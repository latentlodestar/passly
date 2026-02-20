import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
  SubmissionResponse,
  CreateSubmissionRequest,
  UpdateSubmissionStepRequest,
  GenerateSubmissionSummaryRequest,
  SubmissionSummaryResponse,
} from "../types";
import { getIdToken } from "../auth/cognito";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "",
    prepareHeaders: async (headers) => {
      const token = await getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Submissions", "SubmissionSummary"],
  endpoints: (builder) => ({
    getStatus: builder.query<ApiStatusResponse, void>({
      query: () => "/api/status",
    }),
    getSubmissions: builder.query<SubmissionResponse[], void>({
      query: () => "/api/submissions",
      providesTags: ["Submissions"],
    }),
    getSubmission: builder.query<SubmissionResponse, string>({
      query: (id) => `/api/submissions/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Submissions", id }],
    }),
    createSubmission: builder.mutation<SubmissionResponse, CreateSubmissionRequest>({
      query: (body) => ({ url: "/api/submissions", method: "POST", body }),
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
      string
    >({
      query: (id) => `/api/submissions/${id}/summary`,
      providesTags: (_result, _err, id) => [
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
