export const UserStatusEnum = {
  Active: "ACTIVE",
  Inactive: "INACTIVE"
} as const;

export type UserStatusEnum = (typeof UserStatusEnum)[keyof typeof UserStatusEnum];
