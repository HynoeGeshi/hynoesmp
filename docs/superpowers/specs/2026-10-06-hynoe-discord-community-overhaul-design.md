# Hynoe Discord Community Overhaul — Design Specification

Date: 2026-10-06
Owner: Hynoe / Terrell Stewart
Status: Design approved; implementation pending

## 1. Goal

Rebuild the current Hynoe Discord into the central Hynoe community hub: easy for a new member to understand within seconds, active enough to encourage conversation, informative without becoming announcement-heavy, and flexible enough to support Hynoe SMP, Hynoe Outpost, Hynoe Flicks, streams/content, skateboarding, fitness, music, and future paid Hynoe services.

The primary success metric is not channel count. It is sustained conversation and return activity: members should quickly find relevant spaces, have recurring reasons to participate, and remain informed without feeling overwhelmed.

## 2. Community Identity

The Discord is a **Hynoe community server**, not only a Minecraft server.

Primary pillars:

1. Hynoe Community — the shared social center.
2. Hynoe Live & Content — streams, YouTube, clips, and content discussion.
3. Hynoe SMP — Minecraft community and server operations.
4. Hynoe Outpost — the Hynoe Outpost game only.
5. Hynoe Flicks — photography, shoots, feedback, and portfolio/community work.
6. Hynoe Culture — skateboarding, fitness, and music.
7. Support — help and contact flows.
8. Staff / Hynoe Control — private operational area.
9. Hynoe Services — hidden until monetized offers are ready.

There is no dedicated Events category at launch. Empty categories make the server appear inactive. Event channels should be created only once recurring events actually exist.

## 3. Information Architecture

### START HERE

Keep this category compact and mostly read-only.

- `#welcome`
- `#start-here`
- `#rules`
- `#choose-your-interests`
- `#announcements`

Purpose: explain the server, help new members pick interests, and direct them to one immediate action.

### HYN​​OE COMMUNITY

This is the main conversation engine.

- `#general`
- `#introductions`
- `#memes`
- `#music`
- `#what-are-you-playing`
- `#polls`
- `#suggestions`
- General Voice
- Chill Voice

If activity is too low to support every listed channel, combine low-volume topics rather than leaving visibly dead channels.

### HYN​​OE LIVE & CONTENT

- `#hynoe-live`
- `#youtube`
- `#clips-and-highlights`
- `#stream-chat`
- `#content-suggestions`

Purpose: make live/content activity conversational, not just promotional. Discussions should continue after streams end.

### HYN​​OE SMP

- `#smp-info`
- `#smp-updates`
- `#server-chat`
- `#campaign-help`
- `#looking-for-group`
- `#trading-market`
- `#build-showcase`
- `#bugs-and-help`
- SMP Voice

Preserve or reconnect any existing Minecraft↔Discord bridge that is still useful. Server-chat should clearly disclose when Minecraft messages are mirrored into Discord or vice versa.

### HYN​​OE OUTPOST

Hynoe Outpost is treated strictly as the game.

- `#outpost-news`
- `#outpost-chat`
- `#strategies`
- `#progress-and-leaderboards`
- `#outpost-feedback`
- `#outpost-bugs`

The section should support future game progression, leaderboard highlights, balance feedback, and product/community announcements without becoming a second general-chat area.

### HYN​​OE FLICKS

- `#flicks-showcase`
- `#photography-chat`
- `#photo-feedback`
- `#book-a-shoot`
- `#behind-the-scenes`

Purpose: support the photography brand while still feeling useful to non-clients. Booking or inquiry paths should be clear without turning the section into a sales page.

### HYN​​OE CULTURE

- `#skateboarding`
- `#fitness`
- `#music`
- `#lifestyle-media`

Purpose: give members ways to connect around Hynoe interests beyond games and streams. This category should stay compact; split topics only when activity justifies it.

### SUPPORT

- `#help-desk` or a ticket/forum flow
- optional contact/collaboration intake

One public help entry point is preferred over multiple low-volume support channels.

### STAFF / HYN​​OE CONTROL

Private category containing operational channels such as:

- moderation discussion
- bot/control logs
- audit logs
- content/community planning
- incident notes

Only trusted staff and the Hynoe Control bot should see this category.

### HYN​​OE SERVICES

Hidden at launch.

When paid offers are ready, reveal a polished services area for creator management, automation/setup work, website/community builds, photography, consulting, or other validated offers. Until then, keep only a subtle collaboration/contact route elsewhere in the server.

## 4. Roles

Keep roles purposeful rather than decorative.

### Core

- `Hynoe`
- `Staff`
- `Moderator`
- `Creator`
- `Member`
- `New Here`

### Interest roles

- `Hynoe SMP`
- `Hynoe Outpost`
- `Hynoe Flicks`
- `Streams & Content`
- `Skateboarding`
- `Fitness`
- `Music`
- `Giveaways` only when giveaways actually exist

### Recognition roles

Recognition should be earned and limited.

Examples:

- `OG`
- `Top Contributor`
- `Builder`
- `Trader`
- `Photographer`
- `Clipper`
- `Outpost Elite`

A role must control access, express a useful identity, or recognize contribution. Avoid large collections of meaningless cosmetic roles.

## 5. Onboarding

The onboarding goal is to get a new member to take one meaningful action quickly.

Recommended flow:

1. Member joins and sees a small Start Here area.
2. They accept rules and choose interests.
3. Relevant categories are surfaced through Discord onboarding/server-guide capabilities where available.
4. They are prompted to either introduce themselves, join `#general`, or enter the primary topic they selected.
5. `New Here` becomes `Member` after a lightweight participation threshold or manual/automated verification.

Do not require a long questionnaire before members can talk.

## 6. Engagement System

