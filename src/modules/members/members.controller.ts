import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrganization } from '../../common/decorators/organization.decorator';
// import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Member } from '../../database/entities/member.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

class SearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  search?: string;
}

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all members' })
  @ApiResponse({
    status: 200,
    description: 'Members retrieved successfully',
    type: [Member],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll(
    @CurrentOrganization() organizationId: string,
    @Query() searchDto: SearchDto,
  ) {
    return this.membersService.findAll(organizationId, searchDto.search);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Member retrieved successfully',
    type: Member,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @Get('/me')
  findOne(
    @CurrentUser() user: any,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.membersService.findOne(organizationId, user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get member stats' })
  @ApiResponse({
    status: 200,
    description: 'Member stats retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @Get('stats')
  getStats(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.membersService.getMemberStats(organizationId, user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a member' })
  @ApiResponse({
    status: 200,
    description: 'Member updated successfully',
    type: Member,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @Put()
  update(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: any,
    @Body() UpdateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(organizationId, user.id, UpdateMemberDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a member' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 409, description: 'Member has active subscription' })
  @Delete()
  delete(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.membersService.delete(organizationId, user.id);
  }
}
