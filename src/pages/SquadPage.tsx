import { useState, useMemo, useEffect } from "react";
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

interface SquadPageProps {
  loading: boolean;
  players: Player[];
  userArea: string;
  userRole: string; // Added userRole to props
  selectedCount: number;
  handleRateClick: (player: Player) => void;
  handleToggleSelect: (id: string) => void;
  handleClearSelections: () => void;
  generateTeams: (mode?: "balanced" | "random") => void;
  onRefresh: () => void;
}

export const SquadPage = ({
  loading,
  players,
  userArea,
  userRole, // Destructure userRole
  handleRateClick,
  handleToggleSelect,
  handleClearSelections,
  generateTeams,
  onRefresh,
}: SquadPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Auto-refresh when entering the page to catch newly approved players
  useEffect(() => {
    onRefresh();
  }, []);

  const filteredPlayers = useMemo(() => {
    return (players || []).filter((p) => {
      // Handle both 'area' and 'areaId' fields for compatibility
      const playerArea = p.area || p.areaId || "unknown";
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

  const areaSelectedCount = useMemo(() => {
    return filteredPlayers.filter((p) => p.isSelected).length;
  }, [filteredPlayers]);

  // 1. Calculate the highest overall score to determine the MVP
  const maxOverall = useMemo(() => {
    if (filteredPlayers.length === 0) return 0;
    return Math.max(
      ...filteredPlayers.map((p) => {
        const stats = Object.values(p.ratings || {});
        if (stats.length === 0) return 0;
        return Math.round(stats.reduce((a, b) => a + b, 0) / stats.length);
      })
    );
  }, [filteredPlayers]);

  return (
    <Container className="pb-5">
      {/* Header Section: Now wraps on mobile */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-4 gap-3">
        {/* Title and Area Badge Group */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <h2 className="fw-bold mb-0">Squad Selection</h2>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="success" className="rounded-pill px-3 shadow-sm">
              📍 {userArea ? userArea : "Loading..."}
            </Badge>

            <Button
              variant="outline-dark"
              size="sm"
              className="rounded-pill shadow-sm border-0 bg-white d-flex align-items-center gap-1"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" animation="border" /> : "🔄"}
              <span className="small fw-bold">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Player Count Badge: Moves to its own line if needed */}
        <Badge bg="dark" className="p-2 shadow-sm">
          {filteredPlayers.length} Players in {userArea || "Area"}
        </Badge>
      </div>

      <Row className="justify-content-center mb-4 g-2">
        <Col xs={12} md={6}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0">
              🔍
            </InputGroup.Text>
            <Form.Control
              placeholder={`Search in ${userArea || "area"}...`}
              className="border-start-0 ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                className="bg-white border-start-0"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </Button>
            )}
          </InputGroup>
        </Col>
        <Col xs={12} md={2}>
          <Button
            variant={showOnlySelected ? "success" : "outline-success"}
            className="w-100 h-100 shadow-sm fw-bold"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
          >
            {showOnlySelected ? "✅ Selected Only" : "📍 Filter Selected"}
          </Button>
        </Col>
      </Row>

      {loading && players.length === 0 ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Fetching {userArea} Squad...</p>
        </div>
      ) : (
        <Row className="justify-content-center">
          <Col xs={12} md={8}>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-5 border rounded bg-white shadow-sm">
                <p className="text-muted mb-0">
                  {searchTerm
                    ? `No players in ${userArea} match "${searchTerm}"`
                    : `No players found for ${userArea}.`}
                </p>
              </div>
            ) : (
              <Row>
                {filteredPlayers.map((player) => {
                  const stats = Object.values(player.ratings || {});
                  const playerOverall =
                    stats.length > 0
                      ? Math.round(
                          stats.reduce((a, b) => a + b, 0) / stats.length
                        )
                      : 0;
                  return (
                    <Col key={player._id || player.id} xs={12} className="mb-3">
                      <PlayerCard
                        player={player}
                        onRate={handleRateClick}
                        onToggleSelect={handleToggleSelect}
                        // Added a console log here temporarily to debug
                        // console.log("Current User Role:", userRole);
                        canRate={userRole === "Captain"}
                        isMVP={
                          playerOverall === maxOverall && playerOverall > 0
                        } // Pass the prop here
                      />
                    </Col>
                  );
                })}
              </Row>
            )}
          </Col>
        </Row>
      )}

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
            className="px-5 shadow fw-bold rounded-pill"
            // This triggers the App.tsx function which sets setShowMatchModal(true)
            onClick={() => generateTeams("balanced")}
          >
            GENERATE MATCH ⚽
          </Button>
        </div>
      )}
    </Container>
  );
};
