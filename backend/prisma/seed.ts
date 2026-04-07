import { PrismaClient, RecordType, UserRole, UserStatus } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("Password123!");

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@finance.local" },
      update: {
        name: "Aryan Admin",
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      },
      create: {
        name: "Aryan Admin",
        email: "admin@finance.local",
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "analyst@finance.local" },
      update: {
        name: "Ahaan Analyst",
        passwordHash,
        role: UserRole.ANALYST,
        status: UserStatus.ACTIVE
      },
      create: {
        name: "Ahaan Analyst",
        email: "analyst@finance.local",
        passwordHash,
        role: UserRole.ANALYST,
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "viewer@finance.local" },
      update: {
        name: "Varun Viewer",
        passwordHash,
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE
      },
      create: {
        name: "Varun Viewer",
        email: "viewer@finance.local",
        passwordHash,
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE
      }
    })
  ]);

  await prisma.financialRecord.deleteMany();

  const admin = users[0];
  const today = new Date();

  const samples = [
    { amount: 18000, type: RecordType.INCOME, category: "Consulting", daysAgo: 45, description: "Quarterly consulting retainer" },
    { amount: 9400, type: RecordType.INCOME, category: "Subscriptions", daysAgo: 30, description: "Annual billing uplift" },
    { amount: 2500, type: RecordType.EXPENSE, category: "Payroll", daysAgo: 27, description: "Operations contractor payout" },
    { amount: 1200, type: RecordType.EXPENSE, category: "Infrastructure", daysAgo: 20, description: "Cloud hosting and observability" },
    { amount: 7200, type: RecordType.INCOME, category: "Services", daysAgo: 14, description: "Implementation milestone payment" },
    { amount: 860, type: RecordType.EXPENSE, category: "Marketing", daysAgo: 12, description: "Performance ad spend" },
    { amount: 3100, type: RecordType.EXPENSE, category: "Travel", daysAgo: 7, description: "Client visit and lodging" },
    { amount: 15600, type: RecordType.INCOME, category: "Enterprise", daysAgo: 4, description: "Platform license upgrade" },
    { amount: 540, type: RecordType.EXPENSE, category: "Software", daysAgo: 2, description: "Team tools and seats" }
  ];

  for (const sample of samples) {
    await prisma.financialRecord.create({
      data: {
        amount: sample.amount,
        type: sample.type,
        category: sample.category,
        description: sample.description,
        date: new Date(today.getTime() - sample.daysAgo * 24 * 60 * 60 * 1000),
        createdById: admin.id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
