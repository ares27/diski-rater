import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
// Import declineUser
import { getPendingUsers, approveUser, declineUser } from "../services/api/api";

export const CaptainTools = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingUsers();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!window.confirm("Approve this player and add them to the squad?"))
      return;

    try {
      await approveUser(userId);
      alert("Success! Player added to the area squad.");
      fetchPending();
    } catch (err: any) {
      console.error("Approval error:", err);
      alert(`Error: ${err.message || "Server error."}`);
    }
  };

  // New Decline Handler
  const handleDecline = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to decline this request? This will remove the user."
      )
    )
      return;

    try {
      await declineUser(userId);
      alert("Request declined and removed.");
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
              <th>Phone Number</th>
              <th>Target Area</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((u: any) => (
              <tr key={u._id}>
                <td className="fw-bold text-success">
                  {u.diskiName || "No Name"}
                </td>
                <td className="fw-bold text-success">
                  {u.position || "No Name"}
                </td>
                <td>{u.phoneNumber || "No Phone"}</td>
                <td>
                  <Badge bg="info" className="px-3 py-2 text-dark">
                    📍 {u.area || u.areaId || "General"}
                  </Badge>
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
