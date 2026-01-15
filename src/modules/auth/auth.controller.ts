import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshJwtAuthGuard } from '../../common/guards/refresh-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { SkipThrottle } from '../../common/decorators/throttle-skip.decorator';
import { MemberRegisterDto } from 'src/common/dto/member-register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-organization')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and organization' })
  @ApiResponse({
    status: 201,
    description: 'User and organization successfully registered',
    content: {
      'application/json': {
        example: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'levi@life.com',
            firstName: 'Levi',
            lastName: 'Ackerman',
            role: 'admin',
          },
          organization: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Life Fitness',
            email: 'wibble@life.com',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async registerOrganization(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerOrganization(registerDto);
    const refreshToken = result.data.refresh_token;
    if (refreshToken) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
    }

    // Create a new object without refresh_token
    const { refresh_token, ...data } = result.data;
    return {
      ...result,
      data,
    };
  }

  @Post('register-member')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new member' })
  @ApiResponse({
    status: 201,
    description: 'Member successfully registered',
    content: {
      'application/json': {
        example: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'levi@life.com',
            firstName: 'Levi',
            lastName: 'Ackerman',
            role: 'member',
          },
          organization: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Life Fitness',
            email: 'wibble@life.com',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async registerMember(
    @Body() registerDto: MemberRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerMember(registerDto);
    const refreshToken = result.data.refresh_token;
    if (refreshToken) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
    }

    // Create a new object without refresh_token
    const { refresh_token, ...data } = result.data;
    return {
      ...result,
      data,
    };
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    content: {
      'application/json': {
        example: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'john@test.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'admin',
          },
          organization: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Organization',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    const result = await this.authService.login(loginDto, ipAddress, userAgent);
    const refreshToken = result.data.refresh_token;

    // Set refresh token in HTTP-only cookie
    if (refreshToken) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
    }

    // Create a new object without refresh_token
    const { refresh_token, ...data } = result.data;
    return {
      ...result,
      data,
    };
  }

  @Post('refresh')
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async refresh(
    @CurrentUser() user: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies.refreshToken;
    const result = await this.authService.refreshTokens(
      user.id,
      oldRefreshToken,
    );

    const refreshToken = result.data.refresh_token;
    // Set new refresh token in cookie
    if (refreshToken) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    // Create a new object without refresh_token
    const { refresh_token, ...data } = result.data;
    return {
      ...result,
      data,
    };
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @SkipThrottle() // No rate limit for logout
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async logout(
    @CurrentUser() user: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies.refreshToken;
    await this.authService.logout(user.id, refreshToken);

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @ApiBearerAuth('JWT-auth')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user from all devices' })
  @ApiResponse({ status: 200, description: 'User logged out from all devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAllDevices(user.id);

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return { message: 'Logged out from all devices' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          organization: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Example Corp',
            email: 'john@test.com',
            subscription_plan: 'free',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }
}
