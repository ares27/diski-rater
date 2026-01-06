import {
  Card,
  ProgressBar,
  Row,
  Col,
  Badge,
  Button,
  Form,
} from "react-bootstrap";
import type { Player } from "../types/types";

interface Props {
  player: Player;
  onRate: (player: Player) => void;
  onToggleSelect: (playerId: string) => void;
  canRate?: boolean;
  hideCheck?: boolean;
  isMVP?: boolean;
}

const PlayerCard = ({
  player,
  onRate,
  onToggleSelect,
  canRate = false,
  hideCheck = false,
  isMVP = false,
}: Props) => {
  const stats = Object.values(player.ratings);
  const overall = Math.round(stats.reduce((a, b) => a + b, 0) / stats.length);
  const displayName = player.diskiName || player.name || "New Player";
  const playerId = player._id || player.id;

  // Handler to prevent "Rate" button clicks from also toggling the player selection
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={`mb-3 border-3 shadow-sm ${
        player.isSelected ? "border-success" : "border-light"
      } ${isMVP ? "border-warning" : ""}`}
      style={{
        borderRadius: "15px",
        overflow: "hidden",
        transition: "all 0.2s ease",
        cursor: "pointer", // Shows the pointer on the whole card
      }}
      onClick={() => onToggleSelect(playerId)} // Clicking the card toggles Playing/Bench
    >
      <Card.Body className="p-3">
        {/* Top Row: Name, Badges, and Switch */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex flex-wrap gap-1 align-items-center">
            <h5 className="mb-0 fw-bold text-dark me-2">{displayName}</h5>
            {isMVP && (
              <Badge
                bg="primary"
                className="rounded-pill d-flex align-items-center gap-1 shadow-sm"
                style={{ fontSize: "0.65rem" }}
              >
                ⭐ MVP
              </Badge>
            )}
            {player.role === "Captain" && (
              <Badge
                bg="warning"
                text="dark"
                className="rounded-pill d-flex align-items-center gap-1 shadow-sm"
                style={{ fontSize: "0.65rem", border: "1px solid #d39e00" }}
              >
                © CAPTAIN
              </Badge>
            )}
            {player.isPioneer && (
              <span
                title="Area Pioneer"
                style={{ cursor: "help", marginLeft: "5px" }}
              >
                🛡️
              </span>
            )}
          </div>

          {!hideCheck && (
            <div onClick={handleActionClick}>
              {" "}
              {/* Stop propagation so switch doesn't double-trigger */}
              <Form.Check
                type="switch"
                id={`status-switch-${playerId}`}
                label={player.isSelected ? "" : "Bench"}
                checked={player.isSelected || false}
                onChange={() => onToggleSelect(playerId)}
                className={
                  player.isSelected ? "text-success fw-bold" : "text-muted"
                }
              />
            </div>
          )}
        </div>

        <Row className="align-items-center g-0">
          {/* Left Side: Avatar & Overall Score */}
          <Col xs={3} className="text-center border-end pe-3">
            <div
              className={`${
                player.isSelected ? "bg-success" : "bg-secondary"
              } text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 shadow`}
              style={{
                width: "55px",
                height: "55px",
                fontSize: "1.4rem",
                fontWeight: "bold",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <Badge bg="dark" className="mb-1" style={{ fontSize: "0.7rem" }}>
              {player.position || "SUB"}
            </Badge>
            <div className="h3 mb-0 text-success fw-bold">{overall}</div>
            <div
              className="text-muted text-uppercase fw-bold"
              style={{ fontSize: "0.55rem", letterSpacing: "0.5px" }}
            >
              Overall
            </div>
          </Col>

          {/* Right Side: Skill Progress Bars */}
          <Col xs={9} className="ps-3">
            <AttributeRow
              label="PACE"
              value={player.ratings.pace}
              color="info"
            />
            <AttributeRow
              label="TECH"
              value={player.ratings.technical}
              color="primary"
            />
            <AttributeRow
              label="PHY"
              value={player.ratings.physical}
              color="danger"
            />
            <AttributeRow
              label="REL"
              value={player.ratings.reliability}
              color="warning"
            />

            <div className="mt-2" onClick={handleActionClick}>
              {" "}
              {/* Stop propagation here too */}
              {canRate ? (
                <Button
                  variant="outline-success"
                  size="sm"
                  className="w-100 fw-bold rounded-pill py-1"
                  style={{ fontSize: "0.75rem", borderWidth: "2px" }}
                  onClick={() => onRate(player)}
                >
                  Rate {displayName.split(" ")[0]}
                </Button>
              ) : (
                <div className="text-center pt-1">
                  <span
                    className="text-muted italic fw-medium"
                    style={{ fontSize: "0.65rem" }}
                  >
                    Official Ratings Locked
                  </span>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

const AttributeRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="mb-2">
    <div
      className="d-flex justify-content-between align-items-center"
      style={{ lineHeight: "1" }}
    >
      <span className="fw-bold text-muted" style={{ fontSize: "0.65rem" }}>
        {label}
      </span>
      <span className="fw-bold" style={{ fontSize: "0.75rem" }}>
        {value}
      </span>
    </div>
    <ProgressBar
      variant={color}
      now={value}
      max={100}
      style={{ height: "4px", marginTop: "2px" }}
      className="shadow-none"
    />
  </div>
);

export default PlayerCard;
