async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include", // send the HTTP-only auth cookie on every request
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  // Auth
  me: () => request("/auth/me"),
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request("/auth/logout", { method: "POST" }),

  // Matches
  getMatches: () => request("/matches"),
  getDashboard: () => request("/matches/dashboard"),
  refreshMatches: () => request("/matches/refresh", { method: "POST" }),

  // Personal layer — body can be any subset of { highlights_watched, full_match_watched, note }
  updatePersonal: (matchId, changes) =>
    request(`/personal/${matchId}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    }),

  // Export — returns JSON that the caller turns into a file download
  exportData: () => request("/export"),

  // Import — posts the parsed JSON back
  importData: (data) =>
    request("/import", { method: "POST", body: JSON.stringify(data) }),
};
