export const Role = {
  Viewer: "VIEWER",
  Analyst: "ANALYST",
  Admin: "ADMIN"
} as const;

export type Role = (typeof Role)[keyof typeof Role];
