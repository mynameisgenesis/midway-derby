import { describe, expect, it } from "vitest";
import { createRacePlan, position, liveOrder } from "@/lib/race";

describe("race plan", () => {
  it("selected winner always crosses first, progress never goes backwards", () => {
    for (let r = 0; r < 60; r++) {
      const plan = createRacePlan(r);
      expect(plan.order[0]).toBe(plan.winner);
      const wt = plan.horses[plan.winner]!.finishTime;
      expect(wt).toBeGreaterThanOrEqual(30);
      expect(plan.duration).toBeLessThanOrEqual(45);
      plan.horses.forEach((hp, i) => {
        let prev = 0;
        for (let t = 0; t <= plan.duration; t += 0.1) {
          const p = position(hp, t);
          expect(p).toBeGreaterThanOrEqual(prev - 1e-9);
          if (i !== plan.winner && t <= wt) expect(p).toBeLessThan(1);
          prev = p;
        }
      });
      expect(liveOrder(plan, plan.duration)).toEqual(plan.order);
    }
  });

  it("winner distribution is roughly uniform", () => {
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5000; i++) counts[createRacePlan(i).winner]!++;
    counts.forEach((c) => expect(c).toBeGreaterThan(850));
  });

  it("produces lead changes in most races", () => {
    let withChanges = 0;
    for (let r = 0; r < 100; r++) {
      const plan = createRacePlan(r);
      const leaders = new Set<number>();
      for (let t = 2; t < plan.horses[plan.winner]!.finishTime; t += 0.5) leaders.add(liveOrder(plan, t)[0]!);
      if (leaders.size > 1) withChanges++;
    }
    expect(withChanges).toBeGreaterThan(80);
  });
});
