import { Octokit } from "@octokit/rest";

/**
 * Options for fetching GitHub activity.
 */
interface FetchOptions {
  user: string;
  token: string;
}

/**
 * Fetches GitHub activity for a user within the last 7 days.
 * @param options GitHub username and token
 * @returns List of filtered events
 */
export async function fetchGitHubActivity({ user, token }: FetchOptions): Promise<any[]> {
  const octokit = new Octokit({ auth: token });
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  try {
    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username: user,
      per_page: 100,
    });
    
    // Filter events from the last 7 days
    const filteredEvents = events.filter((event: any) => {
      const eventDate = new Date(event.created_at!);
      return eventDate >= sevenDaysAgo;
    });

    // Slim down event data to save tokens and improve prompt focus
    return filteredEvents.map((event: any) => ({
      type: event.type,
      repo: event?.repo?.name,
      date: event.created_at,
      payload: {
        action: event.payload?.action,
        ref: event.payload?.ref,
        commits: event.payload?.commits?.map((c: any) => c.message),
        pr_title: event.payload?.pull_request?.title,
        issue_title: event.payload?.issue?.title,
        comment: event.payload?.comment?.body?.substring(0, 100),
      }
    }));
  } catch (error: any) {
    console.error('Error fetching GitHub activity:', error.message);
    throw error;
  }
}
