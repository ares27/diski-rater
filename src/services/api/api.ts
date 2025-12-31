const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 1. Fetch all players
export const getPlayers = () =>
  fetch(`${API_URL}/api/players`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch players");
    return res.json();
  });

// 2. Create a new player (renamed for clarity in App.tsx)
export const createPlayerApi = (player: any) =>
  fetch(`${API_URL}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player),
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to create player");
    return res.json();
  });

// 3. Update an existing player (Ratings or Selection)
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

export const getSuggestions = () =>
  fetch(`${API_URL}/api/suggestions`).then((res) => res.json());

export const createSuggestion = (data: { text: string; category: string }) =>
  fetch(`${API_URL}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const getUserStatus = (uid: string) =>
  fetch(`${API_URL}/api/users/${uid}`).then((res) => {
    if (res.status === 404) return null; // User doesn't exist yet
    if (!res.ok) throw new Error("Failed to fetch user status");
    return res.json();
  });

export const upvoteSuggestion = async (id: string) => {
  const res = await fetch(
    `${API_URL}/api/suggestions/${id}/upvote` ||
      `http://localhost:5000/api/suggestions/${id}/upvote`,
    {
      method: "PATCH",
    }
  );
  return res.json();
};
