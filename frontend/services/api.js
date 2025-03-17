// frontend/services/api.js (bổ sung các API mới)

import axios from "axios";
import { API_URL } from "../utils/constants";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// User API
export const userApi = {
  register: (data) => api.post("/users", data),
  login: (data) => api.post("/users/login", data),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  // Các phương thức đổi mật khẩu mới
  requestPasswordReset: (email) =>
    api.post("/users/request-password-reset", { email }),
  resetPassword: (email, code, newPassword) =>
    api.post("/users/reset-password", { email, code, newPassword }),
  // Add this method to the userApi object
changePassword: (userId, currentPassword, newPassword) =>
  api.post("/users/change-password", { userId, currentPassword, newPassword }),
verifyPasswordResetCode: (email, code) =>
  api.post("/users/verify-reset-code", { email, code }),  
};

// Group API
export const groupApi = {
  getGroups: () => api.get("/groups"),
  getGroup: (id) => api.get(`/groups/${id}`),
  getUserGroups: (userId) => api.get(`/groups/user/${userId}`),
  createGroup: (data) => api.post("/groups", data),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  addMember: (groupId, userId) =>
    api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) =>
    api.delete(`/groups/${groupId}/members/${userId}`),

  // Các API mới
  getGroupByJoinCode: (joinCode) => api.get(`/groups/join/${joinCode}`),
  joinGroup: (joinCode, userId) =>
    api.post("/groups/join", { joinCode, userId }),
  regenerateJoinCode: (groupId, userId) =>
    api.post(`/groups/${groupId}/regenerate-code`, { userId }),
};

// Expense API
export const expenseApi = {
  getExpenses: () => api.get("/expenses"),
  getExpense: (id) => api.get(`/expenses/${id}`),
  getGroupExpenses: (groupId) => api.get(`/expenses/group/${groupId}`),
  getUserExpenses: (userId) => api.get(`/expenses/user/${userId}`),
  createExpense: (data) => api.post("/expenses", data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  settleExpense: (id) => api.post(`/expenses/${id}/settle`),
  unsettleExpense: (id) => api.post(`/expenses/${id}/unsettle`),
  settleParticipant: (expenseId, userId, settled) =>
    api.post(`/expenses/${expenseId}/settleParticipant`, { userId, settled }),
};

export default api;
