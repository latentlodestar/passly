import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useDeviceId } from "../hooks/useDeviceId";
import { useGetSubmissionsQuery } from "../api/api";
import { useAppDispatch, useAppSelector } from "../store";
import { setActiveSubmission } from "../store/activeSubmissionSlice";
import { stepToRoute } from "../lib/steps";

export function SettingsPage() {
  const navigate = useNavigate();
  const deviceId = useDeviceId();
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.activeSubmission.id);
  const { data: submissions = [] } = useGetSubmissionsQuery(deviceId);

  return (
    <div className="page">
      <div className="page-section">
        <div className="page-section__header">
          <h2 className="page-section__title">Submissions</h2>
          <Button variant="secondary" onClick={() => navigate("/")}>
            Back
          </Button>
        </div>

        {submissions.length === 0 ? (
          <p className="helper-text">No submissions yet.</p>
        ) : (
          <div className="submission-list">
            {submissions.map((sub) => {
              const isActive = sub.id === activeId;
              return (
                <div
                  key={sub.id}
                  className={`submission-list__item ${isActive ? "submission-list__item--active" : ""}`}
                >
                  <div className="submission-list__info">
                    <div className="submission-list__label">{sub.label}</div>
                    <div className="submission-list__meta">
                      {sub.status} &middot; Step: {sub.currentStep} &middot;{" "}
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    {!isActive && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => dispatch(setActiveSubmission(sub.id))}
                      >
                        Set active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        dispatch(setActiveSubmission(sub.id));
                        navigate(stepToRoute(sub.currentStep));
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
