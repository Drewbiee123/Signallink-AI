import type { AthenaEvent } from "./parseNotificationBundle";
export function detectTransportAnomalies(event: AthenaEvent): string[] {
  const findings: string[] = [];
  if (!event.resourceReference && event.notificationType === "event-notification") findings.push("missing_resource_reference");
  if (event.eventTimestamp && Math.abs(Date.now() - Date.parse(event.eventTimestamp)) > 300000) findings.push("timestamp_outside_window");
  return findings;
}
