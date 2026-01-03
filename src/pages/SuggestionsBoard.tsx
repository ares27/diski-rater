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
import { useNavigate } from "react-router-dom";
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

  // 1. Memoized Load function for reuse
  const loadSuggestions = useCallback(async () => {
    // A. Immediate Load from Cache
    const cached = localStorage.getItem("diski_suggestions_cache");
    if (cached) {
      setSuggestions(JSON.parse(cached));
      setLoading(false); // Hide spinner early if we have cache
    }

    try {
      // B. Fetch fresh data
      const data = await getSuggestions();
      const sorted = (data || []).sort(
        (a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0)
      );

      // C. Update State and Cache
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

      // Sync local state with server response
      setSuggestions((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch (err) {
      // Revert if API fails
      setSuggestions(originalSuggestions);
      alert("Could not upvote while offline.");
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
        // @ts-ignore (if type is strict)
        area: area,
        status: "Pending",
      });

      setNewText("");
      setShowModal(false);
      loadSuggestions();
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(`Error: ${err.message || "Check connection"}`);
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* HEADER */}
      <div className="bg-white border-bottom py-3 mb-4 shadow-sm sticky-top">
        <Container className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold mb-0">
              ⚽ DiskiRater <span className="text-success">Board</span>
            </h4>
            <small className="text-muted">Community Roadmap</small>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="success"
              size="sm"
              className="fw-bold px-3 shadow-sm"
              onClick={() => setShowModal(true)}
            >
              + Post Idea
            </Button>
            <Button
              variant="outline-dark"
              size="sm"
              onClick={() => navigate("/home")}
            >
              {"<<"} Back
            </Button>
          </div>
        </Container>
      </div>

      <Container>
        {loading && suggestions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-5 border rounded bg-white shadow-sm">
            <p className="text-muted mb-0">No suggestions yet. Be the first!</p>
          </div>
        ) : (
          <Row>
            {suggestions.map((s: any) => (
              <Col xs={12} md={6} lg={4} key={s._id} className="mb-4">
                <Card className="h-100 border-0 shadow-sm hover-shadow transition">
                  <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                    <Badge
                      bg={
                        s.category === "Bug"
                          ? "danger"
                          : s.category === "Feature"
                          ? "info"
                          : "secondary"
                      }
                      className="text-uppercase"
                    >
                      {s.category}
                    </Badge>
                    {/* Update 1: Display the Area on the card */}
                    {/* <small
                      className="text-muted fw-bold"
                      style={{ fontSize: "0.65rem" }}
                    >
                      📍 {s.area || "General"}
                    </small> */}
                    <Badge
                      pill
                      bg={getStatusColor(s.status)}
                      style={{ fontSize: "0.7rem" }}
                    >
                      {s.status || "Pending"}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0 fw-bold" style={{ fontSize: "1.05rem" }}>
                      "{s.text}"
                    </p>
                  </Card.Body>
                  <Card.Footer className="bg-white border-0 pb-3 d-flex justify-content-between align-items-center">
                    <small className="text-muted small">
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString()
                        : "Recent"}
                    </small>
                    <Button
                      variant={
                        votedItems.includes(s._id)
                          ? "success"
                          : "outline-success"
                      }
                      size="sm"
                      className="rounded-pill px-3 fw-bold"
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

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Share an Idea</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">
                CATEGORY
              </Form.Label>
              <Form.Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Feature">✨ Feature Request</option>
                <option value="Bug">🪲 Report a Bug</option>
                <option value="Other">🔎 Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">
                YOUR FEEDBACK
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="How can we improve the game?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              className="px-4 fw-bold shadow-sm"
            >
              Post Suggestion
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};
