export const RecordTypeEnum = {
  Income: "INCOME",
  Expense: "EXPENSE"
} as const;

export type RecordTypeEnum = (typeof RecordTypeEnum)[keyof typeof RecordTypeEnum];
