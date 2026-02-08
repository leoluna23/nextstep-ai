/**
 * lib/planStore.ts
 *
 * Purpose:
 * - Session-only persistence for demo speed.
 * - Stores BOTH the plan and completion state.
 *
 * Structure:
 * {
 *   plan: Plan,
 *   completedTaskIds: string[]
 * }
 *
 * Later:
 * - Replace with MongoDB save/load using a planId.
 */

import type { Plan } from "@/models/Plan";

const KEY = "nextstep_state_v1";

export type StoredState = {
  plan: Plan;
  completedTaskIds: string[];
};

export function saveState(state: StoredState) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function loadState(): StoredState | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function clearState() {
  sessionStorage.removeItem(KEY);
}

/**
 * Convenience: store a new plan with empty completion list.
 */
export function initStateWithPlan(plan: Plan) {
  saveState({ plan, completedTaskIds: [] });
}
