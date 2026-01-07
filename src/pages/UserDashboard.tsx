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
  checkAreaCaptain,
  claimCaptaincyApi,
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
  let analysis =
    "You provide a solid balance to any squad, capable of filling multiple roles.";

  // --- 1. HYBRID ARCHETYPES (Combined Strengths) ---

  if (pace > 75 && technical > 75) {
    archetype = "The Wing Wizard";
    analysis =
      "A deadly combination of raw speed and close control; you're a nightmare for fullbacks.";
  } else if (technical > 75 && physical > 75) {
    archetype = "The Maestro";
    analysis =
      "You possess the strength to hold off challenges and the skill to dictate the tempo.";
  } else if (physical > 75 && reliability > 75) {
    archetype = "The General";
    analysis =
      "A leader on the pitch who wins every battle and never lets their intensity drop.";
  } else if (pace > 75 && reliability > 75) {
    archetype = "The Box-to-Box Specialist";
    analysis =
      "You have the lungs to cover every blade of grass and the speed to join every attack.";
  }

  // --- 2. ELITE SPECIALISTS (Single Peak) ---
  else if (max === pace && pace > 80) {
    archetype = "The Speedster";
    analysis =
      "Your explosive pace is a massive threat on the counter-attack and breaks defensive lines.";
  } else if (max === technical && technical > 80) {
    archetype = "The Playmaker";
    analysis =
      "You have the elite vision and technical touch required to unlock the tightest defenses.";
  } else if (max === physical && physical > 80) {
    archetype = "The Enforcer";
    analysis =
      "You dominate the physical duels and provide the steel your team needs in the middle.";
  } else if (max === reliability && reliability > 80) {
    archetype = "The Engine";
    analysis =
      "The most consistent player on the pitch. Your work rate ensures the team remains solid.";
  }

  // --- 3. THE "RISING STAR" (For lower overall but high potential) ---
  else if (max < 65 && reliability > 60) {
    archetype = "The Hard Worker";
    analysis =
      "You might still be honing your skills, but your discipline makes you a coach's favorite.";
  } else if (max < 65 && pace > 65) {
    archetype = "The Raw Talent";
    analysis =
      "You have the natural speed to cause trouble; once the technical side clicks, you'll be unstoppable.";
  } else if (max < 65) {
    archetype = "The Prospect";
    analysis =
      "You're finding your feet on the pitch. Focus on your consistency to unlock your true potential.";
  }

  // This handles players who have one "Pro" level stat while the rest are low
  else if (
    max > 75 &&
    max - (pace + technical + physical + reliability) / 4 > 15
  ) {
    archetype = "The Hidden Gem";
    analysis =
      "You have one elite attribute that stands out. Use that weapon to change the game!";
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
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const isApproved = userData?.status === "Approved";

  const navigate = useNavigate();

  const report = getScoutReport(playerStats?.ratings);
  const displayArea = userData?.area || userData?.areaId || "General";

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
            console.log("Captain Status Check:", capStatus); // Add this to debug!
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

  useEffect(() => {
    const fetchPendingMatches = async () => {
      const user = auth.currentUser;
      if (!user || !isApproved || !userData?.linkedPlayerId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/matches/pending/${displayArea}`
        );
        const data = await response.json();

        // NEW LOGIC: Only show on Dashboard if I am ALREADY in the lineup
        // AND I haven't verified yet.
        const myPersonalPending = data.filter((m: any) => {
          const isInLineup = [...m.lineups.teamA, ...m.lineups.teamB].includes(
            userData.linkedPlayerId
          );
          const hasNotVerified = !m.verifications.includes(user.uid);
          return isInLineup && hasNotVerified;
        });

        setPendingMatches(myPersonalPending);
      } catch (err) {
        console.error("Failed to fetch pending matches", err);
      }
    };

    if (displayArea && isApproved) fetchPendingMatches();
  }, [displayArea, isApproved, userData?.linkedPlayerId]);

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

  const handleVerify = async (matchId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/matches/${matchId}/verify`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebaseUid: auth.currentUser?.uid }),
        }
      );

      if (response.ok) {
        // Remove from local state
        setPendingMatches((prev) => prev.filter((m) => m._id !== matchId));
        alert("Match confirmed! Stats will update once 75% of players agree.");
      }
    } catch (err) {
      alert("Verification failed.");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-2 text-muted">Loading Diski Centre...</p>
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

      {/* 2. PLAYER WELCOME HEADER */}
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
              bg={isApproved ? "success" : "warning"}
              className="rounded-pill px-3"
            >
              {userData?.status || "Pending"} {userData?.role}
            </Badge>
            <Badge bg="light" text="dark" className="rounded-pill px-3 border">
              📍 {displayArea}
            </Badge>
          </div>
          {/* --- NEW AREA MATCHES BUTTON --- */}
          {isApproved && (
            <Button
              variant="dark"
              size="sm"
              className="rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
              onClick={() => navigate(`/area/${displayArea}`)}
              style={{ fontSize: "0.8rem", marginTop: "1.5rem" }}
            >
              ⚽ Area Matches
            </Button>
          )}
        </Col>
      </Row>

      {/* 3. CONDITIONAL RENDER: APPROVED CONTENT VS PENDING MESSAGE */}
      {!isApproved ? (
        /* WAITING FOR APPROVAL MESSAGE */
        <Row>
          <Col>
            <Card className="border-0 shadow-sm rounded-4 bg-white p-5 text-center">
              <div className="display-1 mb-3">⏳</div>
              <h4 className="fw-bold">Awaiting Admin Approval</h4>
              <p className="text-muted mx-auto" style={{ maxWidth: "450px" }}>
                Your profile is currently under review by the{" "}
                <strong>{displayArea}</strong> Area Captain. Once approved,
                you'll gain access to match verifications, scouting reports, and
                team chats.
              </p>
              <div className="mt-2">
                <Button
                  variant="outline-success"
                  className="rounded-pill px-4"
                  onClick={() => window.location.reload()}
                >
                  🔄 Check Status
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      ) : (
        /* FULL DASHBOARD FOR APPROVED PLAYERS */
        <>
          {/* 4. MATCH VERIFICATION ALERT (Oldest First Queue) */}
          {pendingMatches.length > 0 && (
            <Row className="mb-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-danger mb-0 small fw-bold text-uppercase tracking-wider">
                    ⚠️ Pending Verification
                  </h6>
                  {pendingMatches.length > 1 && (
                    <Badge bg="danger" pill>
                      +{pendingMatches.length - 1} more
                    </Badge>
                  )}
                </div>
                {(() => {
                  const match = pendingMatches[0];
                  const confirmedCount = match.verifications.length;
                  const requiredCount = Math.ceil(
                    match.expectedConfirmations * 0.75
                  );
                  return (
                    <Card
                      key={match._id}
                      className="border-0 shadow-sm rounded-4 bg-white border-start border-danger border-4"
                    >
                      <Card.Body className="p-4">
                        <Row className="align-items-center">
                          <Col>
                            <div className="small text-muted mb-1 text-uppercase fw-bold">
                              Recent Result
                            </div>
                            <h4 className="fw-bold mb-0">
                              {match.score.teamA}{" "}
                              <span className="text-muted mx-2">—</span>{" "}
                              {match.score.teamB}
                            </h4>
                            <p className="small text-muted mt-2 mb-0">
                              Progress:{" "}
                              <strong>
                                {confirmedCount}/{requiredCount}
                              </strong>
                            </p>
                          </Col>
                          <Col xs="auto" className="text-end">
                            <div className="d-flex flex-column gap-2">
                              <Button
                                variant="success"
                                className="rounded-pill fw-bold px-4"
                                onClick={() => handleVerify(match._id)}
                              >
                                Confirm ✅
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="text-muted rounded-pill"
                                onClick={() =>
                                  navigate(`/match-details/${match._id}`)
                                }
                              >
                                View Details
                              </Button>
                            </div>
                          </Col>
                        </Row>
                        <div
                          className="progress mt-3"
                          style={{ height: "4px" }}
                        >
                          <div
                            className="progress-bar bg-success"
                            style={{
                              width: `${
                                (confirmedCount / requiredCount) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })()}
              </Col>
            </Row>
          )}

          <Row>
            {/* 5. SCOUTING REPORT */}
            <Col lg={5} className="mb-4">
              <h6 className="text-muted mb-3 small fw-bold text-uppercase tracking-wider">
                Scouting Report
              </h6>
              <StatHero player={playerStats} report={report} />
            </Col>

            <Col lg={7}>
              {/* 6. WHATSAPP CHAT */}
              {areaHasCaptain && areaCaptainData?.socialLink && (
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

              {/* 6.5 ANNOUNCEMENTS */}
              <h6 className="text-muted mb-3 small fw-bold text-uppercase tracking-wider">
                📢 Announcements
              </h6>
              <Card className="border-0 shadow-sm rounded-4 bg-white mb-4 overflow-hidden">
                <Card.Body className="p-0">
                  {/* If you have a specific announcements array in state, map it here. 
        Otherwise, here is a placeholder/static version based on Area logic */}
                  <div className="p-3 border-bottom border-light">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <Badge bg="info" className="rounded-pill small">
                        General
                      </Badge>
                      <small className="text-muted">Just now</small>
                    </div>
                    <h6 className="fw-bold mb-1">
                      Welcome to the {displayArea} Diski Centre!
                    </h6>
                    <p className="small text-muted mb-0">
                      Make sure to verify your recent matches to keep your
                      scouting report updated.
                    </p>
                  </div>

                  {/* Example of a second announcement */}
                  <div className="p-3 bg-light bg-opacity-50">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <Badge
                        bg="warning"
                        text="dark"
                        className="rounded-pill small"
                      >
                        Alert
                      </Badge>
                      <small className="text-muted">Yesterday</small>
                    </div>
                    <h6 className="fw-bold mb-1">Weekly Rankings Reset</h6>
                    <p className="small text-muted mb-0">
                      New leaderboards are calculated every Monday. Play more to
                      climb the ranks!
                    </p>
                  </div>
                </Card.Body>
              </Card>

              {/* 7. QUICK ACTIONS */}
              <h6 className="text-muted mb-3 small fw-bold text-uppercase tracking-wider">
                Quick Actions
              </h6>
              <Row className="g-3">
                <Col xs={12}>
                  <Button
                    variant={pendingMatches.length > 0 ? "warning" : "white"}
                    className="w-100 py-3 shadow-sm border-0 rounded-4 fw-bold d-flex align-items-center justify-content-between px-4"
                    onClick={() => navigate("/pending-matches")}
                  >
                    <div className="d-flex align-items-center">
                      <span className="fs-3 me-3">⏳</span>
                      <div className="text-start">
                        <div className="mb-0 text-dark">
                          Area Pending Matches
                        </div>
                        <small className="text-muted fw-normal">
                          {pendingMatches.length > 0
                            ? `${pendingMatches.length} matches need review`
                            : "All caught up!"}
                        </small>
                      </div>
                    </div>
                    {pendingMatches.length > 0 && (
                      <Badge bg="danger" pill>
                        {pendingMatches.length}
                      </Badge>
                    )}
                  </Button>
                </Col>
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
        </>
      )}

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
