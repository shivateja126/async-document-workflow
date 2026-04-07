import { Test } from "@nestjs/testing";
import { Role } from "src/common/enums/role.enum";
import { UserStatusEnum } from "src/common/enums/status.enum";
import { UsersRepository } from "src/modules/users/repositories/users.repository";
import { UsersService } from "src/modules/users/users.service";

describe("UsersService", () => {
  const repository = {
    findByEmail: jest.fn(),
    create: jest.fn()
  };

  let service: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: repository
        }
      ]
    }).compile();

    service = moduleRef.get(UsersService);
    jest.clearAllMocks();
  });

  it("creates a user when the email is available", async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: "usr_1",
      name: "Test User",
      email: "test@example.com",
      role: Role.Admin,
      status: UserStatusEnum.Active,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await service.create({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      role: Role.Admin
    });

    expect(result.data.email).toBe("test@example.com");
    expect(repository.create).toHaveBeenCalled();
  });
});
