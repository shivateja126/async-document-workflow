import { Role } from "src/common/enums/role.enum";
import { UserStatusEnum } from "src/common/enums/status.enum";

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  status: UserStatusEnum;
  name: string;
};
