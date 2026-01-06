// src/modules/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if organization email exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { email: registerDto.organizationEmail },
    });

    if (existingOrg) {
      throw new ConflictException('Organization email already exists');
    }

    // Check if user email exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.userEmail },
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
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });

    const savedOrg = await this.organizationRepository.save(organization);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create admin user
    const user = this.userRepository.create({
      organization_id: savedOrg.id,
      email: registerDto.userEmail,
      password_hash: hashedPassword,
      first_name: registerDto.firstName,
      last_name: registerDto.lastName,
      role: 'admin',
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(savedUser);

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
        access_token: token,
      },
    };
  }

  async login(loginDto: LoginDto) {
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

    // Generate token
    const token = this.generateToken(user);

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
        access_token: token,
      },
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

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      organization_id: user.organization_id,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
