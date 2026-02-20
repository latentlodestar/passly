import { useEffect } from 'react';
import { useAppSelector } from '@/store';
import { useUpdateSubmissionStepMutation } from '@/api/api';

export function useStepSync(stepName: string) {
  const activeId = useAppSelector((s) => s.activeSubmission.id);
  const [updateStep] = useUpdateSubmissionStepMutation();

  useEffect(() => {
    if (!activeId) return;
    updateStep({ id: activeId, body: { currentStep: stepName } });
  }, [activeId, stepName, updateStep]);
}
