import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { LandingPage } from "../pages/LandingPage";
import { SquadPage } from "../pages/SquadPage";
import { CaptainTools } from "../pages/CaptainTools";
import { SuggestionsBoard } from "../pages/SuggestionsBoard";
import { UserDashboard } from "../pages/UserDashboard";
import { LogMatch } from "../components/LogMatch";
import { PendingMatches } from "../pages/PendingMatches";
import { MatchDetails } from "../pages/MatchDetails";
import { AreaMatches } from "../components/AreaMatches";

interface AppRoutesProps {
  // Pass all the state and functions down as props
  squadProps: any;
  user: any;
  userRole: any;
  onRefresh: () => Promise<void>;
}

export const AppRoutes = ({
  squadProps,
  user,
  userRole,
  onRefresh,
}: AppRoutesProps) => {
  return (
    <Routes>
      {/* 1. PUBLIC LANDING PAGE */}
      <Route path="/" element={<LandingPage />} />

      {/* 3. LOGIN PAGE */}
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/home" />}
      />

      {/* 4. PROTECTED SQUAD PAGE - Redirect to / instead of /login */}
      <Route
        path="/squad"
        element={
          user ? (
            <SquadPage {...squadProps} onRefresh={onRefresh} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* LOG NEW MATCH */}
      <Route
        path="/log-match"
        element={user ? <LogMatch /> : <Navigate to="/" />}
      />

      {/* NEW: PENDING MATCHES LIST */}
      <Route
        path="/pending-matches"
        element={user ? <PendingMatches /> : <Navigate to="/" />}
      />

      <Route
        path="/area/:areaName"
        element={user ? <AreaMatches /> : <Navigate to="/" />}
      />

      {/* NEW: MATCH DETAILS PAGE */}
      <Route
        path="/match-details/:id"
        element={user ? <MatchDetails /> : <Navigate to="/" />}
      />

      {/* 5. USER HOME / DASHBOARD - Redirect to / instead of /login */}
      <Route
        path="/home"
        element={user ? <UserDashboard /> : <Navigate to="/" />}
      />

      {/* 2. PUBLIC BOARD */}
      <Route path="/board" element={<SuggestionsBoard />} />

      {/* ADMIN TOOLS */}
      <Route
        path="/admin"
        element={
          user && userRole === "Captain" ? (
            <CaptainTools
              squadProps={{
                refreshUserStatus: squadProps.refreshUserStatus,
                userData: squadProps.userData,
              }}
            />
          ) : (
            <Navigate to="/home" />
          )
        }
      />
    </Routes>
  );
};
