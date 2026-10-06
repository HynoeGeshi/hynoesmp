# Hynoe Outpost cache release — 2026-10-06

## Root cause

The Watch & Play entry page and nested browser modules referenced multiple older fixed asset-version tokens. Mobile browsers could therefore continue using previously cached mining, touch, progression, or save-recovery code after the repository had newer files.

## Fix

The complete Hynoe Outpost browser entry graph now uses release token `20261006a`, including the Watch & Play CSS/JS entries, mobile interaction/save-recovery module, game/session/command modules, and progression module.

A regression test requires these references to stay on one release token so future changes cannot silently recreate the mixed-cache state.

## Leaderboard scope

Global leaderboard transmission remains disabled under the existing privacy hold. Local Legend scoring remains available. This cache release does not re-enable external player-ID or score uploads.
