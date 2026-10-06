import { describe, expect, it } from 'vitest';
import { summarizeDiscordActivity } from '../src/discord/analytics';

describe('Discord activity analytics', () => {
  it('returns aggregate channel metrics without member profiles', () => {
    const summary = summarizeDiscordActivity({
      channels: [
        {
          channelId: 'general',
          channelName: 'general',
          messages: [
            { id: '1', content: 'hello', timestamp: '2026-10-06T10:00:00Z', author: { id: 'u1' } },
            { id: '2', content: 'reply', timestamp: '2026-10-06T10:05:00Z', author: { id: 'u2' }, message_reference: { message_id: '1' } },
          ],
        },
      ],
    });
    expect(summary.channels).toEqual([
      expect.objectContaining({ channelId: 'general', channelName: 'general', messageCount: 2, replyCount: 1 }),
    ]);
    expect(JSON.stringify(summary)).not.toContain('u1');
    expect(JSON.stringify(summary)).not.toContain('u2');
    expect(JSON.stringify(summary)).not.toContain('hello');
    expect(summary.totalMessages).toBe(2);
    expect(summary.totalReplies).toBe(1);
  });

  it('sorts the busiest channels first', () => {
    const summary = summarizeDiscordActivity({
      channels: [
        { channelId: 'quiet', channelName: 'quiet', messages: [{ id: '1', author: { id: 'u' } }] },
        { channelId: 'busy', channelName: 'busy', messages: [{ id: '2', author: { id: 'u' } }, { id: '3', author: { id: 'v' } }] },
      ],
    });
    expect(summary.channels.map((channel) => channel.channelId)).toEqual(['busy', 'quiet']);
  });
});
