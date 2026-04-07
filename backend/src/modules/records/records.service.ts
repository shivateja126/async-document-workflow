import {
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtPayload } from "src/modules/auth/types/jwt-payload.type";
import { CreateRecordDto } from "./dto/create-record.dto";
import { QueryRecordsDto } from "./dto/query-records.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { RecordsRepository } from "./repositories/records.repository";

@Injectable()
export class RecordsService {
  constructor(private readonly recordsRepository: RecordsRepository) {}

  async create(createRecordDto: CreateRecordDto, user: JwtPayload) {
    const record = await this.recordsRepository.create({
      amount: new Prisma.Decimal(createRecordDto.amount),
      type: createRecordDto.type,
      category: createRecordDto.category,
      date: new Date(createRecordDto.date),
      description: createRecordDto.description,
      createdById: user.sub
    });

    return { data: record };
  }

  async findAll(query: QueryRecordsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.category ? { category: { equals: query.category, mode: "insensitive" } } : {}),
      ...(query.startDate || query.endDate
        ? {
            date: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {})
            }
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { category: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.recordsRepository.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { date: "desc" }
      }),
      this.recordsRepository.count({ where })
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const record = await this.recordsRepository.findById(id);
    if (!record || record.deletedAt) {
      throw new NotFoundException("Record not found");
    }

    return { data: record };
  }

  async update(id: string, updateRecordDto: UpdateRecordDto) {
    await this.ensureExists(id);

    const record = await this.recordsRepository.update(id, {
      amount:
        updateRecordDto.amount !== undefined
          ? new Prisma.Decimal(updateRecordDto.amount)
          : undefined,
      type: updateRecordDto.type,
      category: updateRecordDto.category,
      date: updateRecordDto.date ? new Date(updateRecordDto.date) : undefined,
      description: updateRecordDto.description
    });

    return { data: record };
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const record = await this.recordsRepository.update(id, {
      deletedAt: new Date()
    });

    return { data: record };
  }

  private async ensureExists(id: string) {
    const record = await this.recordsRepository.findById(id);
    if (!record || record.deletedAt) {
      throw new NotFoundException("Record not found");
    }

    return record;
  }
}
