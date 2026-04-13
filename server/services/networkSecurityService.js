import CompanyNetwork from "../models/CompanyNetwork.js";

export async function getMatchedCompanyNetwork(ip) {
  if (!ip) return null;
  return CompanyNetwork.findOne({ publicIP: ip }).select("officeName publicIP").lean();
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

