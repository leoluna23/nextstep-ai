"use client";

/**
 * components/ProgressMeter.tsx
 *
 * Purpose:
 * - Displays a simple altitude progress bar plus counts
 * - Keeps styling minimal for now, can be enhanced later.
 */

export default function ProgressMeter(props:{
    completed: number;
    total: number;
}) {

    const { completed, total } = props; // passed in as props for flexibility (can be used in multiple places, e.g. overall plan progress, weekly progress, etc.)
    const pct = total > 0 ? 0 : Math.round((completed/total)*100); // avoid NaN if total is 0


    // Simple styled progress meter with counts. Can be enhanced with colors, animations, etc. later.
    return ( 
        <section
      style={{
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 0,
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>Altitude</div>
        <div style={{ opacity: 0.85 }}>
          {completed}/{total} tasks • {pct}%
        </div>
      </div>

      <div
        style={{
          height: 10,
          background: "#eee",
          borderRadius: 0,
          marginTop: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#111",
          }}
        />
      </div>
    </section>
    );
}