/**
 * lib/planStore.ts
 *
 * Purpose:
 * - Temporary client-side storage for the generated plan using sessionStorage.
 * - This enables a fast hackathon vertical slice BEFORE MongoDB is wired.
 *
 * Why sessionStorage?
 * - Persists across page navigation/refresh within the same browser session.
 * - Clears automatically when the tab/window is closed (nice for demos).
 *
 * When to remove/replace:
 * - Once MongoDB save/load endpoints are implemented, this becomes optional.
 *
 * Notes:
 * - This runs ONLY in the browser (sessionStorage is not available server-side).
 */
import type { Plan } from "@/models/Plan";

const KEY = "nextstep_plan_v1";
// Save a Plan object for the current session.
export function savePlan(plan: Plan){
    sessionStorage.setItem(KEY, JSON.stringify(plan));
}
// Load the Plan object for the current session, or return null if not found.
export function loadPlan(): Plan | null {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
}
// Clear the stored Plan from sessionStorage.
export function clearPlan(){
    sessionStorage.removeItem(KEY);
}