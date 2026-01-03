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
  canRate?: boolean; // Only true if user.role === "Captain"
  hideCheck?: boolean;
}

const PlayerCard = ({
  player,
  onRate,
  onToggleSelect,
  canRate = false,
  hideCheck = false,
}: Props) => {
  const stats = Object.values(player.ratings);
  const overall = Math.round(stats.reduce((a, b) => a + b, 0) / stats.length);

  // Use diskiName primarily, fallback to name, then "Player"
  const displayName = player.diskiName || player.name || "New Player";

  return (
    <Card
      className={`mb-3 border-3 shadow-sm ${
        player.isSelected ? "border-success" : "border-transparent"
      }`}
      style={{ borderRadius: "15px", transition: "0.3s" }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          {/* Main Title now shows Diski Name */}
          <Card.Title className="mb-0 fw-bold text-dark align-items-center">
            {displayName}
          </Card.Title>

          {!hideCheck && (
            <Form.Check
              type="switch"
              id={`status-switch-${player._id || player.id}`}
              label={player.isSelected ? "Playing" : "Bench"}
              checked={player.isSelected || false}
              onChange={() => onToggleSelect(player._id || player.id)}
              className={
                player.isSelected ? "text-success fw-bold" : "text-muted"
              }
            />
          )}
        </div>

        <Row className="align-items-center">
          {/* Left Side: Avatar & Overall */}
          <Col xs={4} className="text-center border-end">
            <div
              className={`${
                player.isSelected ? "bg-success" : "bg-secondary"
              } text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 shadow-sm`}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                transition: "background-color 0.3s ease",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <Badge bg="dark" className="mb-1 px-2">
              {player.position || "SUB"}
            </Badge>
            <div className="h4 mb-0 text-success fw-bold">{overall}</div>
            <small
              className="text-uppercase text-muted"
              style={{ fontSize: "0.6rem", letterSpacing: "1px" }}
            >
              Overall
            </small>
          </Col>

          {/* Right Side: Stats & Action */}
          <Col xs={8} className="ps-4">
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

            <div className="d-grid mt-3">
              {/* Rate Button: ONLY visible/active for Captains 
                This protects the integrity of the skill ratings.
            */}
              {canRate ? (
                <div className="d-grid mt-3">
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="fw-bold rounded-pill"
                    onClick={() => onRate(player)}
                  >
                    Rate {displayName.split(" ")[0]}
                  </Button>
                </div>
              ) : (
                <div className="text-center mt-3">
                  <span
                    className="text-muted"
                    style={{ fontSize: "0.65rem", fontStyle: "italic" }}
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
  <div className="mb-1">
    <div
      className="d-flex justify-content-between"
      style={{ fontSize: "0.75rem" }}
    >
      <span className="fw-bold text-muted" style={{ fontSize: "0.65rem" }}>
        {label}
      </span>
      <span className="fw-bold">{value}</span>
    </div>
    <ProgressBar
      variant={color}
      now={value}
      max={100}
      style={{ height: "4px" }}
    />
  </div>
);

export default PlayerCard;
