import { prisma } from "../utils/prisma.js";
import { nanoid } from "nanoid";
import client from "../client.js";

export const originalUrl = async (req, res) => {
  try {
    const { sentLink, customAliases } = req.body;

    const id = req.user.id;
    const cacheKey = `user:${id}:urls`;

    if (!sentLink) {
      return res.status(400).json({
        success: false,
        message: "Link is required",
      });
    }

    let original = await prisma.originalUrl.findUnique({
      where: { link: sentLink },
    });

    if (!original) {
      original = await prisma.originalUrl.create({
        data: {
          link: sentLink,
        },
      });
    }

    const existingShortUrl = await prisma.shortenedUrl.findFirst({
      where: {
        userId: id,
        originalUrlId: original.id,
      },
    });

    if (existingShortUrl) {
      return res.status(201).json({
        success: true,
        url: `${process.env.BASE_URL}/${existingShortUrl.unique_code}`,
      });
    }

    const code = customAliases || nanoid(6);

    try {
      const saveShortUrl = await prisma.shortenedUrl.create({
        data: {
          originalUrlId: original.id,
          userId: id,
          unique_code: code,
        },
      });

      await client.del(cacheKey);

      return res.status(201).json({
        success: true,
        url: `${process.env.BASE_URL}/${saveShortUrl.unique_code}`,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Keyword already taken. Try something else",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.stack,
    });
  }
};