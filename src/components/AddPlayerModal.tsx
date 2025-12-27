import { Modal, Button, Form } from "react-bootstrap";
import { useState } from "react";
import type { Player } from "../types/types";

interface Props {
  show: boolean;
  onHide: () => void;
  onAdd: (player: Player) => void;
}

const AddPlayerModal = ({ show, onHide, onAdd }: Props) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Player["position"]>("MID");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newPlayer: Player = {
      id: Date.now().toString(), // Simple unique ID
      name,
      position,
      isSelected: true, // Auto-select so they're ready to play
      ratings: { pace: 50, technical: 50, physical: 50, reliability: 50 },
    };

    onAdd(newPlayer);
    setName("");
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Player</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Player Name</Form.Label>
            <Form.Control
              autoFocus
              placeholder="e.g. Cristiano"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Preferred Position</Form.Label>
            <Form.Select
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
            >
              <option value="GK">Goalkeeper</option>
              <option value="DEF">Defender</option>
              <option value="MID">Midfielder</option>
              <option value="FWD">Forward</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="success" type="submit">
            Add to Squad
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddPlayerModal;
