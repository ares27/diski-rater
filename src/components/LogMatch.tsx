import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Badge,
} from "react-bootstrap";
import { auth } from "../firebase/config";
import { logMatchApi } from "../services/api/api";

export const LogMatch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { team1, team2 } = location.state || { team1: [], team2: [] };

  // Local State for Score and Stats
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [stats, setStats] = useState<any>({}); // Format: { playerId: { goals: 0, assists: 0, isMVP: false } }
  const [submitting, setSubmitting] = useState(false);

  // Initialize stats for all players if not already done
  const allPlayers = [...team1, ...team2];

  const updateStat = (playerId: string, field: string, value: any) => {
    setStats((prev: any) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, assists: 0, isMVP: false }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setSubmitting(true);

    const matchData = {
      areaId: team1[0]?.area || "General",
      submittedBy: auth.currentUser.uid,
      score: {
        teamA: teamAScore,
        teamB: teamBScore,
      },
      lineups: {
        teamA: team1.map((p: any) => p._id),
        teamB: team2.map((p: any) => p._id),
      },
      playerPerformance: allPlayers.map((p) => ({
        playerId: p._id,
        goals: stats[p._id]?.goals || 0,
        assists: stats[p._id]?.assists || 0,
        isMVP: stats[p._id]?.isMVP || false,
      })),
      expectedConfirmations: allPlayers.length,
    };

    try {
      // Use the API helper
      await logMatchApi(matchData);

      alert("Match submitted for community verification!");
      navigate("/home");
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(err.message || "Failed to submit match.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPlayerRow = (p: any, teamColor: string) => (
    <tr key={p._id}>
      <td>
        <div className="fw-bold">{p.diskiName}</div>
        <small className="text-muted">{p.position}</small>
      </td>
      <td>
        <Form.Control
          type="number"
          size="sm"
          min="0"
          value={stats[p._id]?.goals || 0}
          onChange={(e) => updateStat(p._id, "goals", parseInt(e.target.value))}
          style={{ width: "60px" }}
        />
      </td>
      <td>
        <Form.Control
          type="number"
          size="sm"
          min="0"
          value={stats[p._id]?.assists || 0}
          onChange={(e) =>
            updateStat(p._id, "assists", parseInt(e.target.value))
          }
          style={{ width: "60px" }}
        />
      </td>
      <td className="text-center">
        <Form.Check
          type="radio"
          name="mvp"
          checked={stats[p._id]?.isMVP || false}
          onChange={() => {
            // Reset all MVPs first then set this one
            const newStats = { ...stats };
            allPlayers.forEach((player) => {
              if (newStats[player._id]) newStats[player._id].isMVP = false;
            });
            setStats(newStats);
            updateStat(p._id, "isMVP", true);
          }}
        />
      </td>
    </tr>
  );

  // 1. Create helper functions to sum goals
  const calculateTeamScore = (team: any[]) => {
    return team.reduce(
      (acc, player) => acc + (stats[player._id]?.goals || 0),
      0,
    );
  };

  const teamAScore = calculateTeamScore(team1);
  const teamBScore = calculateTeamScore(team2);

  return (
    <Container className="py-4">
      <h3 className="fw-bold mb-4">Log Match Results</h3>

      {/* Scoreboard Section */}

      <Card className="border-0 shadow-sm mb-4 bg-dark text-white rounded-4">
        <Card.Body className="p-4 text-center">
          <Row className="align-items-center">
            <Col>
              <h5 className="text-success mb-3">TEAM A</h5>
              <div className="display-4 fw-bold text-success">{teamAScore}</div>
            </Col>
            <Col xs={2} className="display-6 fw-bold text-muted">
              VS
            </Col>
            <Col>
              <h5 className="text-danger mb-3">TEAM B</h5>
              <div className="display-4 fw-bold text-danger">{teamBScore}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Individual Stats Section */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Player</th>
                <th>Goals</th>
                <th>Assists</th>
                <th className="text-center">MVP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="bg-success bg-opacity-10 py-1 small fw-bold text-success"
                >
                  TEAM A
                </td>
              </tr>
              {team1.map((p) => renderPlayerRow(p, "success"))}
              <tr>
                <td
                  colSpan={4}
                  className="bg-danger bg-opacity-10 py-1 small fw-bold text-danger"
                >
                  TEAM B
                </td>
              </tr>
              {team2.map((p) => renderPlayerRow(p, "danger"))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="d-grid gap-2">
        <Button
          variant="success"
          size="lg"
          className="fw-bold py-3 rounded-pill"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Match for Verification 🚀"}
        </Button>
        <Button
          variant="link"
          className="text-muted"
          onClick={() => navigate(-1)}
        >
          Cancel and go back
        </Button>
      </div>
    </Container>
  );
};
