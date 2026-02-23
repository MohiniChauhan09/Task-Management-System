const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const request = async (url, options = {}) => {
  const { headers: optionHeaders = {}, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...optionHeaders
    }
  });

  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (payload) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) }),
  resetPassword: (payload) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  getTasks: (token, status) => {
    const query = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/tasks${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createTask: (token, payload) =>
    request("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  completeTask: (token, taskId) =>
    request(`/tasks/${taskId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    }),
  deleteTask: (token, taskId) =>
    request(`/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
};
