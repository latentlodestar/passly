import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
  SubmissionResponse,
  CreateSubmissionRequest,
  UpdateSubmissionStepRequest,
  GenerateSubmissionSummaryRequest,
  SubmissionSummaryResponse,
} from "../types";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  tagTypes: ["Submissions", "SubmissionSummary"],
  endpoints: (builder) => ({
    getStatus: builder.query<ApiStatusResponse, void>({
      query: () => "/api/status",
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
  }),
});

export const {
  useGetStatusQuery,
  useGetSubmissionsQuery,
  useGetSubmissionQuery,
  useCreateSubmissionMutation,
  useUpdateSubmissionStepMutation,
  useGenerateSubmissionSummaryMutation,
  useGetSubmissionSummaryQuery,
} = api;
