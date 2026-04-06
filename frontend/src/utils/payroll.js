export const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export const formatMonthLabel = (monthValue, fallback = "") => {
  if (fallback) {
    return fallback;
  }

  if (!monthValue) {
    return "—";
  }

  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export const getGrossFromStructure = (salaryStructure = {}) =>
  (Number(salaryStructure.basicSalary) || 0) +
  (Number(salaryStructure.hra) || 0) +
  (Number(salaryStructure.allowances) || 0);
