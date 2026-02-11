// pages/api/account/billing.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

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
      updateData.billingName = billingName?.trim() || null;
    }

    if (billingCompany !== undefined) {
      updateData.billingCompany = billingCompany?.trim() || null;
    }

    if (billingAddress !== undefined) {
      updateData.billingAddress = billingAddress?.trim() || null;
    }

    if (billingCity !== undefined) {
      updateData.billingCity = billingCity?.trim() || null;
    }

    if (billingState !== undefined) {
      updateData.billingState = billingState?.trim() || null;
    }

    if (billingZipCode !== undefined) {
      updateData.billingZipCode = billingZipCode?.trim() || null;
    }

    if (billingCountry !== undefined) {
      updateData.billingCountry = billingCountry?.trim() || null;
    }

    if (taxId !== undefined) {
      updateData.taxId = taxId?.trim() || null;
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
      error: "Failed to update billing information",
      message: error.message || "Unknown error occurred",
    });
  }
}
