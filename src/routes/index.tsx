import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { HORSES } from "@/lib/horses";
import { Track, ordinal } from "@/components/derby/Track";
import { Confetti } from "@/components/derby/Confetti";
import { COUNTDOWN_S, INTERMISSION_S, useRaceEngine, type Snapshot } from "@/hooks/useRaceEngine";
import { position } from "@/lib/race";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Midway Derby — Pixel Carnival Horse Races" },
      { name: "description", content: "Watch five pixel horses dash down the midway in simulated carnival races that run automatically, every couple of minutes." },
      { property: "og:title", content: "Midway Derby — Pixel Carnival Horse Races" },
      { property: "og:description", content: "Simulated retro fairground horse races with live results and a winner's circle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const fmt = (s: number) => {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};

function Btn({ children, onClick, disabled, variant = "primary", pressed }: { children: ReactNode; onClick: () => void; disabled?: boolean; variant?: "primary" | "secondary" | "ghost"; pressed?: boolean | undefined }) {
  const v = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    ghost: "bg-card text-foreground",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`${v} rounded-sm border-2 border-border px-3 py-2 font-display text-[0.6rem] uppercase shadow-pixel-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 sm:text-xs`}
    >
      {children}
    </button>
  );
}

function Marquee() {
  return (
    <header className="marquee relative rounded-md px-4 py-5 text-center sm:py-7">
      <div className="absolute inset-x-3 top-1.5 flex justify-between">{Array.from({ length: 18 }, (_, i) => <span key={i} className="bulb" />)}</div>
      <div className="absolute inset-x-3 bottom-1.5 flex justify-between">{Array.from({ length: 18 }, (_, i) => <span key={i} className="bulb" />)}</div>
      <h1 className="marquee-title font-display text-2xl leading-tight sm:text-5xl">Midway Derby</h1>
      <p className="mt-2 text-sm text-primary-foreground sm:text-base">Five ponies · one straightaway · races every two minutes</p>
    </header>
  );
}

