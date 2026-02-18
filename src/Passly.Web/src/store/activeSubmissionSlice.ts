import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "passly_active_submission_id";

interface ActiveSubmissionState {
  id: string | null;
}

const initialState: ActiveSubmissionState = {
  id: localStorage.getItem(STORAGE_KEY),
};

const activeSubmissionSlice = createSlice({
  name: "activeSubmission",
  initialState,
  reducers: {
    setActiveSubmission(state, action: PayloadAction<string>) {
      state.id = action.payload;
      localStorage.setItem(STORAGE_KEY, action.payload);
    },
    clearActiveSubmission(state) {
      state.id = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setActiveSubmission, clearActiveSubmission } =
  activeSubmissionSlice.actions;
export default activeSubmissionSlice.reducer;
