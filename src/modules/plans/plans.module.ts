import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { MemberPlan } from '../../database/entities/member-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberPlan])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
