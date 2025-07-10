import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface InviteUser {
  uuid: string;
  name: string;
  email: string;
  role: string;
  project: string;
}

interface InviteState {
  users: InviteUser[];
  loading: boolean;
  error: string | null;
}

const initialState: InviteState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchInvitedUsers = createAsyncThunk('invite/fetchAll', async () => {
  const res = await axios.get('http://localhost:3000/api/invite');
  return res.data;
});

export const sendInvite = createAsyncThunk(
  'invite/sendInvite',
  async (payload: { email: string; role: string; project: string }) => {
    const res = await axios.post('http://localhost:3000/api/invite', payload);
    return res.data;
  }
);

export const resendInvite = createAsyncThunk(
  'invite/resendInvite',
  async (uuid: string) => {
    const res = await axios.post(`http://localhost:3000/api/invite/resend/${uuid}`);
    return res.data;
  }
);

export const updateUserRole = createAsyncThunk(
  'invite/updateRole',
  async ({ uuid, role }: { uuid: string; role: string }) => {
    const res = await axios.put(`http://localhost:3000/api/invite/role/${uuid}`, { role });
    return res.data;
  }
);

export const deleteUser = createAsyncThunk(
  'invite/deleteUser',
  async (uuid: string) => {
    await axios.delete(`http://localhost:3000/api/invite/${uuid}`);
    return uuid;
  }
);

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
      .addCase(fetchInvitedUsers.fulfilled, (state, action: PayloadAction<InviteUser[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchInvitedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch invited users';
      })

      .addCase(sendInvite.fulfilled, (state, action: PayloadAction<InviteUser>) => {
        state.users.push(action.payload);
      })

      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.users = state.users.filter((user) => user.uuid !== action.payload);
      })

      .addCase(updateUserRole.fulfilled, (state, action: PayloadAction<InviteUser>) => {
        const index = state.users.findIndex((u) => u.uuid === action.payload.uuid);
        if (index !== -1) {
          state.users[index].role = action.payload.role;
        }
      })

      .addCase(resendInvite.fulfilled, (state, action: PayloadAction<InviteUser>) => {
        const index = state.users.findIndex((u) => u.uuid === action.payload.uuid);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });
  },
});

export default inviteSlice.reducer;
