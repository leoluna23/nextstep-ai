"use client";

/**
 * components/MotivationalSpeaker.tsx
 *
 * Purpose:
 * - Plays motivational audio messages using ElevenLabs
 * - Shows a button to play/pause motivational speech
 */

import { useState, useRef } from "react";

type MotivationalSpeakerProps = {
  context?: {
    progress?: number;
    completedTasks?: number;
    totalTasks?: number;
    nextTask?: string;
    goalText?: string;
  };
  customText?: string;
};

export default function MotivationalSpeaker({ context, customText }: MotivationalSpeakerProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlay() {
    if (playing && audioRef.current) {
      // Pause if already playing
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/voice/motivational", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: customText,
          context: context,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to generate speech");
      }

      // Create audio blob and play
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous audio if exists
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setError("Failed to play audio");
        setPlaying(false);
        setLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setPlaying(true);
    } catch (err: any) {
      setError(err?.message || "Failed to generate motivational speech");
      console.error("Motivational speaker error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <button
        onClick={handlePlay}
        disabled={loading}
        style={{
          padding: "14px 24px",
          borderRadius: 0,
          border: "none",
          backgroundColor: loading ? "#9ca3af" : playing ? "#f59e0b" : "#059669",
          color: "white",
          fontWeight: 700,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s",
          boxShadow: loading ? "none" : "0 4px 12px rgba(5,150,105,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 180
        }}
        onMouseOver={(e) => {
          if (!loading && !playing) {
            e.currentTarget.style.backgroundColor = "#047857";
          }
        }}
        onMouseOut={(e) => {
          if (!loading && !playing) {
            e.currentTarget.style.backgroundColor = "#059669";
          }
        }}
      >
        {loading ? (
          <>
            <span>⏳</span>
            <span>Generating...</span>
          </>
        ) : playing ? (
          <>
            <span>⏸️</span>
            <span>Pause</span>
          </>
        ) : (
          <>
            <span>🎙️</span>
            <span>Motivational Speech</span>
          </>
        )}
      </button>
      {error && (
        <div style={{
          fontSize: 12,
          color: "#dc2626",
          textAlign: "center",
          maxWidth: 200
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

