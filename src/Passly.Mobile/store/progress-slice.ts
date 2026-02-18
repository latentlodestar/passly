import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ProgressState {
  maxReachedStep: number;
}

const initialState: ProgressState = {
  maxReachedStep: 0,
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    reportStep(state, action: PayloadAction<number>) {
      if (action.payload > state.maxReachedStep) {
        state.maxReachedStep = action.payload;
      }
    },
  },
});

export const { reportStep } = progressSlice.actions;
export default progressSlice.reducer;
