import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { clearLoginSession, getUserFromRequest } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { accountDataSummary, deleteAccountData } from "@/lib/accountDeletion";
import { CancelError, stopSubscriptionForDeletedAccount } from "@/lib/billing/cancelSubscription";
import { adminRecipients, formatDate } from "@/lib/billing/subscriptionEmails";
import { getUserSubscriptionStatus } from "@/lib/billing/subscription";
import { sendAccountDeletedEmail, sendAccountDeletedAdminEmail } from "@/lib/email";
import { DELETE_ACCOUNT_WORD, SUPPORT_EMAIL } from "@/lib/site";

const ADMIN_REFUSED = "Admin accounts can't be deleted here. Ask another admin, or remove the admin role first.";

// What happens to the customer's plan, for the warning: active, free days (refunded), already cancelled or none
function planState(user) {
  const { status, planName } = getUserSubscriptionStatus(user);
  if (status !== "SUBSCRIPTION_ACTIVE") return { state: "none" };
  const endsOn = formatDate(user.subscriptionEndsAt);
  if (user.subscriptionCancelledAt) return { state: "cancelled", planName, endsOn };
  if (user.subscriptionStartedAt && user.subscriptionStartedAt > new Date()) return { state: "freeDays", planName };
  return { state: "active", planName, endsOn };
}

/**
 * GET /api/account/delete: what deleting the signed-in account would remove, and what happens to its plan.
 * POST /api/account/delete { confirmation, password }: permanently deletes it. confirmation must be the word CONFIRM
 * and the password correct, so an unattended or stolen session can't do it. The subscription is stopped first: if
 * that fails nothing is deleted, because an account must never go while it can still be charged.
 */
export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    try {
      return res.status(200).json({ ...(await accountDataSummary(user.id)), plan: planState(user), canDelete: user.role !== "admin" });
    } catch (error) {
      console.error("Account deletion summary failed:", error);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // The site's owner mustn't be able to lock themselves out of the admin pages
  if (user.role === "admin") {
    return res.status(403).json({ error: ADMIN_REFUSED });
  }
  if (isRateLimited(`delete-account:${user.id}`, 15 * 60 * 1000, 5)) {
    return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
  }

  try {
    const { confirmation, password } = req.body || {};
    if (String(confirmation ?? "").trim().toUpperCase() !== DELETE_ACCOUNT_WORD) {
      return res.status(400).json({ error: `Type ${DELETE_ACCOUNT_WORD} to confirm.` });
    }

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, razorpaySubscriptionId: true, subscriptionCancelledAt: true, company: true },
    });
    if (!password || !(await bcrypt.compare(String(password).slice(0, 128), account.password))) {
      return res.status(400).json({ error: "Your password is incorrect." });
    }

    const plan = planState(user);
    const stopped = await stopSubscriptionForDeletedAccount({ ...user, ...account });
    if (stopped.subscriptionId && !account.subscriptionCancelledAt) {
      // So the account is right even if deleting it fails next and they stay signed in
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionCancelledAt: new Date() } });
    }

    const removed = await accountDataSummary(user.id);
    await deleteAccountData(user);
    clearLoginSession(res);

    // Not awaited: the account is gone either way, and a mail problem doesn't change that
    Promise.all([
      sendAccountDeletedEmail({ to: user.email, name: user.name, refund: stopped.refund, supportEmail: SUPPORT_EMAIL }),
      sendAccountDeletedAdminEmail({
        to: adminRecipients(),
        // Who it was only matters when there's a payment to follow up
        customer: stopped.subscriptionId ? { name: user.name, email: user.email, company: account.company } : null,
        planName: plan.planName,
        subscriptionId: stopped.subscriptionId,
        refund: stopped.refund,
        removed,
      }),
    ]).catch((error) => console.error("Account deletion emails:", error.message));

    return res.status(200).json({ deleted: true, refund: stopped.refund ? { amount: stopped.refund.amount, ok: !stopped.refund.error } : null });
  } catch (error) {
    if (error instanceof CancelError) {
      return res.status(error.status).json({ error: `${error.message} Nothing has been deleted.` });
    }
    console.error("Account deletion failed:", error);
    return res.status(500).json({ error: "Your account couldn't be deleted just now. Nothing has been lost; please try again, or contact us." });
  }
}
