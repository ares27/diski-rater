import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
  Form,
} from "react-bootstrap";
import { getPendingUsers, approveUser, declineUser } from "../services/api/api";

// Accept squadProps as a prop to access refreshUserStatus
export const CaptainTools = ({ squadProps }: any) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {}
  );

  // Destructure the refresh function from squadProps
  const { refreshUserStatus } = squadProps || {};

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
      setPendingUsers(playersArray);

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
        `Approve this player as a "${role}" and add them to the squad?`
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
