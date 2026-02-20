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
  label: string;
}

export interface UpdateSubmissionStepRequest {
  currentStep: string;
}

export interface GenerateSubmissionSummaryRequest {
  passphrase: string;
  chatImportId: string;
}

export interface SubmissionSummaryResponse {
  id: string;
  submissionId: string;
  chatImportId: string;
  totalMessages: number;
  selectedMessages: number;
  gapCount: number;
  createdAt: string;
}