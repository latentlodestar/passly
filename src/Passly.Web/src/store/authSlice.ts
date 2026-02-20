import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as cognito from "../auth/cognito";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  userEmail: null,
  error: null,
};

export const checkSession = createAsyncThunk(
  "auth/checkSession",
  async () => {
    const session = await cognito.getCurrentSession();
    if (!session) return null;
    const payload = session.getIdToken().decodePayload();
    return payload.email as string;
  },
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async ({ email, password }: { email: string; password: string }) => {
    const session = await cognito.signIn(email, password);
    const payload = session.getIdToken().decodePayload();
    return payload.email as string;
  },
);

export const signUp = createAsyncThunk(
  "auth/signUp",
  async ({ email, password }: { email: string; password: string }) => {
    await cognito.signUp(email, password);
    return email;
  },
);

export const confirmSignUp = createAsyncThunk(
  "auth/confirmSignUp",
  async ({ email, code }: { email: string; code: string }) => {
    await cognito.confirmSignUp(email, code);
  },
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  await cognito.signOut();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // checkSession
    builder.addCase(checkSession.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkSession.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.isAuthenticated = true;
        state.userEmail = action.payload;
      } else {
        state.isAuthenticated = false;
        state.userEmail = null;
      }
    });
    builder.addCase(checkSession.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.userEmail = null;
    });

    // signIn
    builder.addCase(signIn.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.userEmail = action.payload;
      state.error = null;
    });
    builder.addCase(signIn.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Sign in failed";
    });

    // signUp
    builder.addCase(signUp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signUp.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signUp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Sign up failed";
    });

    // confirmSignUp
    builder.addCase(confirmSignUp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(confirmSignUp.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(confirmSignUp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Confirmation failed";
    });

    // signOut
    builder.addCase(signOut.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.userEmail = null;
      state.error = null;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
