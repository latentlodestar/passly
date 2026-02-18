import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { Stepper } from "./components/Stepper";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { EvidenceImportPage } from "./pages/EvidenceImportPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useStepSync } from "./hooks/useStepSync";
import { processSteps, routeToStepIndex } from "./lib/steps";

export default function App() {
  const { pathname } = useLocation();
  const showStepper = pathname.startsWith("/submission/");
  const currentStep = routeToStepIndex(pathname);

  useStepSync();

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
          <Link to="/settings" className="btn btn--ghost btn--sm">
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submission/home" element={<OnboardingPage />} />
          <Route path="/submission/evidence" element={<EvidenceImportPage />} />
          <Route path="/submission/checklist" element={<ChecklistPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Redirect old routes */}
          <Route path="/home" element={<Navigate to="/submission/home" replace />} />
          <Route path="/evidence" element={<Navigate to="/submission/evidence" replace />} />
          <Route path="/checklist" element={<Navigate to="/submission/checklist" replace />} />
        </Routes>
      </main>
    </div>
  );
}
