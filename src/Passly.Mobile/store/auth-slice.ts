import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  confirmSignUp as cognitoConfirmSignUp,
  signOut as cognitoSignOut,
  getCurrentSession,
} from '@/auth/cognito';

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

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async () => {
    const session = await getCurrentSession();
    if (!session) return { isAuthenticated: false, email: null };
    const payload = session.getIdToken().decodePayload();
    const email = (payload['email'] as string) ?? null;
    return { isAuthenticated: true, email };
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const session = await cognitoSignIn(email, password);
    const payload = session.getIdToken().decodePayload();
    const sessionEmail = (payload['email'] as string) ?? email;
    return { email: sessionEmail };
  },
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password }: { email: string; password: string }) => {
    await cognitoSignUp(email, password);
    return { email };
  },
);

export const confirmSignUp = createAsyncThunk(
  'auth/confirmSignUp',
  async ({ email, code }: { email: string; code: string }) => {
    await cognitoConfirmSignUp(email, code);
    return { email };
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await cognitoSignOut();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // checkSession
    builder
      .addCase(checkSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.userEmail = action.payload.email;
      })
      .addCase(checkSession.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userEmail = null;
      });

    // signIn
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.userEmail = action.payload.email;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = extractErrorMessage(action.error);
      });

    // signUp
    builder
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = extractErrorMessage(action.error);
      });

    // confirmSignUp
    builder
      .addCase(confirmSignUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmSignUp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(confirmSignUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = extractErrorMessage(action.error);
      });

    // signOut
    builder
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userEmail = null;
        state.error = null;
      })
      .addCase(signOut.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.userEmail = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
