import { NextResponse } from 'next/server';

const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
const MS_TENANT = process.env.MS_TENANT || 'common';
const MS_REDIRECT_URI = process.env.MS_REDIRECT_URI;

export async function GET() {
  if (!MS_CLIENT_ID || !MS_REDIRECT_URI) {
    return NextResponse.json(
      { error: { message: 'Microsoft OAuth not configured' } },
      { status: 500 }
    );
  }

  // Microsoft OAuth Authorization Code Flow
  // Scope: Tasks.Read (or Group.Read.All depending on tenant setup)
  // Note: Actual required permissions may vary by tenant configuration
  const scope = 'https://graph.microsoft.com/Tasks.Read offline_access';
  const authUrl = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize?${new URLSearchParams({
    client_id: MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MS_REDIRECT_URI,
    response_mode: 'query',
    scope,
    state: 'planner-connect',
  })}`;

  return NextResponse.json({ authUrl });
}
