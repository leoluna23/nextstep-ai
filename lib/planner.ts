/*
lib/planner.ts

Purpose:
- Contains "planning logic" that should not live insider UI components
- Select Today's Next Step:
    - First task that is not completed
    AND all prereqs are completed (if any)

Why:
- Keeps the "business logic" separate from the UI, making it easier to test and maintain.
*/

import type { Plan } from "@/models/Plan";

export type FlatTask = {
    id: string;
    text: string;
    minutes: number;
    category: "research" | "build" | "practice" | "network" | "apply";
    successCriteria: string;
    prereqs: string[];
    week: number;
    milestoneName: string;
};

/*
Flattens the nested plan structure into a simple list for easy iteration */
export function flattenPlan(plan: Plan): FlatTask[] {
    const out: FlatTask[] = [];

    for (const w of plan.weeks) {
        for (const m of w.milestones) {
            for (const t of m.tasks){
                out.push({
                    id: t.id,
                    text: t.text,
                    minutes: t.minutes,
                    category: t.category,
                    successCriteria: t.successCriteria,
                    prereqs: t.prereqs ?? [],
                    week: w.week,
                    milestoneName: m.name,
                });
            }
        }
    }
    return out;
}

/*
Returns the next "ready" task for the user to work on:
- incomplete (not completed yet)
- all prereqs completed */
export function getNextReadyTask(
    flat: FlatTask[],
    completedIds: Set<string>
): FlatTask | null {
    for (const task of flat){
        if (completedIds.has(task.id)) continue; // already completed

        const prereqs = task.prereqs ?? [];
        const prereqsDone = prereqs.every((p) => completedIds.has(p));

        if (prereqsDone) return task; // this is the next ready task
    }
    return null; // all tasks are completed or blocked by unmet prereqs
}

/* Progress helpers */
// Counts total number of tasks in the plan.
export function countTotalTasks(flat: FlatTask[]): number {
    return flat.length;
}
// Counts how many tasks have been completed based on the set of completed task IDs.
export function countCompleted(flat: FlatTask[], completedIds: Set<string>): number {
    return flat.reduce((acc, t) => acc + (completedIds.has(t.id) ? 1 : 0), 0);
}