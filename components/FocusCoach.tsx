"use client";

/**
 * components/FocusCoach.tsx
 *
 * Purpose:
 * - Timer-based focus coach for "Today's Next Step"
 * - Midway check-in prompts
 * - Micro-help when user is stuck
 * - Optional audio via ElevenLabs
 */

import { useState, useEffect, useRef } from "react";
import type { FlatTask } from "@/lib/planner";

type FocusCoachProps = {
  task: FlatTask | null;
  goalText?: string;
  onTaskComplete?: () => void;
};

type CoachState = "idle" | "running" | "paused" | "checkin" | "stuck" | "help";

export default function FocusCoach({ task, goalText, onTaskComplete }: FocusCoachProps) {
  const [state, setState] = useState<CoachState>("idle");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(0); // in minutes
  const [microHelp, setMicroHelp] = useState<{ smallerStep: string; threeMinuteVersion: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when task changes
  useEffect(() => {
    if (task) {
      setState("idle");
      setTimeElapsed(0);
      setSelectedDuration(task.minutes); // Default to task duration
      setTimeRemaining(task.minutes * 60);
      setMicroHelp(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [task?.id]);

  // Timer logic
  useEffect(() => {
    if (state === "running" && selectedDuration > 0) {
      const totalSeconds = selectedDuration * 60;
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newElapsed = prev + 1;
          const newRemaining = Math.max(0, totalSeconds - newElapsed);
          setTimeRemaining(newRemaining);

          // Check for midway point (50% of time)
          const midwayPoint = Math.floor(totalSeconds / 2);
          if (newElapsed === midwayPoint && newElapsed > 0) {
            setState("checkin");
            speakText("Still on track? Click yes to continue, or stuck if you need help.");
          }

          // Check if time is up
          if (newRemaining === 0) {
            setState("idle");
            speakText("Time's up! Great work. You can mark this task as complete if you're done.");
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }

          return newElapsed;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [state, selectedDuration]);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }
  }

  async function speakText(text: string) {
    if (!audioEnabled) return;

    // Stop any currently playing audio
    stopAudio();

    try {
      const response = await fetch("/api/voice/motivational", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        await audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
      }
    } catch (err) {
      console.error("Failed to play audio:", err);
    }
  }

  async function handleStuck() {
    if (!task) return;

    setLoading(true);
    setState("stuck");

    try {
      const response = await fetch("/api/focus-coach/micro-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskText: task.text,
          taskMinutes: task.minutes,
          goalText: goalText,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMicroHelp(data);
        setState("help");
        if (audioEnabled) {
          speakText(`Here's a smaller first step: ${data.smallerStep}`);
        }
      } else {
        throw new Error(data?.error || "Failed to get help");
      }
    } catch (err: any) {
      console.error("Micro-help error:", err);
      setMicroHelp({
        smallerStep: "Take a 2-minute break, then come back and do just one tiny piece of this task.",
        threeMinuteVersion: "Set a 3-minute timer and do the absolute smallest version - even just opening the right file or writing one sentence.",
      });
      setState("help");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (!task) {
    return null;
  }

  return (
    <div style={{
      padding: 24,
      border: "2px solid #059669",
      backgroundColor: "#f0fdf4",
      borderRadius: 0,
      marginTop: 24
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: "#166534",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>🎯</span>
          <span>Focus Coach</span>
        </h3>
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 14,
          color: "#166534"
        }}>
          <input
            type="checkbox"
            checked={audioEnabled}
            onChange={(e) => setAudioEnabled(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span>🔊 Audio</span>
        </label>
      </div>

      <div style={{
        marginBottom: 16,
        padding: 16,
        backgroundColor: "white",
        border: "1px solid #86efac",
        borderRadius: 0
      }}>
        <div style={{
          fontSize: 14,
          color: "#4a5568",
          marginBottom: 8,
          fontWeight: 600
        }}>
          Current Task:
        </div>
        <div style={{
          fontSize: 16,
          color: "#1e3a5f",
          lineHeight: 1.5
        }}>
          {task.text}
        </div>
        <div style={{
          fontSize: 12,
          color: "#6b7280",
          marginTop: 8
        }}>
          Estimated: {task.minutes} minutes
        </div>
      </div>

      {/* Timer Display */}
      {state !== "idle" && (
        <div style={{
          textAlign: "center",
          marginBottom: 16,
          padding: 20,
          backgroundColor: state === "running" ? "#dcfce7" : state === "paused" ? "#f3f4f6" : "#fef3c7",
          border: `2px solid ${state === "running" ? "#059669" : state === "paused" ? "#6b7280" : "#f59e0b"}`,
          borderRadius: 0
        }}>
          <div style={{
            fontSize: 36,
            fontWeight: 800,
            color: state === "running" ? "#059669" : state === "paused" ? "#4b5563" : "#92400e",
            marginBottom: 8
          }}>
            {formatTime(timeRemaining)}
          </div>
          <div style={{
            fontSize: 14,
            color: "#6b7280"
          }}>
            {state === "running" ? "Time remaining" : state === "paused" ? "Paused" : state === "checkin" ? "Midway check-in" : ""}
          </div>
        </div>
      )}

      {/* State-based UI */}
      {state === "idle" && (
        <div>
          <div style={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: "white",
            border: "1px solid #86efac",
            borderRadius: 0
          }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 8
            }}>
              ⏱️ Timer Duration (minutes):
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
              gap: 8,
              marginBottom: 12
            }}>
              {[5, 10, 15, 20, 25, 30, 45, 60].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => {
                    setSelectedDuration(minutes);
                    setTimeRemaining(minutes * 60);
                    setTimeElapsed(0);
                  }}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 0,
                    border: selectedDuration === minutes ? "2px solid #059669" : "1px solid #d1d5db",
                    backgroundColor: selectedDuration === minutes ? "#f0fdf4" : "white",
                    color: selectedDuration === minutes ? "#166534" : "#374151",
                    fontWeight: selectedDuration === minutes ? 700 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    if (selectedDuration !== minutes) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#9ca3af";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedDuration !== minutes) {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }
                  }}
                >
                  {minutes}
                </button>
              ))}
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8
            }}>
              <input
                type="number"
                min={1}
                max={60}
                value={selectedDuration || ""}
                onChange={(e) => {
                  const value = Math.min(60, Math.max(1, parseInt(e.target.value) || 0));
                  setSelectedDuration(value);
                  setTimeRemaining(value * 60);
                  setTimeElapsed(0);
                }}
                placeholder="Custom (1-60)"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 0,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  fontFamily: "inherit",
                  color: "#000000"
                }}
              />
              <span style={{ fontSize: 12, color: "#6b7280" }}>min</span>
            </div>
            {selectedDuration > 0 && (
              <div style={{
                marginTop: 12,
                fontSize: 12,
                color: "#059669",
                fontWeight: 600
              }}>
                Selected: {selectedDuration} minute{selectedDuration !== 1 ? "s" : ""}
                {task && selectedDuration !== task.minutes && (
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>
                    {" "}(Task estimate: {task.minutes} min)
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (selectedDuration > 0) {
                setState("running");
                if (audioEnabled) {
                  speakText(`Let's focus on: ${task.text}. Timer starting now for ${selectedDuration} minutes!`);
                }
              }
            }}
            disabled={selectedDuration === 0}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 0,
              border: "none",
              backgroundColor: selectedDuration === 0 ? "#9ca3af" : "#059669",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
              cursor: selectedDuration === 0 ? "not-allowed" : "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => {
              if (selectedDuration > 0) {
                e.currentTarget.style.backgroundColor = "#047857";
              }
            }}
            onMouseOut={(e) => {
              if (selectedDuration > 0) {
                e.currentTarget.style.backgroundColor = "#059669";
              }
            }}
          >
            ▶️ Start Focus Session
          </button>
        </div>
      )}

      {state === "running" && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              setState("paused");
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              stopAudio();
            }}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 0,
              border: "1px solid #f59e0b",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fde68a"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fef3c7"}
          >
            ⏸️ Pause
          </button>
          <button
            onClick={() => {
              setState("idle");
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              stopAudio();
            }}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 0,
              border: "1px solid #dc2626",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
          >
            ⏹️ Stop
          </button>
          <button
            onClick={() => {
              setState("idle");
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              stopAudio();
              if (onTaskComplete) {
                onTaskComplete();
              }
              // Congratulate user if audio is enabled
              if (audioEnabled) {
                const timeSpent = Math.floor(timeElapsed / 60);
                const timeText = timeSpent > 0 ? `You spent ${timeSpent} minute${timeSpent !== 1 ? 's' : ''} on this task.` : "";
                speakText(`Congratulations! You've completed this task! ${timeText} Great work! Keep up the momentum!`);
              }
            }}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 0,
              border: "none",
              backgroundColor: "#059669",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#047857"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#059669"}
          >
            ✓ Complete Task
          </button>
        </div>
      )}

      {state === "paused" && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              setState("running");
              if (audioEnabled) {
                speakText("Resuming focus session. Let's continue!");
              }
            }}
            style={{
              flex: 2,
              padding: "12px 20px",
              borderRadius: 0,
              border: "none",
              backgroundColor: "#059669",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#047857"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#059669"}
          >
            ▶️ Resume
          </button>
          <button
            onClick={() => {
              setState("idle");
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              stopAudio();
            }}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 0,
              border: "1px solid #dc2626",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
          >
            ⏹️ Stop
          </button>
        </div>
      )}

      {state === "checkin" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#92400e",
            textAlign: "center",
            marginBottom: 8
          }}>
            Still on track?
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setState("running");
                if (audioEnabled) {
                  speakText("Great! Keep going!");
                }
              }}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 0,
                border: "none",
                backgroundColor: "#059669",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              ✓ Yes, continuing
            </button>
            <button
              onClick={handleStuck}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 0,
                border: "1px solid #f59e0b",
                backgroundColor: loading ? "#f3f4f6" : "#fef3c7",
                color: loading ? "#9ca3af" : "#92400e",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "⏳ Getting help..." : "🆘 I'm stuck"}
            </button>
          </div>
        </div>
      )}

      {state === "help" && microHelp && (
        <div style={{
          padding: 16,
          backgroundColor: "white",
          border: "2px solid #f59e0b",
          borderRadius: 0,
          marginTop: 16
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#92400e",
            marginBottom: 12
          }}>
            💡 Here's some help:
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#78350f",
              marginBottom: 6
            }}>
              Smaller first step:
            </div>
            <div style={{
              fontSize: 14,
              color: "#1e3a5f",
              lineHeight: 1.6,
              padding: 12,
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24"
            }}>
              {microHelp.smallerStep}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#78350f",
              marginBottom: 6
            }}>
              3-minute version:
            </div>
            <div style={{
              fontSize: 14,
              color: "#1e3a5f",
              lineHeight: 1.6,
              padding: 12,
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24"
            }}>
              {microHelp.threeMinuteVersion}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setState("running");
                if (audioEnabled) {
                  speakText("You've got this! Let's get back to it.");
                }
              }}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 0,
                border: "none",
                backgroundColor: "#059669",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              ▶️ Continue
            </button>
            <button
              onClick={() => {
                setState("idle");
                setMicroHelp(null);
              }}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 0,
                border: "1px solid #6b7280",
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

