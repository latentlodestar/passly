import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
  CreateChatImportResponse,
  ChatImportSummaryResponse,
  ChatImportDetailResponse,
  SubmissionResponse,
  CreateSubmissionRequest,
  UpdateSubmissionStepRequest,
  GenerateSubmissionSummaryRequest,
  SubmissionSummaryResponse,
  SummaryContentResponse,
} from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5192";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
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
    getChatImports: builder.query<ChatImportSummaryResponse[], string>({
      query: (deviceId) => `/api/imports?deviceId=${encodeURIComponent(deviceId)}`,
      providesTags: ["Imports"],
    }),
    getChatImportMessages: builder.query<
      ChatImportDetailResponse,
      { id: string; deviceId: string; passphrase: string; skip: number; take: number }
    >({
      query: ({ id, deviceId, passphrase, skip, take }) =>
        `/api/imports/${id}/messages?deviceId=${encodeURIComponent(deviceId)}&passphrase=${encodeURIComponent(passphrase)}&skip=${skip}&take=${take}`,
      providesTags: (_result, _err, { id }) => [{ type: "Imports", id }],
    }),
    getSubmissions: builder.query<SubmissionResponse[], string>({
      query: (deviceId) => `/api/submissions?deviceId=${encodeURIComponent(deviceId)}`,
      providesTags: ["Submissions"],
    }),
    getSubmission: builder.query<SubmissionResponse, { id: string; deviceId: string }>({
      query: ({ id, deviceId }) =>
        `/api/submissions/${id}?deviceId=${encodeURIComponent(deviceId)}`,
      providesTags: (_result, _err, { id }) => [{ type: "Submissions", id }],
    }),
    createSubmission: builder.mutation<SubmissionResponse, CreateSubmissionRequest>({
      query: (body) => ({ url: "/api/submissions", method: "POST", body }),
      invalidatesTags: ["Submissions"],
    }),
    updateSubmissionStep: builder.mutation<
      SubmissionResponse,
      { id: string; deviceId: string; body: UpdateSubmissionStepRequest }
    >({
      query: ({ id, deviceId, body }) => ({
        url: `/api/submissions/${id}/step?deviceId=${encodeURIComponent(deviceId)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Submissions", id }],
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
      { id: string; deviceId: string }
    >({
      query: ({ id, deviceId }) =>
        `/api/submissions/${id}/summary?deviceId=${encodeURIComponent(deviceId)}`,
      providesTags: (_result, _err, { id }) => [
        { type: "SubmissionSummary", id },
      ],
    }),
    getSubmissionSummaryContent: builder.query<
      SummaryContentResponse,
      { id: string; deviceId: string; passphrase: string }
    >({
      query: ({ id, deviceId, passphrase }) =>
        `/api/submissions/${id}/summary/content?deviceId=${encodeURIComponent(deviceId)}&passphrase=${encodeURIComponent(passphrase)}`,
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
  useUpdateSubmissionStepMutation,
  useGenerateSubmissionSummaryMutation,
  useGetSubmissionSummaryQuery,
  useGetSubmissionSummaryContentQuery,
} = api;
