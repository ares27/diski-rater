import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import { auth } from "../firebase/config";
import {
  getUserStatus,
  getPlayers,
  getPendingUsers,
} from "../services/api/api";
import { StatHero } from "../components/StatHero";
import { useNavigate } from "react-router-dom";

const checkAreaCaptain = async (areaId: string) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/areas/${areaId}/has-captain`
  );
  return res.json();
};

const claimCaptaincyApi = async (data: any) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/users/claim-captain`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  return res.json();
};

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
  const [areaHasCaptain, setAreaHasCaptain] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({ social: "", note: "" });
  const [areaCaptainData, setAreaCaptainData] = useState<any>(null);

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

          // Check if area has a captain
          const areaId = data.areaId || data.area;
          if (areaId) {
            const capStatus = await checkAreaCaptain(areaId);
            setAreaHasCaptain(capStatus.hasCaptain);
            setAreaCaptainData(capStatus);
          }

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

  const handleCaptainClaim = async () => {
    if (!claimData.social || !claimData.note) {
      alert("Please provide both a social link and a short note.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/claim-captain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: auth.currentUser?.uid,
            socialLink: claimData.social,
            note: claimData.note,
          }),
        }
      );

      if (response.ok) {
        alert("Success! You are now the Captain of " + displayArea);
        setShowClaimModal(false);
        // Refresh to show the Captain's Command Centre
        window.location.reload();
      } else {
        throw new Error("Failed to promote");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong with the claim.");
    }
  };

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
      {/* 1. CAPTAIN'S PRIVILEGED SECTION */}
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
                      🛡️ Player Approvals{" "}
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

      {/* 2. ORGANIC CLAIM SECTION */}
      {!areaHasCaptain &&
        userData?.role !== "Captain" &&
        userData?.status === "Approved" && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm bg-primary bg-opacity-10 rounded-4">
                <Card.Body className="p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div style={{ flex: "1 1 300px" }}>
                    <h5 className="fw-bold text-primary mb-1">
                      Founding Captain Wanted 🏆
                    </h5>
                    <p className="small mb-0 text-dark">
                      {displayArea} has no organizer. Claim this area to lead!
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="fw-bold rounded-pill px-4"
                    onClick={() => setShowClaimModal(true)}
                  >
                    Apply to Lead
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      {/* 3. PLAYER WELCOME */}
      <Row className="mb-4">
        <Col>
          <span className="text-uppercase small fw-bold text-muted tracking-widest">
            Player Profile
          </span>
          <h2 className="fw-bold mb-1">
            Welcome back, {userData?.diskiName || "Baller"}!
          </h2>
          {/* {JSON.stringify(areaCaptainData)} */}
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
                  ? "Your profile is linked! Scouting analysis appears after your first match."
                  : "Your application is pending approval."}
              </p>
            </Card>
          )}
        </Col>

        <Col lg={7}>
          {/* NEW: WHATSAPP VERIFIED ACTION */}
          {areaHasCaptain &&
            userData?.role !== "Captain" &&
            areaCaptainData?.socialLink && (
              <Card className="border-0 shadow-sm bg-success bg-opacity-10 mb-4 rounded-4">
                <Card.Body className="d-flex align-items-center justify-content-between p-3">
                  <div className="d-flex align-items-center">
                    <div className="fs-3 me-3">💬</div>
                    <div>
                      <h6 className="mb-0 fw-bold text-success">
                        Join the Squad Chat
                      </h6>
                      <small className="text-dark opacity-75">
                        Official WhatsApp for {displayArea}
                      </small>
                    </div>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    className="rounded-pill px-3 fw-bold shadow-sm"
                    onClick={() =>
                      window.open(areaCaptainData.socialLink, "_blank")
                    }
                  >
                    Join Group
                  </Button>
                </Card.Body>
              </Card>
            )}
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
                    Sunday 15:30. Ensure you toggle selection in Squad tab.
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
                    We are using the bottom Baseball field this week.
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
                <div className="fs-2 mb-2">⚽</div>Go to Squad
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                variant="white"
                className="w-100 py-4 shadow-sm border-0 rounded-4 fw-bold text-dark h-100"
                onClick={() => navigate("/board")}
              >
                <div className="fs-2 mb-2">💡</div>Suggestions
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* CLAIM MODAL */}
      <Modal
        show={showClaimModal}
        onHide={() => setShowClaimModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Claim Captaincy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">
              WhatsApp Group Invite Link
            </Form.Label>
            <Form.Control
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              onChange={(e) =>
                setClaimData({ ...claimData, social: e.target.value })
              }
            />
            <Form.Text className="text-muted small">
              Provide the invite link to your area's football group so players
              can join.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">
              Why should you lead {displayArea}?
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              onChange={(e) =>
                setClaimData({ ...claimData, note: e.target.value })
              }
            />
          </Form.Group>
          <Button
            variant="primary"
            className="w-100 fw-bold"
            onClick={handleCaptainClaim}
          >
            Submit Application
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};
