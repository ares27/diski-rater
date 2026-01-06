import { useEffect, useState } from "react";
import { Container, Card, Badge, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";

export const PendingMatches = () => {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();
  const userArea =
    JSON.parse(localStorage.getItem("diski_user_profile") || "{}").area ||
    JSON.parse(localStorage.getItem("diski_user_profile") || "{}").areaId ||
    "General";

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/matches/pending/${userArea}`)
      .then((res) => res.json())
      .then((data) => setMatches(data));
  }, [userArea]);

  return (
    <Container className="py-4">
      <h3 className="fw-bold mb-4">Pending in {userArea}</h3>
      {matches.length === 0 ? (
        <Card className="text-center p-5 border-0 shadow-sm rounded-4">
          <div className="display-1 mb-3">✅</div>
          <h5>No Pending Matches</h5>
          <p className="text-muted">
            All matches in your area have been verified.
          </p>
          <Button variant="success" onClick={() => navigate("/home")}>
            Back to Dashboard
          </Button>
        </Card>
      ) : (
        matches.map((m: any) => (
          <Card
            key={m._id}
            className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden"
          >
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col>
                  <Badge bg="warning" text="dark" className="mb-2">
                    Awaiting Consensus
                  </Badge>
                  <h4 className="fw-bold">
                    {m.score.teamA} - {m.score.teamB}
                  </h4>
                  <small className="text-muted">ID: {m._id.slice(-6)}</small>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="outline-dark"
                    className="rounded-pill fw-bold"
                    onClick={() => navigate(`/match-details/${m._id}`)}
                  >
                    View Details
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};
