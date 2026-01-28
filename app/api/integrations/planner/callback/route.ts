import { NextRequest, NextResponse } from 'next/server';
import { updateSettings } from '@/lib/db/settings';
import type { PlannerToken } from '@/lib/db/settings';

const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const MS_TENANT = process.env.MS_TENANT || 'common';
const MS_REDIRECT_URI = process.env.MS_REDIRECT_URI;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: { message: `OAuth error: ${error}` } },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: { message: 'Missing authorization code' } },
        { status: 400 }
      );
    }

    if (!MS_CLIENT_ID || !MS_CLIENT_SECRET || !MS_REDIRECT_URI) {
      return NextResponse.json(
        { error: { message: 'Microsoft OAuth not configured' } },
        { status: 500 }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: MS_CLIENT_ID,
          client_secret: MS_CLIENT_SECRET,
          code,
          redirect_uri: MS_REDIRECT_URI,
          grant_type: 'authorization_code',
          scope: 'https://graph.microsoft.com/Tasks.Read offline_access',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };

    const plannerToken: PlannerToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      scope: tokenData.scope,
    };

    await updateSettings({
      planner_connected: true,
      planner_token: plannerToken,
      planner_last_sync: null,
    });

    // Redirect to integrations page
    return NextResponse.redirect(new URL('/integrations', request.url));
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}
