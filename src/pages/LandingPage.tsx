import { Container, Row, Col, Button, Card, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

export const LandingPage = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleEntryAction = (target: string) => {
    if (user) {
      navigate(target);
    } else {
      navigate("/login");
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "85vh" }}
    >
      <Row className="text-center justify-content-center w-100">
        <Col md={8} lg={6}>
          {/* Header Section */}
          <div className="mb-4">
            <span style={{ fontSize: "5rem" }}>⚽</span>
            <h1 className="display-4 fw-bold mt-2">DiskiRater</h1>
            <p
              className="lead text-muted mx-auto"
              style={{ maxWidth: "450px" }}
            >
              The ultimate platform for local football communities to rate,
              draft, and dominate.
            </p>
          </div>

          <Row className="g-3 mt-2">
            {/* Primary Action: Squad & Draft */}
            <Col xs={12}>
              <Card
                className="border-0 shadow-sm bg-success text-white p-2"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onClick={() => handleEntryAction("/squad")}
              >
                <Card.Body>
                  <h3 className="fw-bold mb-1">Enter Squad & Draft</h3>
                  <p className="small mb-0 opacity-75">
                    View ratings and generate teams for today's match.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            {/* Secondary Actions */}
            <Col xs={6}>
              <Button
                variant="white"
                className="w-100 py-3 fw-bold border shadow-sm"
                onClick={() => navigate("/board")}
              >
                💡 Suggestions
              </Button>
            </Col>

            <Col xs={6}>
              {user ? (
                <Button
                  variant="outline-dark"
                  className="w-100 py-3 fw-bold shadow-sm"
                  onClick={() => navigate("/home")}
                >
                  👤 My Dashboard
                </Button>
              ) : (
                <Button
                  variant="outline-success"
                  className="w-100 py-3 fw-bold shadow-sm"
                  onClick={() => navigate("/login")}
                >
                  Join Area
                </Button>
              )}
            </Col>
          </Row>

          {/* Version / Meta Footer */}
          <div className="mt-5">
            <Badge
              bg="light"
              text="muted"
              className="border px-3 py-2 fw-normal"
            >
              Currently in <strong>Open Beta (v0.1.4)</strong>
            </Badge>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
