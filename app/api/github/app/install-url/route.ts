import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signInstallState } from '@/lib/github/install-state';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  const urlIn = new URL(req.url);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationIdParam = urlIn.searchParams.get('organizationId') || undefined;
  let organizationId = organizationIdParam;

  if (!organizationId) {
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, isActive: true } } },
        ],
        isActive: true,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    organizationId = org?.id;
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'No organization found for user' }, { status: 400 });
  }

  const url = new URL('https://github.com/apps/codedolphinn/installations/new');
  const state = signInstallState({
    userId: session.user.id,
    organizationId,
    returnTo: `/organizations/${organizationId}/integrations`,
  });
  url.searchParams.set('state', state);

  return NextResponse.json({ url: url.toString() });
}

