import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import type { Player } from '../types/types';

interface Props {
  show: boolean;
  player: Player | null;
  onHide: () => void;
  onSave: (playerId: string, newRatings: Player['ratings']) => void;
}

const RatingModal = ({ show, player, onHide, onSave }: Props) => {
  const [ratings, setRatings] = useState<Player['ratings']>({
    pace: 50,
    technical: 50,
    physical: 50,
    reliability: 50,
  });

  // Reset ratings to player's current stats when modal opens
  useEffect(() => {
    if (player) setRatings(player.ratings);
  }, [player]);

  const handleSave = () => {
    if (player) {
      onSave(player.id, ratings);
      onHide();
    }
  };

  if (!player) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton className="border-0">
        <Modal.Title>Rate {player.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {Object.keys(ratings).map((key) => (
          <div key={key} className="mb-4">
            <div className="d-flex justify-content-between mb-1">
              <label className="text-capitalize fw-bold">{key}</label>
              <span className="text-success fw-bold">{ratings[key as keyof Player['ratings']]}</span>
            </div>
            <Form.Range
              value={ratings[key as keyof Player['ratings']]}
              onChange={(e) => setRatings({
                ...ratings,
                [key]: parseInt(e.target.value)
              })}
              step={1}
              min={0}
              max={100}
            />
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="light" onClick={onHide}>Cancel</Button>
        <Button variant="success" onClick={handleSave} className="px-4">Save Rating</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RatingModal;