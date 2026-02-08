/*
models/PlanDoc.ts

Purpose:
- Defines the MongoDB document shape for a stored plan.
- Keeps DB fields consistent across save/load/complete endpoints.
*/

import type { Plan } from "@/models/Plan";

export type PlanDoc = { 
    _id?: any; // MongoDB document ID
    createdAt: Date;
    updatedAt: Date;

    // User association
    userId?: string; // User ID who owns this plan

    // Metadata
    goalText: string;
    targetRole?: string;
    hoursPerWeek: number;
    timelineWeeks: number;
    skillLevel: "Beginner" | "Intermediate" | "Advanced";

    // Core data
    plan: Plan;
    completedTaskIds: string[]; // List of task IDs that the user has completed
};