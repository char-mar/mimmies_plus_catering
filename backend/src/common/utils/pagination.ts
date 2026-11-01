import type {
  PaginationOptions,
  PaginationMeta,
} from "../types/pagination.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Calculate page, limit and database offset.
export function getPagination(
  page?: number,
  limit?: number,
): PaginationOptions {
  const validPage =
    Number.isFinite(page) && page! > 0 ? Math.floor(page!) : DEFAULT_PAGE;

  const validLimit =
    Number.isFinite(limit) && limit! > 0
      ? Math.min(Math.floor(limit!), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  };
}

// Build pagination information for the API response.
export function buildPagination(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
