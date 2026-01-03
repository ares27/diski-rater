import { useState, useMemo, useEffect } from "react"; // Added useEffect
import {
  Container,
  Row,
  Col,
  Spinner,
  Button,
  Form,
  InputGroup,
  Badge,
} from "react-bootstrap";
import PlayerCard from "../components/PlayerCard";
import type { Player } from "../types/types";
import { getUserStatus } from "../services/api/api";
import { auth } from "../firebase/config"; // Added auth

interface SquadPageProps {
  loading: boolean;
  players: Player[];
  userArea: string;
  selectedCount: number;
  handleRateClick: (player: Player) => void;
  handleToggleSelect: (id: string) => void;
  handleClearSelections: () => void;
  generateTeams: () => void;
}

export const SquadPage = ({
  loading,
  players,
  userArea,
  // selectedCount, // We will now calculate this locally to ensure area-specificity
  handleRateClick,
  handleToggleSelect,
  handleClearSelections,
  generateTeams,
}: SquadPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // BUG 1 FIX: Reset all players to "Bench" when the page loads
  // useEffect(() => {
  //   handleClearSelections();
  //   // This ensures that navigating to the squad page always starts with a fresh slate
  // }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const cached = localStorage.getItem("diski_user_profile");
      if (cached) setUserData(JSON.parse(cached));
      try {
        const data = await getUserStatus(user.uid);
        if (data) {
          setUserData(data);
          localStorage.setItem("diski_user_profile", JSON.stringify(data));
        }
      } catch (err) {
        console.warn("Could not refresh user role, using cache.");
      }
    };
    fetchUserRole();
  }, []);

  const filteredPlayers = useMemo(() => {
    return (players || []).filter((p) => {
      const playerArea = p.area || "unknown";
      const matchesArea = playerArea === userArea;

      const matchesSearch =
        (p.diskiName || p.name)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        p.position?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSelectionFilter = showOnlySelected ? p.isSelected : true;

      return matchesArea && matchesSearch && matchesSelectionFilter;
    });
  }, [players, userArea, searchTerm, showOnlySelected]);

  // BUG 2 FIX: Calculate "Ready" count ONLY for the filtered/area players
  const areaSelectedCount = useMemo(() => {
    return filteredPlayers.filter((p) => p.isSelected).length;
  }, [filteredPlayers]);

  return (
    <Container className="pb-5">
      {/* ... Header and Search UI stays the same ... */}

      <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <h2 className="fw-bold mb-0">Squad Selection</h2>
          <Badge bg="success" className="rounded-pill px-3 shadow-sm">
            📍 {userArea ? userArea : "Loading Area..."}
          </Badge>
        </div>
        <Badge bg="dark" className="p-2">
          {filteredPlayers.length} Players in {userArea || "your area"}
        </Badge>
      </div>

      {/* ... (Search and Filter Rows) ... */}

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Fetching {userArea} Squad...</p>
        </div>
      ) : (
        <Row className="justify-content-center">
          <Col xs={12} md={8}>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-5 border rounded bg-white shadow-sm">
                <p className="text-muted mb-0">No players found.</p>
              </div>
            ) : (
              <Row>
                {filteredPlayers.map((player) => (
                  <Col key={player._id || player.id} xs={12} className="mb-3">
                    <PlayerCard
                      player={player}
                      onRate={handleRateClick}
                      onToggleSelect={handleToggleSelect}
                      canRate={userData?.role === "Captain"}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      )}

      {/* FLOATING ACTION BAR: Now uses areaSelectedCount */}
      {areaSelectedCount >= 2 && (
        <div
          className="fixed-bottom bg-white p-3 shadow-lg border-top d-flex justify-content-between align-items-center"
          style={{ zIndex: 1030 }}
        >
          <div className="d-flex flex-column">
            <span className="fw-bold text-success">
              {areaSelectedCount} Players Ready
            </span>
            <Button
              variant="link"
              size="sm"
              className="text-danger p-0 text-start text-decoration-none"
              onClick={handleClearSelections}
            >
              Clear Selections
            </Button>
          </div>
          <Button
            variant="success"
            size="lg"
            className="px-5 shadow fw-bold"
            onClick={generateTeams}
          >
            GENERATE TEAMS ⚽
          </Button>
        </div>
      )}
    </Container>
  );
};
