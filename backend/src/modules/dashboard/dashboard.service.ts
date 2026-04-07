import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [totals, categoryBreakdown, monthlyTrends, weeklyTrends, recentTransactions] = await Promise.all([
      this.prisma.financialRecord.groupBy({
        by: ["type"],
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      this.prisma.financialRecord.groupBy({
        by: ["category", "type"],
        where: { deletedAt: null },
        _sum: { amount: true },
        orderBy: {
          category: "asc"
        }
      }),
      this.prisma.$queryRaw<
        Array<{ month: string; type: string; total: Prisma.Decimal }>
      >(Prisma.sql`
        SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS month,
               "type"::text AS type,
               SUM(amount) AS total
        FROM "FinancialRecord"
        WHERE "deletedAt" IS NULL
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `),
      this.prisma.$queryRaw<
        Array<{ week: string; type: string; total: Prisma.Decimal }>
      >(Prisma.sql`
        SELECT to_char(date_trunc('week', "date"), 'YYYY-MM-DD') AS week,
               "type"::text AS type,
               SUM(amount) AS total
        FROM "FinancialRecord"
        WHERE "deletedAt" IS NULL
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `),
      this.prisma.financialRecord.findMany({
        where: { deletedAt: null },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { date: "desc" },
        take: 5
      })
    ]);

    const income =
      totals.find((item) => item.type === "INCOME")?._sum.amount?.toNumber() ?? 0;
    const expenses =
      totals.find((item) => item.type === "EXPENSE")?._sum.amount?.toNumber() ?? 0;

    return {
      data: {
        totals: {
          income,
          expenses,
          netBalance: income - expenses
        },
        categoryBreakdown: categoryBreakdown.map((item) => ({
          category: item.category,
          type: item.type,
          total: item._sum.amount?.toNumber() ?? 0
        })),
        monthlyTrends: monthlyTrends.map((item) => ({
          month: item.month,
          type: item.type,
          total: Number(item.total)
        })),
        weeklyTrends: weeklyTrends.map((item) => ({
          week: item.week,
          type: item.type,
          total: Number(item.total)
        })),
        recentTransactions
      }
    };
  }
}
