export interface ApiStatusResponse {
  version: string;
  databaseConnected: boolean;
  timestamp: string;
}

export interface SubmissionResponse {
  id: string;
  label: string;
  status: string;
  currentStep: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRequest {
  deviceId: string;
  label: string;
}

export interface UpdateSubmissionStepRequest {
  currentStep: string;
}