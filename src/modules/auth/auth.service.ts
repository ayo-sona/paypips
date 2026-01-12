import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';

interface AuthResponse {
  message: string;
  data: {
    organization: {
      id: string;
      name: string;
      email: string;
    };
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
    access_token: string;
    refresh_token?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if organization email exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { email: registerDto.organizationEmail },
    });

    if (existingOrg) {
      throw new ConflictException('Organization email already exists');
    }

    // Check if user email exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User email already exists');
    }

    // Create organization
    const organization = this.organizationRepository.create({
      name: registerDto.organizationName,
      email: registerDto.organizationEmail,
      subscription_plan: 'free',
      subscription_status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const savedOrg = await this.organizationRepository.save(organization);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create admin user
    const user = this.userRepository.create({
      organization_id: savedOrg.id,
      email: registerDto.email,
      password_hash: hashedPassword,
      first_name: registerDto.firstName,
      last_name: registerDto.lastName,
      role: 'admin',
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      savedUser,
      null,
      null,
    );

    // Send welcome email
    await this.notificationsService.sendWelcomeEmail({
      email: savedUser.email,
      userName: `${savedUser.first_name} ${savedUser.last_name}`,
      organizationName: savedOrg.name,
    });

    return {
      message: 'Organization and admin user created successfully',
      data: {
        organization: {
          id: savedOrg.id,
          name: savedOrg.name,
          email: savedOrg.email,
        },
        user: {
          id: savedUser.id,
          email: savedUser.email,
          first_name: savedUser.first_name,
          last_name: savedUser.last_name,
          role: savedUser.role,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          organization_id: user.organization_id,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async refreshTokens(userId: string, oldRefreshToken: string) {
    // Find and revoke old token
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken, is_revoked: false },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    storedToken.is_revoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      storedToken.user,
      storedToken.ip_address,
      storedToken.user_agent,
    );

    return {
      message: 'Tokens refreshed successfully',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async logout(userId: string, refreshToken: string) {
    // Revoke refresh token
    await this.refreshTokenRepository.update(
      { token: refreshToken, user_id: userId },
      { is_revoked: true },
    );

    return {
      message: 'Logged out successfully',
    };
  }

  async logoutAllDevices(userId: string) {
    // Revoke all refresh tokens for user
    await this.refreshTokenRepository.update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true },
    );

    return {
      message: 'Logged out from all devices',
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        email: user.organization.email,
        subscription_plan: user.organization.subscription_plan,
      },
    };
  }

  // Clean up expired tokens (run by cron job)
  async cleanupExpiredTokens() {
    const now = new Date();
    const deleted = await this.refreshTokenRepository.delete({
      expires_at: LessThan(now),
    });

    return deleted.affected || 0;
  }

  async checkSuspiciousIds(userId: string) {
    // Check for multiple IPs
    const tokens = await this.refreshTokenRepository.find({
      where: { user_id: userId, is_revoked: false },
    });

    const uniqueIPs = new Set(tokens.map((t) => t.ip_address));

    if (uniqueIPs.size > 5) {
      // Potential account compromise
      await this.logoutAllDevices(userId);
      // Send security alert email
    }
  }

  private async generateTokens(
    user: User,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      organization_id: user.organization_id,
      role: user.role,
    };

    // Generate access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: '15m',
    });

    // Generate refresh token (1 day)
    const refreshTokenString = crypto.randomBytes(64).toString('hex');
    const refreshToken = this.jwtService.sign(
      { ...payload, token: refreshTokenString },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: '1d',
      },
    );

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day

    type TokenData = Pick<
      RefreshToken,
      'user_id' | 'token' | 'expires_at' | 'ip_address' | 'user_agent'
    >;

    const tokenInstance: TokenData = {
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    };

    const tokenEntity = this.refreshTokenRepository.create(tokenInstance);

    await this.refreshTokenRepository.save(tokenEntity);

    return { accessToken, refreshToken };
  }
}
