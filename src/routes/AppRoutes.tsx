import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { LandingPage } from "../pages/LandingPage";
import { SquadPage } from "../pages/SquadPage";
import { CaptainTools } from "../pages/CaptainTools";
import { SuggestionsBoard } from "../pages/SuggestionsBoard";
import { UserDashboard } from "../pages/UserDashboard";

interface AppRoutesProps {
  // Pass all the state and functions down as props
  squadProps: any;
  user: any;
  userRole: any;
}

export const AppRoutes = ({ squadProps, user, userRole }: AppRoutesProps) => {
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
        element={user ? <SquadPage {...squadProps} /> : <Navigate to="/" />}
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
            <CaptainTools />
          ) : (
            <Navigate to="/home" />
          )
        }
      />
    </Routes>
  );
};
