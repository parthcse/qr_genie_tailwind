
import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const codes = await prisma.qRCode.findMany({
    where: { userId: user.id },

    include: {
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse meta JSON and extract designConfig for each code
  const codesWithParsedMeta = codes.map(code => {
    let parsedMeta = null;
    let designConfig = null;
    
    if (code.meta) {
      try {
        parsedMeta = typeof code.meta === "string" ? JSON.parse(code.meta) : code.meta;
        if (parsedMeta && parsedMeta.designConfig) {
          designConfig = parsedMeta.designConfig;
        }
      } catch (e) {
        console.error("Error parsing meta for QR code:", code.id, e);
      }
    }
    
    return {
      ...code,
      meta: parsedMeta || code.meta,
      designConfig: designConfig, // Make designConfig easily accessible
    };
  });

  return res.status(200).json({ codes: codesWithParsedMeta });
}
