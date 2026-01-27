import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Badge,
  Container,
  Card,
  Row,
  Col,
  Table,
  Button,
  Alert,
  Spinner,
  ButtonGroup,
} from "react-bootstrap";
import { auth } from "../firebase/config";
import { getMatchDetails, joinMatchApi } from "../services/api/api";

export const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userProfile = JSON.parse(
    localStorage.getItem("diski_user_profile") || "{}",
  );
  const myPlayerId = userProfile.linkedPlayerId;

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    // 2. Use the imported function
    getMatchDetails(id)
      .then((data) => {
        setMatch(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Match fetch error:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </Container>
    );

  if (!match)
    return <Container className="py-5 text-center">Match not found.</Container>;

  // --- LOGIC VARIABLES ---
  const isFinished = match?.status === "Verified";

  const mvpPerformance = match?.playerPerformance?.find((p: any) => p.isMVP);
  const mvpPlayer = mvpPerformance?.playerId;

  const winnerA = isFinished && match.score.teamA > match.score.teamB;
  const winnerB = isFinished && match.score.teamB > match.score.teamA;

  const isPlayerInTeamA = match.lineups.teamA.some(
    (p: any) => (p._id || p) === myPlayerId,
  );
  const isPlayerInTeamB = match.lineups.teamB.some(
    (p: any) => (p._id || p) === myPlayerId,
  );
  const isPlayerInMatch = isPlayerInTeamA || isPlayerInTeamB;

  const handleSelfJoin = async (team: "teamA" | "teamB") => {
    if (!auth.currentUser) {
      alert("You must be logged in to join a match.");
      return;
    }

    try {
      // Use the API helper - note we pass the match ID from your component's state/params
      const updatedData = await joinMatchApi(id, {
        firebaseUid: auth.currentUser.uid,
        team: team,
      });

      alert("Lineup updated! You can now verify this match on your dashboard.");

      // The backend returns { message, match: ... } based on your snippet
      setMatch(updatedData.match);
      navigate("/home");
    } catch (error: any) {
      console.error("Join error:", error);
      alert(error.message || "Error joining match.");
    }
  };

  const handleShare = async () => {
    const isWin = (winnerA && isPlayerInTeamA) || (winnerB && isPlayerInTeamB);
    const myStats = match.playerPerformance.find(
      (s: any) => (s.playerId._id || s.playerId) === myPlayerId,
    );

    const shareData = {
      title: "Diski Match Report",
      text: `🔥 Just finished a match on Diski!\n\n⚽ Score: Team A ${
        match.score.teamA
      } - ${match.score.teamB} Team B\n${
        myStats?.goals
          ? `🥅 I scored ${myStats.goals} goal(s)!`
          : "🏃 Great game today!"
      }\n\nView the full scout report here:`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`,
        );
        alert("Match report link copied to clipboard!");
      }
    } catch (err) {
      console.log("Error sharing:", err);
    }
  };

  const renderTeamTable = (players: any[]) => (
    <Table
      borderless
      hover
      className="bg-white rounded-4 shadow-sm overflow-hidden"
    >
      <thead className="bg-light">
        <tr>
          <th className="ps-3">Player</th>
          <th className="text-center">Goals</th>
          <th className="text-center">Assists</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player: any) => {
          const stats = match.playerPerformance.find(
            (s: any) => (s.playerId._id || s.playerId) === player._id,
          );
          // Fixed: Define isThisPlayerMVP inside the map loop
          const isThisPlayerMVP = stats?.isMVP;

          return (
            <tr key={player._id} className="align-middle">
              <td className="ps-3 fw-bold">
                {player.diskiName}
                {isThisPlayerMVP && (
                  <Badge
                    bg="primary"
                    className="ms-2 rounded-pill"
                    style={{ fontSize: "0.6rem" }}
                  >
                    ⭐ MVP
                  </Badge>
                )}
              </td>
              <td className="text-center text-success fw-bold">
                {stats?.goals || 0}
              </td>
              <td className="text-center text-info fw-bold">
                {stats?.assists || 0}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  return (
    <Container className="py-4">
      <Button
        variant="link"
        className="text-dark p-0 mb-3 text-decoration-none"
        onClick={() => navigate(-1)}
      >
        ← Back
      </Button>

      <Card className="border-0 shadow-sm rounded-4 mb-4 text-center p-4 bg-dark text-white">
        {/* 1. Dynamic Top Text */}
        <p
          className="text-uppercase fw-bold mb-1"
          style={{ fontSize: "0.7rem", opacity: 0.8, letterSpacing: "1px" }}
        >
          {isFinished ? "Final Score" : "Match in Progress"}
        </p>

        {/* 2. Team Names + Score Layout */}
        <div className="d-flex align-items-center justify-content-center gap-3 my-2">
          <div className="text-end" style={{ flex: 1 }}>
            <h5 className="mb-0 fw-bold text-truncate">
              {match.lineups?.teamA?.name || "Team A"}
            </h5>
          </div>

          <h1 className="display-3 fw-bold mb-0" style={{ minWidth: "120px" }}>
            {match.score.teamA} - {match.score.teamB}
          </h1>

          <div className="text-start" style={{ flex: 1 }}>
            <h5 className="mb-0 fw-bold text-truncate">
              {match.lineups?.teamB?.name || "Team B"}
            </h5>
          </div>
        </div>

        {/* 3. Single Verified Badge Logic */}
        <div className="d-flex justify-content-center gap-2 mb-3">
          {match.status === "Verified" ? (
            <Badge
              bg="warning"
              text="dark"
              className="text-uppercase px-3 py-2 rounded-pill shadow-sm fw-bold"
            >
              ✅ Official Result
            </Badge>
          ) : (
            <Badge
              bg="success"
              className="text-uppercase px-3 py-2 rounded-pill fw-bold"
            >
              {match.status}
            </Badge>
          )}
        </div>

        {/* 4. Share Button */}
        {isFinished && (
          <div className="d-flex justify-content-center">
            <Button
              variant="outline-light"
              size="sm"
              className="rounded-pill px-4 d-flex align-items-center gap-2"
              onClick={handleShare}
              style={{
                borderWidth: "2px",
                fontSize: "0.8rem",
                fontWeight: "bold",
              }}
            >
              <span style={{ fontSize: "1rem" }}>🔗</span> Share Match Report
            </Button>
          </div>
        )}
      </Card>

      {isFinished && mvpPlayer && (
        <Card className="border-0 shadow-sm rounded-4 mb-4 bg-primary text-white p-3">
          <Row className="align-items-center">
            <Col xs={2} className="text-center">
              <div className="h1 mb-0">⭐</div>
            </Col>
            <Col>
              <h6 className="mb-0 fw-bold">Man of the Match</h6>
              <h4 className="mb-0">{mvpPlayer.diskiName || mvpPlayer.name}</h4>
            </Col>
            <Col className="text-end">
              <div className="small opacity-75">Impact</div>
              <div className="fw-bold">
                +{mvpPerformance.goals + mvpPerformance.assists} G/A
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {!isPlayerInMatch && match.status === "Pending" && (
        <Alert
          variant="warning"
          className="rounded-4 border-0 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3"
        >
          <div>
            <strong className="d-block">Missing from this match?</strong>
            <span className="small">
              Select your team to add yourself to the stats.
            </span>
          </div>
          <ButtonGroup>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => handleSelfJoin("teamA")}
            >
              Join Team A
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleSelfJoin("teamB")}
            >
              Join Team B
            </Button>
          </ButtonGroup>
        </Alert>
      )}

      <Row>
        <Col lg={6} className="mb-4">
          <h5 className="fw-bold text-success mb-3 d-flex justify-content-between">
            <span>{match.teamA?.name || "Team A"}</span>
            <small className="text-muted">
              {match.lineups.teamA.length} Players
            </small>
          </h5>
          {renderTeamTable(match.lineups.teamA)}
        </Col>
        <Col lg={6} className="mb-4">
          <h5 className="fw-bold text-danger mb-3 d-flex justify-content-between">
            <span>{match.teamB?.name || "Team B"}</span>
            <small className="text-muted">
              {match.lineups.teamB.length} Players
            </small>
          </h5>
          {renderTeamTable(match.lineups.teamB)}
        </Col>
      </Row>
    </Container>
  );
};
