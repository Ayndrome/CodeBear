import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { verifyInstallState } from '@/lib/github/install-state';
import { getInstallationOctokit } from '@/lib/github/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || url.origin;
  const installationIdRaw = url.searchParams.get('installation_id');
  const stateToken = url.searchParams.get('state');

  console.log(`🔗 Callback hit: installation_id=${installationIdRaw}, has_state=${!!stateToken}`);

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    console.log('❌ Callback: No session found, redirecting to login');
    return NextResponse.redirect(new URL('/login', baseUrl));
  }
  console.log(`✅ Callback: Session found for user ${session.user.id}`);

  if (!installationIdRaw || !stateToken) {
    console.log('❌ Callback: Missing params');
    return NextResponse.redirect(new URL('/connect-github?status=missing_params', baseUrl));
  }

  let state: { userId: string; returnTo?: string; ts: number };
  try {
    state = verifyInstallState(stateToken);
  } catch {
    console.log('❌ Callback: Invalid state token');
    return NextResponse.redirect(new URL('/connect-github?status=bad_state', baseUrl));
  }

  if (state.userId !== session.user.id) {
    console.log(`❌ Callback: User mismatch — state=${state.userId} session=${session.user.id}`);
    return NextResponse.redirect(new URL('/connect-github?status=user_mismatch', baseUrl));
  }

  const installationId = Number(installationIdRaw);
  if (!Number.isFinite(installationId) || installationId <= 0) {
    console.log('❌ Callback: Bad installation ID');
    return NextResponse.redirect(new URL('/connect-github?status=bad_installation', baseUrl));
  }

  try {
    const octokit = await getInstallationOctokit(installationId);
    const { data } = await octokit.request('GET /installation/repositories', { per_page: 100 });

    const repos = data.repositories ?? [];
    console.log(`📦 Callback: Found ${repos.length} repo(s) to sync for installation ${installationId}`);

    await Promise.all(
      repos.map((repo) =>
        prisma.repository.upsert({
          where: { githubId: repo.id },
          create: {
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description ?? undefined,
            language: repo.language ?? undefined,
            isPrivate: repo.private,
            defaultBranch: repo.default_branch ?? 'main',
            installationId,
            isActive: true,
            userId: session.user.id,
          },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description ?? undefined,
            language: repo.language ?? undefined,
            isPrivate: repo.private,
            defaultBranch: repo.default_branch ?? 'main',
            installationId,
            isActive: true,
            userId: session.user.id,
          },
        })
      )
    );
    console.log(`✅ Callback: Synced ${repos.length} repo(s) to DB`);
  } catch (e) {
    console.error('❌ Callback: GitHub install sync failed', e);
    return NextResponse.redirect(new URL('/connect-github?status=sync_failed', baseUrl));
  }

  const returnTo = state.returnTo || '/connect-github';
  console.log(`🔀 Callback: Redirecting to ${returnTo}?status=installed`);
  return NextResponse.redirect(new URL(`${returnTo}?status=installed`, baseUrl));
}

