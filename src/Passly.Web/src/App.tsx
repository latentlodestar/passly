import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { Stepper } from "./components/Stepper";
import { OnboardingPage } from "./pages/OnboardingPage.tsx";
import { EvidenceImportPage } from "./pages/EvidenceImportPage.tsx";
import { ChecklistPage } from "./pages/ChecklistPage.tsx";

const processSteps = [
  { label: "Get started" },
  { label: "Import evidence" },
  { label: "Review & complete" },
];

const routeToStep: Record<string, number> = {
  "/home": 0,
  "/evidence": 1,
  "/checklist": 2,
};

export default function App() {
  const { pathname } = useLocation();
  const currentStep = routeToStep[pathname] ?? 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">Passly</div>
        <Stepper steps={processSteps} currentStep={currentStep} className="topbar__stepper" />
        <ThemeToggle />
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<OnboardingPage />} />
          <Route path="/evidence" element={<EvidenceImportPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
        </Routes>
      </main>
    </div>
  );
}
