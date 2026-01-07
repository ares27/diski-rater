import {
  Container,
  Card,
  Badge,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link
import {
  getSuggestions,
  createSuggestion,
  upvoteSuggestion,
} from "../services/api/api";

export const SuggestionsBoard = () => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [category, setCategory] = useState("Feature");
  const [votedItems, setVotedItems] = useState<string[]>(
    JSON.parse(localStorage.getItem("votedSuggestions") || "[]")
  );
  const navigate = useNavigate();

  const loadSuggestions = useCallback(async () => {
    const cached = localStorage.getItem("diski_suggestions_cache");
    if (cached) {
      setSuggestions(JSON.parse(cached));
      setLoading(false);
    }

    try {
      const data = await getSuggestions();
      const sorted = (data || []).sort(
        (a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0)
      );

      setSuggestions(sorted);
      localStorage.setItem("diski_suggestions_cache", JSON.stringify(sorted));
    } catch (err) {
      console.warn("Offline: Using cached suggestions board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "in progress":
        return "warning";
      case "planned":
        return "primary";
      case "pending":
        return "dark";
      default:
        return "secondary";
    }
  };

  const handleUpvote = async (id: string) => {
    if (votedItems.includes(id)) return;
    const originalSuggestions = [...suggestions];
    setSuggestions((prev) =>
      prev.map((s) =>
        s._id === id ? { ...s, upvotes: (s.upvotes || 0) + 1 } : s
      )
    );

    try {
      const updated = await upvoteSuggestion(id);
      const newVotes = [...votedItems, id];
      setVotedItems(newVotes);
      localStorage.setItem("votedSuggestions", JSON.stringify(newVotes));
      setSuggestions((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch (err) {
      setSuggestions(originalSuggestions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const cachedProfile = JSON.parse(
        localStorage.getItem("diski_user_profile") || "{}"
      );
      const area = cachedProfile.area || "General";

      await createSuggestion({
        text: newText,
        category,
        area: area,
      });

      setNewText("");
      setShowModal(false);
      loadSuggestions();
    } catch (err: any) {
      alert(`Error: ${err.message || "Check connection"}`);
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* SEAMLESS HEADER */}
      <div className="bg-white border-bottom py-4 mb-4 shadow-sm">
        <Container className="d-flex justify-content-between align-items-end">
          <div>
            <h2 className="fw-bold mb-0">
              ⚽ DiskiRater <span className="text-success">Board</span>
            </h2>
            <Link
              to="/home"
              className="text-decoration-none small fw-bold text-muted hover-success"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <Button
            variant="success"
            className="fw-bold px-4 rounded-pill shadow-sm"
            onClick={() => setShowModal(true)}
          >
            + Post Idea
          </Button>
        </Container>
      </div>

      <Container>
        {loading && suggestions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : (
          <Row className="g-4">
            {suggestions.map((s: any) => (
              <Col xs={12} md={6} lg={4} key={s._id}>
                <Card
                  className="h-100 border-0 shadow-sm"
                  style={{ borderRadius: "20px", overflow: "hidden" }}
                >
                  <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <Badge
                      bg={
                        s.category === "Bug"
                          ? "danger"
                          : s.category === "Feature"
                          ? "info"
                          : "secondary"
                      }
                      className="rounded-pill px-3"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {s.category}
                    </Badge>
                    <Badge
                      bg={getStatusColor(s.status)}
                      className="rounded-pill opacity-75"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {s.status || "Pending"}
                    </Badge>
                  </Card.Header>

                  <Card.Body className="px-4 py-3">
                    <h5
                      className="mb-0 fw-bold text-dark"
                      style={{ lineHeight: "1.4" }}
                    >
                      "{s.text}"
                    </h5>
                  </Card.Body>

                  <Card.Footer className="bg-white border-0 pb-4 px-4 d-flex justify-content-between align-items-center">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      <span
                        className="d-block fw-bold text-uppercase opacity-50"
                        style={{ fontSize: "0.55rem" }}
                      >
                        Posted
                      </span>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString()
                        : "Recent"}
                    </div>
                    <Button
                      variant={
                        votedItems.includes(s._id)
                          ? "success"
                          : "outline-success"
                      }
                      size="sm"
                      className="rounded-pill px-3 fw-bold border-2"
                      onClick={() => handleUpvote(s._id)}
                      disabled={votedItems.includes(s._id)}
                    >
                      🚀 {s.upvotes || 0}
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* MODAL (Styled to match) */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        border-0
      >
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">Share an Idea</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4">
            <Form.Group className="mb-3">
              <Form.Label
                className="small fw-bold text-muted text-uppercase"
                style={{ fontSize: "0.65rem" }}
              >
                Category
              </Form.Label>
              <Form.Select
                className="rounded-3 border-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Feature">✨ Feature Request</option>
                <option value="Bug">🪲 Report a Bug</option>
                <option value="Other">🔎 Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label
                className="small fw-bold text-muted text-uppercase"
                style={{ fontSize: "0.65rem" }}
              >
                Details
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                className="rounded-3 border-2"
                placeholder="What's on your mind?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button
              variant="light"
              className="fw-bold rounded-pill"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              className="px-4 fw-bold rounded-pill shadow-sm"
            >
              Submit Idea
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};
