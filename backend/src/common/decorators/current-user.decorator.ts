import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "src/modules/auth/types/jwt-payload.type";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as JwtPayload;
});
