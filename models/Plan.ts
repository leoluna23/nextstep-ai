/*models/Plan.ts

Purpose:
- Defines the exact JSON shape that we need Gemini to return
- Uses Zod to validate that the response matches the schema at runtime.
- Exports typescript files inferred from the schema.

Importance:
- LLM outputs can be inconsistent. Zod validation gives us safety and predictable UI rendering
- If Gemini returns malformed JSON or missing fields, then we fail fast with a clear error.
*/

import { z } from 'zod';

/* A single actionable task (small enough to complete in one sitting)*/
export const TaskSchema = z.object({
    id: z.string(), // Unique identifier for the task
    text: z.string(), // The specific action that the user should take
    minutes: z.number(), // Estimated time to complete the task in minutes
    /* Category of task. This is used for UI filtering, coloring and to ensure a balanced plan.
       (We keep the enum tight so Gemini doesn't create new categories.)*/
       category: z.enum([
        "research",
        "build",
        "practice",
        "network",
        "apply",
       ]),

    successCriteria: z.string(), // Clear criteria for what success looks like for this task
    prereqs: z.array(z.string()).default([]), // List of task IDs that must be completed before this task
});


/* A milestone groups tasks into a coherent chunk of progress. */
export const MilestoneSchema = z.object({
    id: z.string(), // Unique identifier for the milestone
    name: z.string(), // A short, descriptive name for the milestone
    why: z.string(), // A brief explanation of why this milestone is important for the user's goal
    tasks: z.array(TaskSchema), // List of tasks that belong to this milestone
});

/* The week plan: a theme plus multiple milestones */
export const WeekSchema = z.object({
    week: z.number(), // The week number in the overall plan (e.g., 1 for the first week)
    theme: z.string(), // A concise theme that captures the main focus of this week 
    milestones: z.array(MilestoneSchema), // List of milestones for this week
});

/* The full plan that the app stores, renders, and tracks progress against. */
export const PlanSchema = z.object({
    title: z.string(), // A concise, descriptive title for the overall plan
    summary: z.string(), // A brief summary of the plan and how it helps the user achieve their goal
    weeks: z.array(WeekSchema), // List of weekly plans that make up the overall plan
});

/********** Inferred Typescript types for type safety across the app **********/
export type Plan = z.infer<typeof PlanSchema>;