import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getIdToken } from "@/auth/cognito";
import type {
  ApiStatusResponse,
  CreateChatImportResponse,
  ChatImportSummaryResponse,
  ChatImportDetailResponse,
  SubmissionResponse,
  CreateSubmissionRequest,
  UpdateSubmissionStepRequest,
  AnalyzeSubmissionRequest,
  GenerateSubmissionSummaryRequest,
  SubmissionSummaryResponse,
  SummaryContentResponse,
} from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5192";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Imports", "Submissions", "SubmissionSummary"],
  endpoints: (builder) => ({
    getStatus: builder.query<ApiStatusResponse, void>({
      query: () => "/api/status",
    }),
    uploadChatExport: builder.mutation<CreateChatImportResponse, FormData>({
      query: (formData) => ({
        url: "/api/imports",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Imports"],
    }),
    getChatImports: builder.query<ChatImportSummaryResponse[], { submissionId: string }>({
      query: ({ submissionId }) =>
        `/api/imports?submissionId=${encodeURIComponent(submissionId)}`,
      providesTags: ["Imports"],
    }),
    getChatImportMessages: builder.query<
      ChatImportDetailResponse,
      { id: string; passphrase: string; skip: number; take: number }
    >({
      query: ({ id, passphrase, skip, take }) =>
        `/api/imports/${id}/messages?passphrase=${encodeURIComponent(passphrase)}&skip=${skip}&take=${take}`,
      providesTags: (_result, _err, { id }) => [{ type: "Imports", id }],
    }),
    getSubmissions: builder.query<SubmissionResponse[], void>({
      query: () => `/api/submissions`,
      providesTags: ["Submissions"],
    }),
    getSubmission: builder.query<SubmissionResponse, { id: string }>({
      query: ({ id }) => `/api/submissions/${id}`,
      providesTags: (_result, _err, { id }) => [{ type: "Submissions", id }],
    }),
    createSubmission: builder.mutation<SubmissionResponse, CreateSubmissionRequest>({
      query: (body) => ({ url: "/api/submissions", method: "POST", body }),
      invalidatesTags: ["Submissions"],
    }),
    deleteSubmission: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/api/submissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Submissions"],
    }),
    updateSubmissionStep: builder.mutation<
      SubmissionResponse,
      { id: string; body: UpdateSubmissionStepRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/submissions/${id}/step`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Submissions", id }],
    }),
    analyzeSubmission: builder.mutation<
      SubmissionSummaryResponse,
      { id: string; body: AnalyzeSubmissionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/submissions/${id}/analyze`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "SubmissionSummary", id },
      ],
    }),
    generateSubmissionSummary: builder.mutation<
      SubmissionSummaryResponse,
      { id: string; body: GenerateSubmissionSummaryRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/submissions/${id}/summary`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "SubmissionSummary", id },
      ],
    }),
    getSubmissionSummary: builder.query<
      SubmissionSummaryResponse,
      { id: string }
    >({
      query: ({ id }) => `/api/submissions/${id}/summary`,
      providesTags: (_result, _err, { id }) => [
        { type: "SubmissionSummary", id },
      ],
    }),
    getSubmissionSummaryContent: builder.query<
      SummaryContentResponse,
      { id: string; passphrase: string }
    >({
      query: ({ id, passphrase }) =>
        `/api/submissions/${id}/summary/content?passphrase=${encodeURIComponent(passphrase)}`,
      providesTags: (_result, _err, { id }) => [
        { type: "SubmissionSummary", id },
      ],
    }),
  }),
});

export const {
  useGetStatusQuery,
  useUploadChatExportMutation,
  useGetChatImportsQuery,
  useGetChatImportMessagesQuery,
  useGetSubmissionsQuery,
  useGetSubmissionQuery,
  useCreateSubmissionMutation,
  useDeleteSubmissionMutation,
  useUpdateSubmissionStepMutation,
  useAnalyzeSubmissionMutation,
  useGenerateSubmissionSummaryMutation,
  useGetSubmissionSummaryQuery,
  useGetSubmissionSummaryContentQuery,
} = api;
