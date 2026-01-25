import { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
// IMPORT the central API function
import { resetPasswordApi } from "../services/api/api";

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
      // CLEANER: Use the imported API function instead of manual fetch
      const data = await resetPasswordApi({
        phoneNumber: phone,
        securityPin: pin,
        newPassword: newPassword,
      });

      // data is already parsed as JSON by the API helper
      alert(data.message || "Password updated! You can now login.");
      navigate("/login");
    } catch (err: any) {
      // This will now catch both network errors and the "Failed to execute json" error
      // by handling it inside api.ts
      setError(err.message || "An unexpected error occurred.");
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
