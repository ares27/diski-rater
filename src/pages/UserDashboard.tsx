import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Button,
} from "react-bootstrap";
import { auth } from "../firebase/config";
import {
  getUserStatus,
  getPlayers,
  getPendingUsers,
} from "../services/api/api";
import PlayerCard from "../components/PlayerCard";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- ADDITION 1: THE INVESTIGATION LOGIC ---
// This lives outside the component so it doesn't re-run on every render
const getScoutReport = (ratings: any) => {
  if (!ratings)
    return {
      archetype: "Prospect",
      analysis: "Waiting for your first match data...",
    };

  const { pace, technical, physical, reliability } = ratings;
  const max = Math.max(pace, technical, physical, reliability);
  const avg = (pace + technical + physical + reliability) / 4;

  let archetype = "All-Rounder";
  let analysis = "You provide a solid balance to any squad.";

  if (max === pace && pace > 70) {
    archetype = "The Speedster";
    analysis = "Your pace is a massive threat on the counter-attack.";
  } else if (max === technical && technical > 70) {
    archetype = "The Playmaker";
    analysis = "You have the vision to unlock tight defenses.";
  } else if (max === physical && physical > 70) {
    archetype = "The Enforcer";
    analysis = "You dominate the physical duels in the middle of the park.";
  } else if (max === reliability && reliability > 70) {
    archetype = "The Engine";
    analysis = "Your work rate ensures the team stays solid for 90 minutes.";
  }

  if (avg < 55) analysis = "Focus on training to boost your core attributes.";

  return { archetype, analysis, overall: Math.round(avg) };
};

export const UserDashboard = () => {
  const [userData, setUserData] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const cachedProfile = localStorage.getItem("diski_user_profile");
      const cachedStats = localStorage.getItem("diski_my_stats");
      const cachedPending = localStorage.getItem("diski_pending_count");

      if (cachedProfile) setUserData(JSON.parse(cachedProfile));
      if (cachedStats) setPlayerStats(JSON.parse(cachedStats));
      if (cachedPending) setPendingCount(parseInt(cachedPending));

      if (cachedProfile) setLoading(false);

      try {
        const data = await getUserStatus(user.uid);
        if (!data) {
          setUserData({
            status: "Pending",
            role: "Player",
            diskiName: "New Baller",
          });
          return;
        }

        setUserData(data);
        localStorage.setItem("diski_user_profile", JSON.stringify(data));

        if (data.linkedPlayerId) {
          const allPlayers = await getPlayers();
          const me = allPlayers.find((p: any) => p._id === data.linkedPlayerId);
          if (me) {
            setPlayerStats(me);
            localStorage.setItem("diski_my_stats", JSON.stringify(me));
          }
        }

        if (data.role === "Captain") {
          try {
            // FIX: Use the central API function instead of fetch()
            const pending = await getPendingUsers();

            const areaSpecificPending = pending.filter(
              (u: any) => (u.area || u.areaId) === (data.area || data.areaId)
            );
            setPendingCount(areaSpecificPending.length);
            localStorage.setItem(
              "diski_pending_count",
              areaSpecificPending.length.toString()
            );
          } catch (e) {
            console.warn("Could not fetch pending count, using cache.");
            console.error(
              "Silent fail on pending count - likely not a captain or network issue."
            );
          }
        }
      } catch (err) {
        console.error("Dashboard fetch failed, using offline data.");
        if (!cachedProfile) setUserData({ status: "Pending", role: "Player" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- ADDITION 2: RUN THE INVESTIGATION ---
  // Helper for area display
  // const displayArea = userData?.area || userData?.areaId || "General";
  const report = getScoutReport(playerStats?.ratings);
  const displayArea = userData?.area || userData?.areaId || "General";

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-2 text-muted">Accessing Dashboard...</p>
      </div>
    );

  return (
    <Container className="py-4">
      {/* CAPTAIN'S PRIVILEGED SECTION */}
      {userData?.role === "Captain" && (
        <Row className="mb-4">
          <Col>
            <Card className="border-success bg-light shadow-sm">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0 fw-bold text-dark">
                    Captain's Command Centre:{" "}
                    <span className="text-success">{displayArea}</span>
                  </h6>
                  <small className="text-muted">
                    {pendingCount > 0
                      ? `There are ${pendingCount} new players in ${displayArea} awaiting approval.`
                      : `All caught up in ${displayArea}!`}
                  </small>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  className="fw-bold px-3"
                  onClick={() => navigate("/admin")}
                >
                  Approvals{" "}
                  {pendingCount > 0 && (
                    <Badge bg="danger" className="ms-1">
                      {pendingCount}
                    </Badge>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold mb-1">
            Welcome back, {userData?.diskiName || "Baller"}!
          </h2>
          <div className="d-flex gap-2">
            <Badge
              bg={userData?.status === "Approved" ? "success" : "warning"}
              className="px-2 py-1"
            >
              {userData?.status || "Pending"} {userData?.role || "Player"}
            </Badge>
            <Badge bg="dark" className="px-2 py-1">
              📍 {displayArea}
            </Badge>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={6} lg={4} className="mb-4">
          <h5 className="text-muted mb-3 small fw-bold text-uppercase">
            Your Stats Profile
          </h5>
          {playerStats ? (
            <PlayerCard
              player={playerStats}
              onRate={() => {}}
              onToggleSelect={() => {}}
            />
          ) : (
            <Card
              className="p-4 text-center border-secondary"
              style={{
                borderStyle: "dashed",
                backgroundColor: "transparent",
                borderRadius: "15px",
              }}
            >
              <p className="mb-0 text-muted small">
                {userData?.status === "Approved"
                  ? "Profile approved! Your stats will appear once the Captain links your game data."
                  : "Waiting for Captain approval to generate your stats card."}
              </p>
            </Card>
          )}
        </Col>

        <Col md={6} lg={8}>
          <h5 className="text-muted mb-3 small fw-bold text-uppercase">
            Quick Actions
          </h5>
          <div className="d-grid gap-3 d-sm-flex mb-4">
            <Button
              variant="success"
              size="lg"
              className="shadow-sm fw-bold px-4"
              disabled={userData?.status !== "Approved"}
              onClick={() => navigate("/squad")}
            >
              ⚽ Squad & Draft
            </Button>
            <Button
              variant="outline-dark"
              size="lg"
              className="shadow-sm fw-bold px-4"
              onClick={() => navigate("/board")}
            >
              💡 Suggestions
            </Button>
          </div>

          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="fw-bold mb-0">Announcements</Card.Title>
                <Badge bg="light" text="dark" className="border">
                  {displayArea} News
                </Badge>
              </div>
              <hr />
              <div className="mb-3 d-flex align-items-start">
                <Badge bg="info" className="me-2 mt-1">
                  News
                </Badge>
                <div>
                  <div className="fw-bold small">Sunday Match</div>
                  <small className="text-muted">
                    10:00 AM kickoff. Please confirm availability in the squad
                    tab.
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <Badge bg="danger" className="me-2 mt-1">
                  Alert
                </Badge>
                <div>
                  <div className="fw-bold small">Pitch Update</div>
                  <small className="text-muted">
                    Pitch 3 is closed. We are moving to the main turf today.
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
