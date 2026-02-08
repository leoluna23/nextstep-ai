"use client";

/**
 * components/AudioExplanationButton.tsx
 *
 * Purpose:
 * - Button to play audio explanations for tasks, weeks, or plans
 * - Handles loading, playing, and stopping audio
 */

import { useState, useRef } from "react";

type AudioExplanationButtonProps = {
  type: "task" | "week" | "plan";
  data: any; // Task, Week, or Plan data
  goalText?: string;
  size?: "small" | "medium" | "large";
};

export default function AudioExplanationButton({ 
  type, 
  data, 
  goalText,
  size = "small"
}: AudioExplanationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }
    setPlaying(false);
  }

  async function handlePlay() {
    if (playing && audioRef.current) {
      stopAudio();
      return;
    }

    setLoading(true);
    setError(null);
    stopAudio();

    try {
      let endpoint = "";
      let requestBody: any = { goalText };

      if (type === "task") {
        endpoint = "/api/explain/task";
        requestBody = {
          ...requestBody,
          taskText: data.text,
          taskMinutes: data.minutes,
          category: data.category,
          successCriteria: data.successCriteria,
          milestoneName: data.milestoneName,
          weekNumber: data.weekNumber,
        };
      } else if (type === "week") {
        endpoint = "/api/explain/week";
        requestBody = {
          ...requestBody,
          weekNumber: data.week,
          theme: data.theme,
          milestones: data.milestones,
        };
      } else if (type === "plan") {
        endpoint = "/api/explain/plan";
        requestBody = {
          ...requestBody,
          title: data.title,
          summary: data.summary,
          totalWeeks: data.weeks?.length || 0,
          totalTasks: data.totalTasks || 0,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to generate explanation");
      }

      // Create audio blob and play
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setError("Failed to play audio");
        setPlaying(false);
        setLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      setPlaying(true);
    } catch (err: any) {
      setError(err?.message || "Failed to generate explanation");
      console.error("Audio explanation error:", err);
    } finally {
      setLoading(false);
    }
  }

  const sizeStyles = {
    small: { padding: "6px 12px", fontSize: 12 },
    medium: { padding: "8px 16px", fontSize: 14 },
    large: { padding: "10px 20px", fontSize: 16 },
  };

  const style = sizeStyles[size];

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <button
        onClick={handlePlay}
        disabled={loading}
        style={{
          ...style,
          borderRadius: 0,
          border: "1px solid #059669",
          backgroundColor: loading ? "#9ca3af" : playing ? "#f59e0b" : "#f0fdf4",
          color: loading ? "#ffffff" : playing ? "#ffffff" : "#166534",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        onMouseOver={(e) => {
          if (!loading && !playing) {
            e.currentTarget.style.backgroundColor = "#dcfce7";
          }
        }}
        onMouseOut={(e) => {
          if (!loading && !playing) {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
          }
        }}
        title={error || (playing ? "Stop explanation" : "Listen to explanation")}
      >
        {loading ? (
          <>
            <span>⏳</span>
            <span>Loading...</span>
          </>
        ) : playing ? (
          <>
            <span>⏸️</span>
            <span>Stop</span>
          </>
        ) : (
          <>
            <span>🔊</span>
            <span>Explain</span>
          </>
        )}
      </button>
      {error && (
        <span style={{ fontSize: 10, color: "#dc2626" }} title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
}

