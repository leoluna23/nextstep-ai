"use client";

/**
 * app/plan/page.tsx (MongoDB version)
 *
 * - Reads planId from URL query param (?id=...)
 * - Loads planDoc from MongoDB via /api/plan/load
 * - Toggles completion via /api/plan/complete
 * - Computes progress + Today's Next Step locally
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Plan } from "@/models/Plan";
import ProgressMeter from "@/components/ProgressMeter";
import { flattenPlan, getNextReadyTask, countTotalTasks, countCompleted, type FlatTask } from "@/lib/planner";
import CopyLinkButton from "@/components/CopyLinkButton";
import BackgroundPattern from "@/components/BackgroundPattern";
import MotivationalSpeaker from "@/components/MotivationalSpeaker";
import FocusCoach from "@/components/FocusCoach";
import AudioExplanationButton from "@/components/AudioExplanationButton";

// Loading plan document from MongoDB, including metadata and completion state
type LoadedDoc = {
  _id: string;
  goalText: string;
  targetRole?: string;
  hoursPerWeek: number;
  timelineWeeks: number;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  plan: Plan;
  completedTaskIds: string[];
};

// This page is responsible for displaying a generated plan, tracking task completion, and showing progress. It relies on the plan document structure defined in MongoDB and the related API endpoints for loading and updating the plan state.
export default function PlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");

  const [doc, setDoc] = useState<LoadedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [replanning, setReplanning] = useState(false);
  const [showReplanForm, setShowReplanForm] = useState(false);
  const [constraints, setConstraints] = useState("");
  const [feedback, setFeedback] = useState("");

  // Load plan from MongoDB
  useEffect(() => {
    if (!planId) {
      router.push("/");
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/plan/load?id=${encodeURIComponent(planId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load plan");
        setDoc(data.planDoc);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [planId, router]);

  const flat = useMemo(() => (doc ? flattenPlan(doc.plan) : []), [doc]);
  const completedSet = useMemo(() => new Set(doc?.completedTaskIds ?? []), [doc]);

  // Create a map of task ID to task for looking up prerequisite tasks
  const taskMap = useMemo(() => {
    const map = new Map<string, FlatTask>();
    flat.forEach(task => map.set(task.id, task));
    return map;
  }, [flat]);

  const total = useMemo(() => countTotalTasks(flat), [flat]);
  const done = useMemo(() => countCompleted(flat, completedSet), [flat, completedSet]);
  const todayTask = useMemo(() => getNextReadyTask(flat, completedSet), [flat, completedSet]);
  
  const shareUrl = 
    typeof window !== "undefined" ? window.location.href : "";

  async function toggleTask(taskId: string) {
    if (!doc) return;

    const res = await fetch("/api/plan/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: doc._id, taskId }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed to update task");
      return;
    }

    // Update local state from DB source of truth
    setDoc({ ...doc, completedTaskIds: data.completedTaskIds });
  }

  async function handleReplan() {
    if (!doc) return;

    setReplanning(true);
    setErr(null);

    try {
      const res = await fetch("/api/plan/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: doc._id,
          constraints: constraints.trim() || undefined,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to replan");
      }

      // Reload the plan to get the updated version
      const loadRes = await fetch(`/api/plan/load?id=${encodeURIComponent(doc._id)}`);
      const loadData = await loadRes.json();
      
      if (!loadRes.ok) {
        throw new Error(loadData?.error || "Failed to reload plan");
      }

      // Update local state with the replanned plan
      setDoc(loadData.planDoc);
      setShowReplanForm(false);
      setConstraints("");
      setFeedback("");
      
      // Show success message
      alert(`Trail rerouted! Replaced ${data.replacedCount} waypoints with ${data.newCount} new ones.`);
    } catch (e: any) {
      setErr(e?.message || "Failed to replan");
      alert(e?.message || "Failed to replan");
    } finally {
      setReplanning(false);
    }
  }

  if (loading) {
    return (
      <main style={{ 
        padding: "48px 24px", 
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #e0f2fe 0%, #f0fdf4 100%)",
        width: "100%"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⛰️</div>
          <div style={{ fontSize: 18, color: "#1e3a5f", marginBottom: 8, fontWeight: 600 }}>Loading your trail map...</div>
          <div style={{ fontSize: 14, color: "#4a5568" }}>Preparing your journey</div>
        </div>
      </main>
    );
  }
  
  if (err) {
    return (
      <main style={{ 
        padding: "48px 24px", 
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 1200,
        margin: "0 auto",
        background: "linear-gradient(to bottom, #e0f2fe 0%, #f0fdf4 100%)",
        width: "100%",
        minHeight: "100vh"
      }}>
        <div style={{ 
          padding: 24, 
          backgroundColor: "#fef2f2",
          border: "2px solid #dc2626",
          borderRadius: 0,
          color: "#991b1b",
          boxShadow: "0 4px 12px rgba(220,38,38,0.2)"
        }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>⚠️ Trail Error</h2>
          <p>{err}</p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "12px 24px",
              borderRadius: 0,
              border: "none",
              backgroundColor: "#059669",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              marginTop: 16,
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#047857"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#059669"}
          >
            🏕️ Return to Base Camp
          </button>
        </div>
      </main>
    );
  }
  
  if (!doc) return null;

  const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    research: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", icon: "🔍" },
    build: { bg: "#dcfce7", border: "#10b981", text: "#065f46", icon: "🔨" },
    practice: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", icon: "💪" },
    network: { bg: "#e9d5ff", border: "#8b5cf6", text: "#5b21b6", icon: "🤝" },
    apply: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", icon: "📝" },
  };

  const progressPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

  // Determine progress milestone
  const getProgressMilestone = (percentage: number): { name: string; icon: string; description: string } => {
    if (percentage === 0) {
      return { name: "Base Camp", icon: "🏕️", description: "Starting your journey" };
    } else if (percentage < 25) {
      return { name: "Base Camp", icon: "🏕️", description: "Preparing for the climb" };
    } else if (percentage < 75) {
      return { name: "Climbing", icon: "⛰️", description: "Making steady progress" };
    } else if (percentage < 100) {
      return { name: "Summit", icon: "🏔️", description: "Almost at the top" };
    } else {
      return { name: "Summit Reached", icon: "🏔️", description: "Journey complete!" };
    }
  };

  const milestone = getProgressMilestone(progressPercentage);

  return (
    <main style={{ 
      padding: "32px 48px", 
      fontFamily: "system-ui, -apple-system, sans-serif", 
      maxWidth: "100%",
      margin: 0,
      background: "linear-gradient(to bottom, #e0f2fe 0%, #f0fdf4 50%, #fef3c7 100%)",
      minHeight: "100vh",
      width: "100%",
      position: "relative"
    }}>
      <BackgroundPattern color="#059669" opacity={0.12} />
      <div style={{ 
        backgroundColor: "white",
        borderRadius: 0,
        padding: 36,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        marginBottom: 24,
        border: "2px solid #e5e7eb",
        maxWidth: 1800,
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        position: "relative",
        zIndex: 1
      }}>
        <button 
          onClick={() => router.push("/")} 
          style={{ 
            marginBottom: 24,
            padding: "10px 18px",
            borderRadius: 0,
            border: "1px solid #a7c957",
            backgroundColor: "#f0fdf4",
            cursor: "pointer",
            fontWeight: 600,
            color: "#166534",
            transition: "all 0.2s",
            fontSize: 14
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#dcfce7";
            e.currentTarget.style.borderColor = "#65a30d";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.borderColor = "#a7c957";
          }}
        >
          🏕️ Base Camp
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 36 }}>⛰️</div>
            <h1 style={{ 
              fontSize: 36, 
              margin: 0,
              fontWeight: 800,
              color: "#1e3a5f",
              lineHeight: 1.2
            }}>
              {doc.plan.title}
            </h1>
          </div>
          <AudioExplanationButton
            type="plan"
            data={{
              title: doc.plan.title,
              summary: doc.plan.summary,
              weeks: doc.plan.weeks,
              totalTasks: total,
            }}
            goalText={doc.goalText}
            size="medium"
          />
        </div>
        <p style={{ 
          marginTop: 0,
          marginBottom: 24,
          fontSize: 16,
          color: "#4a5568",
          lineHeight: 1.6,
          paddingLeft: 48
        }}>
          {doc.plan.summary}
        </p>

        {/* Elevation Progress */}
        <div style={{
          marginBottom: 24,
          padding: 20,
          backgroundColor: "#f0fdf4",
          borderRadius: 0,
          border: "2px solid #059669"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12
          }}>
            <div style={{ fontWeight: 700, color: "#166534", fontSize: 16 }}>
              🗺️ Trail Progress
            </div>
            <div style={{ fontWeight: 700, color: "#059669", fontSize: 18 }}>
              {done} / {total} waypoints
            </div>
          </div>

          {/* Progress Milestone */}
          <div style={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: "white",
            border: "2px solid #059669",
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              fontSize: 32,
              lineHeight: 1
            }}>
              {milestone.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1e3a5f",
                marginBottom: 4
              }}>
                {milestone.name}
              </div>
              <div style={{
                fontSize: 13,
                color: "#6b7280"
              }}>
                {milestone.description}
              </div>
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#059669"
            }}>
              {progressPercentage}%
            </div>
          </div>

          <div style={{
            width: "100%",
            height: 24,
            backgroundColor: "#d1fae5",
            borderRadius: 0,
            overflow: "hidden",
            border: "2px solid #059669",
            position: "relative"
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: "100%",
              background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
              transition: "width 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 8
            }}>
              {progressPercentage > 15 && (
                <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>
                  {progressPercentage}%
                </span>
              )}
            </div>
            {progressPercentage <= 15 && (
              <div style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#059669",
                fontSize: 12,
                fontWeight: 700
              }}>
                {progressPercentage}%
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          gap: 12, 
          marginTop: 16, 
          flexWrap: "wrap",
          marginBottom: 24,
          alignItems: "center"
        }}>
          <CopyLinkButton url={shareUrl} />
          <MotivationalSpeaker 
            context={{
              progress: progressPercentage,
              completedTasks: done,
              totalTasks: total,
              nextTask: todayTask?.text,
              goalText: doc.goalText
            }}
          />
          <button
            onClick={() => setShowReplanForm(!showReplanForm)}
            style={{
              padding: "10px 20px",
              borderRadius: 0,
              border: showReplanForm ? "2px solid #f59e0b" : "1px solid #a7c957",
              backgroundColor: showReplanForm ? "#fef3c7" : "#f0fdf4",
              color: showReplanForm ? "#92400e" : "#166534",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              if (!showReplanForm) {
                e.currentTarget.style.backgroundColor = "#dcfce7";
                e.currentTarget.style.borderColor = "#65a30d";
              }
            }}
            onMouseOut={(e) => {
              if (!showReplanForm) {
                e.currentTarget.style.backgroundColor = "#f0fdf4";
                e.currentTarget.style.borderColor = "#a7c957";
              }
            }}
          >
            {showReplanForm ? "✕ Cancel Reroute" : "🔄 Reroute Trail"}
          </button>
        </div>

        {showReplanForm && (
          <section style={{ 
            marginTop: 24,
            marginBottom: 24,
            padding: 24, 
            border: "2px solid #f59e0b", 
            borderRadius: 0,
            backgroundColor: "#fef3c7"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, color: "#92400e" }}>
              🗺️ Reroute Your Trail
            </h3>
            <p style={{ fontSize: 14, color: "#78350f", marginBottom: 20, lineHeight: 1.5 }}>
              Adjust your path by replacing incomplete waypoints with new ones. Completed checkpoints will remain.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#78350f" }}>
                  Trail Conditions (optional)
                </label>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g., Focus on networking paths, reduce time to 4 hours/week"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 0,
                    border: "1px solid #fbbf24",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    transition: "border-color 0.2s",
                    backgroundColor: "white",
                    color: "#000000"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#fbbf24"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#78350f" }}>
                  Trail Feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., Previous waypoints were too challenging, need more practice-focused routes"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 0,
                    border: "1px solid #fbbf24",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    transition: "border-color 0.2s",
                    backgroundColor: "white",
                    color: "#000000"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#fbbf24"}
                />
              </div>

              <button
                onClick={handleReplan}
                disabled={replanning}
                style={{
                  padding: "12px 24px",
                  borderRadius: 0,
                  border: "none",
                  backgroundColor: replanning ? "#9ca3af" : "#f59e0b",
                  color: "white",
                  cursor: replanning ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 15,
                  transition: "background-color 0.2s",
                  alignSelf: "flex-start",
                }}
                onMouseOver={(e) => {
                  if (!replanning) {
                    e.currentTarget.style.backgroundColor = "#d97706";
                  }
                }}
                onMouseOut={(e) => {
                  if (!replanning) {
                    e.currentTarget.style.backgroundColor = "#f59e0b";
                  }
                }}
              >
                {replanning ? "⏳ Rerouting..." : "🗺️ Generate New Trail"}
              </button>
            </div>
          </section>
        )}

        <section style={{ 
          marginTop: 32, 
          padding: 28, 
          border: "2px solid #fbbf24", 
          borderRadius: 0,
          backgroundColor: "#fef3c7",
          borderLeft: "6px solid #f59e0b",
          boxShadow: "0 4px 12px rgba(245,158,11,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 28 }}>🎯</span>
              <span>Next Waypoint</span>
            </h2>
            {todayTask && (
              <AudioExplanationButton
                type="task"
                data={{
                  ...todayTask,
                  milestoneName: todayTask.milestoneName,
                  weekNumber: todayTask.week,
                }}
                goalText={doc.goalText}
                size="medium"
              />
            )}
          </div>

          {todayTask ? (
            <div>
              <div style={{ 
                fontWeight: 700, 
                fontSize: 20,
                color: "#78350f",
                marginBottom: 16,
                lineHeight: 1.5
              }}>
                {todayTask.text}
              </div>
              <div style={{ 
                marginBottom: 12,
                fontSize: 15,
                color: "#92400e",
                display: "flex",
                gap: 16,
                flexWrap: "wrap"
              }}>
                <span>⏱️ ~{todayTask.minutes} min</span>
                <span>📅 Week {todayTask.week}</span>
                <span>📍 {todayTask.milestoneName}</span>
              </div>
              <div style={{ 
                marginBottom: 20,
                fontSize: 14,
                color: "#78350f",
                padding: 16,
                backgroundColor: "rgba(255,255,255,0.6)",
                borderRadius: 0,
                border: "1px solid #fbbf24"
              }}>
                <strong>📍 Checkpoint:</strong> {todayTask.successCriteria}
              </div>

              <button
                onClick={() => toggleTask(todayTask.id)}
                style={{
                  padding: "14px 28px",
                  borderRadius: 0,
                  border: "none",
                  backgroundColor: completedSet.has(todayTask.id) ? "#6b7280" : "#059669",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  transition: "background-color 0.2s",
                  boxShadow: completedSet.has(todayTask.id) ? "none" : "0 4px 12px rgba(5,150,105,0.3)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = completedSet.has(todayTask.id) ? "#4b5563" : "#047857";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = completedSet.has(todayTask.id) ? "#6b7280" : "#059669";
                }}
              >
                {completedSet.has(todayTask.id) ? "↩️ Mark as Incomplete" : "✓ Reach Checkpoint"}
              </button>
            </div>
          ) : (
              <div style={{ 
                fontWeight: 700, 
                fontSize: 22,
                color: "#059669",
                textAlign: "center",
                padding: 32
              }}>
                🏔️ Summit Reached! You've completed your journey!
              </div>
            )}
        </section>

        {/* Focus Coach */}
        {todayTask && (
          <FocusCoach 
            task={todayTask}
            goalText={doc.goalText}
            onTaskComplete={() => toggleTask(todayTask.id)}
          />
        )}
      </div>

      <section style={{ 
        marginTop: 24,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
        gap: 24,
        maxWidth: 1800,
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        position: "relative",
        zIndex: 1
      }}>
        {doc.plan.weeks.map((w, weekIndex) => (
          <div 
            key={w.week} 
            style={{ 
              backgroundColor: "white",
              borderRadius: 0,
              padding: 32,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              border: "2px solid #e5e7eb",
              position: "relative"
            }}
          >
            {/* Trail marker */}
            <div style={{
              position: "absolute",
              left: -12,
              top: 40,
              width: 24,
              height: 24,
              backgroundColor: "#059669",
              borderRadius: 0,
              border: "3px solid white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "white"
            }}>
              {w.week}
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              paddingLeft: 24,
              paddingBottom: 16,
              borderBottom: "3px solid #059669"
            }}>
              <h3 style={{ 
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: "#1e3a5f"
              }}>
                <span style={{ marginRight: 8 }}>🏕️</span>
                Week {w.week}: {w.theme}
              </h3>
              <AudioExplanationButton
                type="week"
                data={w}
                goalText={doc.goalText}
                size="small"
              />
            </div>

            {w.milestones.map((m, milestoneIndex) => (
              <div
                key={m.id}
                style={{
                  padding: 24,
                  border: "2px solid #e5e7eb",
                  borderRadius: 0,
                  marginBottom: 20,
                  backgroundColor: "#fafafa",
                  transition: "all 0.2s",
                  borderLeft: "4px solid #059669"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
                  e.currentTarget.style.borderColor = "#059669";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: 20,
                  color: "#1e3a5f",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span>📍</span>
                  <span>{m.name}</span>
                </div>
                <div style={{ 
                  opacity: 0.8, 
                  marginBottom: 20,
                  fontSize: 14,
                  color: "#4a5568",
                  lineHeight: 1.6,
                  paddingLeft: 28
                }}>
                  {m.why}
                </div>

                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {m.tasks.map((t) => {
                    const checked = completedSet.has(t.id);
                    const category = categoryColors[t.category] || categoryColors.research;
                    
                    // Check prerequisite status
                    const prereqs = t.prereqs || [];
                    const unmetPrereqs = prereqs.filter(prereqId => !completedSet.has(prereqId));
                    const hasUnmetPrereqs = unmetPrereqs.length > 0 && !checked;
                    const prereqTasks = prereqs.map(id => taskMap.get(id)).filter(Boolean) as FlatTask[];

                    return (
                      <li 
                        key={t.id} 
                        style={{ 
                          marginBottom: 14,
                          padding: 16,
                          backgroundColor: checked ? "#f3f4f6" : hasUnmetPrereqs ? "#fef3c7" : "white",
                          borderRadius: 0,
                          border: checked ? "2px solid #d1d5db" : hasUnmetPrereqs ? "2px solid #f59e0b" : `2px solid ${category.border}`,
                          transition: "all 0.2s",
                          opacity: checked ? 0.7 : hasUnmetPrereqs ? 0.8 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!checked) {
                            e.currentTarget.style.borderColor = category.border;
                            e.currentTarget.style.boxShadow = `0 4px 12px ${category.border}40`;
                            e.currentTarget.style.transform = "translateX(4px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!checked) {
                            e.currentTarget.style.borderColor = category.border;
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateX(0)";
                          }
                        }}
                      >
                        <label style={{ 
                          display: "flex", 
                          alignItems: "flex-start", 
                          gap: 14,
                          cursor: "pointer"
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTask(t.id)}
                            disabled={hasUnmetPrereqs}
                            style={{
                              marginTop: 2,
                              width: 22,
                              height: 22,
                              cursor: hasUnmetPrereqs ? "not-allowed" : "pointer",
                              accentColor: category.border,
                              opacity: hasUnmetPrereqs ? 0.5 : 1
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ 
                                textDecoration: checked ? "line-through" : "none",
                                color: checked ? "#9ca3af" : hasUnmetPrereqs ? "#92400e" : "#1e3a5f",
                                fontSize: 16,
                                lineHeight: 1.6,
                                fontWeight: checked ? 400 : 500
                              }}>
                                {t.text}
                              </span>
                              <AudioExplanationButton
                                type="task"
                                data={{
                                  ...t,
                                  milestoneName: m.name,
                                  weekNumber: w.week,
                                }}
                                goalText={doc.goalText}
                                size="small"
                              />
                            </div>
                            
                            {/* Prerequisites display */}
                            {prereqs.length > 0 && (
                              <div style={{
                                marginTop: 8,
                                padding: 10,
                                backgroundColor: hasUnmetPrereqs ? "#fef3c7" : "#f0fdf4",
                                border: `1px solid ${hasUnmetPrereqs ? "#f59e0b" : "#059669"}`,
                                borderRadius: 0
                              }}>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: hasUnmetPrereqs ? "#92400e" : "#166534",
                                  marginBottom: 6
                                }}>
                                  {hasUnmetPrereqs ? "⏳ Prerequisites Required:" : "✅ Prerequisites Met:"}
                                </div>
                                <div style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4
                                }}>
                                  {prereqTasks.map(prereq => {
                                    const prereqCompleted = completedSet.has(prereq.id);
                                    return (
                                      <div key={prereq.id} style={{
                                        fontSize: 11,
                                        color: prereqCompleted ? "#059669" : "#92400e",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                      }}>
                                        <span>{prereqCompleted ? "✓" : "○"}</span>
                                        <span style={{
                                          textDecoration: prereqCompleted ? "line-through" : "none",
                                          opacity: prereqCompleted ? 0.7 : 1
                                        }}>
                                          {prereq.text}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            <div style={{ 
                              marginTop: 10,
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              flexWrap: "wrap"
                            }}>
                              <span style={{ 
                                fontSize: 13,
                                color: "#6b7280",
                                fontWeight: 500
                              }}>
                                ⏱️ {t.minutes} min
                              </span>
                              <span style={{
                                fontSize: 12,
                                padding: "5px 10px",
                                borderRadius: 0,
                                backgroundColor: category.bg,
                                color: category.text,
                                fontWeight: 700,
                                textTransform: "capitalize",
                                border: `1px solid ${category.border}`
                              }}>
                                {category.icon} {t.category}
                              </span>
                              {hasUnmetPrereqs && (
                                <span style={{
                                  fontSize: 12,
                                  padding: "5px 10px",
                                  borderRadius: 0,
                                  backgroundColor: "#fef3c7",
                                  color: "#92400e",
                                  fontWeight: 700,
                                  border: "1px solid #f59e0b"
                                }}>
                                  🔒 Blocked
                                </span>
                              )}
                            </div>
                          </div>
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
