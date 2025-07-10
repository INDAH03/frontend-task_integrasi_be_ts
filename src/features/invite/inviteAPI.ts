import axios from 'axios';
import { InviteUser } from './inviteSlice';

const BASE_URL = 'http://localhost:3000/api';

// ──────────────── INVITE USER ────────────────

export const getAllInvites = async (): Promise<InviteUser[]> => {
  const res = await axios.get(`${BASE_URL}/invite`);
  return res.data;
};

export const postInvite = async (payload: {
  email: string;
  role: string;
  project: string;
}): Promise<InviteUser> => {
  const res = await axios.post(`${BASE_URL}/invite`, payload);
  return res.data;
};

// ──────────────── PROJECTS ────────────────

export interface Project {
  id: string;
  name: string;
}

export const getAllProjects = async (): Promise<Project[]> => {
  const res = await axios.get(`${BASE_URL}/projects`);
  return res.data;
};

export const searchProjects = async (query: string): Promise<Project[]> => {
  const res = await axios.get(`${BASE_URL}/projects/search`, {
    params: { query }
  });
  return res.data;
};
