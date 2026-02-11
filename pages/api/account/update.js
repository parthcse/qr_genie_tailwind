// pages/api/account/update.js
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
    } = req.body;

    // Validate email if provided
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    // Build update data object
    const updateData = {};

    // Combine firstName and lastName into name
    if (firstName !== undefined || lastName !== undefined) {
      const currentName = user.name || "";
      const currentParts = currentName.split(" ");
      const newFirstName = firstName !== undefined ? firstName : currentParts[0] || "";
      const newLastName = lastName !== undefined ? lastName : currentParts.slice(1).join(" ") || "";
      updateData.name = `${newFirstName} ${newLastName}`.trim() || null;
    }

    if (email !== undefined && email !== user.email) {
      updateData.email = email.trim();
    }

    if (telephone !== undefined) {
      updateData.telephone = telephone?.trim() || null;
    }

    if (company !== undefined) {
      updateData.company = company?.trim() || null;
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || null;
    }

    if (city !== undefined) {
      updateData.city = city?.trim() || null;
    }

    if (state !== undefined) {
      updateData.state = state?.trim() || null;
    }

    if (zipCode !== undefined) {
      updateData.zipCode = zipCode?.trim() || null;
    }

    if (country !== undefined) {
      updateData.country = country?.trim() || null;
    }

    if (language !== undefined) {
      updateData.language = language?.trim() || null;
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

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Account information updated successfully",
    });
  } catch (error) {
    console.error("Error updating account:", error);
    return res.status(500).json({
      error: "Failed to update account information",
      message: error.message || "Unknown error occurred",
    });
  }
}
