import { useEffect, useState } from "react";
import {
  Card,
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
  Form,
} from "react-bootstrap";
import { getPendingUsers, approveUser, declineUser } from "../services/api/api";
import { auth } from "../firebase/config"; // Ensure auth is imported for the API call
import { updateSquadLinkApi } from "../services/api/api";

// Accept squadProps as a prop to access refreshUserStatus
export const CaptainTools = ({ squadProps }: any) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {},
  );
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Destructure the refresh function from squadProps
  const { refreshUserStatus } = squadProps || {};

  // 2. Safety Net for userData: Check props, then check localStorage
  const userData =
    squadProps?.userData ||
    JSON.parse(localStorage.getItem("diski_user_profile") || "{}");

  // Debug line: Open your browser console to see what this says!
  // console.log("DEBUG: CaptainTools received userData:", userData);

  const handleCopyLink = () => {
    const link = userData?.captainClaim?.socialLink || userData?.socialLink;
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset "Copied" text after 2 seconds
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleRoleChange = (userId: string, role: string) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingUsers();
      const playersArray = Array.isArray(data) ? data : [];

      // Filter so Captain only sees their area
      const captainArea = userData?.area || userData?.areaId;
      const filtered = playersArray.filter(
        (u) => (u.area || u.areaId) === captainArea,
      );

      setPendingUsers(filtered);

      // Initialize roles: default everyone to "Player"
      const initialRoles: Record<string, string> = {};
      playersArray.forEach((u: any) => {
        initialRoles[u._id] = "Player";
      });
      setSelectedRoles(initialRoles);
    } catch (err) {
      console.error("Fetch error:", err);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const role = selectedRoles[userId] || "Player";

    if (
      !window.confirm(
        `Approve this player as a "${role}" and add them to the squad?`,
      )
    )
      return;

    try {
      // 1. Send approval to API
      await approveUser(userId, role);

      // 2. Trigger the global refresh from App.tsx
      // This ensures if the Captain approved themselves or needs new permissions,
      // the App state updates immediately without a logout.
      if (refreshUserStatus) {
        await refreshUserStatus();
      }

      alert(`Success! Player added to the squad as ${role}.`);
      fetchPending();
    } catch (err: any) {
      console.error("Approval error:", err);
      alert(`Error: ${err.message || "Server error."}`);
    }
  };

  const handleDecline = async (userId: string) => {
    if (!window.confirm("Are you sure you want to decline this request?"))
      return;

    try {
      await declineUser(userId);
      alert("Request declined.");
      fetchPending();
    } catch (err: any) {
      console.error("Decline error:", err);
      alert(`Error: ${err.message || "Server error."}`);
    }
  };

  const handleSaveLink = async () => {
    // 1. Validation logic remains in the UI layer
    if (!tempLink.includes("chat.whatsapp.com")) {
      alert("Please enter a valid WhatsApp invite link.");
      return;
    }

    try {
      // 2. Use the central API helper
      await updateSquadLinkApi({
        firebaseUid: auth.currentUser?.uid,
        newSocialLink: tempLink,
      });

      // 3. Success UI updates
      alert("WhatsApp link updated!");
      setIsEditingLink(false);

      // 4. Refresh global state if the provider function exists
      if (refreshUserStatus) {
        await refreshUserStatus();
      }
    } catch (err: any) {
      console.error("Link update error:", err);
      alert(err.message || "Failed to update link.");
    }
  };

  const handleShareWhatsApp = () => {
    const link = userData?.captainClaim?.socialLink || userData?.socialLink;
    if (!link) return;

    const message = `⚽ *Join our Diski Squad!* ⚽\n\nTap the link below to join our official WhatsApp group:\n${link}`;

    // Use the WhatsApp API link
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-2">Loading requests...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Captain's Command Centre</h2>
        <Button variant="outline-secondary" size="sm" onClick={fetchPending}>
          🔄 Refresh
        </Button>
      </div>

      {/* --- ADD THIS SECTION HERE --- */}
      <Card className="border-0 shadow-sm mb-4 bg-light rounded-4">
        <Card.Body className="p-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <span className="fs-4 me-3">🔗</span>
              <div>
                <div className="fw-bold small text-uppercase text-muted">
                  Squad WhatsApp Link
                </div>
                {isEditingLink ? (
                  <Form.Control
                    size="sm"
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                    placeholder="Paste new link..."
                    className="mt-1"
                  />
                ) : (
                  <div className="d-flex flex-column gap-1">
                    <small className="text-success fw-bold d-block">
                      {userData?.captainClaim?.socialLink ||
                        userData?.socialLink ||
                        "No link set"}
                    </small>

                    {(userData?.captainClaim?.socialLink ||
                      userData?.socialLink) && (
                      <div className="d-flex gap-2 mt-1">
                        {/* Copy Button */}
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="py-0 px-2"
                          style={{ fontSize: "0.7rem", height: "22px" }}
                          onClick={handleCopyLink}
                        >
                          {copied ? "✅" : "📋 Copy"}
                        </Button>

                        {/* Share Button */}
                        <Button
                          variant="success"
                          size="sm"
                          className="py-0 px-2 d-flex align-items-center gap-1"
                          style={{ fontSize: "0.7rem", height: "22px" }}
                          onClick={handleShareWhatsApp}
                        >
                          <span style={{ fontSize: "0.8rem" }}>💬</span> Share
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              {isEditingLink ? (
                <div className="d-flex gap-2">
                  <Button variant="success" size="sm" onClick={handleSaveLink}>
                    Save
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setIsEditingLink(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="link"
                  className="text-decoration-none p-0"
                  onClick={() => {
                    setTempLink(userData?.captainClaim?.socialLink || "");
                    setIsEditingLink(true);
                  }}
                >
                  Edit Link
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
      {/* ---------------------------- */}

      <h4 className="mb-3 text-muted">Pending Join Requests</h4>

      {pendingUsers.length === 0 ? (
        <Alert variant="info" className="border-0 shadow-sm">
          No pending requests at the moment.
        </Alert>
      ) : (
        <Table hover responsive className="shadow-sm align-middle">
          <thead className="table-dark">
            <tr>
              <th>Diski Name</th>
              <th>Position</th>
              <th>Target Area</th>
              <th>Assign Role</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((u: any) => (
              <tr key={u._id}>
                <td className="fw-bold text-success">
                  {u.diskiName || "No Name"}
                </td>
                <td className="fw-bold">{u.position || "N/A"}</td>
                <td>
                  <Badge bg="info" className="px-3 py-2 text-dark">
                    📍 {u.area || u.areaId || "General"}
                  </Badge>
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    className="border-success fw-bold"
                    style={{ maxWidth: "130px" }}
                    value={selectedRoles[u._id] || "Player"}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  >
                    <option value="Player">Player</option>
                    <option value="Captain">Captain</option>
                  </Form.Select>
                </td>
                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="success"
                      size="sm"
                      className="fw-bold shadow-sm px-3"
                      onClick={() => handleApprove(u._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="fw-bold px-3"
                      onClick={() => handleDecline(u._id)}
                    >
                      Decline
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};
