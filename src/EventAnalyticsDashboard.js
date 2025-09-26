useEffect(() => {
  if (event) {
    // Use real API call when supabase is available
    if (typeof supabase.from === "function" && supabase.from("event_wines")) {
      loadDashboardData();
    } else {
      // Fall back to demo data for standalone component
      loadDemoData();
    }
  }
}, [event, selectedTimeRange]);

const loadDemoData = () => {
  // Generate realistic demo data
  const demoData = generateDemoAnalyticsData();
  setDashboardData(demoData);
  setLoading(false);
};

const generateDemoAnalyticsData = () => {
  // Demo wines for the event
  const demoWines = [
    { id: 1, name: "Château Margaux 2015", producer: "Château Margaux" },
    { id: 2, name: "Opus One 2018", producer: "Opus One Winery" },
    { id: 3, name: "Dom Pérignon 2012", producer: "Moët & Chandon" },
    { id: 4, name: "Caymus Cabernet 2020", producer: "Caymus Vineyards" },
    { id: 5, name: "Cloudy Bay Sauvignon Blanc 2022", producer: "Cloudy Bay" },
  ];

  // Generate demo ratings and comments
  const demoComments = [
    "Exceptional balance with notes of dark cherry and oak",
    "Smooth finish with hints of vanilla and spice",
    "Crisp and refreshing with citrus undertones",
    "Full-bodied with complex tannins",
    "Elegant and well-structured",
  ];

  const wineData = demoWines.map((wine) => ({
    id: wine.id,
    name: wine.name,
    producer: wine.producer,
    averageRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
    totalRatings: Math.floor(Math.random() * 25) + 10,
    totalComments: Math.floor(Math.random() * 15) + 5,
    randomComment:
      demoComments[Math.floor(Math.random() * demoComments.length)],
  }));

  // Generate hourly activity
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    ratings: Math.floor(Math.random() * 8) + (i >= 17 && i <= 22 ? 5 : 0),
    label: `${i}:00`,
  }));

  // Rating distribution
  const ratingDistribution = [
    { rating: 1, count: 2, percentage: 3 },
    { rating: 2, count: 5, percentage: 8 },
    { rating: 3, count: 15, percentage: 24 },
    { rating: 4, count: 25, percentage: 40 },
    { rating: 5, count: 16, percentage: 25 },
  ];

  // Top comments
  const topComments = [
    {
      wine: "Château Margaux 2015",
      comment: "Absolutely phenomenal wine with incredible depth",
      rating: 5,
      timestamp: new Date().toISOString(),
    },
    {
      wine: "Opus One 2018",
      comment: "Perfect pairing with the cheese course",
      rating: 4,
      timestamp: new Date().toISOString(),
    },
    {
      wine: "Dom Pérignon 2012",
      comment: "Elegant bubbles, perfect for celebrations",
      rating: 5,
      timestamp: new Date().toISOString(),
    },
  ];

  // Demo attendee emails
  const attendeeEmails = [
    {
      email: "sarah.johnson@email.com",
      name: "Sarah Johnson",
      totalRatings: 5,
      averageRating: 4.2,
    },
    {
      email: "michael.chen@email.com",
      name: "Michael Chen",
      totalRatings: 4,
      averageRating: 3.8,
    },
    {
      email: "emily.davis@email.com",
      name: "Emily Davis",
      totalRatings: 5,
      averageRating: 4.6,
    },
  ];

  return {
    totalAttendees: 28,
    totalRatings: 63,
    averageRating: 4.1,
    totalComments: 35,
    wineData,
    hourlyActivity,
    ratingDistribution,
    topComments,
    attendeeEmails,
  };
};
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  BarChart3,
  Users,
  Wine,
  Star,
  Download,
  Clock,
  MessageSquare,
  TrendingUp,
  Calendar,
  ArrowLeft,
  FileText,
  Filter,
  Eye,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const EventAnalyticsDashboard = ({ event, onBack }) => {
  const [dashboardData, setDashboardData] = useState({
    totalAttendees: 0,
    totalRatings: 0,
    averageRating: 0,
    totalComments: 0,
    wineData: [],
    hourlyActivity: [],
    ratingDistribution: [],
    topComments: [],
    attendeeEmails: [],
    timeZoneData: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [selectedWineFilter, setSelectedWineFilter] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (event) {
      loadDashboardData();
    }
  }, [event, selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // First get event wines for this specific event
      const { data: eventWines, error: winesError } = await supabase
        .from("event_wines")
        .select("id, wine_name, producer")
        .eq("event_id", event.id);

      if (winesError) {
        console.error("Error loading event wines:", winesError);
        // Fall back to demo data if there's an error
        loadDemoData();
        return;
      }

      console.log("Event wines found:", eventWines?.length || 0);

      if (!eventWines || eventWines.length === 0) {
        console.log("No wines found for this event, showing demo data");
        loadDemoData();
        return;
      }

      const wineIds = eventWines.map((w) => w.id);
      console.log("Loading ratings for wine IDs:", wineIds);

      // Get all ratings for this event's wines only
      const { data: ratings, error: ratingsError } = await supabase
        .from("user_wine_ratings")
        .select(
          `
          *,
          event_wines (wine_name, producer),
          profiles (eventbrite_email, display_name)
        `
        )
        .in("event_wine_id", wineIds)
        .order("created_at", { ascending: false });

      if (ratingsError) {
        console.error("Error loading ratings:", ratingsError);
        loadDemoData();
        return;
      }

      console.log("Found ratings for this event:", ratings?.length || 0);

      if (!ratings || ratings.length === 0) {
        console.log(
          "No ratings found for this event, showing demo data with option to add test data"
        );
        // Show demo data but indicate it's because no real data exists
        const demoData = generateDemoAnalyticsData();
        demoData.isDemo = true;
        demoData.eventWines = eventWines; // Include real wine data
        setDashboardData(demoData);
        setLoading(false);
        return;
      }

      // Process the real data
      const processedData = processAnalyticsData(ratings || [], eventWines);
      processedData.isDemo = false;
      setDashboardData(processedData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const addTestRatingsData = async () => {
    try {
      setLoading(true);

      // Get event wines
      const { data: eventWines } = await supabase
        .from("event_wines")
        .select("id, wine_name")
        .eq("event_id", event.id);

      if (!eventWines || eventWines.length === 0) {
        alert("No wines found for this event. Please add wines first.");
        setLoading(false);
        return;
      }

      // Create test users and ratings
      const testUsers = [];
      for (let i = 0; i < 5; i++) {
        const userId = crypto.randomUUID();

        // Create test user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              display_name: `Test User ${i + 1}`,
              eventbrite_email: `testuser${i + 1}@example.com`,
              is_admin: false,
              is_temp_account: true,
              account_expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ])
          .select()
          .single();

        if (!profileError) {
          testUsers.push(profile);
        }
      }

      // Create test ratings for each wine
      const testRatings = [];
      eventWines.forEach((wine) => {
        testUsers.forEach((user) => {
          const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
          const comments = [
            "Excellent wine with great depth",
            "Smooth finish, very enjoyable",
            "Good wine, would recommend",
            "Amazing flavor profile",
            "Perfect balance of flavors",
            "Outstanding vintage",
            "Crisp and refreshing",
          ];

          testRatings.push({
            user_id: user.id,
            event_wine_id: wine.id,
            rating: rating,
            personal_notes:
              comments[Math.floor(Math.random() * comments.length)],
            would_buy: rating >= 4,
            created_at: new Date(
              Date.now() - Math.random() * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        });
      });

      // Insert test ratings
      const { error: ratingsError } = await supabase
        .from("user_wine_ratings")
        .insert(testRatings);

      if (ratingsError) {
        console.error("Error creating test ratings:", ratingsError);
        alert("Error creating test data: " + ratingsError.message);
      } else {
        alert(`Successfully created ${testRatings.length} test ratings!`);
        // Reload the dashboard data
        loadDashboardData();
      }
    } catch (error) {
      console.error("Error adding test data:", error);
      alert("Error creating test data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (ratings, eventWines) => {
    // Basic stats
    const uniqueAttendees = new Set(ratings.map((r) => r.user_id));
    const ratingsWithComments = ratings.filter(
      (r) => r.personal_notes && r.personal_notes.trim()
    );

    // Wine-specific data
    const wineData = eventWines.map((wine) => {
      const wineRatings = ratings.filter((r) => r.event_wine_id === wine.id);
      const avgRating =
        wineRatings.length > 0
          ? wineRatings.reduce((sum, r) => sum + r.rating, 0) /
            wineRatings.length
          : 0;

      const comments = wineRatings
        .filter((r) => r.personal_notes && r.personal_notes.trim())
        .map((r) => r.personal_notes);

      const randomComment =
        comments.length > 0
          ? comments[Math.floor(Math.random() * comments.length)]
          : null;

      return {
        id: wine.id,
        name: wine.wine_name,
        producer: wine.producer,
        averageRating: Number(avgRating.toFixed(1)),
        totalRatings: wineRatings.length,
        totalComments: comments.length,
        randomComment,
      };
    });

    // Hourly activity data
    const hourlyActivity = generateHourlyActivity(ratings);

    // Rating distribution
    const ratingCounts = [0, 0, 0, 0, 0];
    ratings.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating - 1]++;
      }
    });

    const ratingDistribution = ratingCounts.map((count, index) => ({
      rating: index + 1,
      count,
      percentage:
        ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0,
    }));

    // Top comments (random selection for demo)
    const topComments = ratingsWithComments.slice(0, 5).map((r) => ({
      wine: r.event_wines?.wine_name || "Unknown Wine",
      comment: r.personal_notes,
      rating: r.rating,
      timestamp: r.created_at,
    }));

    // Attendee emails for export
    const attendeeEmails = Array.from(uniqueAttendees).map((userId) => {
      const userRating = ratings.find((r) => r.user_id === userId);
      return {
        email:
          userRating?.profiles?.eventbrite_email ||
          `user-${userId.slice(0, 8)}@example.com`,
        name: userRating?.profiles?.display_name || "Wine Enthusiast",
        totalRatings: ratings.filter((r) => r.user_id === userId).length,
        averageRating: calculateUserAverageRating(ratings, userId),
      };
    });

    return {
      totalAttendees: uniqueAttendees.size,
      totalRatings: ratings.length,
      averageRating:
        ratings.length > 0
          ? Number(
              (
                ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              ).toFixed(1)
            )
          : 0,
      totalComments: ratingsWithComments.length,
      wineData,
      hourlyActivity,
      ratingDistribution,
      topComments,
      attendeeEmails,
    };
  };

  const generateHourlyActivity = (ratings) => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      ratings: 0,
      label: `${i}:00`,
    }));

    ratings.forEach((rating) => {
      const hour = new Date(rating.created_at).getHours();
      hours[hour].ratings++;
    });

    return hours;
  };

  const calculateUserAverageRating = (ratings, userId) => {
    const userRatings = ratings.filter((r) => r.user_id === userId);
    return userRatings.length > 0
      ? Number(
          (
            userRatings.reduce((sum, r) => sum + r.rating, 0) /
            userRatings.length
          ).toFixed(1)
        )
      : 0;
  };

  const exportToCSV = () => {
    const csvData = [];

    // Add headers
    csvData.push([
      "Email",
      "Name",
      "Total Ratings",
      "Average Rating",
      "Comments",
    ]);

    // Add attendee data with their comments
    dashboardData.attendeeEmails.forEach((attendee) => {
      const userComments = dashboardData.topComments
        .filter((comment) => comment.email === attendee.email)
        .map((c) => `"${c.wine}: ${c.comment}"`)
        .join("; ");

      csvData.push([
        attendee.email,
        attendee.name,
        attendee.totalRatings,
        attendee.averageRating,
        userComments || "No comments",
      ]);
    });

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.event_name}-analytics-export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const COLORS = ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Events
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {event.event_name}
                </h1>
                <p className="text-gray-600">Analytics Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Attendees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalAttendees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ratings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalRatings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.averageRating}/5
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalComments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hourly Activity Chart */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Activity by Hour
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dashboardData.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ratings"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Rating Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dashboardData.ratingDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ rating, percentage }) =>
                    `${rating}★ (${percentage}%)`
                  }
                >
                  {dashboardData.ratingDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wine Performance Table */}
        <div className="bg-white rounded-lg border shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Wine Performance
                </h3>
              </div>
              <select
                value={selectedWineFilter}
                onChange={(e) => setSelectedWineFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Wines</option>
                <option value="top">Top Rated</option>
                <option value="most-comments">Most Comments</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Ratings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample Comment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.wineData
                  .sort((a, b) => b.averageRating - a.averageRating)
                  .map((wine) => (
                    <tr key={wine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {wine.name}
                          </div>
                          {wine.producer && (
                            <div className="text-sm text-gray-500">
                              {wine.producer}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {wine.averageRating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wine.totalRatings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wine.totalComments}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {wine.randomComment ? (
                          <div className="text-sm text-gray-600 italic truncate">
                            "{wine.randomComment}"
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No comments
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Comments */}
        {dashboardData.topComments.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Comments
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.topComments.map((comment, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-purple-200 pl-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.wine}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">
                          {comment.rating}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 italic">"{comment.comment}"</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Export Event Data</h3>
            </div>

            <p className="text-gray-600 mb-6">
              This will export all attendee emails, ratings, and comments for
              this event into a CSV file that can be imported into Excel or
              other spreadsheet applications.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Export includes:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • {dashboardData.attendeeEmails.length} attendee email
                  addresses
                </li>
                <li>• {dashboardData.totalRatings} individual wine ratings</li>
                <li>• {dashboardData.totalComments} comments and feedback</li>
                <li>• Attendee participation statistics</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAnalyticsDashboard;
