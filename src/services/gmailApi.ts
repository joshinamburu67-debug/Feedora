export interface GmailSendResult {
  id: string;
  threadId: string;
  labelIds?: string[];
}

/**
 * Sends an email via Google Gmail API using the client's OAuth Bearer token
 * Endpoint: POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
 */
export async function sendGmailMessage(rawBase64Url: string, accessToken: string): Promise<GmailSendResult> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawBase64Url,
    }),
  });

  if (!response.ok) {
    let errorDetails = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorDetails = errorJson.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(`Gmail API delivery failed: ${errorDetails}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds,
  };
}
