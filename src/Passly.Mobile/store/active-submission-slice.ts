import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ActiveSubmissionState {
  id: string | null;
}

const initialState: ActiveSubmissionState = {
  id: null,
};

const activeSubmissionSlice = createSlice({
  name: "activeSubmission",
  initialState,
  reducers: {
    setActiveSubmission(state, action: PayloadAction<string>) {
      state.id = action.payload;
    },
    clearActiveSubmission(state) {
      state.id = null;
    },
  },
});

export const { setActiveSubmission, clearActiveSubmission } =
  activeSubmissionSlice.actions;
export default activeSubmissionSlice.reducer;
