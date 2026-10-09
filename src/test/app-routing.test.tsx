import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

// Keep the real app shell while isolating canvas/audio race rendering in jsdom.
vi.mock("@/Derby", () => ({ default: () => <h1>Midway Derby</h1> }));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("App routing", () => {
  it("renders the derby at the home path", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Midway Derby" })).toBeInTheDocument();
  });

  it("shows a home link for unknown paths", () => {
    window.history.replaceState({}, "", "/missing");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
