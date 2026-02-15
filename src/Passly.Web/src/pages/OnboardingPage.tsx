import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { cn } from "../lib/cn";

const features = [
  {
    title: "Guided preparation",
    description:
      "Step-by-step guidance through every section of your petition. Nothing gets overlooked.",
  },
  {
    title: "Evidence analysis",
    description:
      "Import your communication history and we surface the timeline signals that matter.",
  },
  {
    title: "Gap identification",
    description:
      "See exactly what documentation is missing or weak before you submit.",
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

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
          <Button size="lg" onClick={() => navigate("/evidence")}>
            Begin preparation
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate("/checklist")}>
            View checklist
          </Button>
        </div>
      </div>

      <div className="feature-rotator">
        <div className="feature-rotator__tabs">
          {features.map((f, i) => (
            <button
              key={f.title}
              className={cn(
                "feature-rotator__tab",
                i === active && "feature-rotator__tab--active",
              )}
              onClick={() => setActive(i)}
            >
              {f.title}
            </button>
          ))}
        </div>
        <div className="feature-rotator__content" key={active}>
          <p className="feature-rotator__text">{features[active].description}</p>
        </div>
      </div>
    </div>
  );
}
