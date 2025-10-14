import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";
import "./App.css";
import EnhancedJoinEventForm from "./EnhancedJoinEventForm";
import UserInterface from "./UserInterface";
import WineDetailsInterface from "./WineDetailsInterface";
import EnhancedCreateEventForm from "./EnhancedCreateEventForm";
import AdminDashboardRedesign from "./AdminDashboardRedesign";
import { supabase } from "./supabaseClient";
import { User } from "lucide-react";

// Admin Login Component
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile.is_admin) {
        throw new Error("Access denied. Admin privileges required.");
      }

      onLogin(profile);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <User className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-purple-200">Sign in to manage wine events</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 px-6 rounded-xl font-semibold transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-purple-200">Demo credentials:</p>
          <p className="text-xs text-white">admin@winetasting.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

// Component to handle URL parameters for booth mode
const UserRouteWithParams = ({
  onEventJoined,
  currentEvent,
  onRateWine,
  onBackToJoin,
  showRatingForm,
  selectedWine,
  backToUser,
  userSession,
}) => {
  const [searchParams] = useSearchParams();
  const boothCode = searchParams.get("boothCode");

  // If showing rating form
  if (showRatingForm) {
    return (
      <WineDetailsInterface
        wine={selectedWine}
        userSession={userSession}
        onBack={backToUser}
        onRatingSaved={backToUser}
      />
    );
  }

  // If no current event, show join form with booth code detection
  if (!currentEvent) {
    return (
      <EnhancedJoinEventForm
        onEventJoined={onEventJoined}
        boothCode={boothCode}
      />
    );
  }

  // Show user interface for current event
  return (
    <UserInterface
      event={currentEvent}
      onRateWine={onRateWine}
      onBackToJoin={onBackToJoin}
    />
  );
};

function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [selectedWine, setSelectedWine] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const goToCreateForm = (user) => {
    setAdminUser(user);
    setShowCreateForm(true);
  };

  const goToRatingForm = (wine) => {
    setSelectedWine(wine);
    setShowRatingForm(true);
  };

  const handleEventJoined = (event, session = null) => {
    setCurrentEvent(event);

    // Set user session from the join process
    if (session) {
      setUserSession(session);
    } else if (event?.userEmail) {
      // Fallback for booth mode
      setUserSession({
        email: event.userEmail,
        isBoothMode: event.is_booth_mode,
        eventId: event.id,
      });
    }
  };

  const backToAdmin = () => setShowCreateForm(false);
  const backToUser = () => setShowRatingForm(false);

  const backToJoin = () => {
    console.log("backToJoin called - resetting to join form");
    setCurrentEvent(null);
    setUserSession(null);
    // Clear any stored session
    localStorage.removeItem("wineAppSession");
  };

  const handleAdminLogin = (user) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setCurrentEvent(null);
    setUserSession(null);
    setSelectedWine(null);
    setShowCreateForm(false);
    setShowRatingForm(false);
    // Clear any stored session
    localStorage.removeItem("wineAppSession");
  };

  // Admin Route Component
  const AdminRoute = () => {
    // If admin is logged in and showing create form
    if (showCreateForm) {
      return (
        <EnhancedCreateEventForm
          user={adminUser}
          onBack={backToAdmin}
          onEventCreated={backToAdmin}
        />
      );
    }

    // If admin is logged in, show dashboard
    if (adminUser) {
      return (
        <AdminDashboardRedesign
          onCreateEvent={goToCreateForm}
          onLogout={handleLogout}
        />
      );
    }

    // Show admin login
    return <AdminLogin onLogin={handleAdminLogin} />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin route */}
          <Route path="/admin" element={<AdminRoute />} />

          {/* User route - handles both standard and booth mode */}
          <Route
            path="/*"
            element={
              <UserRouteWithParams
                onEventJoined={handleEventJoined}
                currentEvent={currentEvent}
                onRateWine={goToRatingForm}
                onBackToJoin={backToJoin}
                showRatingForm={showRatingForm}
                selectedWine={selectedWine}
                backToUser={backToUser}
                userSession={userSession}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
