import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { RequireRole } from "./RequireRole";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../contexts/AuthContext";

function renderWithRouter(node: ReactNode, initial = "/users") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/users" element={node} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireRole", () => {
  it("redirects to login when user is not authenticated", () => {
    (useAuth as any).mockReturnValue({ user: null, isLoading: false });
    renderWithRouter(
      <RequireRole roles={["ADMIN"]}>
        <div>Protected</div>
      </RequireRole>
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("redirects to home when role is unauthorized", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "STAFF" },
      isLoading: false,
    });
    renderWithRouter(
      <RequireRole roles={["ADMIN"]}>
        <div>Protected</div>
      </RequireRole>
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders children for allowed role", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "ADMIN" },
      isLoading: false,
    });
    renderWithRouter(
      <RequireRole roles={["ADMIN"]}>
        <div>Protected</div>
      </RequireRole>
    );
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });
});

