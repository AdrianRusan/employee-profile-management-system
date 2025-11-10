import { prisma } from '../../../server/db';

/**
 * Seeds the database with test data
 * Should be run before E2E tests
 */
export async function seedTestData() {
  // Clean existing data
  await prisma.feedback.deleteMany();
  await prisma.absenceRequest.deleteMany();
  await prisma.user.deleteMany();

  // Create test users (using email-only authentication)
  const manager = await prisma.user.create({
    data: {
      email: 'emily@example.com',
      name: 'Emily Manager',
      role: 'MANAGER',
      department: 'Engineering',
      title: 'Engineering Manager',
      bio: 'Passionate about building great teams',
      salary: '150000',
      performanceRating: 5,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'david@example.com',
      name: 'David Developer',
      role: 'EMPLOYEE',
      department: 'Engineering',
      title: 'Senior Software Engineer',
      bio: 'Full-stack developer',
      salary: '100000',
      performanceRating: 4,
    },
  });

  const coworker = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      name: 'Sarah Designer',
      role: 'COWORKER',
      department: 'Design',
      title: 'Senior UX Designer',
      bio: 'Creating delightful user experiences',
      salary: '95000',
      performanceRating: 5,
    },
  });

  return { manager, employee, coworker };
}

/**
 * Cleans up test data
 * Should be run after E2E tests
 */
export async function cleanupTestData() {
  await prisma.feedback.deleteMany();
  await prisma.absenceRequest.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Gets a user by email
 */
export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}
