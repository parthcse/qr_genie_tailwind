import { getUserFromRequest } from "../../../lib/auth";

/**
 * DEPRECATED: This endpoint is no longer used.
 * Only Basic Package is available - use /api/checkout/basic instead.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Only Basic Package is available - use /api/checkout/basic instead
  return res.status(400).json({ 
    error: "This plan is no longer available. Please subscribe to Basic Package instead.",
    availablePlan: "BASIC"
  });
}
