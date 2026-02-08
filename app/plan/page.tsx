"use client";

/*
app/plan/page.tsx

Purpose:
- Displays the generated plan to the user.
- Shows a "Today's Next Step" section and renders the full weekly plan.
- Loads the plan from sessionStorage (MVP storage) via lib/planStore.ts.

Why client component?
- Uses useEffect (browser only storage) and client side navigation.

Extend later:
- Add task completion checkboxes that update the plan state and persist progress.
- Add smarter selection logic for "Today's Next Step" (e.g. based on deadlines, user preferences, etc.)
- Replace sessionStorage with MongoDB loading by planId in the URL.
*/

import { useEffect, useMemo, useState } from "react";
import { loadPlan, clearPlan } from "@/lib/planStore";
import type { Plan } from "@/models/Plan";
import { useRouter } from "next/navigation";

/* 
Helper: flatten all tasks across weeks/milestones
This makes it easy to select a "next" task in MVP.
*/
function flattenTasks(plan: Plan) {
    const all: {
        week: number;
        milestone: string;
        taskId: string;
        text: string;
        minutes: number;
    }[] = [];

    for (const w of plan.weeks){
        for (const m of w.milestones){
            for (const t of m.tasks){
                all.push({
                    week: w.week,
                    milestone: m.name,
                    taskId: t.id,
                    text: t.text,
                    minutes: t.minutes,
                });
            }
        }
    }
    return all;
}

export default function PlanPage() {
    const router = useRouter();
    const [plan, setPlan] = useState<Plan | null>(null);

    /* On page load:
    - Attempt to laod the plan from sessionStorage.
    - If none exists, redirect back to homepage.
     */
    useEffect(()=>{
        const p = loadPlan();
        if (!p) router.push("/");
        else setPlan(p);
    }, [router]);

    /* Memoize the flattened tasks for easy access */
    const tasks = useMemo(()=> plan ? flattenTasks(plan) : [], [plan]);

    /* 
    Todays next step logic
    - Simply takes the first task in the plan
    - Later: choose first incomplete task, respecting prerequisites, deadlines, and user preferences.
    */
   const todayTask = tasks[0];

   // While laoding plan or redirecting, render nothing.
   if (!plan) return null;









   /* Render the plan! */
   return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <button
        onClick={() => {
          // Clear stored plan and return to start.
          clearPlan();
          router.push("/");
        }}
        style={{ marginBottom: 16 }}
      >
        ← Start over
      </button>

      <h1 style={{ fontSize: 28, marginBottom: 6 }}>{plan.title}</h1>
      <p style={{ marginTop: 0 }}>{plan.summary}</p>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Today’s Next Step</h2>

        {todayTask ? (
          <div>
            <div style={{ fontWeight: 700 }}>{todayTask.text}</div>
            <div style={{ opacity: 0.8 }}>
              ~{todayTask.minutes} min • Week {todayTask.week} • {todayTask.milestone}
            </div>
          </div>
        ) : (
          <div>No tasks found.</div>
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
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div style={{ opacity: 0.85, marginBottom: 8 }}>{m.why}</div>

                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {m.tasks.map((t) => (
                    <li key={t.id}>
                      {t.text} <span style={{ opacity: 0.75 }}>({t.minutes} min)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

