import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Folder ID is required" });

  // Verify folder exists and belongs to user
  const folder = await prisma.folder.findFirst({
    where: { id, userId: user.id },
    include: {
      qrCodes: true,
      _count: {
        select: { qrCodes: true },
      },
    },
  });

  if (!folder) {
    return res.status(404).json({ error: "Folder not found" });
  }

  if (req.method === "PUT") {
    // Rename folder
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Check if name already exists for this user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        id: { not: id },
      },
    });

    if (existingFolder) {
      return res.status(400).json({ error: "A folder with this name already exists" });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name: name.trim() },
      include: {
        _count: {
          select: { qrCodes: true },
        },
      },
    });

    // Transform to match frontend expectations
    const folderWithCount = {
      ...updatedFolder,
      qrCodes: Array(updatedFolder._count.qrCodes).fill(null),
    };

    return res.status(200).json({ folder: folderWithCount });
  }

  if (req.method === "DELETE") {
    // Delete folder
    // Note: QR codes will be moved to "No Folder" (folderId set to null)
    // due to Prisma's onDelete behavior, but we'll handle it explicitly
    
    // Move all QR codes in this folder to "No Folder" (set folderId to null)
    await prisma.qRCode.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // Delete the folder
    await prisma.folder.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, message: "Folder deleted successfully" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
