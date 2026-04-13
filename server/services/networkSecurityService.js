import CompanyNetwork from "../models/CompanyNetwork.js";

export async function getMatchedCompanyNetwork(ip) {
  if (!ip) return null;
  const network = await CompanyNetwork.findOne({ publicIP: ip, isActive: true })
    .select("officeName publicIP description isActive")
    .lean();

  if (network) {
    CompanyNetwork.updateOne(
      { _id: network._id },
      { $set: { lastMatchedAt: new Date() } }
    ).catch(() => {});
  }

  return network;
}

export async function verifyIpAgainstCompanyNetwork(ip) {
  if (!ip) {
    return {
      authorized: false,
      reason: "ip_unavailable",
      network: null,
    };
  }

  const network = await getMatchedCompanyNetwork(ip);
  if (!network) {
    return {
      authorized: false,
      reason: "ip_not_allowed",
      network: null,
    };
  }

  return {
    authorized: true,
    reason: "ok",
    network,
  };
}

