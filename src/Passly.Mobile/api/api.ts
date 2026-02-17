import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
  CreateChatImportResponse,
  ChatImportSummaryResponse,
} from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5192";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Imports"],
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
  }),
});

export const {
  useGetStatusQuery,
  useUploadChatExportMutation,
  useGetChatImportsQuery,
} = api;
