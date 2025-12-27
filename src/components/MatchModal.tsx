import { Modal, Row, Col, ListGroup, Badge } from 'react-bootstrap';
import type { Player } from '../types/types';

interface Props {
  show: boolean;
  onHide: () => void;
  team1: Player[];
  team2: Player[];
}

const MatchModal = ({ show, onHide, team1, team2 }: Props) => {
  const calcAvg = (team: Player[]) => {
    if (team.length === 0) return 0;
    const total = team.reduce((acc, p) => {
      const stats = Object.values(p.ratings);
      return acc + (stats.reduce((a, b) => a + b, 0) / stats.length);
    }, 0);
    return Math.round(total / team.length);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Today's Match</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light">
        <Row>
          <TeamColumn title="Team 1" players={team1} avg={calcAvg(team1)} color="primary" />
          <TeamColumn title="Team 2" players={team2} avg={calcAvg(team2)} color="danger" />
        </Row>
      </Modal.Body>
    </Modal>
  );
};

const TeamColumn = ({ title, players, avg, color }: any) => (
  <Col xs={6}>
    <div className={`text-center mb-3 p-2 bg-${color} text-white rounded`}>
      <h6 className="mb-0">{title}</h6>
      <small>Avg: {avg}</small>
    </div>
    <ListGroup variant="flush">
      {players.map((p: Player) => (
        <ListGroup.Item key={p.id} className="bg-transparent border-0 px-1">
          <Badge bg="secondary" className="me-2">{p.position}</Badge>
          <small className="fw-bold">{p.name}</small>
        </ListGroup.Item>
      ))}
    </ListGroup>
  </Col>
);

export default MatchModal;