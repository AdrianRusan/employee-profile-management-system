import { prisma } from '../server/db';
import bcrypt from 'bcrypt';

// Demo password for all seed users
const DEMO_PASSWORD = 'Password123!';
const SALT_ROUNDS = 12;

async function main() {
  console.log('Starting database seed...');

  // Hash the demo password
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  console.log(`✓ Generated password hash for demo users (password: ${DEMO_PASSWORD})`);

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme',
      logo: null,
      domain: 'acme.com',
      settings: {},
    },
  });
  console.log(`✓ Created organization: ${organization.name} (${organization.slug})`);

  // Create demo users with organizationId, passwordHash, and emailVerified
  const users = [
    {
      email: 'emily@example.com',
      name: 'Emily Manager',
      role: 'MANAGER' as const,
      department: 'Engineering',
      title: 'Engineering Manager',
      bio: 'Leading the engineering team with passion for innovation and team development.',
      salary: 120000,
      performanceRating: 5,
      organizationId: organization.id,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE' as const,
    },
    {
      email: 'david@example.com',
      name: 'David Developer',
      role: 'EMPLOYEE' as const,
      department: 'Engineering',
      title: 'Senior Software Engineer',
      bio: 'Full-stack developer focused on building scalable web applications.',
      salary: 95000,
      performanceRating: 4,
      organizationId: organization.id,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE' as const,
    },
    {
      email: 'sarah@example.com',
      name: 'Sarah Designer',
      role: 'COWORKER' as const,
      department: 'Design',
      title: 'UX/UI Designer',
      bio: 'Creating beautiful and intuitive user experiences.',
      salary: 85000,
      performanceRating: 5,
      organizationId: organization.id,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE' as const,
    },
    {
      email: 'john@example.com',
      name: 'John Product Manager',
      role: 'EMPLOYEE' as const,
      department: 'Product',
      title: 'Product Manager',
      bio: 'Driving product strategy and roadmap.',
      salary: 110000,
      performanceRating: 4,
      organizationId: organization.id,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE' as const,
    },
    {
      email: 'alice@example.com',
      name: 'Alice Anderson',
      role: 'EMPLOYEE' as const,
      department: 'Engineering',
      title: 'Frontend Developer',
      bio: 'Specializing in React and modern web technologies.',
      salary: 90000,
      performanceRating: 4,
      organizationId: organization.id,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE' as const,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email_organizationId: {
          email: user.email,
          organizationId: organization.id
        }
      },
      update: {},
      create: user,
    });
    console.log(`✓ Created user: ${user.name} (${user.email})`);
  }

  // Get created users for relationships using findFirst
  const emily = await prisma.user.findFirst({
    where: {
      email: 'emily@example.com',
      organizationId: organization.id
    }
  });
  const david = await prisma.user.findFirst({
    where: {
      email: 'david@example.com',
      organizationId: organization.id
    }
  });
  const sarah = await prisma.user.findFirst({
    where: {
      email: 'sarah@example.com',
      organizationId: organization.id
    }
  });
  const john = await prisma.user.findFirst({
    where: {
      email: 'john@example.com',
      organizationId: organization.id
    }
  });
  const alice = await prisma.user.findFirst({
    where: {
      email: 'alice@example.com',
      organizationId: organization.id
    }
  });

  if (emily && david && sarah && john && alice) {
    // Create sample feedback with organizationId
    const feedbackData = [
      {
        content: 'Great work on the new feature! Your code quality is excellent.',
        giverId: emily.id,
        receiverId: david.id,
        organizationId: organization.id,
      },
      {
        content: 'Really impressed with the UI improvements. The attention to detail shows.',
        giverId: david.id,
        receiverId: sarah.id,
        organizationId: organization.id,
      },
      {
        content: 'Excellent collaboration on the product roadmap. Very clear communication.',
        giverId: sarah.id,
        receiverId: john.id,
        organizationId: organization.id,
      },
      {
        content: 'Your frontend work is top-notch. The components are well-structured.',
        giverId: emily.id,
        receiverId: alice.id,
        organizationId: organization.id,
      },
    ];

    for (const feedback of feedbackData) {
      await prisma.feedback.create({
        data: feedback,
      });
    }
    console.log(`✓ Created ${feedbackData.length} feedback entries`);

    // Create sample absence requests with organizationId
    const now = new Date();
    const absenceData = [
      {
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 19),
        reason: 'Family vacation to the mountains',
        status: 'PENDING' as const,
        userId: david.id,
        organizationId: organization.id,
      },
      {
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 3),
        reason: 'Medical appointment',
        status: 'APPROVED' as const,
        userId: sarah.id,
        organizationId: organization.id,
      },
      {
        startDate: new Date(now.getFullYear(), now.getMonth() + 2, 10),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 12),
        reason: 'Conference attendance',
        status: 'PENDING' as const,
        userId: john.id,
        organizationId: organization.id,
      },
      {
        startDate: new Date(now.getFullYear(), now.getMonth(), 5),
        endDate: new Date(now.getFullYear(), now.getMonth(), 7),
        reason: 'Personal time off',
        status: 'REJECTED' as const,
        userId: alice.id,
        organizationId: organization.id,
      },
    ];

    for (const absence of absenceData) {
      await prisma.absenceRequest.create({
        data: absence,
      });
    }
    console.log(`✓ Created ${absenceData.length} absence requests`);
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
