import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { UserStatusEnum } from "src/common/enums/status.enum";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, payload.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatusEnum.Inactive) {
      throw new ForbiddenException("Your account is inactive");
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: user.name
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return {
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      }
    };
  }
}
