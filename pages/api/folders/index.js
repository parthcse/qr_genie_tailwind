import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  if (req.method === "GET") {
    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { qrCodes: true },
        },
      },
    });
    
    // Transform to include qrCodes count
    const foldersWithCount = folders.map((folder) => ({
      ...folder,
      qrCodes: Array(folder._count.qrCodes).fill(null), // Create array for count
    }));
    
    return res.status(200).json({ folders: foldersWithCount });
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const folder = await prisma.folder.create({
      data: { name: name.trim(), user: { connect: { id: user.id } } },
    });

    return res.status(201).json({ folder });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
