// This ensures we always have a valid, absolute URL
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If we are in development and no URL is set, or it doesn't start with http
  if (!envUrl || !envUrl.startsWith("http")) {
    return "http://localhost:5000";
  }

  // Remove trailing slash if it exists to prevent double slashes in fetch calls
  return envUrl.replace(/\/$/, "");
};

const API_URL = getBaseUrl();

// 1. Fetch all players
export const getPlayers = () =>
  fetch(`${API_URL}/api/players`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch players");
    return res.json();
  });

// 2. Create a new player
export const createPlayerApi = (player: any) =>
  fetch(`${API_URL}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to create player");
    return res.json();
  });

// 3. Update an existing player
export const updatePlayerApi = (id: string, updates: any) => {
  if (!id || id === "undefined") {
    return Promise.reject("No valid ID provided to API");
  }
  return fetch(`${API_URL}/api/players/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to update player");
    return res.json();
  });
};

// Get User Status
export const getUserStatus = (uid: string) =>
  fetch(`${API_URL}/api/users/${uid}`).then((res) => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch user status");
    return res.json();
  });

// Get Suggestions
export const getSuggestions = () =>
  fetch(`${API_URL}/api/suggestions`).then((res) => res.json());

// 3. Create Suggestions (FIXED: Corrected categories and default Pending status)
export const createSuggestion = async (data: {
  text: string;
  category: string;
  area: string; // Ensure area is included as discussed previously
}) => {
  const res = await fetch(`${API_URL}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      status: "Pending", // Forces "Pending" as the default state
      createdAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create suggestion");
  }
  return res.json();
};

// Upvote Suggestion
export const upvoteSuggestion = async (id: string) => {
  // FIXED: Removed hardcoded localhost fallback to prevent production interference
  const res = await fetch(`${API_URL}/api/suggestions/${id}/upvote`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to upvote");
  return res.json();
};

// Get Pending Users for Captains
export const getPendingUsers = () =>
  fetch(`${API_URL}/api/users/pending`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch pending requests");
    return res.json();
  });

// 2. Approve User (FIXED: Backend usually creates Player from User document data)
export const approveUser = async (userId: string) => {
  // We send linkedPlayerId as empty so the backend knows to generate
  // a NEW Player entry using the diskiName and POSITION stored in the User doc.
  const res = await fetch(`${API_URL}/api/users/approve/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkedPlayerId: "" }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to approve player");
  }
  return res.json();
};

// Decline/Delete User Request
export const declineUser = async (userId: string) => {
  const res = await fetch(`${API_URL}/api/users/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to decline request");
  }
  return res.json();
};

// 1. Register User (FIXED: Ensure position is handled in the spreading)
export const registerUserApi = async (userData: any) => {
  const res = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firebaseUid: userData.firebaseUid,
      phoneNumber: userData.phoneNumber,
      diskiName: userData.diskiName,
      email: userData.email,
      areaId: userData.areaId,
      role: userData.role || "Player",
      status: userData.status || "Pending",
      position: userData.position, // <--- Explicitly sending this to the User collection
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Registration failed");
  }
  return res.json();
};
