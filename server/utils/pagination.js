const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export function parsePagination(query = {}, options = {}) {
  const defaultPage = Number.parseInt(options.defaultPage ?? DEFAULT_PAGE, 10);
  const defaultLimit = Number.parseInt(options.defaultLimit ?? DEFAULT_LIMIT, 10);
  const maxLimit = Number.parseInt(options.maxLimit ?? 100, 10);

  const page = Math.max(
    1,
    Number.parseInt(query.page ?? `${defaultPage}`, 10) || defaultPage,
  );
  const limit = Math.min(
    Math.max(1, Number.parseInt(query.limit ?? `${defaultLimit}`, 10) || defaultLimit),
    maxLimit,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginationMeta({ page, limit, totalItems }) {
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / limit));

  return {
    currentPage: page,
    totalPages,
    totalItems: safeTotalItems,
    limit,
  };
}

export function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
