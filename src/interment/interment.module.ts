import { Module } from '@nestjs/common';
import { IntermentService } from './interment.service';
import { IntermentController } from './interment.controller';

@Module({
  controllers: [IntermentController],
  providers: [IntermentService],
})
export class IntermentModule {}
