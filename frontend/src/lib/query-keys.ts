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
