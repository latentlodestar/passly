import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

export function OnboardingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="page">
      <div className="hero">
        <h1 className="hero__title">
          Prepare your immigration petition with confidence
        </h1>
        <p className="hero__subtitle">
          Passly helps you structure your relationship-based petition, analyze
          supporting evidence, and identify documentation gaps — so you can
          submit with certainty.
        </p>
        <div className="hero__actions">
          <Button size="lg" onClick={() => navigate("/submission/evidence")}>
            Begin preparation
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate("/submission/checklist")}>
            View checklist
          </Button>
        </div>
      </div>
    </div>
  );
}
