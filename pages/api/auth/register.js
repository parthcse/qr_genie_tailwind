
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const user = await prisma.user.create({
  data: {
    email,
    password: hashed,
    name: name || null,
    plan: "free",
    trialEndsAt,
  },
});

  setLoginSession(res, user);

  return res.status(201).json({ id: user.id, email: user.email });
}
