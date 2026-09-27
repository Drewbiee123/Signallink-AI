export type AthenaEvent = {
  eventId: string; bundleId: string; subscriptionId: string | null;
  topic: string | null; resourceReference: string | null; resourceType: string | null;
  eventTimestamp: string | null; notificationType: string | null;
};
const str = (x: unknown): string | null => typeof x === "string" && x.length > 0 ? x : null;
export function parseNotificationBundle(value: unknown): AthenaEvent {
  if (!value || typeof value !== "object") throw new Error("INVALID_BUNDLE");
  const b = value as Record<string, unknown>;
  if (b.resourceType !== "Bundle" || b.type !== "history" || !Array.isArray(b.entry)) throw new Error("INVALID_BUNDLE");
  const statusEntry = b.entry.find((e: unknown) => {
    const r = (e as { resource?: { resourceType?: string } })?.resource;
    return r?.resourceType === "SubscriptionStatus";
  }) as { resource?: Record<string, unknown> } | undefined;
  const status = statusEntry?.resource;
  if (!status) throw new Error("INVALID_BUNDLE");
  const events = Array.isArray(status.notificationEvent) ? status.notificationEvent : [];
  const notification = events[0] as Record<string, unknown> | undefined;
  const focus = notification?.focus as { reference?: unknown } | undefined;
  const reference = str(focus?.reference);
  const subscription = (status.subscription as { reference?: unknown } | undefined)?.reference;
  const eventNumber = notification?.eventNumber;
  const id = str(b.id);
  const eventId = str(eventNumber) || (typeof eventNumber === "number" ? String(eventNumber) : null);
  if (!id || !str(subscription) || (!eventId && !str(status.type))) throw new Error("INVALID_BUNDLE");
  const timestamp = str(notification?.timestamp) || str(b.timestamp);
  if (timestamp && Number.isNaN(Date.parse(timestamp))) throw new Error("INVALID_BUNDLE");
  return {
    eventId: eventId ? `${subscription}:${eventId}` : `${subscription}:${id}`,
    bundleId: id, subscriptionId: str(subscription), topic: str(status.topic),
    resourceReference: reference, resourceType: reference?.split("/")[0] || null,
    eventTimestamp: timestamp ? new Date(timestamp).toISOString() : null,
    notificationType: str(status.type)
  };
}
