import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';
import { MemberRegisterDto } from 'src/common/dto/member-register.dto';
import { Member } from 'src/database/entities';
import { OrganizationUser } from 'src/database/entities/organization-user.entity';
import { OrgRole } from 'src/database/entities/organization-user.entity';
import { OrganizationInvite } from 'src/database/entities/organization-invite.entity';
import { StaffRegisterDto } from 'src/common/dto/staff-register.dto';

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
      phone: string;
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

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,

    @InjectRepository(OrganizationInvite)
    private organizationInviteRepository: Repository<OrganizationInvite>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async registerOrganization(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if organization email exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { email: registerDto.organizationEmail },
    });

    if (existingOrg) {
      throw new ConflictException('Organization email already exists');
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(registerDto.organizationName);

    // Create organization
    const organization = this.organizationRepository.create({
      name: registerDto.organizationName,
      email: registerDto.organizationEmail,
      slug,
      status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const savedOrg = await this.organizationRepository.save(organization);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Check if user email exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    // Create admin user
    let user: User;
    if (!existingUser) {
      const createdUser = this.userRepository.create({
        email: registerDto.email,
        password_hash: hashedPassword,
        first_name: registerDto.firstName,
        last_name: registerDto.lastName,
        phone: registerDto.phone,
        status: 'active',
      });
      user = await this.userRepository.save(createdUser);
    } else {
      user = existingUser;
    }

    // Create organization_user with OWNER role
    const orgUser = this.organizationUserRepository.create({
      user_id: user.id,
      organization_id: savedOrg.id,
      role: OrgRole.ADMIN,
      status: 'active',
    });

    const savedOrgUser = await this.organizationUserRepository.save(orgUser);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      null,
      null,
    );

    // Send welcome email
    await this.notificationsService.sendWelcomeEmail({
      email: user.email,
      userName: `${user.first_name} ${user.last_name}`,
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
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async registerMember(memberRegisterDto: MemberRegisterDto) {
    // Find organization by slug
    const organization = await this.organizationRepository.findOne({
      where: { slug: memberRegisterDto.organizationSlug.toLowerCase() },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user email exists
    let user = await this.userRepository.findOne({
      where: { email: memberRegisterDto.email },
      relations: ['organization_users', 'organization_users.organization'],
    });

    if (user) {
      // Check if already member of this org
      const existingOrgUser = await this.organizationUserRepository.findOne({
        where: {
          user_id: user.id,
          organization_id: organization.id,
        },
      });

      if (existingOrgUser) {
        throw new ConflictException('Already a member of this organization');
      }
    } else {
      // Create new user
      const password_hash = await bcrypt.hash(memberRegisterDto.password, 10);

      user = this.userRepository.create({
        email: memberRegisterDto.email,
        password_hash,
        first_name: memberRegisterDto.firstName,
        last_name: memberRegisterDto.lastName,
        phone: memberRegisterDto.phone,
        status: 'active',
      });

      user = await this.userRepository.save(user);
    }

    // Create organization_user with MEMBER role
    const orgUser = this.organizationUserRepository.create({
      user_id: user.id,
      organization_id: organization.id,
      role: OrgRole.MEMBER,
      status: 'active',
    });

    const savedOrgUser = await this.organizationUserRepository.save(orgUser);

    const member = this.memberRepository.create({
      organization_user_id: savedOrgUser.id,
      date_of_birth: memberRegisterDto.dateOfBirth,
      address: memberRegisterDto.address,
      emergency_contact_name: memberRegisterDto.emergencyContactName,
      emergency_contact_phone: memberRegisterDto.emergencyContactPhone,
      medical_notes: memberRegisterDto.medicalNotes,
      check_in_count: memberRegisterDto.checkInCount,
      metadata: {},
    });

    await this.memberRepository.save(member);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      null,
      null,
    );

    // Send welcome email
    await this.notificationsService.sendWelcomeEmail({
      email: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      organizationName: organization.name,
    });

    return {
      message: 'Registration successful',
      data: {
        customer: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async registerStaff(staffRegisterDto: StaffRegisterDto, token: string) {
    // Find organization by token
    const invitation = await this.organizationInviteRepository.findOne({
      where: { token },
      relations: ['organization'],
    });
    console.log('invitation', invitation);

    if (!invitation?.organization.id) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user email exists
    let user = await this.userRepository.findOne({
      where: { email: staffRegisterDto.email },
      relations: ['organization_users', 'organization_users.organization'],
    });

    if (user) {
      // Check if already part of this org
      const existingOrgUser = await this.organizationUserRepository.findOne({
        where: {
          user_id: user.id,
          organization_id: invitation.organization.id,
        },
      });

      if (existingOrgUser) {
        throw new ConflictException('Already a part of this organization');
      }
    } else {
      // Create new user
      const password_hash = await bcrypt.hash(staffRegisterDto.password, 10);

      user = this.userRepository.create({
        email: staffRegisterDto.email,
        password_hash,
        first_name: staffRegisterDto.firstName,
        last_name: staffRegisterDto.lastName,
        phone: staffRegisterDto.phone,
        status: 'active',
      });

      user = await this.userRepository.save(user);
    }

    // Create organization_user with STAFF role
    const orgUser = this.organizationUserRepository.create({
      user_id: user.id,
      organization_id: invitation.organization.id,
      role: OrgRole.STAFF,
      status: 'active',
    });

    await this.organizationUserRepository.save(orgUser);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      null,
      null,
    );

    // Send welcome email
    await this.notificationsService.sendWelcomeEmail({
      email: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      organizationName: invitation.organization.name,
    });

    return {
      message: 'Registration successful',
      data: {
        customer: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
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
      relations: ['organization_users', 'organization_users.organization'],
    });
    // console.log('USER', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
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

    // Update last login
    user.last_login_at = new Date();
    await this.userRepository.save(user);

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
          phone: user.phone,
          status: user.status,
        },
        organizations: user.organization_users.map((orgUser) => ({
          id: orgUser.organization.id,
          name: orgUser.organization.name,
          email: orgUser.organization.email,
          role: orgUser.role,
          status: orgUser.status,
        })),
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async refreshTokens(userId: string, oldRefreshToken: string) {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken, is_revoked: false },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user and their primary org_user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const orgUser = await this.organizationUserRepository.findOne({
      where: { user_id: userId },
      relations: ['organization'],
    });

    if (!orgUser) {
      throw new UnauthorizedException('No organization access');
    }

    // Revoke old token
    storedToken.is_revoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user,
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
    // Get user organization with their roles
    const orgUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization_users', 'organization_users.organization'],
    });

    if (!orgUser) {
      throw new UnauthorizedException('No organization user found');
    }

    return {
      id: orgUser.id,
      email: orgUser.email,
      first_name: orgUser.first_name,
      last_name: orgUser.last_name,
      phone: orgUser.phone,
      organizations: orgUser.organization_users.map((orgUser) => ({
        id: orgUser.organization.id,
        name: orgUser.organization.name,
        email: orgUser.organization.email,
        role: orgUser.role,
      })),
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

  async checkSuspiciousActivity(userId: string) {
    // Check for multiple IPs
    const tokens = await this.refreshTokenRepository.find({
      where: { user_id: userId, is_revoked: false },
      take: 100,
    });

    const uniqueIPs = new Set(tokens.map((t) => t.ip_address).filter(Boolean));

    if (uniqueIPs.size > 5) {
      // Potential account compromise - send alert
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        // TODO: Send security alert email
        console.warn(
          `Suspicious activity detected for user ${user.email}: ${uniqueIPs.size} unique IPs`,
        );
      }

      // Optional auto logout all devices
      // await this.logoutAllDevices(userId);
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let counter = 2;
    let finalSlug = slug;

    while (
      await this.organizationRepository.findOne({ where: { slug: finalSlug } })
    ) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  async generateTokens(
    user: User,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
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
