import { getSettings, updateSettings, type PlannerToken } from '@/lib/db/settings';

const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const MS_TENANT = process.env.MS_TENANT || 'common';
const MS_REDIRECT_URI = process.env.MS_REDIRECT_URI;

if (!MS_CLIENT_ID || !MS_CLIENT_SECRET || !MS_REDIRECT_URI) {
  console.warn('Microsoft Graph OAuth credentials not configured');
}

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

export async function getAccessToken(): Promise<string | null> {
  const settings = await getSettings();
  const token = settings.planner_token;

  if (!token || !token.access_token) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  if (token.expires_at && token.expires_at < Date.now() + 5 * 60 * 1000) {
    // Try to refresh
    if (token.refresh_token) {
      const newToken = await refreshAccessToken(token.refresh_token);
      if (newToken) {
        return newToken.access_token;
      }
    }
    return null;
  }

  return token.access_token;
}

async function refreshAccessToken(
  refreshToken: string
): Promise<PlannerToken | null> {
  if (!MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: MS_CLIENT_ID,
          client_secret: MS_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Tasks.Read',
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };

    const newToken: PlannerToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    };

    await updateSettings({ planner_token: newToken });

    return newToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

export async function fetchPlannerTasks(): Promise<
  Array<{
    id: string;
    title: string;
    planId?: string;
    bucketId?: string;
    [key: string]: unknown;
  }>
> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated with Microsoft Planner');
  }

  // Note: Planner API requires specific permissions
  // Tasks.Read or Group.Read.All (depending on tenant setup)
  // This is a simplified implementation - actual API may vary
  const response = await fetch(`${GRAPH_API_BASE}/me/planner/tasks`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Planner tasks: ${response.status} ${error}`);
  }

  const data = (await response.json()) as {
    value: Array<{
      id: string;
      title: string;
      planId?: string;
      bucketId?: string;
      [key: string]: unknown;
    }>;
  };

  return data.value;
}
