import { useEffect } from 'react';
import { useDeviceId } from './use-device-id';
import { useAppSelector } from '@/store';
import { useUpdateSubmissionStepMutation } from '@/api/api';

export function useStepSync(stepName: string) {
  const deviceId = useDeviceId();
  const activeId = useAppSelector((s) => s.activeSubmission.id);
  const [updateStep] = useUpdateSubmissionStepMutation();

  useEffect(() => {
    if (!activeId || !deviceId) return;
    updateStep({ id: activeId, deviceId, body: { currentStep: stepName } });
  }, [activeId, deviceId, stepName, updateStep]);
}
