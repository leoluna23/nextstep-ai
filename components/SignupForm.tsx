"use client";

/**
 * components/SignupForm.tsx
 *
 * Purpose:
 * - Signup form for new users
 */

import { useState } from "react";

type SignupFormProps = {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
};

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Signup failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 700, color: "#1e3a5f" }}>
        🎒 Create Account
      </h3>

      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>
          Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 0,
            border: "2px solid #059669",
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
            e.currentTarget.style.borderColor = "#059669";
            e.currentTarget.style.backgroundColor = "#fafafa";
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 0,
            border: "2px solid #059669",
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
            e.currentTarget.style.borderColor = "#059669";
            e.currentTarget.style.backgroundColor = "#fafafa";
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>
          Password (min 6 characters)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 0,
            border: "2px solid #059669",
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
            e.currentTarget.style.borderColor = "#059669";
            e.currentTarget.style.backgroundColor = "#fafafa";
          }}
        />
      </div>

      {error && (
        <div style={{
          padding: 12,
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
          padding: "14px 24px",
          borderRadius: 0,
          border: "none",
          backgroundColor: loading ? "#9ca3af" : "#059669",
          color: "white",
          fontWeight: 700,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s",
          boxShadow: loading ? "none" : "0 4px 12px rgba(5,150,105,0.3)",
        }}
        onMouseOver={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "#047857";
          }
        }}
        onMouseOut={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "#059669";
          }
        }}
      >
        {loading ? "⏳ Creating account..." : "🎒 Create Account"}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        style={{
          padding: "10px",
          borderRadius: 0,
          border: "none",
          backgroundColor: "transparent",
          color: "#059669",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Already have an account? Sign in
      </button>
    </form>
  );
}

