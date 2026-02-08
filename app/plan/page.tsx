"use client";

/*
app/plan/page.tsx

Purpose:
- Displays the generated plan to the user.
- Shows a "Today's Next Step" section and renders the full weekly plan.
- Loads the plan from sessionStorage (MVP storage) via lib/planStore.ts.

Why client component?
- Uses useEffect (browser only storage) and client side navigation.
*/

import { useEffect, useMemo, useState } from "react";
import { clearState, loadState, saveState, type StoredState } from "@/lib/planStore";
import { flattenPlan, getNextReadyTask, countTotalTasks, countCompleted } from "@/lib/planner";
import ProgressMeter from "@/components/ProgressMeter";
import type { Plan } from "@/models/Plan";
import { useRouter } from "next/navigation";

// Main component for the /plan page. Displays the plan and handles task completion state.
export default function PlanPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);


  // Load state (plan + completed list) from sessionStorage
  useEffect(() => {
    const state = loadState();
    if (!state) {
      router.push("/");
      return;
    }
    setPlan(state.plan);
    setCompletedTaskIds(state.completedTaskIds ?? []);
  }, [router]);

  const flat = useMemo(() => (plan ? flattenPlan(plan) : []), [plan]);

  const completedSet = useMemo(() => new Set(completedTaskIds), [completedTaskIds]);

  const total = useMemo(() => countTotalTasks(flat), [flat]);
  const done = useMemo(() => countCompleted(flat, completedSet), [flat, completedSet]);

  const todayTask = useMemo(() => getNextReadyTask(flat, completedSet), [flat, completedSet]);


  // Persist the current plan and completion state to sessionStorage. Called whenever a task is toggled.
  function persist(planToSave: Plan, completedToSave: string[]) {
    const state: StoredState = { plan: planToSave, completedTaskIds: completedToSave };
    saveState(state);
  }


 // Toggle a task's completion state, update local state and persist to sessionStorage
  function toggleTask(taskId: string) {
    if (!plan) return;

    setCompletedTaskIds((prev) => {
      const next = prev.includes(taskId) ? prev.filter((x) => x !== taskId) : [...prev, taskId];
      persist(plan, next);
      return next;
    });
  }

  if (!plan) return null;




 // Style layout
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <button
        onClick={() => {
          clearState();
          router.push("/");
        }}
        style={{ marginBottom: 16 }}
      >
        ← Start over
      </button>

      <h1 style={{ fontSize: 28, marginBottom: 6 }}>{plan.title}</h1>
      <p style={{ marginTop: 0 }}>{plan.summary}</p>

      <ProgressMeter completed={done} total={total} />

      <section
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Today’s Next Step</h2>

        {todayTask ? (
          <div>
            <div style={{ fontWeight: 800 }}>{todayTask.text}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              ~{todayTask.minutes} min • Week {todayTask.week} • {todayTask.milestoneName}
            </div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              Success criteria: {todayTask.successCriteria}
            </div>

            <button
              onClick={() => toggleTask(todayTask.id)}
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {completedSet.has(todayTask.id) ? "Mark as incomplete" : "Mark as done"}
            </button>
          </div>
        ) : (
          <div style={{ fontWeight: 800 }}>You’ve completed everything. Summit reached 🏔️</div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        {plan.weeks.map((w) => (
          <div key={w.week} style={{ marginBottom: 18 }}>
            <h3 style={{ marginBottom: 6 }}>
              Week {w.week}: {w.theme}
            </h3>

            {w.milestones.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 800 }}>{m.name}</div>
                <div style={{ opacity: 0.85, marginBottom: 8 }}>{m.why}</div>

                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {m.tasks.map((t) => {
                    const checked = completedSet.has(t.id);

                    return (
                      <li key={t.id} style={{ marginBottom: 6 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTask(t.id)}
                          />
                          <span style={{ textDecoration: checked ? "line-through" : "none" }}>
                            {t.text}{" "}
                            <span style={{ opacity: 0.75 }}>({t.minutes} min)</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

