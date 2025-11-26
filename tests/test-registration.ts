import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});

async function testRegistration() {
  console.log('=== Testing Registration with Real Email ===\n');

  const testEmail = 'rusan.adrian.ionut+5@gmail.com';
  const testOrgName = 'Adrian Test Company 5';
  const testName = 'Adrian Rusan';
  const testPassword = 'SecurePassword123!';

  console.log(`Registering: ${testEmail}`);
  console.log(`Organization: ${testOrgName}`);
  console.log(`Name: ${testName}`);
  console.log('');

  try {
    const result = await client.auth.register.mutate({
      organizationName: testOrgName,
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    console.log('✓ Registration successful!');
    console.log('Result:', result);
  } catch (error: any) {
    console.error('✗ Registration failed:', error.message);
  }
}

testRegistration();
