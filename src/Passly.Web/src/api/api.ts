import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiStatusResponse,
} from "../types";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  tagTypes: [],
  endpoints: (builder) => ({
    getStatus: builder.query<ApiStatusResponse, void>({
      query: () => "/api/status",
    }),
  }),
});

export const {
  useGetStatusQuery,
} = api;
