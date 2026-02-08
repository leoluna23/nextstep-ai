/*
app/archived/page.tsx

Purpose:
  - Displays all archived trails
  - Allows users to unarchive trails
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ArchivedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
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
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      router.push("/");
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
        // Filter only archived plans
        const archivedPlans = data.plans.filter((plan: PlanSummary) => plan.archived === true);
        setPlans(archivedPlans);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setPlansLoading(false);
    }
  }

  async function handleUnarchive(planId: string) {
    try {
      const res = await fetch("/api/plan/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, archived: false }),
      });
      if (res.ok) {
        loadPlans();
      }
    } catch (err) {
      console.error("Failed to unarchive:", err);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
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
          <div style={{ fontSize: 18, color: "#1e3a5f", fontWeight: 600 }}>Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

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
        {/* Header */}
        <div style={{
          backgroundColor: "white",
          borderRadius: 0,
          padding: 24,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: "2px solid #9ca3af",
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
              color: "#1e3a5f",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span>📦</span>
              <span>Archived Trails</span>
            </h1>
            <p style={{ 
              margin: "8px 0 0 0",
              fontSize: 14,
              color: "#6b7280"
            }}>
              Your completed and archived trail maps
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "10px 20px",
                borderRadius: 0,
                border: "1px solid #059669",
                backgroundColor: "#f0fdf4",
                color: "#166534",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#dcfce7";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f0fdf4";
              }}
            >
              🏠 Home
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

        {/* Archived Plans */}
        <div style={{
          backgroundColor: "white",
          borderRadius: 0,
          padding: 32,
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
          border: "3px solid #9ca3af"
        }}>
          {plansLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              ⏳ Loading archived trails...
            </div>
          ) : plans.length === 0 ? (
            <div style={{ 
              padding: 32, 
              textAlign: "center",
              color: "#6b7280",
              backgroundColor: "#f9fafb",
              border: "2px dashed #d1d5db"
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
              <p style={{ margin: 0, fontSize: 16 }}>
                No archived trails yet. Archived trails will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {plans.map((plan) => {
                const completedCount = plan.completedTaskIds.length;
                return (
                  <div
                    key={plan._id}
                    style={{
                      padding: 20,
                      border: "2px solid #9ca3af",
                      backgroundColor: "#f9fafb",
                      transition: "all 0.2s",
                      opacity: 0.8
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
                        e.currentTarget.style.opacity = "0.8";
                      }}
                    >
                      <div style={{ 
                        fontWeight: 700, 
                        fontSize: 18,
                        color: "#4b5563",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}>
                        <span>📦</span>
                        <span>{plan.plan.title}</span>
                      </div>
                      <div style={{ 
                        fontSize: 14,
                        color: "#6b7280",
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
                        <span>✅ {completedCount}/{plan.totalTasks} waypoints completed</span>
                        <span>📦 Archived</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnarchive(plan._id)}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        borderRadius: 0,
                        border: "1px solid #059669",
                        backgroundColor: "#f0fdf4",
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        marginTop: 12
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#dcfce7";
                        e.currentTarget.style.borderColor = "#059669";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0fdf4";
                        e.currentTarget.style.borderColor = "#059669";
                      }}
                    >
                      📤 Unarchive Trail
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

