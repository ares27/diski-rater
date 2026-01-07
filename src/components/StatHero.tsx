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

  // Helper to safely access career stats
  const career = player.careerStats || {
    goals: 0,
    assists: 0,
    wins: 0,
    mvps: 0,
    matchesPlayed: 0,
  };

  const FormDot = ({ result }: { result: string }) => {
    // Normalize the input: convert to uppercase and remove spaces
    const normalizedResult = result?.trim().toUpperCase();
    const colors: Record<string, string> = {
      W: "bg-success", // Green
      L: "bg-danger", // Red
      D: "bg-secondary", // Grey
    };

    return (
      <div
        className={`${
          colors[normalizedResult] || "bg-light"
        } rounded-circle d-inline-block shadow-sm`}
        style={{
          width: "12px",
          height: "12px",
          margin: "0 2px",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
        title={normalizedResult}
      />
    );
  };

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
          <h5 className="fw-bold mb-1 text-dark">Scout Analysis</h5>
          <p className="text-muted small italic">"{report.analysis}"</p>
        </div>

        {/* Detailed Stats Bars */}
        <Row className="g-3">
          {stats.map((stat) => {
            // Correctly lowercase the label for the lookup
            const change = player.lastChange?.[stat.label.toLowerCase()] || 0;
            return (
              <Col xs={6} key={stat.label}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span
                    className="small fw-bold text-uppercase"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {stat.label}
                  </span>
                  <div className="d-flex align-items-center gap-1">
                    {change !== 0 && (
                      <span
                        className={`fw-bold ${
                          change > 0 ? "text-success" : "text-danger"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {change > 0 ? `+${change}` : change}
                      </span>
                    )}
                    <span className="small fw-bold">
                      {Math.round(stat.value)}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  variant={stat.color}
                  now={stat.value}
                  style={{ height: "6px" }}
                  className="rounded-pill"
                />
              </Col>
            );
          })}
        </Row>

        <hr className="my-4 opacity-25" />

        {/* --- CAREER STATS RIBBON --- */}
        <div className="bg-light rounded-4 p-3 mb-4 d-flex justify-content-around text-center border">
          <div>
            <div className="h5 fw-bold mb-0 text-dark">
              {career.matchesPlayed || 0}
            </div>
            <div
              className="text-muted text-uppercase fw-bold"
              style={{ fontSize: "0.55rem" }}
            >
              Apps
            </div>
          </div>
          <div className="border-start ps-3">
            <div className="h5 fw-bold mb-0 text-success">
              {career.goals || 0}
            </div>
            <div
              className="text-muted text-uppercase fw-bold"
              style={{ fontSize: "0.55rem" }}
            >
              Goals
            </div>
          </div>
          <div className="border-start ps-3">
            <div className="h5 fw-bold mb-0 text-info">
              {career.assists || 0}
            </div>
            <div
              className="text-muted text-uppercase fw-bold"
              style={{ fontSize: "0.55rem" }}
            >
              Assists
            </div>
          </div>
          <div className="border-start ps-3">
            <div className="h5 fw-bold mb-0 text-warning">
              {career.mvps || 0}
            </div>
            <div
              className="text-muted text-uppercase fw-bold"
              style={{ fontSize: "0.55rem" }}
            >
              MVPs
            </div>
          </div>
        </div>

        {/* NEW: FORM INDICATOR ROW */}
        <div className="pt-2 border-top d-flex justify-content-between align-items-center">
          <span
            className="text-muted text-uppercase fw-bold"
            style={{ fontSize: "0.6rem" }}
          >
            Recent Form
          </span>
          <div className="d-flex align-items-center">
            {player.form && player.form.length > 0 ? (
              player.form.map((res: string, idx: number) => {
                console.log(
                  `Player ${player.diskiName} Match ${idx} Result:`,
                  `"${res}"`
                );
                return <FormDot key={idx} result={res} />;
              })
            ) : (
              <small className="text-muted" style={{ fontSize: "0.6rem" }}>
                No recent matches
              </small>
            )}
          </div>
        </div>

        {/* Original Footer: Position, Foot, Kit */}
        <div className="pt-3 border-top d-flex justify-content-between">
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
