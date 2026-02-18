import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUpdateSubmissionStepMutation } from "../api/api";
import { useDeviceId } from "./useDeviceId";
import { useAppSelector } from "../store";
import { routeToStep } from "../lib/steps";

export function useStepSync() {
  const { pathname } = useLocation();
  const deviceId = useDeviceId();
  const activeId = useAppSelector((s) => s.activeSubmission.id);
  const [updateStep] = useUpdateSubmissionStepMutation();

  useEffect(() => {
    if (!activeId || !pathname.startsWith("/submission/")) return;

    const step = routeToStep(pathname);
    if (!step) return;

    updateStep({ id: activeId, deviceId, body: { currentStep: step } });
  }, [pathname, activeId, deviceId, updateStep]);
}
