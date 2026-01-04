import { Card, Row, Col, ProgressBar, Badge } from "react-bootstrap";

interface StatHeroProps {
  player: any;
  report: {
    archetype: string;
    analysis: string;
    overall: number;
  };
}

export const StatHero = ({ player, report }: StatHeroProps) => {
  const stats = [
    { label: "Pace", value: player.ratings?.pace || 0, color: "success" },
    {
      label: "Technical",
      value: player.ratings?.technical || 0,
      color: "info",
    },
    {
      label: "Physical",
      value: player.ratings?.physical || 0,
      color: "warning",
    },
    {
      label: "Reliability",
      value: player.ratings?.reliability || 0,
      color: "danger",
    },
  ];

  return (
    <Card
      className="border-0 shadow-lg overflow-hidden"
      style={{ borderRadius: "20px" }}
    >
      {/* Top Section: Identity */}
      <div className="bg-dark text-white p-4 text-center">
        <Badge bg="success" className="mb-2 px-3 rounded-pill">
          {report.archetype}
        </Badge>
        <h1 className="display-4 fw-bold mb-0">{report.overall}</h1>
        <p className="text-uppercase tracking-widest small opacity-75">
          Overall Rating
        </p>
      </div>

      <Card.Body className="p-4">
        <div className="mb-4">
          <h5 className="fw-bold mb-1">Scout Analysis</h5>
          <p className="text-muted small italic">"{report.analysis}"</p>
        </div>

        {/* Detailed Stats Bars */}
        <Row className="g-3">
          {stats.map((stat) => (
            <Col xs={6} key={stat.label}>
              <div className="d-flex justify-content-between mb-1">
                <span className="small fw-bold">{stat.label}</span>
                <span className="small fw-bold">{stat.value}</span>
              </div>
              <ProgressBar
                variant={stat.color}
                now={stat.value}
                style={{ height: "6px" }}
                className="rounded-pill"
              />
            </Col>
          ))}
        </Row>

        <div className="mt-4 pt-3 border-top d-flex justify-content-between">
          <div className="text-center">
            <div className="fw-bold">{player.position || "N/A"}</div>
            <small
              className="text-muted text-uppercase"
              style={{ fontSize: "0.6rem" }}
            >
              Position
            </small>
          </div>
          <div className="text-center">
            <div className="fw-bold">{player.foot || "Right"}</div>
            <small
              className="text-muted text-uppercase"
              style={{ fontSize: "0.6rem" }}
            >
              Preferred Foot
            </small>
          </div>
          <div className="text-center">
            <div className="fw-bold">#{player.kitNumber || "?"}</div>
            <small
              className="text-muted text-uppercase"
              style={{ fontSize: "0.6rem" }}
            >
              Kit No.
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
