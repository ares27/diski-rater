import { version } from "../package.json";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import {
  Badge,
  Button,
  Container,
  Navbar,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Nav,
} from "react-bootstrap";
import type { Player } from "./types/types";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import RatingModal from "./components/RatingModal";
import MatchModal from "./components/MatchModal";
import AddPlayerModal from "./components/AddPlayerModal";

import {
  getPlayers,
  createPlayerApi,
  updatePlayerApi,
  getUserStatus,
} from "./services/api/api";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [userArea, setUserArea] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [team1, setTeam1] = useState<Player[]>([]);
  const [team2, setTeam2] = useState<Player[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSynced, setIsSynced] = useState(true);

  const hideNavbarPaths = ["/", "/login", "/board"];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // 1. Auth & Role Listener with Offline Support
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Step A: Immediate check for cached role AND area
        const cachedRole = localStorage.getItem("diski_user_role");
        const cachedProfile = localStorage.getItem("diski_user_profile");

        if (cachedRole) setUserRole(cachedRole);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          setUserArea(parsed.area || parsed.areaId); // Support both just in case
        }

        fetchPlayers();

        try {
          // Step B: Try to get fresh status from MongoDB
          const profile = await getUserStatus(firebaseUser.uid);
          if (profile) {
            setUserRole(profile.role);
            // Ensure we set the area state correctly
            const currentArea = profile.area || profile.areaId;
            setUserArea(currentArea);

            // Step C: Update cache
            localStorage.setItem("diski_user_role", profile.role);
            localStorage.setItem("diski_user_profile", JSON.stringify(profile));
          }
        } catch (err) {
          console.error("Offline: Using cached data");
        }
      } else {
        setUserRole("");
        setUserArea(""); // Clear area on logout
        setPlayers([]);
        localStorage.removeItem("diski_user_role");
        localStorage.removeItem("diski_user_profile");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Move fetchPlayers to its own function so it can be reused
  const fetchPlayers = async () => {
    const cachedData = localStorage.getItem("diski_players_cache");
    let localPlayers: Player[] = [];

    // 1. Immediate UI update from Cache
    if (cachedData) {
      try {
        localPlayers = JSON.parse(cachedData);
        // Only set loading false if we actually have data to show
        if (localPlayers.length > 0) {
          setPlayers(localPlayers);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cache", e);
      }
    }

    try {
      // 2. Background Fetch from Server
      const serverData = await getPlayers();

      // 3. MERGE LOGIC: Prioritize local 'isSelected' state
      const mergedData = serverData.map((serverPlayer: Player) => {
        const serverId = serverPlayer._id || serverPlayer.id;

        // Look for this player in our local session
        const localMatch = localPlayers.find(
          (lp) => (lp._id || lp.id) === serverId
        );

        return {
          ...serverPlayer,
          // If they exist locally, keep their 'isSelected' status.
          // Otherwise, default to false (Bench).
          isSelected: localMatch ? localMatch.isSelected : false,
        };
      });

      // 4. Update State and Sync Cache
      setPlayers(mergedData);
      localStorage.setItem("diski_players_cache", JSON.stringify(mergedData));
      setIsSynced(true);
    } catch (error) {
      console.error("Database fetch failed, continuing with local data", error);
      setIsSynced(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserStatus = async () => {
    if (!user) return;

    try {
      const profile = await getUserStatus(user.uid);
      if (profile) {
        setUserRole(profile.role);
        const currentArea = profile.area || profile.areaId;
        setUserArea(currentArea);

        // Update cache so it persists on next reload
        localStorage.setItem("diski_user_role", profile.role);
        localStorage.setItem("diski_user_profile", JSON.stringify(profile));

        console.log("User profile refreshed:", profile.role);
      }
    } catch (err) {
      console.error("Failed to refresh user status:", err);
    }
  };

  // Listen for Browser Online/Offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // AUTO-SYNC TRIGGER: If we were out of sync, try to fetch fresh data now
      if (!isSynced) {
        console.info("Back online! Re-syncing squad...");
        fetchPlayers();
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isSynced]); // Depend on isSynced so handleOnline has the latest value

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Handlers
  const handleAddPlayer = async (newPlayer: Player) => {
    try {
      // Spread the player data and force the area to match the Captain's area
      const playerWithArea = {
        ...newPlayer,
        area: userArea,
      };

      const savedPlayer = await createPlayerApi(playerWithArea);

      // Only add to local state if it matches the current view (optional logic)
      setPlayers((prev) => [savedPlayer, ...prev]);
      setShowAddModal(false);

      // Update cache
      const updatedPlayers = [savedPlayer, ...players];
      localStorage.setItem(
        "diski_players_cache",
        JSON.stringify(updatedPlayers)
      );
    } catch (error) {
      alert("Error saving player to " + userArea);
    }
  };

  const handleToggleSelect = async (playerId: string) => {
    setIsSynced(false); // Optimistically start sync

    const player = players.find((p) => p._id === playerId || p.id === playerId);
    if (!player) return;

    const newStatus = !player.isSelected;

    // 1. Update State and Cache simultaneously (Optimistic UI)
    setPlayers((prev) => {
      const updatedPlayers = prev.map((p) =>
        p._id === playerId || p.id === playerId
          ? { ...p, isSelected: newStatus }
          : p
      );

      // Update local storage so the session survives navigation/refresh
      localStorage.setItem(
        "diski_players_cache",
        JSON.stringify(updatedPlayers)
      );

      return updatedPlayers;
    });

    try {
      // 2. Persist to DB
      await updatePlayerApi(player._id || player.id, { isSelected: newStatus });
      setIsSynced(true);
    } catch (error) {
      console.error("Failed to sync selection to DB:", error);
      setIsSynced(false);

      // 3. Rollback State AND Cache on failure
      setPlayers((prev) => {
        const rolledBack = prev.map((p) =>
          p._id === playerId || p.id === playerId
            ? { ...p, isSelected: !newStatus }
            : p
        );
        localStorage.setItem("diski_players_cache", JSON.stringify(rolledBack));
        return rolledBack;
      });

      alert("Connection lost. Selection saved to device but not to cloud.");
    }
  };

  const handleRateClick = (player: Player) => {
    setSelectedPlayer(player);
    setShowModal(true);
  };

  const handleClearSelections = async () => {
    // 1. Update local UI & Cache immediately for a "Clean Slate"
    const clearedPlayers = players.map((p) => ({ ...p, isSelected: false }));
    setPlayers(clearedPlayers);
    localStorage.setItem("diski_players_cache", JSON.stringify(clearedPlayers));

    setIsSynced(false);

    try {
      // 2. Sync with Database
      // We filter for players who WERE selected and set them to false in the DB
      const playersToReset = players.filter((p) => p.isSelected);

      await Promise.all(
        playersToReset.map((p) =>
          updatePlayerApi(p._id || p.id, { isSelected: false })
        )
      );

      setIsSynced(true);
    } catch (error) {
      console.error("Failed to clear selections in the cloud:", error);
      setIsSynced(false);
      // We don't necessarily want to "rollback" a clear action because
      // the user intent was to start over. We just leave the sync indicator orange.
    }
  };

  const handleUpdateRating = async (
    playerId: string,
    newRatings: Player["ratings"]
  ) => {
    try {
      const updatedPlayer = await updatePlayerApi(playerId, {
        ratings: newRatings,
      });
      setPlayers((prev) =>
        prev.map((p) => ((p._id || p.id) === playerId ? updatedPlayer : p))
      );
      setShowModal(false);
    } catch (error) {
      alert("Could not save ratings.");
    }
  };

  // Inside App.tsx, update generateTeams to return the result:
  const generateTeams = (mode: "balanced" | "random" = "balanced") => {
    const activePlayers = players.filter(
      (p) => p.isSelected && (p.area === userArea || p.areaId === userArea)
    );

    if (activePlayers.length < 2) return { t1: [], t2: [] };

    let pool = [...activePlayers];
    if (mode === "balanced") {
      pool.sort((a, b) => {
        const getAvg = (p: Player) =>
          Object.values(p.ratings).reduce((sum, r) => sum + r, 0) /
          Math.max(Object.values(p.ratings).length, 1);
        return getAvg(b) - getAvg(a);
      });
    } else {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    const t1: Player[] = [];
    const t2: Player[] = [];
    pool.forEach((player, index) => {
      const setIndex = Math.floor(index / 2);
      if (setIndex % 2 === 0) {
        index % 2 === 0 ? t1.push(player) : t2.push(player);
      } else {
        index % 2 === 0 ? t2.push(player) : t1.push(player);
      }
    });

    // Update state for the Modal to display
    setTeam1(t1);
    setTeam2(t2);
    setShowMatchModal(true);
    return { t1, t2 };
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // 4. Group Props
  const squadProps = {
    loading,
    players,
    userArea,
    userRole,
    refreshUserStatus,
    selectedCount: players.filter(
      (p) => p.isSelected && (p.area === userArea || p.areaId === userArea)
    ).length,
    handleRateClick,
    handleToggleSelect,
    handleClearSelections,
    generateTeams,
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <div className="bg-light" style={{ minHeight: "100vh" }}>
      {showNavbar && (
        <Navbar
          bg="success"
          variant="dark"
          expand="lg"
          className="mb-4 shadow-sm sticky-top"
        >
          <Container>
            <Navbar.Brand as={Link} to="/" className="fw-bold">
              ⚽ DiskiRater
            </Navbar.Brand>
            {/* --- CENTERED VERSION BADGE --- */}
            <div
              className="position-absolute start-50 translate-middle-x d-flex align-items-center"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              <Badge
                bg="light"
                text="dark"
                style={{ fontSize: "0.6rem", opacity: 0.9 }}
              >
                v{version}
              </Badge>

              {isOffline && (
                <Badge
                  bg="warning"
                  text="dark"
                  className="ms-2 d-none d-md-inline"
                >
                  Offline Mode
                </Badge>
              )}
            </div>

            {/* Mobile Toggle Button */}
            <Navbar.Toggle aria-controls="main-navbar-nav" />

            {/* Collapsible Content */}
            <Navbar.Collapse id="main-navbar-nav">
              <Nav className="ms-auto align-items-center gap-2 py-2 py-lg-0">
                {/* Navigation Links */}
                <Nav.Link as={Link} to="/home" className="text-white px-3">
                  Dashboard
                </Nav.Link>
                {/*
                <Nav.Link as={Link} to="/squad" className="text-white px-3">
                  Squad
                </Nav.Link>
                */}

                {/* Separator for desktop, hidden on mobile */}
                <div
                  className="vr d-none d-lg-block mx-2 text-white opacity-25"
                  style={{ height: "20px" }}
                ></div>

                {/* Action Icons Group */}
                <div className="d-flex align-items-center gap-3 mt-2 mt-lg-0">
                  {/* Suggestions Board */}
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>Community Board</Tooltip>}
                  >
                    <Link
                      to="/board"
                      className="text-white text-decoration-none fs-5"
                    >
                      💡
                    </Link>
                  </OverlayTrigger>
                  {/* Sync Indicator */}
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip>
                        {isSynced
                          ? "All data saved to cloud"
                          : "Changes saved locally (Offline)"}
                      </Tooltip>
                    }
                  >
                    <div className="d-flex align-items-center ms-2">
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: isSynced ? "#2ecc71" : "#f39c12", // Green vs Orange
                          boxShadow: isSynced
                            ? "0 0 5px #2ecc71"
                            : "0 0 8px #f39c12",
                          transition: "all 0.3s ease",
                        }}
                      />
                    </div>
                  </OverlayTrigger>

                  {/* Captain's Quick Add */}
                  {/* {userRole === "Captain" && (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Add player to {userArea}</Tooltip>}
                    >
                      <Button
                        variant="light"
                        size="sm"
                        className="d-flex align-items-center justify-content-center fw-bold shadow-sm"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          padding: 0,
                          border: "2px solid #fff",
                        }}
                        onClick={() => setShowAddModal(true)}
                      >
                        <span style={{ fontSize: "1.2rem", marginTop: "-2px" }}>
                          +
                        </span>
                      </Button>
                    </OverlayTrigger>
                  )} */}

                  {/* Logout Button */}
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="fw-bold ms-lg-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      )}

      <AppRoutes
        user={user}
        userRole={userRole}
        squadProps={squadProps}
        onRefresh={fetchPlayers}
      />

      <AddPlayerModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onAdd={handleAddPlayer}
      />
      <MatchModal
        show={showMatchModal}
        onHide={() => setShowMatchModal(false)}
        team1={team1}
        team2={team2}
        onRegenerate={generateTeams} // Add this prop
      />
      <RatingModal
        show={showModal}
        player={selectedPlayer}
        onHide={() => setShowModal(false)}
        onSave={handleUpdateRating}
      />

      {needRefresh && (
        <div
          className="fixed-top bg-dark text-white p-3 d-flex justify-content-between shadow-lg"
          style={{ zIndex: 9999 }}
        >
          <span>Update available!</span>
          <Button
            variant="success"
            size="sm"
            onClick={() => updateServiceWorker(true)}
          >
            Update
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;
