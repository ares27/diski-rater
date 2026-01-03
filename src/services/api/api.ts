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

// Get Suggestions
export const getSuggestions = () =>
  fetch(`${API_URL}/api/suggestions`).then((res) => res.json());

// Create Suggestions
export const createSuggestion = (data: { text: string; category: string }) =>
  fetch(`${API_URL}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

// Get User Status
export const getUserStatus = (uid: string) =>
  fetch(`${API_URL}/api/users/${uid}`).then((res) => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch user status");
    return res.json();
  });

// Upvote Suggestion
export const upvoteSuggestion = async (id: string) => {
  // FIXED: Removed hardcoded localhost fallback to prevent production interference
  const res = await fetch(`${API_URL}/api/suggestions/${id}/upvote`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to upvote");
  return res.json();
};
