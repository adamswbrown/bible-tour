// Read-progress milestones for the Tour. Mirrors the badge pattern used by the
// web Eagle Method (app/eagle/page.js) but tracks books *read* (bt:progress)
// rather than books studied. Thresholds are book counts out of 66.

export type Milestone = {
  id: string;
  name: string;
  threshold: number; // books read needed to earn it
  pct: number;       // label only
  message: string;   // shown in the celebration pop-up
};

export const TOUR_MILESTONES: Milestone[] = [
  {
    id: 'quarter',
    name: 'Taking Flight',
    threshold: 17, // 25% of 66, rounded up
    pct: 25,
    message: 'Great job — a quarter of the way. Keep going!',
  },
  {
    id: 'half',
    name: 'Halfway There',
    threshold: 33, // 50%
    pct: 50,
    message: "Halfway there! Don't turn back now.",
  },
  {
    id: 'three-quarter',
    name: 'Almost Home',
    threshold: 50, // 75% of 66, rounded up
    pct: 75,
    message: 'Three quarters done — the finish line is in sight!',
  },
  {
    id: 'complete',
    name: 'Tour Complete',
    threshold: 66, // 100%
    pct: 100,
    message: 'Amazing! All 66 books!',
  },
];

// Returns the ids a reader with `done` books read has earned.
export function earnedFor(done: number): string[] {
  return TOUR_MILESTONES.filter((m) => done >= m.threshold).map((m) => m.id);
}
