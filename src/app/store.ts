import { configureStore } from '@reduxjs/toolkit';
import inviteReducer from '../features/invite/inviteSlice';
import projectReducer from '../features/invite/projectSlice';

export const store = configureStore({
  reducer: {
    invite: inviteReducer,
    project: projectReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
