import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { registerUserApi } from "../services/api/api";

export const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState("");
  const [diskiName, setDiskiName] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("Valhalla");
  const [position, setPosition] = useState("MID"); // Default position
  const [securityPin, setSecurityPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const formatPhoneToAuth = (number: string) => {
    const cleanPhone = number.replace(/\s+/g, "");
    return `${cleanPhone}@diski.local`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || (isRegistering && !diskiName)) {
      return setError("Please fill in all fields");
    }

    setError("");
    const shadowEmail = formatPhoneToAuth(phone);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          shadowEmail,
          password
        );

        // Dynamic API call based on your .env files
        await registerUserApi({
          firebaseUid: userCredential.user.uid,
          phoneNumber: phone,
          diskiName: diskiName,
          position: position,
          email: shadowEmail,
          areaId: location,
          securityPin: securityPin,
          role: "Player",
          status: "Pending",
        });

        alert(`Request sent for ${diskiName}! Wait for captain approval.`);
      } else {
        await signInWithEmailAndPassword(auth, shadowEmail, password);
      }
      navigate("/home");
    } catch (err: any) {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid phone number or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This phone number is already registered.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <Card
        className="p-4 shadow-sm border-0"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold text-success">⚽ DiskiRater</h2>
          <p className="text-muted small">
            {isRegistering
              ? "Create your Player Profile"
              : "Sign in with your Phone"}
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="small p-2">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleAuth}>
          {isRegistering && (
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-success">
                Select Your Area
              </Form.Label>
              <Form.Select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-success"
              >
                <option value="Centurion">Centurion</option>
                <option value="Erasmia">Erasmia</option>
                <option value="Midrand">Midrand</option>
                <option value="Rooihuiskraal">Rooihuiskraal</option>
                <option value="Valhalla">Valhalla</option>
                <option value="VTH">VTH</option>
              </Form.Select>
            </Form.Group>
          )}

          {isRegistering && (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">
                  Diski Nickname
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Scara, Kasi King..."
                  value={diskiName}
                  onChange={(e) => setDiskiName(e.target.value)}
                  required
                />
              </Form.Group>

              {/* NEW POSITION FIELD */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">
                  Primary Position
                </Form.Label>
                <Form.Select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                >
                  <option value="FWD">Forward (FWD)</option>
                  <option value="MID">Midfielder (MID)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="GK">Goalkeeper (GK)</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="e.g. 0821234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          {isRegistering && (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-danger">
                Recovery PIN (4 Digits)
              </Form.Label>
              <Form.Control
                type="password"
                pattern="\d{4}"
                maxLength={4}
                placeholder="e.g. 1234"
                value={securityPin}
                onChange={(e) =>
                  setSecurityPin(e.target.value.replace(/\D/g, ""))
                }
                required
              />
              <Form.Text className="text-muted" style={{ fontSize: "0.7rem" }}>
                Save this! You'll need it if you forget your password.
              </Form.Text>
            </Form.Group>
          )}

          {!isRegistering && (
            <div className="text-end mb-3">
              <Link
                to="/reset-password"
                style={{ fontSize: "0.8rem" }}
                className="text-success text-decoration-none fw-bold"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <Button
            variant="success"
            type="submit"
            className="w-100 fw-bold py-2 mb-3 shadow-sm"
          >
            {isRegistering ? "Join the Squad" : "Login"}
          </Button>
        </Form>

        <div className="text-center">
          <Button
            variant="link"
            size="sm"
            className="text-decoration-none"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
          >
            {isRegistering
              ? "Already registered? Login"
              : "New player? Join an Area"}
          </Button>
          <hr />
          <Link to="/board" className="text-decoration-none small text-muted">
            💡 Public Suggestions Board
          </Link>
        </div>
      </Card>
    </Container>
  );
};
