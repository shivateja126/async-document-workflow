import { Module } from "@nestjs/common";
import { RecordsController } from "./records.controller";
import { RecordsService } from "./records.service";
import { RecordsRepository } from "./repositories/records.repository";

@Module({
  controllers: [RecordsController],
  providers: [RecordsService, RecordsRepository],
  exports: [RecordsService]
})
export class RecordsModule {}
