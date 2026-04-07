import { Injectable } from "@nestjs/common";
import { FinancialRecord, Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class RecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.FinancialRecordUncheckedCreateInput): Promise<FinancialRecord> {
    return this.prisma.financialRecord.create({ data });
  }

  findMany(args: Prisma.FinancialRecordFindManyArgs) {
    return this.prisma.financialRecord.findMany(args);
  }

  count(args: Prisma.FinancialRecordCountArgs) {
    return this.prisma.financialRecord.count(args);
  }

  findById(id: string) {
    return this.prisma.financialRecord.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.FinancialRecordUpdateInput) {
    return this.prisma.financialRecord.update({ where: { id }, data });
  }
}
