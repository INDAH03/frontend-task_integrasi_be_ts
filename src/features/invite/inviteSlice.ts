import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';
import axios from 'axios';
import React, { useState, useEffect } from 'react';


export const api = axios.create({
  baseURL: 'http://localhost:5001/api/v1',
});

// === HELPER: Format UUID ===
function formatUuid(uuid: string): string {
  if (!uuid) return '';
  const clean = uuid.replace(/-/g, '').toLowerCase();
  if (clean.length !== 32) return uuid; // biarkan kalau bukan UUID valid
  return clean.replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
    '$1-$2-$3-$4-$5'
  );
}

// === INTERFACES ===
export interface InviteUser {
  uuid: string;
  name: string;
  email: string;
  role: string;
  projectUuid: string;
  query?: string;
}

export interface Project {
  uuid: string;
  name: string;
}

export interface Role {
  uuid: string;
  name: string;
}

interface InviteState {
  users: {
    data: InviteUser[];
    totalPages: number;
    totalRows: number;
  };
  projects: Project[];
  roles: Role[];
  loading: boolean;
  error: string | null;
  isSearching: boolean;
}

const initialState: InviteState = {
  users: {
    data: [],
    totalPages: 1,
    totalRows: 0,
  },
  projects: [],
  roles: [],
  loading: false,
  error: null,
  isSearching: false,
};

interface SearchInviteUserResponse {
  page: number;
  limit: number;
  query?: string;
  [key: string]: any;
}


// inviteSlice.ts
function formatUUID(uuid: string): string {
  const clean = uuid.replace(/-/g, '');
  if (clean.length !== 32) return uuid;
  return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
}


// === UTILS ===
export function normalizeRole(role: string): 'member' | 'admin' | 'super_admin' | '' {
  if (!role) return '';
  const r = role.toLowerCase();
  if (['member', 'admin', 'super_admin'].includes(r)) return r as any;
  if (r === 'super admin' || r === 'superadmin') return 'super_admin';
  return '';
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler); // Clear jika value berubah sebelum delay selesai
    };
  }, [value, delay]);

  return debouncedValue;
}


// === THUNKS ===
export const fetchInvitedUsers = createAsyncThunk(
  'invite/fetchInvitedUsers',
  async ({ page, limit }: { page: number; limit: number }) => {
    const res = await axios.get(`http://localhost:5001/api/v1/invite-user-dashboard/invite`, {
      params: { page, limit },
    });
    return res.data;
  }
);

export const sendInvite = createAsyncThunk(
  'invite/sendInvite',
  async ({ emails, role, projectUuid }: { emails: string[]; role: string; projectUuid: string }) => {
    const response = await api.post('/invite-user-dashboard/invite', {
      emails,
      role,
      projectUuid: formatUuid(projectUuid),
    });
    return response.data;
  }
);

export const resendInviteUser = createAsyncThunk(
  'invite/resendInvite',
  async (payload: { emails: string[]; projectUuid: string; role: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/resend', {
        ...payload,
        role: normalizeRole(payload.role),
      });

      const result = res.data?.results?.[0];
      if (!result || !result.success) {
        return rejectWithValue(result?.error || 'Gagal resend invite');
      }

      return result; 
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Request gagal');
    }
  }
);

export const updateUser = createAsyncThunk(
  'invite/updateUser',
  async (payload: { uuid: string; name?: string; email?: string; role?: string }) => {
    const { uuid, ...data } = payload;
    const res = await axiosInstance.put(`/uuid/${formatUuid(uuid)}`, data);
    return res.data as InviteUser;
  }
);

export const fetchProjects = createAsyncThunk('invite/fetchProjects', async () => {
  const res = await axiosInstance.get('/projects');
  return res.data;
});

export const fetchRoles = createAsyncThunk('invite/fetchRoles', async () => {
  const res = await axiosInstance.get('/roles');
  return res.data;
});

export const searchInvitedUsers = createAsyncThunk(
  'invitedUsers/search',
  async ({ page, limit, query }: { page: number; limit: number; query?: string }) => {
    const response = await axios.get('/api/invite-user-dashboard', {
      params: { page, limit, search: query }
    });
    return response.data;
  }
);

// export const searchInvitedUsers = createAsyncThunk(
//   'invite/searchUsers',
// async ({ query, page, limit }: { query: string; page: number; limit: number }) => {
//   const response = await axios.get('/api/invite/search', {
//     params: {
//       query,
//       page,
//       limit,
//     },
//   });
//   return response.data;
// }
// );


// === SLICE ===
const inviteSlice = createSlice({
  name: 'invite',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvitedUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
        .addCase(fetchInvitedUsers.fulfilled, (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      const rawUsers = Array.isArray(payload.data) ? payload.data : [];

      state.users = {
        data: rawUsers.map((u: any) => ({
          uuid: formatUUID(u.uuid ?? ''),
          name: u.name ?? '',
          email: u.email ?? '',
          role: u.role ?? '',
          projectUuid: formatUUID(u.project?.uuid ?? u.projectUuid ?? u.project_uuid ?? ''),
        })),
        totalPages: payload.totalPages ?? 1,
        totalRows: payload.totalRows ?? 0,
      };

      state.loading = false;
      })
      .addCase(fetchInvitedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch invited users';
      })

      .addCase(sendInvite.fulfilled, (state, action: PayloadAction<InviteUser>) => {
        state.users.data.push(action.payload); 
      })

      .addCase(updateUser.fulfilled, (state, action: PayloadAction<InviteUser>) => {
        const index = state.users.data.findIndex((u: InviteUser) => u.uuid === action.payload.uuid);
        if (index !== -1) {
          state.users.data[index] = action.payload;
        }
      })

      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<any>) => {
        state.projects = action.payload.data || action.payload || [];
      })

      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<any>) => {
        const raw = action.payload.data || action.payload;
        state.roles = raw.map((r: any) => ({
          uuid: r.id,
          name: r.roleName,
        }));
      })

      .addCase(searchInvitedUsers.fulfilled, (state, action: PayloadAction<SearchInviteUserResponse>) => {
        state.users = {
        data: action.payload.data.map((u: InviteUser) => ({
            ...u,
            uuid: formatUuid(u.uuid),
            projectUuid: formatUuid(u.projectUuid),
          })),
          totalPages: action.payload.totalPages,
          totalRows: action.payload.totalRows,
        };
      })

  },
});

export default inviteSlice.reducer;
