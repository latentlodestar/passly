import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ApiStatusResponse } from "../types";

const mockStatus: ApiStatusResponse = {
  version: "1.0.0",
  databaseConnected: true,
  timestamp: new Date().toISOString(),
};

const mockUseGetStatusQuery = vi.fn();

vi.mock("../api/api", () => ({
  useGetStatusQuery: (...args: unknown[]) => mockUseGetStatusQuery(...args),
}));

function setDefaults(overrides?: {
  status?: Partial<ReturnType<typeof mockUseGetStatusQuery>>;
}) {
  mockUseGetStatusQuery.mockReturnValue({
    data: mockStatus,
    isLoading: false,
    error: undefined,
    ...overrides?.status,
  });
}

// Import after mocks are set up
import { StatusPage } from "./StatusPage";

describe("StatusPage", () => {
  it("renders loading state initially", () => {
    setDefaults({
      status: { data: undefined, isLoading: true },
    });
    render(<StatusPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders page after loading", () => {
    setDefaults();
    render(<StatusPage />);
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("shows error state on API failure", () => {
    setDefaults({
      status: { data: undefined, error: { message: "Network error" } },
    });
    render(<StatusPage />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});
