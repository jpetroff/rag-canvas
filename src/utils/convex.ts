import { ConvexReactClient } from "convex/react";

// Get Convex URL from environment variable
// In development, this should be set in .env.local
// For now, we'll use a placeholder that will need to be configured
const convexUrl = import.meta.env.VITE_CONVEX_URL || "";

if (!convexUrl) {
  console.warn(
    "VITE_CONVEX_URL is not set. Please set it in your .env.local file."
  );
}

export const convex = new ConvexReactClient(convexUrl);
