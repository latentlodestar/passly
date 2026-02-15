import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
} from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5192";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Catalog", "Runs"],
  endpoints: (builder) => ({
    getStatus: builder.query<ApiStatusResponse, void>({
      query: () => "/api/status",
    }),
  }),
});

export const {
  useGetStatusQuery,
} = api;
