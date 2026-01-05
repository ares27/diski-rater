// This ensures we always have a valid, absolute URL
const getBaseUrl = () => {
  // Get raw value from env
  let envUrl = import.meta.env.VITE_API_URL || "";

  // 1. If it's empty or doesn't start with http, and we are in production
  // We force the correct absolute domain.
  if (import.meta.env.PROD) {
    // This prevents the "Double URL" issue by ensuring a protocol is present
    return "https://diski-rater-api.synczen.co.za";
  }

  // 2. For local development, check if it's missing the protocol
  if (envUrl && !envUrl.startsWith("http")) {
    envUrl = `http://${envUrl}`;
  }

  // 3. Cleanup trailing slashes
  return envUrl.replace(/\/$/, "") || "http://localhost:5000";
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
export const approveUser = async (userId: string, role: string = "Player") => {
  // We send the role along with linkedPlayerId
  // The backend will use this role when creating the Player document
  const res = await fetch(`${API_URL}/api/users/approve/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      linkedPlayerId: "",
      role: role, // <--- This ensures the role is saved to the new Player entry
    }),
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

export const checkAreaCaptain = (areaId: string) =>
  fetch(`${API_URL}/api/areas/${areaId}/has-captain`).then((res) => res.json());

export const claimCaptaincyApi = (data: {
  firebaseUid: string;
  socialLink: string;
  note: string;
}) =>
  fetch(`${API_URL}/api/users/claim-captain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
