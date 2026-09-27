export async function enqueueAthenaEvent(eventId: string): Promise<void> {
  const endpoint = process.env.ATHENA_QUEUE_ENDPOINT;
  const token = process.env.ATHENA_QUEUE_TOKEN;
  if (!endpoint || !token || !endpoint.startsWith("https://")) throw new Error("QUEUE_NOT_CONFIGURED");
  const response = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId }), signal: AbortSignal.timeout(3000)
  });
  if (!response.ok) throw new Error("QUEUE_UNAVAILABLE");
}
