/**
 * Central subscription status utility.
 * All date checks use UTC.
 * Use this helper in API routes, dashboard UI, and QR guards.
 */

// Plan constants
const TRIAL_QR_LIMIT = 2; // Maximum QR codes during free trial
const PAID_PLANS = ["BASIC"]; // Only Basic Package plan available

/**
 * @param {Object} user - User from DB (or auth) with subscriptionPlan, trialStartedAt, trialEndsAt, subscriptionStartedAt, subscriptionEndsAt
 * @returns {{ status: string, daysLeft: number | null, planName: string | null }}
 */
function getUserSubscriptionStatus(user) {
  if (!user) {
    return { status: "NONE", daysLeft: null, planName: null };
  }

  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const subscriptionEndsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;

  // Trial is active if current UTC date <= trialEndsAt
  if (user.subscriptionPlan === "TRIAL" && trialEndsAt && nowUtc <= trialEndsAt) {
    const diffMs = trialEndsAt - nowUtc;
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { status: "TRIAL_ACTIVE", daysLeft, planName: "Free Trial" };
  }

  // Trial expired
  if (user.subscriptionPlan === "TRIAL" && trialEndsAt && nowUtc > trialEndsAt) {
    return { status: "TRIAL_EXPIRED", daysLeft: null, planName: null };
  }

  // Subscription is active if current UTC date <= subscriptionEndsAt (Basic Package only)
  if (user.subscriptionPlan === "BASIC" && subscriptionEndsAt && nowUtc <= subscriptionEndsAt) {
    const diffMs = subscriptionEndsAt - nowUtc;
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { status: "SUBSCRIPTION_ACTIVE", daysLeft, planName: "Basic Package" };
  }

  // Subscription expired (Basic Package only)
  if (user.subscriptionPlan === "BASIC" && subscriptionEndsAt && nowUtc > subscriptionEndsAt) {
    return { status: "SUBSCRIPTION_EXPIRED", daysLeft: null, planName: null };
  }

  return { status: "NONE", daysLeft: null, planName: null };
}

/**
 * Returns true if user can create QR codes (trial active or subscription active).
 */
function canCreateQR(user) {
  const { status } = getUserSubscriptionStatus(user);
  return status === "TRIAL_ACTIVE" || status === "SUBSCRIPTION_ACTIVE";
}

/**
 * Returns the maximum number of QR codes a user can create based on their subscription status.
 * @param {Object} user - User object
 * @returns {number} Maximum QR codes allowed (Infinity for paid plans, TRIAL_QR_LIMIT for trial)
 */
function getQRCodeLimit(user) {
  const { status } = getUserSubscriptionStatus(user);
  if (status === "TRIAL_ACTIVE") {
    return TRIAL_QR_LIMIT;
  }
  if (status === "SUBSCRIPTION_ACTIVE") {
    // Paid plans have unlimited (or very high limit)
    return Infinity;
  }
  return 0; // No access
}

/**
 * Checks if user has reached their QR code limit.
 * @param {Object} user - User object
 * @param {number} currentQRCount - Current number of QR codes user has
 * @returns {{ canCreate: boolean, limit: number, current: number, reason: string | null }}
 */
async function checkQRCodeLimit(user, currentQRCount) {
  const limit = getQRCodeLimit(user);
  const { status } = getUserSubscriptionStatus(user);
  
  if (status === "TRIAL_EXPIRED" || status === "SUBSCRIPTION_EXPIRED" || status === "NONE") {
    return {
      canCreate: false,
      limit: 0,
      current: currentQRCount,
      reason: status === "TRIAL_EXPIRED" 
        ? "Your 14-day free trial has expired. Subscribe to a plan to continue creating QR codes."
        : "Your subscription has expired. Please renew to continue creating QR codes."
    };
  }

  if (currentQRCount >= limit) {
    return {
      canCreate: false,
      limit,
      current: currentQRCount,
      reason: status === "TRIAL_ACTIVE"
        ? `You've reached the ${TRIAL_QR_LIMIT} QR code limit for the free trial. Subscribe to Basic Package to create unlimited QR codes.`
        : "QR code limit reached."
    };
  }

  return {
    canCreate: true,
    limit,
    current: currentQRCount,
    reason: null
  };
}

export { getUserSubscriptionStatus, canCreateQR, getQRCodeLimit, checkQRCodeLimit, TRIAL_QR_LIMIT, PAID_PLANS };
