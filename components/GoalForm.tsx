"use client";

/**
 * components/GoalForm.tsx
 *
 * Purpose:
 * - Collect user input (career/school goal + constraints).
 * - Calls the backend endpoint POST /api/plan/generate.
 * - Stores the returned plan in sessionStorage (temporary MVP storage).
 * - Navigates to /plan to display the generated plan.
 *
 * Why client component?
 * - It uses browser state (useState) and navigation (useRouter).
 *
 * Extend later:
 * - Add validation (min/max) and better UX feedback.
 * - Replace sessionStorage with MongoDB save + planId routing.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initStateWithPlan } from "@/lib/planStore";
import type { Plan } from "@/models/Plan";

export default function GoalForm() {
    const router = useRouter();

    // Form state - kept intentionally mininimal for MVP.
    const [goalText, setGoalText] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [hoursPerWeek, setHoursPerWeek] = useState(5);
    const [timelineWeeks, setTimelineWeeks] = useState(6);
    const [skillLevel, setSkillLevel] = useState("Beginner" || "Intermediate" || "Advanced");

    // Request state for UX feedback (e.g. loading spinner, error messages).
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Submit handler 
    - Validate the goal input
    - Calls backend to generate the plan
    - Saves to sessionStorage and routes to /plan.
     */
    async function onSubmit(e: React.FormEvent){
        e.preventDefault();
        setError(null);

        if (!goalText.trim()) {
            setError("Please enter a valid goal.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/plan/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    goalText,
                    targetRole,
                    hoursPerWeek,
                    timelineWeeks,
                    skillLevel,
                }),
            }); 
        const data = await res.json();

        // If server returns a non 2xx status, show the error message from the response.
        if (!res.ok) throw new Error(data?.error || "Failed to generate plan. Please try again.");

        // We expect data.plan to match the Plan type returned by the API.
        const plan: Plan = data.plan;

        // MVP persistance
        initStateWithPlan(plan);

        // Navigate to the plan page to display the generated plan.
        router.push("/plan");
        } catch (err: any){
            setError(err?.message ?? "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }








    /* 
    This is the form UI for collecting the user's goal and constraints.
    It's intentionally simple for the MVP, but we can enhance it later with better styling, validation, 
    and UX feedback (e.g. disabling the submit button until required fields are filled, showing a loading spinner, etc.).
    */
    return (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Your goal</label>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={3}
              placeholder='e.g., "Get a software engineering internship this summer"'
              style={{ width: "100%", padding: 10 }}
            />
          </div>
    
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Target role/program</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              style={{ width: "100%", padding: 10 }}
            />
          </div>
    
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Hours/week</label>
              <input
                type="number"
                min={1}
                max={30}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                style={{ width: "100%", padding: 10 }}
              />
            </div>
    
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Timeline (weeks)</label>
              <input
                type="number"
                min={1}
                max={26}
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                style={{ width: "100%", padding: 10 }}
              />
            </div>
    
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Skill level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                style={{ width: "100%", padding: 10 }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
    
          {error && <div style={{ color: "crimson" }}>{error}</div>}
    
          <button
            type="submit"
            disabled={loading}
            style={{ padding: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {loading ? "Generating..." : "Generate My Plan"}
          </button>
        </form>
      );
    }
