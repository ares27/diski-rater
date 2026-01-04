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
import { StatHero } from "../components/StatHero";
import { useNavigate } from "react-router-dom";

const getScoutReport = (ratings: any) => {
  if (!ratings)
    return {
      archetype: "Prospect",
      analysis: "Waiting for your first match data...",
      overall: 0,
    };

  const { pace, technical, physical, reliability } = ratings;
  const avg = (pace + technical + physical + reliability) / 4;
  const max = Math.max(pace, technical, physical, reliability);

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
    analysis = "Your work rate ensures the team stays solid.";
  }

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
      if (cachedProfile) setUserData(JSON.parse(cachedProfile));
      if (cachedStats) setPlayerStats(JSON.parse(cachedStats));
      if (cachedProfile) setLoading(false);

      try {
        const data = await getUserStatus(user.uid);
        if (data) {
          setUserData(data);
          localStorage.setItem("diski_user_profile", JSON.stringify(data));

          if (data.linkedPlayerId) {
            const allPlayers = await getPlayers();
            const me = allPlayers.find(
              (p: any) => p._id === data.linkedPlayerId
            );
            if (me) {
              setPlayerStats(me);
              localStorage.setItem("diski_my_stats", JSON.stringify(me));
            }
          }

          if (data.role === "Captain") {
            const pending = await getPendingUsers();
            const areaSpecific = pending.filter(
              (u: any) => (u.area || u.areaId) === (data.area || data.areaId)
            );
            setPendingCount(areaSpecific.length);
          }
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const report = getScoutReport(playerStats?.ratings);
  const displayArea = userData?.area || userData?.areaId || "General";

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-2 text-muted">Loading Command Centre...</p>
      </div>
    );

  return (
    <Container className="py-4">
      {/* 1. CAPTAIN'S PRIVILEGED SECTION (RESTORED & IMPROVED) */}
      {userData?.role === "Captain" && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm bg-dark text-white rounded-4 overflow-hidden">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-success">
                      Captain's Command Centre
                    </h5>
                    <small className="opacity-75">
                      Manage {displayArea} Squad & Approvals
                    </small>
                  </div>
                  <Badge bg="success" className="rounded-pill px-3 py-2">
                    Active Session
                  </Badge>
                </div>
                <Row className="g-2">
                  <Col xs={12} md={6}>
                    <Button
                      variant="outline-light"
                      className="w-100 fw-bold border-2 py-2 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => navigate("/admin")}
                    >
                      🛡️ Player Approvals
                      {pendingCount > 0 && (
                        <Badge bg="danger" pill>
                          {pendingCount}
                        </Badge>
                      )}
                    </Button>
                  </Col>
                  <Col xs={12} md={6}>
                    <Button
                      variant="success"
                      className="w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                      onClick={() => navigate("/squad")}
                    >
                      📋 Generate Match Day
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* 2. PLAYER WELCOME */}
      <Row className="mb-4">
        <Col>
          <span className="text-uppercase small fw-bold text-muted tracking-widest">
            Player Profile
          </span>
          <h2 className="fw-bold mb-1">
            Welcome back, {userData?.diskiName || "Baller"}!
          </h2>
          <div className="d-flex gap-2">
            <Badge
              bg={userData?.status === "Approved" ? "success" : "warning"}
              className="rounded-pill px-3"
            >
              {userData?.status || "Pending"} {userData?.role}
            </Badge>
            <Badge bg="light" text="dark" className="rounded-pill px-3 border">
              📍 {displayArea}
            </Badge>
          </div>
        </Col>
      </Row>

      <Row>
        {/* 3. HERO STATS SECTION */}
        <Col lg={5} className="mb-4">
          <h6 className="text-muted mb-3 small fw-bold text-uppercase tracking-wider">
            Scouting Report
          </h6>
          {playerStats ? (
            <StatHero player={playerStats} report={report} />
          ) : (
            <Card className="p-5 text-center border-0 shadow-sm rounded-4 bg-white h-100 d-flex flex-column justify-content-center">
              <div className="display-4 mb-3">⚽</div>
              <h5 className="fw-bold">Awaiting Stats</h5>
              <p className="text-muted small px-3">
                {userData?.status === "Approved"
                  ? "Your profile is linked! Your scouting analysis will appear once you've been rated in a match."
                  : "Your application is pending approval. Talk to your Captain to get started."}
              </p>
            </Card>
          )}
        </Col>

        {/* 4. ANNOUNCEMENTS & ACTIONS */}
        <Col lg={7}>
          <h6 className="text-muted mb-3 small fw-bold text-uppercase tracking-wider">
            Notice Board
          </h6>
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body className="p-4">
              <div className="mb-4 d-flex align-items-start">
                <div className="bg-info bg-opacity-10 p-2 rounded-3 me-3">
                  <span className="fs-4">📢</span>
                </div>
                <div>
                  <div className="fw-bold">Match Day Confirmation</div>
                  <small className="text-muted">
                    Sunday 15:30 - 16:00. Please ensure you have toggled your
                    selection in the Squad tab.
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <div className="bg-warning bg-opacity-10 p-2 rounded-3 me-3">
                  <span className="fs-4">📍</span>
                </div>
                <div>
                  <div className="fw-bold">Pitch Location</div>
                  <small className="text-muted">
                    We are using the bottom Baseball field this week. See you
                    there!
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>

          <h6 className="text-muted mb-3 small fw-bold text-uppercase tracking-wider">
            Quick Actions
          </h6>
          <Row className="g-3">
            <Col xs={6}>
              <Button
                variant="white"
                className="w-100 py-4 shadow-sm border-0 rounded-4 fw-bold text-dark h-100"
                onClick={() => navigate("/squad")}
              >
                <div className="fs-2 mb-2">⚽</div>
                Go to Squad
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                variant="white"
                className="w-100 py-4 shadow-sm border-0 rounded-4 fw-bold text-dark h-100"
                onClick={() => navigate("/board")}
              >
                <div className="fs-2 mb-2">💡</div>
                Suggestions
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};
