import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Failed to fetch organization info:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}
