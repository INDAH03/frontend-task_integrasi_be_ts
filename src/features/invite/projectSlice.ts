import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllProjects, searchProjects, Project } from './inviteAPI';

interface ProjectState {
  projects: Project[];
  searchResults: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  searchResults: [],
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk('project/fetchAll', async () => {
  return await getAllProjects();
});

export const fetchProjectSearch = createAsyncThunk(
  'project/search',
  async (query: string) => {
    return await searchProjects(query);
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
