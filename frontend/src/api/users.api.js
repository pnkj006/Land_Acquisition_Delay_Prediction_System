import apiClient from './apiClient';

const API_BASE = '/users';

export const usersApi = {
  listUsers: async (params) => {
    const res = await apiClient.get(API_BASE, { params });
    return res.data.data;
  },
  
  createUser: async (data) => {
    const res = await apiClient.post(API_BASE, data);
    return res.data.data;
  },
  
  updateUser: async (id, data) => {
    const res = await apiClient.patch(`${API_BASE}/${id}`, data);
    return res.data.data;
  },
  
  deleteUser: async (id) => {
    const res = await apiClient.delete(`${API_BASE}/${id}`);
    return res.data.data;
  },
  
  getPermissions: async (id) => {
    const res = await apiClient.get(`${API_BASE}/${id}/permissions`);
    return res.data.data;
  },
  
  setPermissions: async (id, grants) => {
    const res = await apiClient.put(`${API_BASE}/${id}/permissions`, { grants });
    return res.data.data;
  }
};
