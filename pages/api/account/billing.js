// pages/api/account/billing.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

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
      billingName,
      billingCompany,
      billingAddress,
      billingCity,
      billingState,
      billingZipCode,
      billingCountry,
      taxId,
    } = req.body;

    // Build update data object
    const updateData = {};

    if (billingName !== undefined) {
      updateData.billingName = clean(billingName);
    }

    if (billingCompany !== undefined) {
      updateData.billingCompany = clean(billingCompany);
    }

    if (billingAddress !== undefined) {
      updateData.billingAddress = clean(billingAddress);
    }

    if (billingCity !== undefined) {
      updateData.billingCity = clean(billingCity);
    }

    if (billingState !== undefined) {
      updateData.billingState = clean(billingState);
    }

    if (billingZipCode !== undefined) {
      updateData.billingZipCode = clean(billingZipCode);
    }

    if (billingCountry !== undefined) {
      updateData.billingCountry = clean(billingCountry);
    }

    if (taxId !== undefined) {
      updateData.taxId = clean(taxId);
    }

    // Update user billing information in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        billingName: true,
        billingCompany: true,
        billingAddress: true,
        billingCity: true,
        billingState: true,
        billingZipCode: true,
        billingCountry: true,
        taxId: true,
      },
    });

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Billing information updated successfully",
    });
  } catch (error) {
    console.error("Error updating billing information:", error);
    return res.status(500).json({
      error: "Failed to update billing information. Please try again.",
    });
  }
}
