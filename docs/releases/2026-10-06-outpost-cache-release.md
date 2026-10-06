# Hynoe Outpost cache release — 2026-10-06

## Root cause

The Watch & Play entry page and nested browser modules referenced multiple older fixed asset-version tokens. Mobile browsers could therefore continue using previously cached mining, touch, progression, or save-recovery code after the repository had newer files.

## Fix

The complete Hynoe Outpost browser entry graph now uses release token `20261006a`, including the Watch & Play CSS/JS entries, mobile interaction/save-recovery module, game/session/command modules, and progression module.

A regression test requires these references to stay on one release token so future changes cannot silently recreate the mixed-cache state.

## Leaderboard scope

The Hall of Legends now loads public site-wide rankings again. Publishing this browser’s own callsign and bounded gameplay metrics is optional, off by default, and requires the explicit in-game opt-in control. Turning that control off stops future score uploads; the Data Deletion page provides the private request route for existing server-side leaderboard records.
