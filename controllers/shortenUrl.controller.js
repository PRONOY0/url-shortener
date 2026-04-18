import { prisma } from "../utils/prisma.js";
import { UAParser } from "ua-parser-js";

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

    const shortenedUrls = await prisma.shortenedUrl.findMany({
      where: {
        userId: id,
      },
    });

    if (!shortenedUrls) {
      return res.status(400).json({
        success: false,
        message: "No URL found",
      });
    }

    let all_shortened_urls = shortenedUrls.map((shortUrl) => {
      return process.env.BASE_URL + `/${shortUrl.unique_code}`;
    });

    return res.status(200).json({
      success: true,
      message: "Got Urls",
      all_shortened_urls,
    });
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

    const { code } = req.params;

    const result = await prisma.shortenedUrl.deleteMany({
      where: {
        id: code,
        userId: id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "URL not found or not yours",
      });
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
    const { code } = req.params;
    console.log(code);
    console.log(typeof code);

    if (!code) {
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
          id: code,
          userId: req.user.id,
        },
        data: {
          unique_code: customAliases,
        },
      });

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
      recentClicks: analytics.slice(0,5),
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
