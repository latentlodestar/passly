import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ToastVariant = 'success' | 'danger';

interface ToastState {
  message: string | null;
  variant: ToastVariant;
}

const initialState: ToastState = {
  message: null,
  variant: 'success',
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<{ message: string; variant?: ToastVariant }>) {
      state.message = action.payload.message;
      state.variant = action.payload.variant ?? 'success';
    },
    dismissToast(state) {
      state.message = null;
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
