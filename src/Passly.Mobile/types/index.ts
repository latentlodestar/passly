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
  fileName: string;
  contentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
