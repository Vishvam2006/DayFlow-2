import CompanyNetwork from "../models/CompanyNetwork.js";
import { sendError, sendSuccess } from "../utils/httpResponse.js";

export const getCurrentNetworkStatus = async (req, res) => {
  try {
    const currentIP = req.clientIP || "";
    const configuredOffice = await CompanyNetwork.findOne({})
      .sort({ updatedAt: -1 })
      .lean();

    const isCurrentIpAllowed = Boolean(
      currentIP &&
        configuredOffice?.publicIP &&
        String(configuredOffice.publicIP).trim() === String(currentIP).trim()
    );

    return sendSuccess(res, 200, {
      currentIP,
      configuredOffice: configuredOffice
        ? {
            officeName: configuredOffice.officeName,
            publicIP: configuredOffice.publicIP,
            updatedAt: configuredOffice.updatedAt,
          }
        : null,
      isCurrentIpAllowed,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch network status.");
  }
};

export const setCurrentOfficeIp = async (req, res) => {
  try {
    const currentIP = req.clientIP || "";
    const officeName = String(req.body?.officeName || "Head Office").trim();

    if (!currentIP) {
      return sendError(res, 400, "Unable to detect your current public IP.");
    }
    if (officeName.length < 2 || officeName.length > 80) {
      return sendError(res, 400, "officeName must be between 2 and 80 characters.");
    }

    const existing = await CompanyNetwork.findOne({});
    let saved;

    if (existing) {
      existing.officeName = officeName || existing.officeName;
      existing.publicIP = currentIP;
      saved = await existing.save();
    } else {
      saved = await CompanyNetwork.create({
        officeName: officeName || "Head Office",
        publicIP: currentIP,
      });
    }

    return sendSuccess(res, 200, {
      message: "Office IP updated successfully.",
      network: {
        officeName: saved.officeName,
        publicIP: saved.publicIP,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to update office IP.");
  }
};

