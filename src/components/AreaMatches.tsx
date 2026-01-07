import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Badge, Spinner, Row, Col } from "react-bootstrap";
import { getAreaMatches } from "../services/api/api";

export const AreaMatches = () => {
  const { areaName } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!areaName) return;

    setLoading(true);
    // 2. Use the imported function instead of manual fetch
    getAreaMatches(areaName)
      .then((data) => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setMatches([]);
        setLoading(false);
      });
  }, [areaName]);

  if (loading)
    return <Spinner animation="border" className="d-block mx-auto my-5" />;

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">Matches in {areaName}</h2>

      {Array.isArray(matches) && matches.length === 0 ? (
        <p className="text-muted">No matches found in this area yet.</p>
      ) : (
        <Row>
          {Array.isArray(matches) &&
            matches.map((match: any) => (
              <Col xs={12} key={match._id} className="mb-3">
                <Card
                  className="border-0 shadow-sm rounded-4 p-3"
                  onClick={() => navigate(`/match-details/${match._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-center" style={{ flex: 1 }}>
                      <h6 className="mb-0">
                        {match.lineups.teamA?.name || "Team A"}
                      </h6>
                    </div>

                    <div className="px-3 text-center">
                      <span className="fw-bold h4">
                        {match.score.teamA} - {match.score.teamB}
                      </span>
                      <br />
                      <Badge
                        bg={
                          match.status === "Finished" ? "secondary" : "success"
                        }
                        className="rounded-pill"
                      >
                        {match.status}
                      </Badge>
                    </div>

                    <div className="text-center" style={{ flex: 1 }}>
                      <h6 className="mb-0">
                        {match.lineups.teamB?.name || "Team B"}
                      </h6>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
      )}
    </Container>
  );
};
