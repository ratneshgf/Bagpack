import type { RedditTravelSignal } from './types';
export { searchOpenStreetMapIndia } from './openstreetmap';

async function getRedditAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT;
  if (!clientId || !clientSecret || !userAgent) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Reddit OAuth failed (${response.status})`);
  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function searchRedditTravelSignals(query: string): Promise<RedditTravelSignal[] | null> {
  const token = await getRedditAccessToken();
  if (!token) return null;

  const params = new URLSearchParams({
    q: `${query} India travel`, sort: 'relevance', t: 'all', type: 'link', limit: '12', raw_json: '1',
  });
  const response = await fetch(`https://oauth.reddit.com/search?${params}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': process.env.REDDIT_USER_AGENT! },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Reddit search failed (${response.status})`);

  const data = (await response.json()) as {
    data?: { children?: Array<{ data?: { title?: string; score?: number; num_comments?: number; permalink?: string; subreddit_name_prefixed?: string } }> };
  };
  return (data.data?.children ?? []).flatMap(({ data: post }) => {
    if (!post?.title || !post.permalink) return [];
    return [{
      title: post.title,
      score: post.score ?? 0,
      commentCount: post.num_comments ?? 0,
      url: `https://www.reddit.com${post.permalink}`,
      subreddit: post.subreddit_name_prefixed ?? 'Reddit',
    }];
  });
}
