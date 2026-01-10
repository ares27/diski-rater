import { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

export const ResetPassword = () => {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(
        `${baseUrl.replace(/\/$/, "")}/api/auth/reset-password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phone,
            securityPin: pin,
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Reset failed");

      alert("Password updated! You can now login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "90vh" }}
    >
      <Card
        className="p-4 border-0 shadow-sm rounded-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <div className="text-center mb-4">
          <span style={{ fontSize: "3rem" }}>🔓</span>
          <h3 className="fw-bold mt-2">Reset Password</h3>
          <p className="text-muted small">
            Enter details to update your password
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="py-2 small">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleReset}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="082..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">
              4-Digit Recovery PIN
            </Form.Label>
            <Form.Control
              type="password"
              maxLength={4}
              placeholder="e.g. 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold">New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </Form.Group>

          <Button
            variant="success"
            type="submit"
            className="w-100 fw-bold py-2 rounded-pill shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Update Password"
            )}
          </Button>

          <div className="text-center mt-3">
            <Link to="/login" className="small text-muted text-decoration-none">
              Back to Login
            </Link>
          </div>
        </Form>
      </Card>
    </Container>
  );
};
