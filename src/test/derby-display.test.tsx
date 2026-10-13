import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Derby from "@/Derby";
import { createRacePlan } from "@/lib/race";
import { HORSES } from "@/lib/horses";

vi.mock("@/components/derby/Track", () => ({
  Track: ({ children }: { children: React.ReactNode }) => <div data-testid="track-surface">{children}</div>,
  ordinal: (n: number) => `${n}`,
}));
vi.mock("@/components/derby/Confetti", () => ({ Confetti: () => <canvas data-testid="confetti" /> }));
vi.mock("@/hooks/useRaceEngine", () => ({
  COUNTDOWN_S: 5,
  INTERMISSION_S: 120,
  useRaceEngine: () => ({
    snap: { phase: "finished", elapsed: 0, raceNumber: 1, plan: createRacePlan(1, () => 0.3), order: [0, 1, 2, 3, 4], paused: false, history: [] },
    confetti: 1, sound: false, raceNow: vi.fn(), togglePause: vi.fn(), toggleSound: vi.fn(), registerDraw: vi.fn(),
  }),
}));
afterEach(cleanup);

describe("Track presentation", () => {
  it("places the winner portrait, message, and confetti on the track", () => {
    render(<Derby />);
    const track = within(screen.getByTestId("track-surface"));
    const winner = HORSES[createRacePlan(1, () => 0.3).winner]!;
    expect(track.getByRole("heading", { name: `${winner.name} wins!` })).toBeInTheDocument();
    expect(track.getByRole("img", { name: `${winner.name}, winning horse` })).toBeInTheDocument();
    expect(track.getByTestId("confetti")).toBeInTheDocument();
  });

  it("supports fullscreen fallback and exits with Escape", async () => {
    render(<Derby />);
    fireEvent.click(screen.getByRole("button", { name: "Fullscreen track" }));
    expect(await screen.findByRole("button", { name: "Exit fullscreen" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Fullscreen track" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
