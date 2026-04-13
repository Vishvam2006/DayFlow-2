import mongoose from "mongoose";
import net from "net";
import CompanyNetwork from "../models/CompanyNetwork.js";
import { sendError, sendSuccess } from "../utils/httpResponse.js";

const normalizeIp = (value) => String(value || "").trim();

const validateNetworkInput = ({ officeName, publicIP }) => {
  const trimmedOfficeName = String(officeName || "").trim();
  const trimmedPublicIP = normalizeIp(publicIP);

  if (trimmedOfficeName.length < 2 || trimmedOfficeName.length > 80) {
    return {
      error: "officeName must be between 2 and 80 characters.",
    };
  }

  if (!trimmedPublicIP || !net.isIP(trimmedPublicIP)) {
    return {
      error: "publicIP must be a valid public IP address.",
    };
  }

  return {
    value: {
      officeName: trimmedOfficeName,
      publicIP: trimmedPublicIP,
    },
  };
};

const toNetworkResponse = (network) => ({
  _id: network._id,
  officeName: network.officeName,
  publicIP: network.publicIP,
  description: network.description || "",
  isActive: network.isActive,
  lastMatchedAt: network.lastMatchedAt || null,
  createdAt: network.createdAt,
  updatedAt: network.updatedAt,
});

export const listApprovedNetworks = async (req, res) => {
  try {
    const currentIP = req.clientIP || "";
    const networks = await CompanyNetwork.find()
      .sort({ isActive: -1, officeName: 1, createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, {
      currentIP,
      networks: networks.map(toNetworkResponse),
      isCurrentIpAllowed: networks.some(
        (network) => network.isActive && network.publicIP === currentIP
      ),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch approved networks.");
  }
};

export const getCurrentNetworkStatus = async (req, res) => {
  try {
    const currentIP = req.clientIP || "";
    const networks = await CompanyNetwork.find({ isActive: true }).lean();
    const matchedNetwork = networks.find((network) => network.publicIP === currentIP);

    return sendSuccess(res, 200, {
      currentIP,
      networks: networks.map(toNetworkResponse),
      configuredOffice: matchedNetwork ? toNetworkResponse(matchedNetwork) : null,
      isCurrentIpAllowed: Boolean(matchedNetwork),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch network status.");
  }
};

export const createApprovedNetwork = async (req, res) => {
  try {
    const validation = validateNetworkInput(req.body || {});
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    const network = await CompanyNetwork.create({
      ...validation.value,
      description: String(req.body?.description || "").trim().slice(0, 160),
      isActive: req.body?.isActive !== false,
    });

    return sendSuccess(res, 201, {
      message: "Approved network added successfully.",
      network: toNetworkResponse(network),
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "This public IP is already whitelisted.");
    }
    return sendError(res, 500, "Failed to add approved network.");
  }
};

export const addCurrentNetworkIp = async (req, res) => {
  try {
    const currentIP = req.clientIP || "";
    if (!currentIP) {
      return sendError(res, 400, "Unable to detect your current public IP.");
    }

    const validation = validateNetworkInput({
      ...req.body,
      publicIP: currentIP,
      officeName: req.body?.officeName || "Current Network",
    });
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    const existing = await CompanyNetwork.findOne({ publicIP: currentIP });
    if (existing) {
      existing.officeName = validation.value.officeName;
      existing.description = String(req.body?.description || existing.description || "")
        .trim()
        .slice(0, 160);
      existing.isActive = true;
      await existing.save();

      return sendSuccess(res, 200, {
        message: "Current network IP is already whitelisted and active.",
        network: toNetworkResponse(existing),
      });
    }

    const network = await CompanyNetwork.create({
      ...validation.value,
      description: String(req.body?.description || "").trim().slice(0, 160),
      isActive: true,
    });

    return sendSuccess(res, 201, {
      message: "Current network IP added successfully.",
      network: toNetworkResponse(network),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to add current network IP.");
  }
};

export const updateApprovedNetwork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid network ID.");
    }

    const network = await CompanyNetwork.findById(id);
    if (!network) {
      return sendError(res, 404, "Approved network not found.");
    }

    const nextOfficeName =
      req.body?.officeName !== undefined ? req.body.officeName : network.officeName;
    const nextPublicIP =
      req.body?.publicIP !== undefined ? req.body.publicIP : network.publicIP;

    const validation = validateNetworkInput({
      officeName: nextOfficeName,
      publicIP: nextPublicIP,
    });
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    network.officeName = validation.value.officeName;
    network.publicIP = validation.value.publicIP;
    if (req.body?.description !== undefined) {
      network.description = String(req.body.description || "").trim().slice(0, 160);
    }
    if (req.body?.isActive !== undefined) {
      network.isActive = Boolean(req.body.isActive);
    }

    await network.save();

    return sendSuccess(res, 200, {
      message: "Approved network updated successfully.",
      network: toNetworkResponse(network),
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "This public IP is already whitelisted.");
    }
    return sendError(res, 500, "Failed to update approved network.");
  }
};

export const deleteApprovedNetwork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid network ID.");
    }

    const deleted = await CompanyNetwork.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 404, "Approved network not found.");
    }

    return sendSuccess(res, 200, {
      message: "Approved network removed successfully.",
    });
  } catch (error) {
    return sendError(res, 500, "Failed to remove approved network.");
  }
};

export const setCurrentOfficeIp = addCurrentNetworkIp;
