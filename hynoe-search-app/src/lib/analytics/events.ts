export const ANALYTICS_EVENTS = [
  'search_submitted',
  'search_result_clicked',
  'page_viewed',
  'page_saved',
  'page_followed',
  'inquiry_submitted',
  'command_center_viewed',
] as const;

export type HynoeAnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsPrimitive = string | number | boolean;

const SAFE_PROPERTY_KEYS = new Set([
  'page_slug',
  'page_type',
  'result_position',
  'has_query',
  'query_length',
  'source',
  'category',
  'action_state',
  'page_count',
]);

export function sanitizeAnalyticsProperties(
  properties: Record<string, unknown> = {},
): Record<string, AnalyticsPrimitive> {
  const safe: Record<string, AnalyticsPrimitive> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!SAFE_PROPERTY_KEYS.has(key)) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    }
  }

  return safe;
}
