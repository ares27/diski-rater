import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";

export const CaptainTools = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/users/pending")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setPendingUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (userId: string) => {
    // Simple confirmation so the captain doesn't click by mistake
    if (!window.confirm("Approve this player and add them to the squad?"))
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/approve/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // We leave this empty to tell the backend "Create a new profile from registration data"
          body: JSON.stringify({ linkedPlayerId: "" }),
        }
      );

      if (response.ok) {
        alert("Success! Player added to the area squad.");
        fetchPending(); // Refresh the list of pending users
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert("Server error. Please check your connection.");
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
              <th>Phone Number</th>
              <th>Target Area</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((u: any) => (
              <tr key={u._id}>
                <td className="fw-bold text-success">
                  {u.diskiName || "No Name"}
                </td>
                <td>{u.phoneNumber || "No Phone"}</td>
                <td>
                  <Badge bg="info" className="px-3 py-2 text-dark">
                    📍 {u.area || u.areaId || "General"}
                  </Badge>
                </td>
                <td style={{ width: "200px" }}>
                  <Button
                    variant="success"
                    className="w-100 fw-bold shadow-sm"
                    onClick={() => handleApprove(u._id)}
                  >
                    Approve Player
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};
