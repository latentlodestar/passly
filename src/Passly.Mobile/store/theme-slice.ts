import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Appearance = "system" | "light" | "dark";

interface ThemeState {
  appearance: Appearance;
}

const initialState: ThemeState = {
  appearance: "system",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setAppearance(state, action: PayloadAction<Appearance>) {
      state.appearance = action.payload;
    },
  },
});

export const { setAppearance } = themeSlice.actions;
export default themeSlice.reducer;
