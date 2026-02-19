export interface ApiStatusResponse {
  version: string;
  databaseConnected: boolean;
  timestamp: string;
}

export interface CreateChatImportResponse {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
}

export interface ChatImportSummaryResponse {
  id: string;
  submissionId: string;
  fileName: string;
  contentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

export interface ChatMessageResponse {
  id: string;
  senderName: string;
  content: string;
  timestamp: string;
  messageIndex: number;
}

export interface ChatImportDetailResponse {
  id: string;
  fileName: string;
  contentType: string;
  status: string;
  totalMessages: number;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageResponse[];
}

export interface AnalyzeSubmissionRequest {
  deviceId: string;
  passphrase: string;
  chatImportId: string;
}

export interface GenerateSubmissionSummaryRequest {
  deviceId: string;
  passphrase: string;
  signatureBase64: string;
}

export interface SubmissionSummaryResponse {
  id: string;
  submissionId: string;
  chatImportId: string;
  totalMessages: number;
  selectedMessages: number;
  gapCount: number;
  hasPdf: boolean;
  hasSignature: boolean;
  createdAt: string;
}

export interface SummaryContentResponse {
  submissionLabel: string;
  earliestMessage: string;
  latestMessage: string;
  totalMessages: number;
  representativeMessages: SummaryMessageResponse[];
  gaps: SummaryGapResponse[];
  messageCountByTimeWindow: Record<string, number>;
}

export interface SummaryMessageResponse {
  senderName: string;
  content: string;
  timestamp: string;
  timeWindow: string;
}

export interface SummaryGapResponse {
  start: string;
  end: string;
  durationDays: number;
}
