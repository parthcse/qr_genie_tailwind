/**
 * Central subscription status utility.
 * All date checks use UTC.
 * Use this helper in API routes, dashboard UI, and QR guards.
 */

/**
 * @param {Object} user - User from DB (or auth) with subscriptionPlan, trialStartedAt, trialEndsAt, subscriptionStartedAt, subscriptionEndsAt
 * @returns {{ status: string, daysLeft: number | null }}
 */
function getUserSubscriptionStatus(user) {
  if (!user) {
    return { status: "NONE", daysLeft: null };
  }

  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const subscriptionEndsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;

  // Trial is active if current UTC date <= trialEndsAt
  if (user.subscriptionPlan === "TRIAL" && trialEndsAt && nowUtc <= trialEndsAt) {
    const diffMs = trialEndsAt - nowUtc;
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { status: "TRIAL_ACTIVE", daysLeft };
  }

  // Trial expired
  if (user.subscriptionPlan === "TRIAL" && trialEndsAt && nowUtc > trialEndsAt) {
    return { status: "TRIAL_EXPIRED", daysLeft: null };
  }

  // Subscription is active if current UTC date <= subscriptionEndsAt
  const paidPlans = ["MONTHLY", "QUARTERLY", "ANNUAL"];
  if (paidPlans.includes(user.subscriptionPlan) && subscriptionEndsAt && nowUtc <= subscriptionEndsAt) {
    const diffMs = subscriptionEndsAt - nowUtc;
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { status: "SUBSCRIPTION_ACTIVE", daysLeft };
  }

  // Subscription expired
  if (paidPlans.includes(user.subscriptionPlan) && subscriptionEndsAt && nowUtc > subscriptionEndsAt) {
    return { status: "SUBSCRIPTION_EXPIRED", daysLeft: null };
  }

  return { status: "NONE", daysLeft: null };
}

/**
 * Returns true if user can create QR codes (trial active or subscription active).
 */
function canCreateQR(user) {
  const { status } = getUserSubscriptionStatus(user);
  return status === "TRIAL_ACTIVE" || status === "SUBSCRIPTION_ACTIVE";
}

export { getUserSubscriptionStatus, canCreateQR };
