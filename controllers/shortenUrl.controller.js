import { prisma } from "../utils/prisma.js";
import { UAParser } from "ua-parser-js";
import client from "../client.js";

export const redirectingToOriginalUrl = async (req, res) => {
  const parser = new UAParser(req.headers["user-agent"]);

  const DeviceType = parser.getDevice().type || "desktop";
  const os = parser.getOS().name || "unknown";
  const browser = parser.getBrowser() || "unknown";
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "No code is provided",
      });
    }

    let url;

    try {
      url = await prisma.shortenedUrl.update({
        where: { unique_code: code },
        data: {
          clicks: {
            increment: 1,
          },
        },
        include: {
          originalUrl: true,
        },
      });

      await prisma.analytics.create({
        data: {
          shortenedUrlId: url.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          device: DeviceType,
        },
      });

      await client.del(`analytics:url:${url.id}`);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.redirect(url.originalUrl.link);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.stack,
    });
  }
};

export const getMyUrls = async (req, res) => {
  try {
    const id = req.user.id;

    let { page = 1, limit = 10, orderBy, search } = req.query;

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(50, parseInt(limit) || 10));

    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page is lesser than 1. Not valid",
      });
    }

    const skip = (page - 1) * limit;

    const cacheKey = `user:${id}:urls:page:1:order:${orderBy || "latest"}:search:${search || "none"}`;

    if (page === 1) {
      const cachedData = await client.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const shortenedUrls = await prisma.shortenedUrl.findMany({
      where: {
        userId: id,
        ...(search && {
          unique_code: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: orderBy === "latest" ? "desc" : "asc",
      },
    });

    const totalCount = await prisma.shortenedUrl.count({
      where: {
        userId: id,
        ...(search && {
          unique_code: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
    });

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          totalCount: 0,
          page: 1,
          limit,
          totalPages: 0,
        },
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    if (page > totalPages) {
      return res.status(400).json({
        success: false,
        message: "Page exceeds total pages",
      });
    }

    if (shortenedUrls.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    const formattedDataUrls = shortenedUrls.map((url) => ({
      id: url.id,
      shortUrl: `${process.env.BASE_URL}/${url.unique_code}`,
      createdAt: url.createdAt,
    }));

    const responseData = {
      success: true,
      message: "Got Urls",
      data: formattedDataUrls,
      pagination: {
        totalCount: totalCount,
        page,
        limit,
        totalPages: totalPages,
      },
    };

    if (page === 1) {
      await client.setex(cacheKey, 120, JSON.stringify(responseData));
      await client.sadd(`user:${id}:urls:keys`, cacheKey);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.stack,
    });
  }
};

export const deleteMyUrls = async (req, res) => {
  try {
    const id = req.user.id;

    const cacheKey = await client.smembers(`user:${id}:urls:keys`);

    const { shortenedUrlId } = req.params;

    const result = await prisma.shortenedUrl.deleteMany({
      where: {
        id: shortenedUrlId,
        userId: id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "URL not found or not yours",
      });
    }

    if (cacheKey.length) {
      await client.del(cacheKey);
      await client.del(`user:${id}:urls:keys`);
    }

    return res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMyShortUrlCode = async (req, res) => {
  try {
    const { shortenedUrlId } = req.params;

    const id = req.user.id;

    const cacheKey = await client.smembers(`user:${id}:urls:keys`);

    if (!shortenedUrlId) {
      return res.status(400).json({
        success: false,
        message: "Shortened Url Id is required",
      });
    }

    const { customAliases } = req.body;

    if (!customAliases) {
      return res.status(400).json({
        success: false,
        message: "Keyword is required",
      });
    }

    const checkCustomAliasesExist = await prisma.shortenedUrl.findUnique({
      where: {
        unique_code: customAliases,
      },
    });

    if (!checkCustomAliasesExist) {
      await prisma.shortenedUrl.update({
        where: {
          id: shortenedUrlId,
          userId: req.user.id,
        },
        data: {
          unique_code: customAliases,
        },
      });

      if (cacheKey.length) {
        await client.del(cacheKey);
        await client.del(`user:${id}:urls:keys`);
      }

      return res.status(200).json({
        success: true,
        message: "Updated successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "This keyword is not available. Try something else",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const showAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `analytics:url:${id}`;

    const cachedData = await client.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const analytics = await prisma.analytics.findMany({
      where: { shortenedUrlId: id },
      select: {
        device: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalClicks = analytics.length;

    let mobileCount = 0;
    let desktopCount = 0;

    for (const a of analytics) {
      if (a.device === "mobile") {
        mobileCount++;
      } else if (a.device === "desktop") {
        desktopCount++;
      }
    }

    const mobilePercentage =
      totalClicks === 0
        ? "0%"
        : `${((mobileCount / totalClicks) * 100).toFixed(2)}%`;

    const desktopPercentage =
      totalClicks === 0
        ? "0%"
        : `${((desktopCount / totalClicks) * 100).toFixed(2)}%`;

    const data = {
      totalClicks: analytics.length,
      deviceStats: {
        mobile_percentage: mobilePercentage,
        desktop_percentage: desktopPercentage,
      },
      recentClicks: analytics.slice(0, 5),
    };

    const responseData = {
      success: true,
      data,
    };

    await client.setex(cacheKey, 3600, JSON.stringify(responseData));

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