function Index() {
  const { snap, confetti, sound, raceNow, togglePause, toggleSound, registerDraw } = useRaceEngine();
  const [showRoster, setShowRoster] = useState(true);

  const places: Record<number, number> = {};
  if (snap) {
    const t = snap.phase === "racing" ? snap.elapsed : snap.phase === "finished" ? 1e9 : 0;
    snap.plan.order.forEach((idx, p) => {
      if (position(snap.plan.horses[idx]!, t) >= 1) places[idx] = p + 1;
    });
  }

  return (
    <main className="min-h-screen pb-10">
      <Confetti fire={confetti} />
      <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-8">
        <Marquee />

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-border bg-card px-3 py-3 shadow-pixel-sm">
          <StatusText snap={snap} />
          <div className="flex flex-wrap gap-2">
            <Btn onClick={raceNow} disabled={!snap || snap.phase !== "finished"}>Race now</Btn>
            <Btn variant="secondary" onClick={togglePause} disabled={!snap} pressed={snap?.paused}>
              {snap?.paused ? "Resume" : "Pause"}
            </Btn>
            <Btn variant="ghost" onClick={toggleSound} pressed={sound}>
              Sound: {sound ? "On" : "Off"}
            </Btn>
          </div>
        </section>

        <section className="pixel-frame overflow-hidden bg-card" aria-label="Race track">
          <Track registerDraw={registerDraw} places={places}>
            {snap?.phase === "countdown" && (
              <div className="absolute inset-0 grid place-items-center bg-ink/20">
                <div className="text-center">
                  <div key={Math.ceil(COUNTDOWN_S - snap.elapsed)} className="count-pulse font-display text-5xl text-accent [text-shadow:4px_4px_0_var(--ink)] sm:text-8xl">
                    {Math.max(1, Math.ceil(COUNTDOWN_S - snap.elapsed))}
                  </div>
                  <div className="mt-2 font-display text-[0.6rem] text-cream [text-shadow:2px_2px_0_var(--ink)] sm:text-sm">Race {snap.raceNumber} · They're at the gate</div>
                </div>
              </div>
            )}
            {snap?.paused && (
              <div className="absolute inset-0 grid place-items-center bg-ink/40">
                <span className="rounded-sm border-2 border-border bg-accent px-4 py-2 font-display text-xs text-accent-foreground shadow-pixel sm:text-base">Paused</span>
              </div>
            )}
          </Track>
        </section>

        <div className="grid gap-4 md:grid-cols-[1.35fr_1fr] sm:gap-6">
          <ResultPanel snap={snap} />
          <History snap={snap} />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm text-secondary sm:text-base">The Stable</h2>
            <button type="button" onClick={() => setShowRoster((v) => !v)} className="text-sm font-semibold text-primary underline underline-offset-4">
              {showRoster ? "Hide roster" : "Show roster"}
            </button>
          </div>
          {showRoster && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {HORSES.map((h) => (
                <article key={h.id} className="overflow-hidden rounded-md border-2 border-border bg-card shadow-pixel-sm">
                  <div className="relative">
                    <img src={h.portrait} alt={`${h.name}, a ${h.coat.toLowerCase()} ${h.breed}`} loading="lazy" width={816} height={816} className="aspect-square w-full object-cover" />
                    <span className="absolute top-2 left-2 grid h-7 w-7 place-items-center rounded-sm border-2 border-border font-display text-xs" style={{ backgroundColor: h.silk, color: h.silkInk }}>
                      {h.number}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-base leading-tight font-bold">{h.name}</h3>
                    <p className="text-sm text-secondary">{h.breed} · {h.coat}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{h.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-muted-foreground">
          Every race is a randomly simulated just-for-fun show — each horse has an equal 1 in 5 chance. No wagering, ever.
        </footer>
      </div>
    </main>
  );
}

function StatusText({ snap }: { snap: Snapshot | null }) {
  if (!snap) return <p className="font-display text-xs">Opening the gates…</p>;
  const label =
    snap.phase === "countdown"
      ? `Starting in ${Math.max(1, Math.ceil(COUNTDOWN_S - snap.elapsed))}`
      : snap.phase === "racing"
        ? "And they're off!"
        : `Next race in ${fmt(INTERMISSION_S - snap.elapsed)}`;
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-sm bg-secondary px-2 py-1 font-display text-[0.6rem] text-secondary-foreground sm:text-xs">Race #{snap.raceNumber}</span>
      <span className="font-display text-[0.6rem] sm:text-xs" aria-live="polite">{label}{snap.paused ? " (paused)" : ""}</span>
    </div>
  );
}

function ResultPanel({ snap }: { snap: Snapshot | null }) {
  if (!snap) return <div className="h-64 rounded-md border-2 border-border bg-card" />;
  if (snap.phase !== "finished") {
    return (
      <section className="rounded-md border-2 border-border bg-card p-4 shadow-pixel-sm">
        <h2 className="mb-3 font-display text-xs text-secondary sm:text-sm">{snap.phase === "racing" ? "Live order" : "Post parade"}</h2>
        <ol className="space-y-2">
          {snap.order.map((idx, p) => {
            const h = HORSES[idx]!;
            return (
              <li key={h.id} className="flex items-center gap-3 rounded-sm bg-muted px-2 py-1.5">
                <span className="w-8 font-display text-[0.6rem] text-primary">{snap.phase === "racing" ? ordinal(p + 1) : "—"}</span>
                <img src={h.portrait} alt="" width={40} height={40} className="h-10 w-10 rounded-sm border-2 border-border object-cover" />
                <span className="flex-1 font-semibold">{h.name}</span>
                <span className="text-xs text-muted-foreground">{h.breed}</span>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }
  const w = HORSES[snap.plan.winner]!;
  return (
    <section key={snap.raceNumber} className="pop-in overflow-hidden rounded-md border-[3px] border-border bg-card shadow-pixel" data-testid="winner-panel">
      <div className="bg-accent px-4 py-2 text-center font-display text-[0.6rem] text-accent-foreground sm:text-xs">★ Winner's Circle · Race #{snap.raceNumber} ★</div>
      <div className="grid gap-4 p-4 sm:grid-cols-[11rem_1fr]">
        <img src={w.portrait} alt={`${w.name}, ${w.breed}`} width={816} height={816} className="mx-auto aspect-square w-44 rounded-md border-[3px] border-border object-cover shadow-pixel-sm" />
        <div>
          <p className="font-display text-[0.6rem] text-primary">1st place</p>
          <h2 className="mt-1 text-3xl leading-none font-bold" data-testid="winner-name">{w.name}</h2>
          <p className="mt-1 text-secondary">{w.breed} · {w.coat}</p>
          <ol className="mt-3 space-y-1 text-sm">
            {snap.plan.order.map((idx, p) => (
              <li key={idx} className="flex gap-2">
                <span className="w-10 font-display text-[0.55rem] leading-5 text-primary">{ordinal(p + 1)}</span>
                <span className="font-semibold">#{HORSES[idx]!.number} {HORSES[idx]!.name}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t-2 border-border bg-secondary px-4 py-3 text-secondary-foreground">
        <span className="text-sm">Next race starts automatically in</span>
        <span className="font-display text-xl text-accent sm:text-2xl" data-testid="next-countdown">{fmt(INTERMISSION_S - snap.elapsed)}</span>
      </div>
    </section>
  );
}

function History({ snap }: { snap: Snapshot | null }) {
  const items = snap?.history ?? [];
  return (
    <section className="rounded-md border-2 border-border bg-card p-4 shadow-pixel-sm">
      <h2 className="mb-3 font-display text-xs text-secondary sm:text-sm">Recent results</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No races finished yet — the first one is underway.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-auto pr-1">
          {items.map((r) => {
            const w = HORSES[r.order[0]!]!;
            return (
              <li key={`${r.raceNumber}-${r.at}`} className="flex items-center gap-3 rounded-sm bg-muted px-2 py-1.5">
                <img src={w.portrait} alt="" width={36} height={36} loading="lazy" className="h-9 w-9 rounded-sm border-2 border-border object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{w.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Race #{r.raceNumber} · then {r.order.slice(1, 3).map((i) => HORSES[i]!.name).join(", ")}
                  </p>
                </div>
                <span className="font-display text-[0.55rem] text-primary">1st</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
