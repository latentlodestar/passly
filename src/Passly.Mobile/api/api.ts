import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
  CreateChatImportResponse,
  ChatImportSummaryResponse,
  SubmissionResponse,
  CreateSubmissionRequest,
  UpdateSubmissionStepRequest,
} from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5192";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Imports", "Submissions"],
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
  }),
});

export const {
  useGetStatusQuery,
  useUploadChatExportMutation,
  useGetChatImportsQuery,
  useGetSubmissionsQuery,
  useGetSubmissionQuery,
  useCreateSubmissionMutation,
  useUpdateSubmissionStepMutation,
} = api;