The server should create recurring reasons to return without manufacturing fake activity.

Initial mechanisms:

- rotating discussion prompts in `#general`
- regular polls
- member/photo/build/clip showcases
- Hynoe SMP challenges when applicable
- Hynoe Outpost leaderboard/progression highlights
- music recommendation threads
- skate clip sharing
- fitness progress/check-in threads
- stream discussion before, during, and after live sessions
- milestone and contributor recognition

No Events category is created until real events exist. If game nights, giveaways, skate meetups, fitness challenges, launches, or similar activities become recurring, add the event structure then.

The system should favor threads and forum-style posts where they reduce channel clutter.

## 7. Hynoe Control Capability Model

The dedicated Hynoe Control Discord bot is the management interface. Do not automate Terrell's normal Discord user account and do not use a self-bot.

### Actions Hynoe Control may perform without per-action confirmation after setup

- audit server/category/channel structure
- read server settings and channel metadata
- read recent messages in authorized community channels for optimization analysis
- create or edit non-destructive informational/community channels
- reorder channels and categories
- create/edit low-risk roles
- adjust channel topics and descriptions
- update onboarding prompts/resources
- post routine announcements and community prompts
- manage bot-authored messages
- analyze activity patterns
- identify inactive, duplicate, confusing, or overloaded channels
- recommend or perform reversible low-risk organization changes

### Actions requiring explicit confirmation

- kick members
- ban members
- timeout members
- mass member-role changes
- destructive channel/category deletion
- destructive role deletion
- bulk message deletion of member-authored content
- permission changes that materially broaden staff/bot access
- destructive webhook/integration removal
- other actions reasonably likely to remove access, history, or community content

Important writes should be logged to the private audit channel and/or bridge audit log.

## 8. Discord Bot Permissions

Grant only permissions required for the approved management scope. Expected permissions may include:

- View Channels
- Read Message History
- Send Messages
- Embed Links
- Manage Channels
- Manage Roles
- Manage Messages
- Manage Webhooks if required for an approved integration
- View Audit Log
- Manage Guild / server settings only if required for onboarding/server configuration features

`Administrator` should not be granted by default. If a Discord feature cannot be managed without it, evaluate that feature separately before expanding permissions.

Message Content Intent should be enabled because activity analysis and bounded message search require message bodies. Presence and Guild Members privileged intents remain disabled unless a later approved feature specifically requires them.

## 9. Optimization Analytics

Hynoe Control should eventually produce practical community-health signals such as:

- active vs. dead channels
- messages/replies per active member
- new-member participation rate
- channels where new members first engage
- unanswered support questions
- topics that consistently generate replies
- best-performing recurring prompts
- SMP/Outpost/Flicks/Culture section activity
- member return patterns where Discord APIs make this available without invasive tracking

Analytics should be used to simplify the server and improve conversation, not to surveil individuals unnecessarily.

## 10. Migration Strategy

The overhaul must not begin by deleting the existing server structure.

Sequence:

1. Inventory current categories, channels, roles, permissions, webhooks/integrations, onboarding, and active message patterns.
2. Classify each existing item as keep, rename/move, merge, archive, or remove.
3. Create the new top-level structure alongside or from existing compatible channels.
4. Preserve useful channel history where practical by renaming/reordering instead of deleting/recreating.
5. Rebuild role hierarchy and channel overwrites carefully.
6. Configure onboarding/interests.
7. Reconnect integrations and Minecraft chat bridge.
8. Validate permissions with member/staff/bot perspectives.
9. Launch the new navigation and welcome flow.
10. Only after verification, archive or delete obsolete structures with user confirmation where destructive.

This staged migration keeps the server usable while it is being transformed.

## 11. Safety and Failure Handling

- Never place the Discord bot token in GitHub, logs, chat messages, or client-side code.
- Keep the token only in protected server-side environment configuration.
- Log management actions without secret values.
- Treat all user-generated Discord content as untrusted input.
- Sanitize mass mentions by default.
- Rate-limit repetitive automated posting.
- Avoid automatic punishments based solely on language-model classification.
- Do not silently delete community history.
- If a permission change fails or produces unexpected access, stop and inspect current overwrites before applying broader permissions.

## 12. Implementation Scope

The implementation must extend the existing `control-bridge` Discord subsystem rather than creating a separate unmanaged bot.

Expected new tool families include:

- server/guild inspection
- category/channel create/update/reorder/archive operations
- role inspection/create/update/reorder operations
- channel permission inspection/update operations
- onboarding/server settings inspection and supported updates
- webhook/integration inspection where safely supported
- moderation action preparation and explicitly-confirmed execution
- message/activity analytics
- audit reporting

The existing narrow Discord tools remain compatible where useful.

## 13. Testing and Verification

Before live overhaul operations:

- unit-test permission gates and destructive-action classification
- test role hierarchy failures
- test channel/role allow/deny behavior
- test mass-mention blocking
- test that destructive tools cannot execute without approval state
- test audit logging/redaction
- test Discord API failures and rate-limit handling
- run typecheck and production build

Live verification should start with read-only inventory calls, then one reversible low-risk change in a test/temporary channel before broader server restructuring.

## 14. Definition of Done

The overhaul is complete when:

- the Discord has the approved Hynoe community architecture
- new members can understand where to go without staff assistance
- interest/onboarding flows expose relevant sections cleanly
- Hynoe SMP, Outpost, Flicks, Culture, and Live/Content each have a clear purpose
- the server avoids visibly empty/dead categories
- Hynoe Control can safely inspect and manage the approved server configuration
- destructive member/community actions remain confirmation-gated
- useful existing integrations and history are preserved where practical
- the server has lightweight recurring engagement mechanisms
- activity can be reviewed over time so future optimization is based on real behavior
