type AnalyticsProperties = Record<string, string | number | boolean>;

type AnalyticsClient = {
  capture: (event: string, properties?: AnalyticsProperties) => unknown;
};

type PendingEvent = {
  event: string;
  properties: AnalyticsProperties;
};

const MAX_PENDING_EVENTS = 30;
let client: AnalyticsClient | null = null;
const pending: PendingEvent[] = [];

export function setAnalyticsClient(nextClient: AnalyticsClient): void {
  client = nextClient;

  while (pending.length > 0) {
    const next = pending.shift();
    if (!next) break;
    try {
      client.capture(next.event, next.properties);
    } catch {
      // Analytics must never interfere with the product experience.
    }
  }
}

export function captureOrQueueAnalytics(event: string, properties: AnalyticsProperties): void {
  if (client) {
    try {
      client.capture(event, properties);
    } catch {
      // Analytics must never interfere with the product experience.
    }
    return;
  }

  if (pending.length >= MAX_PENDING_EVENTS) pending.shift();
  pending.push({ event, properties });
}
