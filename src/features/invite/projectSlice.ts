import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// ===== Interface =====
export interface Project {
  uuid: string;
  name: string;
}

interface ProjectState {
  projects: Project[];
  searchResults: Project[];
  loading: boolean;
  error: string | null;
}

// ===== Initial State =====
const initialState: ProjectState = {
  projects: [],
  searchResults: [],
  loading: false,
  error: null,
};

const BASE_URL = 'http://localhost:5001/api/v1/invite-user-dashboard';

export const fetchProjects = createAsyncThunk<Project[]>(
  'project/fetchAll',
  async () => {
    const res = await axios.get(`${BASE_URL}/projects`);
    return res.data.data || res.data; 
  }
);

export const fetchProjectSearch = createAsyncThunk<Project[], string>(
  'project/search',
  async (query: string) => {
    const res = await axios.get(`${BASE_URL}/projects`, {
      params: { search: query },
    });
    return res.data.data || res.data;
  }
);

// ===== Slice =====
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })

      // Search Projects
      .addCase(fetchProjectSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectSearch.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(fetchProjectSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Search failed';
      });
  },
});

export default projectSlice.reducer;
