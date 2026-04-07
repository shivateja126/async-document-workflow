import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { ActiveUserGuard } from "src/common/guards/active-user.guard";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./types/jwt-payload.type";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Authenticate and receive a JWT" })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard)
  @ApiOperation({ summary: "Get the authenticated user profile" })
  me(@CurrentUser() user: JwtPayload) {
    return {
      data: user
    };
  }
}
