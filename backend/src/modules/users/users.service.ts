import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import * as argon2 from "argon2";
import { Role } from "src/common/enums/role.enum";
import { UserStatusEnum } from "src/common/enums/status.enum";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersRepository } from "./repositories/users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException("A user with that email already exists");
    }

    const passwordHash = await argon2.hash(createUserDto.password);
    const user = await this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash,
      role: createUserDto.role,
      status: createUserDto.status ?? UserStatusEnum.Active
    });

    return { data: this.sanitizeUser(user) };
  }

  async findAll() {
    const users = await this.usersRepository.findMany();
    return {
      data: users.map((user) => this.sanitizeUser(user))
    };
  }

  async findOne(id: string) {
    const user = await this.findByIdOrThrow(id);
    return { data: this.sanitizeUser(user) };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findByIdOrThrow(id);

    if (updateUserDto.email) {
      const byEmail = await this.usersRepository.findByEmail(updateUserDto.email);
      if (byEmail && byEmail.id !== id) {
        throw new ConflictException("That email is already in use");
      }
    }

    const data: Record<string, unknown> = {
      name: updateUserDto.name,
      email: updateUserDto.email,
      role: updateUserDto.role,
      status: updateUserDto.status
    };

    if (updateUserDto.password) {
      data.passwordHash = await argon2.hash(updateUserDto.password);
    }

    const user = await this.usersRepository.update(id, data);
    return { data: this.sanitizeUser(user) };
  }

  async updateStatus(id: string, statusDto: UpdateUserStatusDto) {
    await this.findByIdOrThrow(id);

    const user = await this.usersRepository.update(id, {
      status: statusDto.status
    });

    return { data: this.sanitizeUser(user) };
  }

  async assignRole(id: string, role: Role) {
    await this.findByIdOrThrow(id);

    const user = await this.usersRepository.update(id, { role });
    return { data: this.sanitizeUser(user) };
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException("You cannot delete your own account");
    }

    const user = await this.usersRepository.findByIdWithRecordCount(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user._count.financialRecords > 0) {
      throw new ConflictException(
        "Users with financial records cannot be deleted. Deactivate the account instead."
      );
    }

    await this.usersRepository.delete(id);

    return {
      data: {
        id,
        deleted: true
      }
    };
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  private async findByIdOrThrow(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatusEnum;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
