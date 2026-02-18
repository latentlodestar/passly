import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useDeviceId } from "../hooks/useDeviceId";
import {
  useCreateSubmissionMutation,
  useGetSubmissionQuery,
} from "../api/api";
import { useAppDispatch, useAppSelector } from "../store";
import { setActiveSubmission } from "../store/activeSubmissionSlice";
import { stepToRoute } from "../lib/steps";

export function LandingPage() {
  const navigate = useNavigate();
  const deviceId = useDeviceId();
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.activeSubmission.id);

  const [createSubmission, { isLoading: isCreating }] =
    useCreateSubmissionMutation();

  const { data: activeSubmission } = useGetSubmissionQuery(
    { id: activeId!, deviceId },
    { skip: !activeId },
  );

  const handleCreate = async () => {
    const result = await createSubmission({
      deviceId,
      label: `Petition ${new Date().toLocaleDateString()}`,
    }).unwrap();
    dispatch(setActiveSubmission(result.id));
    navigate("/submission/home");
  };

  const handleResume = () => {
    if (activeSubmission) {
      navigate(stepToRoute(activeSubmission.currentStep));
    }
  };

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
          <Button size="lg" onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create submission"}
          </Button>
          {activeSubmission && (
            <Button variant="secondary" size="lg" onClick={handleResume}>
              Resume submission
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
