export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (page: number, limit: number) =>
    [...userKeys.lists(), { page, limit }] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

export const menuKeys = {
  all: ["menu"] as const,
  list: () => [...menuKeys.all, "list"] as const,
  detail: (id: string) => [...menuKeys.all, "detail", id] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (page: number, limit: number) =>
    [...orderKeys.lists(), { page, limit }] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  verify: (reference: string) =>
    [...paymentKeys.all, "verify", reference] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) => [...paymentKeys.lists(), filters] as const,
  summary: () => [...paymentKeys.all, "summary"] as const,
};

export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  list: (filters: {
    page: number;
    limit: number;
    status?: string;
    paymentStatus?: string;
    fulfillmentType?: string;
  }) => [...adminOrderKeys.lists(), filters] as const,
};

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (days: number) =>
    [...analyticsKeys.all, "overview", days] as const,
};

export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  list: (filters: { page: number; limit: number; status?: string }) =>
    [...contactKeys.lists(), filters] as const,
};
