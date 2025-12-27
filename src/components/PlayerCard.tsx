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
}

const PlayerCard = ({ player, onRate, onToggleSelect }: Props) => {
  const stats = Object.values(player.ratings);
  const overall = Math.round(stats.reduce((a, b) => a + b, 0) / stats.length);

  return (
    <Card
      className={`mb-3 border-3 shadow-sm ${
        player.isSelected ? "border-success" : "border-transparent"
      }`}
      style={{ borderRadius: "15px", transition: "0.3s" }}
    >
      <Card.Body>
        <div className="d-flex justify-content-end mb-2">
          <Form.Check
            type="switch"
            label={player.isSelected ? "Playing" : "Bench"}
            checked={player.isSelected || false}
            onChange={() => onToggleSelect(player.id)}
          />
        </div>
        <Row className="align-items-center">
          {/* Left Side: Avatar & Main Info */}
          <Col xs={4} className="text-center border-end">
            <div
              className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
              style={{
                width: "60px",
                height: "60px",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              {player.name.charAt(0)}
            </div>
            <Badge bg="dark" className="mb-1">
              {player.position}
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
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="mb-0 fw-bold">{player.name}</h5>
            </div>

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
              <Button
                variant="outline-success"
                size="sm"
                className="fw-bold"
                onClick={() => onRate(player)} // Add this prop
                disabled
              >
                Rate Player
              </Button>
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
      <span className="fw-bold text-muted">{label}</span>
      <span>{value}</span>
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
