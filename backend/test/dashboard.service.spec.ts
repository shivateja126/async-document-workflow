import { DashboardService } from "src/modules/dashboard/dashboard.service";

describe("DashboardService", () => {
  it("maps totals into income, expenses and net balance", async () => {
    const prisma = {
      financialRecord: {
        groupBy: jest
          .fn()
          .mockResolvedValueOnce([
            { type: "INCOME", _sum: { amount: { toNumber: () => 1000 } } },
            { type: "EXPENSE", _sum: { amount: { toNumber: () => 400 } } }
          ])
          .mockResolvedValueOnce([]),
        findMany: jest.fn().mockResolvedValue([])
      },
      $queryRaw: jest.fn().mockResolvedValue([])
    };

    const service = new DashboardService(prisma as any);
    const result = await service.getOverview();

    expect(result.data.totals.income).toBe(1000);
    expect(result.data.totals.expenses).toBe(400);
    expect(result.data.totals.netBalance).toBe(600);
  });
});
