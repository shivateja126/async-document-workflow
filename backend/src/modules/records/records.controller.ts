import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/role.enum";
import { ActiveUserGuard } from "src/common/guards/active-user.guard";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { JwtPayload } from "../auth/types/jwt-payload.type";
import { CreateRecordDto } from "./dto/create-record.dto";
import { QueryRecordsDto } from "./dto/query-records.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { RecordsService } from "./records.service";

@ApiTags("Records")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Controller("records")
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @Roles(Role.Analyst, Role.Admin)
  @ApiOperation({ summary: "List financial records with filters and pagination" })
  findAll(@Query() query: QueryRecordsDto) {
    return this.recordsService.findAll(query);
  }

  @Get(":id")
  @Roles(Role.Analyst, Role.Admin)
  @ApiOperation({ summary: "Get a single financial record" })
  findOne(@Param("id") id: string) {
    return this.recordsService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Create a financial record" })
  create(@Body() dto: CreateRecordDto, @CurrentUser() user: JwtPayload) {
    return this.recordsService.create(dto, user);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update a financial record" })
  update(@Param("id") id: string, @Body() dto: UpdateRecordDto) {
    return this.recordsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Soft delete a financial record" })
  remove(@Param("id") id: string) {
    return this.recordsService.remove(id);
  }
}
