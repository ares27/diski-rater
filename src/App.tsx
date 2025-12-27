import { useState, useEffect } from "react";
import { Button, Container, Navbar, Row, Col } from "react-bootstrap";
import PlayerCard from "./components/PlayerCard";
import RatingModal from "./components/RatingModal"; // Import the modal
import MatchModal from "./components/MatchModal"; // Import the modal
import AddPlayerModal from "./components/AddPlayerModal"; // Import the modal
import { MOCK_PLAYERS } from "./data/MockPlayer";
import type { Player } from "./types/types";

function App() {
  // const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem("soccer-players");
    return saved ? JSON.parse(saved) : MOCK_PLAYERS;
  });

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);
  const selectedCount = players.filter((p) => p.isSelected).length;
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [team1, setTeam1] = useState<Player[]>([]);
  const [team2, setTeam2] = useState<Player[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Run this every time 'players' changes to save data
  useEffect(() => {
    localStorage.setItem("soccer-players", JSON.stringify(players));
  }, [players]);

  const handleAddPlayer = (newPlayer: Player) => {
    setPlayers((prev) => [newPlayer, ...prev]);
  };

  const handleRateClick = (player: Player) => {
    setSelectedPlayer(player);
    setShowModal(true);
  };

  const handleUpdateRating = (
    playerId: string,
    newRatings: Player["ratings"]
  ) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, ratings: newRatings } : p))
    );
  };

  // 1. Add this function inside the App component
  const handleToggleSelect = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, isSelected: !p.isSelected } : p
      )
    );
  };

  const generateTeams = () => {
    // 1. Filter for only selected players
    const activePlayers = players.filter((p) => p.isSelected);

    // 2. Sort by overall rating (Highest to Lowest)
    const sorted = [...activePlayers].sort((a, b) => {
      const scoreA = Object.values(a.ratings).reduce((sum, r) => sum + r, 0);
      const scoreB = Object.values(b.ratings).reduce((sum, r) => sum + r, 0);
      return scoreB - scoreA;
    });

    const team1: Player[] = [];
    const team2: Player[] = [];

    // 3. Snake Draft Distribution
    // Player 1 -> T1, Player 2 -> T2, Player 3 -> T2, Player 4 -> T1...
    sorted.forEach((player, index) => {
      // This pattern (0, 3, 4, 7...) goes to Team 1
      // This pattern (1, 2, 5, 6...) goes to Team 2
      if ([0, 3].includes(index % 4)) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });
    console.log("Team 1:", team1, "Team 2:", team2);

    setTeam1(team1);
    setTeam2(team2);
    setShowMatchModal(true); // Open the moda
  };

  return (
    <div className="bg-light" style={{ minHeight: "100vh" }}>
      <Navbar bg="success" variant="dark" className="mb-4 shadow-sm sticky-top">
        <Container className="d-flex justify-content-between">
          <Navbar.Brand href="#">⚽ DiskiRater</Navbar.Brand>
          <Button
            variant="light"
            size="sm"
            onClick={() => setShowAddModal(true)}
            disabled
          >
            <b>+ Add Player</b>
          </Button>
        </Container>
      </Navbar>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6}>
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onRate={handleRateClick}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </Col>
        </Row>
      </Container>
      {selectedCount >= 2 && (
        <div className="fixed-bottom bg-white p-3 shadow-lg border-top d-flex justify-content-between align-items-center">
          <span className="fw-bold">{selectedCount} Players Ready</span>
          <Button variant="success" size="lg" onClick={generateTeams}>
            Generate Teams
          </Button>
        </div>
      )}

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
      />

      <RatingModal
        show={showModal}
        player={selectedPlayer}
        onHide={() => setShowModal(false)}
        onSave={handleUpdateRating}
      />
    </div>
  );
}

export default App;
