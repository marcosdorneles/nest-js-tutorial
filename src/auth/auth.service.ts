import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async singup(dto: AuthDto) {
    try {
      //generate the password hash
      const hash = await argon.hash(dto.password);
      //save the user in the database
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      //return saved user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('User already exists');
        }
      }
    }
  }

  async singin(dto: AuthDto) {
    //find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    //if user doesnt exist throw an error
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    //compare the password hash with the password provided
    const match = await argon.verify(user.hash, dto.password);

    //if the password is incorrect throw an error
    if (!match) {
      throw new ForbiddenException('Invalid credentials');
    }

    //return the user

    return this.singInToken(user.id, user.email);
  }

  async singInToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    //generate a token for the user
    const payload = { sub: userId, email };
    const secret = this.configService.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
