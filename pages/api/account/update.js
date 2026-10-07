// pages/api/account/update.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";
import { checkAccountEmail } from "@/lib/emailCheck";
import { isRateLimited } from "@/lib/rateLimit";
import { sendEmailChangeCode, resendWaitSeconds, RESEND_COOLDOWN_SECONDS } from "@/lib/emailVerification";
import { emailConfigured } from "@/lib/email";

/**
 * PUT /api/account/update — profile details. Changing the email address needs the current password and a real,
 * non-disposable address, and only takes effect once the code emailed to the new address is entered.
 */
// Optional text field: trimmed, capped in length, empty becomes null
const clean = (value, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) || null : null);

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const {
      firstName,
      lastName,
      email,
      telephone,
      company,
      address,
      city,
      state,
      zipCode,
      country,
      language,
      currentPassword,
    } = req.body || {};

    // Changing the sign-in email: current password, real address, not already taken. The address doesn't change
    // here: it becomes pendingEmail and a code is emailed to it (confirmed through api/account/email-change)
    let newEmail = null; // a new address to send a code to
    let keepPending = null; // the same new address saved again within the resend wait: keep the code already sent
    if (typeof email === "string" && email.trim() && email.trim().toLowerCase() !== user.email) {
      if (isRateLimited(`email-change:${user.id}`, 15 * 60 * 1000, 5)) {
        return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
      }
      const account = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true, pendingEmail: true, emailCodeSentAt: true } });
      if (!currentPassword || !(await bcrypt.compare(String(currentPassword).slice(0, 128), account.password))) {
        return res.status(400).json({ error: "Enter your current password to change your email address.", field: "currentPassword" });
      }
      const check = await checkAccountEmail(email);
      if (!check.ok) {
        return res.status(400).json({ error: check.error, field: "email" });
      }
      const existingUser = await prisma.user.findUnique({ where: { email: check.email }, select: { id: true } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: "That email address is already in use.", field: "email" });
      }
      const wait = resendWaitSeconds(account.emailCodeSentAt);
      if (account.pendingEmail === check.email && wait > 0) keepPending = { email: check.email, resendIn: wait };
      else newEmail = check.email;
    }

    // Build update data object
    const updateData = {};

    // Combine firstName and lastName into name
    if (firstName !== undefined || lastName !== undefined) {
      const currentName = user.name || "";
      const currentParts = currentName.split(" ");
      const newFirstName = firstName !== undefined ? firstName : currentParts[0] || "";
      const newLastName = lastName !== undefined ? lastName : currentParts.slice(1).join(" ") || "";
      updateData.name = clean(`${newFirstName ?? ""} ${newLastName ?? ""}`, 120);
    }

    if (telephone !== undefined) {
      updateData.telephone = clean(telephone);
    }

    if (company !== undefined) {
      updateData.company = clean(company);
    }

    if (address !== undefined) {
      updateData.address = clean(address);
    }

    if (city !== undefined) {
      updateData.city = clean(city);
    }

    if (state !== undefined) {
      updateData.state = clean(state);
    }

    if (zipCode !== undefined) {
      updateData.zipCode = clean(zipCode);
    }

    if (country !== undefined) {
      updateData.country = clean(country);
    }

    if (language !== undefined) {
      updateData.language = clean(language);
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        telephone: true,
        company: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        language: true,
      },
    });

    // The new address gets its code; the sign-in email stays the same until it's confirmed
    let emailChange = null;
    if (keepPending) {
      emailChange = { pendingEmail: keepPending.email, sent: true, resendIn: keepPending.resendIn };
    } else if (newEmail) {
      const sent = await sendEmailChangeCode(updatedUser, newEmail);
      if (!sent && emailConfigured()) {
        return res.status(502).json({ error: "Your details were saved, but we couldn't send the code to the new address. Please try again in a minute.", field: "email" });
      }
      emailChange = { pendingEmail: newEmail, sent: true, resendIn: RESEND_COOLDOWN_SECONDS };
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
      emailChange,
      message: emailChange ? "Details saved. Enter the code we sent to your new email address to finish changing it." : "Account information updated successfully",
    });
  } catch (error) {
    console.error("Error updating account:", error);
    return res.status(500).json({ error: "Failed to update account information. Please try again." });
  }
}
