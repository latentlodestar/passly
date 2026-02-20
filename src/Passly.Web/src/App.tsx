import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { Stepper } from "./components/Stepper";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { EvidenceImportPage } from "./pages/EvidenceImportPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ConfirmSignUpPage } from "./pages/ConfirmSignUpPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { useStepSync } from "./hooks/useStepSync";
import { processSteps, routeToStepIndex } from "./lib/steps";
import { useAppDispatch, useAppSelector } from "./store";
import { checkSession, signOut } from "./store/authSlice";
import { Button } from "./components/Button";

export default function App() {
  const { pathname } = useLocation();
  const showStepper = pathname.startsWith("/submission/");
  const currentStep = routeToStepIndex(pathname);
  const dispatch = useAppDispatch();
  const { isAuthenticated, userEmail } = useAppSelector((s) => s.auth);

  useStepSync();

  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  const handleSignOut = () => {
    dispatch(signOut());
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="topbar__brand" style={{ textDecoration: "none" }}>
          Passly
        </Link>
        {showStepper && (
          <Stepper steps={processSteps} currentStep={currentStep} className="topbar__stepper" />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {isAuthenticated && (
            <>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--fg-2)" }}>
                {userEmail}
              </span>
              <Link to="/settings" className="btn btn--ghost btn--sm">
                Settings
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="main-content">
        <Routes>
          {/* Auth routes (public) */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/confirm-signup" element={<ConfirmSignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submission/home"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submission/evidence"
            element={
              <ProtectedRoute>
                <EvidenceImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submission/checklist"
            element={
              <ProtectedRoute>
                <ChecklistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect old routes */}
          <Route path="/home" element={<Navigate to="/submission/home" replace />} />
          <Route path="/evidence" element={<Navigate to="/submission/evidence" replace />} />
          <Route path="/checklist" element={<Navigate to="/submission/checklist" replace />} />
        </Routes>
      </main>
    </div>
  );
}
