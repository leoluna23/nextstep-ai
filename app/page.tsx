/*
app/page.tsx

Purpose:
  - This is the landing / onboarding page
  - Shows login/signup if not authenticated
  - Shows user's plans and goal form if authenticated

*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GoalForm from "@/components/GoalForm";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";
import BackgroundPattern from "@/components/BackgroundPattern";

type User = {
  _id: string;
  email: string;
  name?: string;
  createdAt: Date;
};

type PlanSummary = {
  _id: string;
  goalText: string;
  targetRole?: string;
  plan: { title: string; summary: string };
  createdAt: Date;
  updatedAt: Date;
  completedTaskIds: string[];
  totalTasks: number;
  archived?: boolean;
  archivedAt?: Date;
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        loadPlans();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans() {
    setPlansLoading(true);
    try {
      const res = await fetch("/api/plan/list");
      const data = await res.json();
      if (res.ok && data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setPlansLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setPlans([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  function handleAuthSuccess() {
    checkAuth();
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
          <div style={{ fontSize: 18, color: "#1e3a5f", fontWeight: 600 }}>Loading...</div>
        </div>
      </main>
    );
  }

  // Not logged in - show login/signup
  if (!user) {
    return (
      <main style={{ 
        padding: "48px 64px", 
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "100%",
        margin: 0,
        background: "linear-gradient(to bottom, #e0f2fe 0%, #f0fdf4 50%, #fef3c7 100%)",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        position: "relative"
      }}>
        <BackgroundPattern color="#059669" opacity={0.15} />
        <div style={{
          maxWidth: 500,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: 0,
            padding: 48,
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            border: "3px solid #059669"
          }}>
            <div style={{
              textAlign: "center",
              marginBottom: 32
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>⛰️</div>
              <h1 style={{ 
                fontSize: 48, 
                marginBottom: 12,
                fontWeight: 900,
                background: "linear-gradient(135deg, #059669 0%, #1e3a5f 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.2
              }}>
                NeXTSTeP AI
              </h1>
              <p style={{ 
                marginTop: 0, 
                marginBottom: 0,
                fontSize: 20,
                color: "#4a5568",
                lineHeight: 1.6,
                fontWeight: 500
              }}>
                Turn big career goals into climbable daily steps
              </p>
            </div>

            {showSignup ? (
              <SignupForm 
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setShowSignup(false)}
              />
            ) : (
              <LoginForm 
                onSuccess={handleAuthSuccess}
                onSwitchToSignup={() => setShowSignup(true)}
              />
            )}
          </div>
        </div>
      </main>
    );
  }

  // Logged in - show plans and goal form
  return (
    <main style={{ 
      padding: "48px 64px", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      maxWidth: "100%",
      margin: 0,
      background: "linear-gradient(to bottom, #e0f2fe 0%, #f0fdf4 50%, #fef3c7 100%)",
      minHeight: "100vh",
      width: "100%",
      boxSizing: "border-box",
      position: "relative"
    }}>
      <BackgroundPattern color="#059669" opacity={0.12} />
      <div style={{
        maxWidth: 1800,
        margin: "0 auto",
        width: "100%",
        position: "relative",
        zIndex: 1
      }}>
        {/* Header with user info and logout */}
        <div style={{
          backgroundColor: "white",
          borderRadius: 0,
          padding: 24,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: "2px solid #059669",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ 
              fontSize: 32, 
              margin: 0,
              fontWeight: 800,
              color: "#1e3a5f"
            }}>
              ⛰️ NeXTSTeP AI
            </h1>
            <p style={{ 
              margin: "8px 0 0 0",
              fontSize: 14,
              color: "#6b7280"
            }}>
              Welcome back{user.name ? `, ${user.name}` : ""}! ({user.email})
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => router.push("/archived")}
              style={{
                padding: "10px 20px",
                borderRadius: 0,
                border: "1px solid #9ca3af",
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
            >
              📦 Archived Trails
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                borderRadius: 0,
                border: "1px solid #dc2626",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#fee2e2";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#fef2f2";
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: 24,
          width: "100%"
        }}>
          {/* Ongoing Trails */}
          <div style={{
            backgroundColor: "white",
            borderRadius: 0,
            padding: 32,
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            border: "3px solid #059669"
          }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1e3a5f",
              marginTop: 0,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>⛰️</span>
              <span>Ongoing Trails</span>
            </h2>

            {plansLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                ⏳ Loading your trails...
              </div>
            ) : (() => {
              const ongoingPlans = plans.filter(plan => {
                const completedCount = plan.completedTaskIds.length;
                const progress = plan.totalTasks > 0 
                  ? Math.round((completedCount / plan.totalTasks) * 100) 
                  : 0;
                return progress < 100;
              });

              if (ongoingPlans.length === 0) {
                return (
                  <div style={{ 
                    padding: 32, 
                    textAlign: "center",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    border: "2px dashed #d1d5db"
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⛰️</div>
                    <p style={{ margin: 0, fontSize: 16 }}>
                      No ongoing trails. Start a new journey below!
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ongoingPlans.map((plan) => {
                    const completedCount = plan.completedTaskIds.length;
                    const progress = plan.totalTasks > 0 
                      ? Math.round((completedCount / plan.totalTasks) * 100) 
                      : 0;

                    return (
                      <div
                        key={plan._id}
                        onClick={() => router.push(`/plan?id=${plan._id}`)}
                        style={{
                          padding: 20,
                          border: "2px solid #059669",
                          backgroundColor: "#f0fdf4",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#dcfce7";
                          e.currentTarget.style.borderColor = "#059669";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f0fdf4";
                          e.currentTarget.style.borderColor = "#059669";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div style={{ 
                          fontWeight: 700, 
                          fontSize: 18,
                          color: "#1e3a5f",
                          marginBottom: 8
                        }}>
                          {plan.plan.title}
                        </div>
                        <div style={{ 
                          fontSize: 14,
                          color: "#4a5568",
                          marginBottom: 12
                        }}>
                          {plan.goalText}
                        </div>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12,
                          color: "#6b7280"
                        }}>
                          <span>👣 {completedCount}/{plan.totalTasks} steps</span>
                          <span>{progress}% complete</span>
                        </div>
                        <div style={{
                          width: "100%",
                          height: 6,
                          backgroundColor: "#d1fae5",
                          marginTop: 8
                        }}>
                          <div style={{
                            width: `${progress}%`,
                            height: "100%",
                            backgroundColor: "#059669",
                            transition: "width 0.3s"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Completed Trails */}
          <div style={{
            backgroundColor: "white",
            borderRadius: 0,
            padding: 32,
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            border: "3px solid #f59e0b"
          }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1e3a5f",
              marginTop: 0,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>🏔️</span>
              <span>Completed Trails</span>
            </h2>

            {plansLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                ⏳ Loading your trails...
              </div>
            ) : (() => {
              const completedPlans = plans.filter(plan => {
                const completedCount = plan.completedTaskIds.length;
                const progress = plan.totalTasks > 0 
                  ? Math.round((completedCount / plan.totalTasks) * 100) 
                  : 0;
                // Only show non-archived completed plans
                return progress === 100 && !plan.archived;
              });

              if (completedPlans.length === 0) {
                return (
                  <div style={{ 
                    padding: 32, 
                    textAlign: "center",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    border: "2px dashed #d1d5db"
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🏔️</div>
                    <p style={{ margin: 0, fontSize: 16 }}>
                      No completed trails yet. Keep climbing!
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {completedPlans.map((plan) => {
                    const completedCount = plan.completedTaskIds.length;
                    const progress = 100;

                    return (
                      <div
                        key={plan._id}
                        style={{
                          padding: 20,
                          border: "2px solid #f59e0b",
                          backgroundColor: "#fef3c7",
                          transition: "all 0.2s",
                          opacity: 0.9
                        }}
                      >
                        <div
                          onClick={() => router.push(`/plan?id=${plan._id}`)}
                          style={{
                            cursor: "pointer",
                            marginBottom: 12
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.9";
                          }}
                        >
                          <div style={{ 
                            fontWeight: 700, 
                            fontSize: 18,
                            color: "#1e3a5f",
                            marginBottom: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}>
                            <span>🏔️</span>
                            <span>{plan.plan.title}</span>
                          </div>
                          <div style={{ 
                            fontSize: 14,
                            color: "#4a5568",
                            marginBottom: 12
                          }}>
                            {plan.goalText}
                          </div>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 12,
                            color: "#92400e",
                            fontWeight: 600
                          }}>
                            <span>✅ {completedCount}/{plan.totalTasks} steps completed</span>
                            <span>🏔️ Summit Reached!</span>
                          </div>
                          <div style={{
                            width: "100%",
                            height: 6,
                            backgroundColor: "#fde68a",
                            marginTop: 8
                          }}>
                            <div style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: "#f59e0b",
                              transition: "width 0.3s"
                            }} />
                          </div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch("/api/plan/archive", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ planId: plan._id, archived: true }),
                              });
                              if (res.ok) {
                                loadPlans();
                              }
                            } catch (err) {
                              console.error("Failed to archive:", err);
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 16px",
                            borderRadius: 0,
                            border: "1px solid #6b7280",
                            backgroundColor: "#f3f4f6",
                            color: "#4b5563",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            marginTop: 12
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#e5e7eb";
                            e.currentTarget.style.borderColor = "#4b5563";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#6b7280";
                          }}
                        >
                          📦 Archive Trail
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Goal Form - Full Width Below */}
        <div style={{
          width: "100%",
          marginTop: 24
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: 0,
            padding: 32,
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            border: "3px solid #059669"
          }}>
            <div style={{
              textAlign: "center",
              marginBottom: 32
            }}>
              <h2 style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#1e3a5f",
                marginBottom: 8
              }}>
                🧭 Plan Your Journey
              </h2>
              <p style={{
                fontSize: 16,
                color: "#6b7280",
                margin: 0
              }}>
                Set your destination and we'll create your personalized trail map
              </p>
            </div>
            <GoalForm onSuccess={loadPlans} />
          </div>
        </div>
      </div>
    </main>
  );
}
