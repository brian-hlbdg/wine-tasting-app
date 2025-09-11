import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import EnhancedCreateEventForm from "./EnhancedCreateEventForm"; // Updated import
import UserInterface from "./UserInterface";
import WineRatingForm from "./WineRatingForm";
import EnhancedJoinEventForm from "./EnhancedJoinEventForm"; // New import
import AppPreview from "./AppPreview";
import { supabase } from "./supabaseClient";

// Admin Login Component
const AdminLogin = ({ onAdminLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use Supabase authentication
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setError("Access denied. Admin privileges required.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      onAdminLogin(profile);
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-purple-200">Access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
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
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-4 px-6 rounded-lg font-semibold hover:bg-white/30 transition-all disabled:opacity-50"
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
}) => {
  const [searchParams] = useSearchParams();
  const boothCode = searchParams.get("boothCode");

  // If showing rating form
  if (showRatingForm) {
    return (
      <WineRatingForm
        wine={selectedWine}
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

  const handleEventJoined = (event) => {
    setCurrentEvent(event);
  };

  const backToAdmin = () => setShowCreateForm(false);
  const backToUser = () => setShowRatingForm(false);

  const backToJoin = () => {
    console.log("backToJoin called - resetting to join form");
    setCurrentEvent(null);
  };

  const handleAdminLogin = (user) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setCurrentEvent(null);
    setSelectedWine(null);
    setShowCreateForm(false);
    setShowRatingForm(false);
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

    // If admin is not logged in, show login screen
    if (!adminUser) {
      return <AdminLogin onAdminLogin={handleAdminLogin} />;
    }

    // Admin is logged in, show dashboard
    return (
      <AdminDashboard onCreateEvent={goToCreateForm} onLogout={handleLogout} />
    );
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/app_preview" element={<AppPreview />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route
            path="/"
            element={
              <UserRouteWithParams
                onEventJoined={handleEventJoined}
                currentEvent={currentEvent}
                onRateWine={goToRatingForm}
                onBackToJoin={backToJoin}
                showRatingForm={showRatingForm}
                selectedWine={selectedWine}
                backToUser={backToUser}
              />
            }
          />
          {/* Redirect any unknown routes to user interface */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
