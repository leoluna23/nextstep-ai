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
import type { Plan } from "@/models/Plan";

type GoalFormProps = {
  onSuccess?: () => void;
};

export default function GoalForm({ onSuccess }: GoalFormProps) {
    const router = useRouter();

    // Form state - kept intentionally mininimal for MVP.
    const [goalText, setGoalText] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [hoursPerWeek, setHoursPerWeek] = useState(5);
    const [timelineWeeks, setTimelineWeeks] = useState(6);
    const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Advanced">( 
        "Beginner"
    );

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

        // Initialize the plan store with the generated plan so that /plan can read it. This is a temporary solution for the MVP. In the future, we will save the plan to MongoDB and route with a planId.
        const plan: Plan = data.plan;

        // Save to MongoDB to get a planId
        const saveRes = await fetch("/api/plan/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalText,
            targetRole,
            hoursPerWeek,
            timelineWeeks,
            skillLevel,
            plan,
          }),
        });
        
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData?.error || "Failed to save plan");

        const planId = saveData.planId as string;
        if (!planId) throw new Error("No planId returned from save endpoint");
        
        // Call onSuccess callback if provided (e.g., to refresh plans list)
        if (onSuccess) {
          onSuccess();
        }
        
        router.push(`/plan?id=${encodeURIComponent(saveData.planId)}`);
        router.refresh(); // Ensure the /plan page fetches the latest data from MongoDB
        } catch (err: any){
            setError(err?.message ?? "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 24 }}>
          <div>
            <label style={{ 
              display: "block", 
              fontWeight: 700,
              marginBottom: 10,
              color: "#1e3a5f",
              fontSize: 16
            }}>
              🎯 Your Summit Goal
            </label>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={3}
              placeholder='e.g., "Reach the summit: Get a software engineering internship this summer"'
              style={{ 
                width: "100%", 
                padding: 14,
                borderRadius: 0,
                border: "2px solid #86efac",
                fontSize: 15,
                fontFamily: "inherit",
                resize: "vertical",
                transition: "border-color 0.2s",
                backgroundColor: "#fafafa",
                color: "#000000"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#059669";
                e.currentTarget.style.backgroundColor = "white";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#86efac";
                e.currentTarget.style.backgroundColor = "#fafafa";
              }}
            />
          </div>
    
          <div>
            <label style={{ 
              display: "block", 
              fontWeight: 700,
              marginBottom: 10,
              color: "#1e3a5f",
              fontSize: 16
            }}>
              🏕️ Target Base Camp (optional)
            </label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Software Engineering Intern"
              style={{ 
                width: "100%", 
                padding: 14,
                borderRadius: 0,
                border: "2px solid #86efac",
                fontSize: 15,
                fontFamily: "inherit",
                transition: "border-color 0.2s",
                backgroundColor: "#fafafa",
                color: "#000000"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#059669";
                e.currentTarget.style.backgroundColor = "white";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#86efac";
                e.currentTarget.style.backgroundColor = "#fafafa";
              }}
            />
          </div>
    
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", 
            gap: 20 
          }}>
            <div>
              <label style={{ 
                display: "block", 
                fontWeight: 700,
                marginBottom: 10,
                color: "#1e3a5f",
                fontSize: 16
              }}>
                ⏱️ Hours/Week
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: 14,
                  borderRadius: 0,
                  border: "2px solid #86efac",
                  fontSize: 15,
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  backgroundColor: "#fafafa",
                  color: "#000000"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#059669";
                  e.currentTarget.style.backgroundColor = "white";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#86efac";
                  e.currentTarget.style.backgroundColor = "#fafafa";
                }}
              />
            </div>
    
            <div>
              <label style={{ 
                display: "block", 
                fontWeight: 700,
                marginBottom: 10,
                color: "#1e3a5f",
                fontSize: 16
              }}>
                📅 Trail Duration (weeks)
              </label>
              <input
                type="number"
                min={1}
                max={26}
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: 14,
                  borderRadius: 0,
                  border: "2px solid #86efac",
                  fontSize: 15,
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  backgroundColor: "#fafafa",
                  color: "#000000"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#059669";
                  e.currentTarget.style.backgroundColor = "white";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#86efac";
                  e.currentTarget.style.backgroundColor = "#fafafa";
                }}
              />
            </div>
    
            <div>
              <label style={{ 
                display: "block", 
                fontWeight: 700,
                marginBottom: 10,
                color: "#1e3a5f",
                fontSize: 16
              }}>
                🧗 Experience Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                style={{ 
                  width: "100%", 
                  padding: 14,
                  borderRadius: 0,
                  border: "2px solid #86efac",
                  fontSize: 15,
                  fontFamily: "inherit",
                  backgroundColor: "#fafafa",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  color: "#000000"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#059669";
                  e.currentTarget.style.backgroundColor = "white";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#86efac";
                  e.currentTarget.style.backgroundColor = "#fafafa";
                }}
              >
                <option value="Beginner">🌱 Beginner</option>
                <option value="Intermediate">⛰️ Intermediate</option>
                <option value="Advanced">🏔️ Advanced</option>
              </select>
            </div>
          </div>
    
          {error && (
            <div style={{ 
              padding: 16,
              color: "#dc2626",
              fontSize: 14,
              backgroundColor: "#fef2f2",
              border: "2px solid #fecaca",
              borderRadius: 0,
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}
    
          <button
            type="submit"
            disabled={loading}
            style={{ 
              padding: "16px 32px",
              borderRadius: 0,
              border: "none",
              background: loading ? "#9ca3af" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "white",
              fontWeight: 800,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 6px 20px rgba(5,150,105,0.4)",
              marginTop: 8
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(5,150,105,0.5)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(5,150,105,0.4)";
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "⏳ Charting your trail..." : "🗺️ Generate Trail Map"}
          </button>
        </form>
      );
    }
