/*

app/page.tsx

Purpose:
  - This is the landing / onboarding page
  - Presents a short product value statement and the GoalForm.

*/

import GoalForm from "@/components/GoalForm";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>NeXTSTeP AI</h1>
      <p style={{ marginTop: 0, marginBottom: 20 }}>
        Turn big career/school goals into climbable daily steps.
      </p>

      <GoalForm />
    </main>
  );
}