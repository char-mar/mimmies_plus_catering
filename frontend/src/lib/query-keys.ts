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
};
