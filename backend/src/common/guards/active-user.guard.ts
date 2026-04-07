import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { JwtPayload } from "src/modules/auth/types/jwt-payload.type";
import { UserStatusEnum } from "../enums/status.enum";

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (user.status === UserStatusEnum.Inactive) {
      throw new ForbiddenException("This user account is inactive");
    }

    return true;
  }
}
