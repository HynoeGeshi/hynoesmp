// Public proposals only. No private catalog or upload IDs are embedded.
export const HOME_DRAFTS = [
  {
    key: 'home:survival',
    action: 'channel_section',
    resource_id: 'new:hynoe-home-v1-survival',
    title: 'Home position 0 · Hynoe SMP survival / progression',
    topic: 'Home',
    note: 'Add one public playlist shelf. Its native heading comes from the current playlist title.',
    target: {snippet: {type: 'singleplaylist', position: 0}, contentDetails: {playlists: ['PLYPnPq5j4l3Y']}}
  },
  {
    key: 'home:campaign-development',
    action: 'channel_section',
    resource_id: 'new:hynoe-home-v1-campaign-development',
    title: 'Home position 1 · Hynoe SMP — Campaign & Development',
    topic: 'Home',
    note: 'Add a campaign / development shelf in the exact playlist order shown.',
    target: {snippet: {type: 'multipleplaylists', position: 1, title: 'Hynoe SMP — Campaign & Development'}, contentDetails: {playlists: ['PLMMS96xqHUsE', 'PLBEcWw2l2FS0']}}
  },
  {
    key: 'home:past-streams',
    action: 'channel_section',
    resource_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ.jNQXAC9IVRw',
    title: 'Home position 3 · Past live streams',
    topic: 'Home',
    note: 'Move the existing completed live streams shelf from position 0 to 3.',
    target: {snippet: {type: 'completedevents', position: 3}, contentDetails: {}}
  },
  {
    key: 'home:full-series',
    action: 'channel_section',
    resource_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ.LeAltgu_pbM',
    title: 'Home position 4 · Play a Full Series With Me',
    topic: 'Home',
    note: 'Update the existing series shelf title and move it from position 1 to 4. Keep these three public playlists in the exact order shown.',
    target: {snippet: {type: 'multipleplaylists', position: 4, title: 'Play a Full Series With Me'}, contentDetails: {playlists: ['PLPc8nLKcyUY0', 'PLH0ljnxIrW3A', 'PLbAf2oQTYw9c']}}
  },
  {
    key: 'home:zombies-sports',
    action: 'channel_section',
    resource_id: 'new:hynoe-home-v1-zombies-sports',
    title: 'Home position 5 · Zombies & Sports Replays',
    topic: 'Home',
    note: 'Add a shelf for the two existing public archive playlists.',
    target: {snippet: {type: 'multipleplaylists', position: 5, title: 'Zombies & Sports Replays'}, contentDetails: {playlists: ['PLUOIVuhvnXz4', 'PLd1WqDYEqFtI']}}
  },
  {
    key: 'home:minecraft-shorts',
    action: 'channel_section',
    resource_id: 'new:hynoe-home-v1-minecraft-shorts',
    title: 'Home position 6 · Minecraft Shorts',
    topic: 'Home',
    note: 'Add the existing public Minecraft Shorts playlist below the longer viewing paths.',
    target: {snippet: {type: 'singleplaylist', position: 6}, contentDetails: {playlists: ['PLFYg7OF2Vbdo']}}
  }
];
export const PUBLIC_CHANGE_DRAFTS = {
  "revision": "hynoe-whole-channel-draft-2026-10-07-v3",
  "channel": [
    {
      "key": "channel:about",
      "action": "channel_description",
      "resource_id": "UCjWR1CZVFkrVk3S-TRrOGGQ",
      "title": "Channel About",
      "topic": "Channel",
      "note": "About description only. Current channel name, handle, avatar, banner and links retained.",
      "before": {
        "description": "Hynoe is variety gaming built around progression, long-term projects and live stories. Right now I’m growing Hynoe SMP — a modded Minecraft server with a campaign, economy, jobs, bosses, rare gear and constant updates — while also playing full series like Gears of War: E-Day on Insane difficulty. Expect livestreams, challenges, builds, survival, RPGs, sports, racing and the best moments from the grind. If you like watching games, worlds and communities grow over time, subscribe and be part of Hynoe.\n\nHynoe SMP: https://hynoesmp.com\nDiscord: https://discord.gg/wYTePCkXd5"
      },
      "target": {
        "description": "I’m Hynoe. I stream variety gaming and build worlds that keep growing.\n\nHynoe SMP is my modded Minecraft world: survival, campaign progression, farms, builds and the work behind the server. You’ll also find Gears of War: E-Day on Insane, Halo Infinite, High on Life, Call of Duty Zombies, NBA 2K and Madden replays.\n\nWatch a series, catch a stream and join the community.\n\nHynoe SMP and modpack:\nhttps://hynoesmp.com\n\nDiscord:\nhttps://discord.gg/wYTePCkXd5"
      }
    }
  ],
  "videos": [
    {
      "key": "video:a4SGipDSmsE",
      "action": "public_video_metadata",
      "resource_id": "a4SGipDSmsE",
      "title": "Call of Duty Vanguard Zombies: Terra Maledicta Full Walkthrough (No Commentary)",
      "topic": "Vanguard",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Call of Duty Vanguard Zombies: Terra Maledicta Full Walkthrough (No Commentary)",
        "description": "A full Terra Maledicta Zombies walkthrough in Call of Duty: Vanguard with no commentary.\n\nAn older Call of Duty: Vanguard replay from the Hynoe archive.\n\n💬 JOIN THE HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi\n\n#CallOfDutyVanguard #CODVanguard #Zombies #Hynoe"
      },
      "target": {
        "title": "Call of Duty Vanguard Zombies: Terra Maledicta Full Walkthrough (No Commentary)",
        "description": "A full Terra Maledicta Zombies walkthrough in Call of Duty: Vanguard with no commentary.\n\nAn older Call of Duty: Vanguard replay from the Hynoe archive.\n\nMore Vanguard Zombies walkthroughs:\nhttps://www.youtube.com/playlist?list=PLUOIVuhvnXz4\n\n💬 JOIN THE HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi\n\n#CallOfDutyVanguard #CODVanguard #Zombies #Hynoe"
      }
    },
    {
      "key": "video:7I-RDbYmDgA",
      "action": "public_video_metadata",
      "resource_id": "7I-RDbYmDgA",
      "title": "Call of Duty Vanguard Zombies: Der Anfang Full Walkthrough (No Commentary)",
      "topic": "Vanguard",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Call of Duty Vanguard Zombies: Der Anfang Full Walkthrough (No Commentary)",
        "description": "A full Der Anfang Zombies walkthrough in Call of Duty: Vanguard with no commentary.\n\nAn older Call of Duty: Vanguard replay from the Hynoe archive.\n\n💬 JOIN THE HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi\n\n#CallOfDutyVanguard #CODVanguard #Zombies #Hynoe"
      },
      "target": {
        "title": "Call of Duty Vanguard Zombies: Der Anfang Full Walkthrough (No Commentary)",
        "description": "A full Der Anfang Zombies walkthrough in Call of Duty: Vanguard with no commentary.\n\nAn older Call of Duty: Vanguard replay from the Hynoe archive.\n\nMore Vanguard Zombies walkthroughs:\nhttps://www.youtube.com/playlist?list=PLUOIVuhvnXz4\n\n💬 JOIN THE HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi\n\n#CallOfDutyVanguard #CODVanguard #Zombies #Hynoe"
      }
    },
    {
      "key": "video:BaHUbJitiY0",
      "action": "public_video_metadata",
      "resource_id": "BaHUbJitiY0",
      "title": "Madden NFL 25 on the Hardest Difficulty",
      "topic": "Sports",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Madden NFL 25 on the Hardest Difficulty — This Got Serious",
        "description": "Pushing Madden NFL 25 on the hardest difficulty.\n\nThis replay is from my Madden NFL 25 run — career progression, big games, playoffs and whatever chaos the season throws at us.\n\n💬 JOIN THE HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\n#Madden25 #MaddenNFL25 #Gaming #Hynoe"
      },
      "target": {
        "title": "Madden NFL 25 on the Hardest Difficulty",
        "description": "I'm taking on Madden NFL 25 at the hardest difficulty and seeing how my game holds up. Every play is another decision to get right in this stream replay.\n\nPublished in February 2025. Watch the run, then tell me which play you would have called differently.\n\nMore NBA 2K and Madden replays:\nhttps://www.youtube.com/playlist?list=PLd1WqDYEqFtI\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#MaddenNFL25 #Madden25 #Hynoe"
      }
    },
    {
      "key": "video:fjxQwv8KRFA",
      "action": "public_video_metadata",
      "resource_id": "fjxQwv8KRFA",
      "title": "NBA 2K24 MyCAREER on PC | Gameplay Replay",
      "topic": "Sports",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "NBA 2K24 MyCAREER on PC — Full Stream",
        "description": "Back to NBA 2K24 MyCAREER on PC. This 2023 stream replay is all about getting on the court and continuing the career grind.\n\nBeen playing 2K since this era? Tell me which MyCAREER you would go back to in the comments.\n\nWatch more Hynoe streams:\nhttps://www.youtube.com/@Hynoe/streams\n\nJoin the community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel:\nhttps://streamlabs.com/hynoe_geshi\n\n#NBA2K24 #MyCAREER #Hynoe"
      },
      "target": {
        "title": "NBA 2K24 MyCAREER on PC | Gameplay Replay",
        "description": "NBA 2K24 MyCAREER on PC—back on the court and working on my MyPLAYER. Catch the original gameplay and commentary in this replay from my 2023 career run.\n\nWhich NBA 2K MyCAREER would you go back to? Let me know in the comments.\n\nMore NBA 2K and Madden replays:\nhttps://www.youtube.com/playlist?list=PLd1WqDYEqFtI\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#NBA2K24 #MyCAREER #Hynoe"
      }
    },
    {
      "key": "video:AbDnT24-vhc",
      "action": "public_video_metadata",
      "resource_id": "AbDnT24-vhc",
      "title": "Building a Minecraft Mob Farm in the Sky | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "BUILDING A MASSIVE MOB FARM IN THE SKY! 😈 | Hynoe SMP",
        "description": "🔥 **BUILDING A MASSIVE MOB FARM ON THE HYNOE MODDED MINECRAFT SERVER!** 🔥\n\nToday we’re heading high above the world to build a proper mob farm and turn it into a HUGE source of drops, progression, XP, and money. 👹💰\n\nWe’re building it from scratch, testing how efficient we can make it, and seeing how much it can help push us deeper into the server.\n\n👹 Farm tons of mobs\n⚔️ Stack mob drops & resources\n💼 Level Jobs+\n💰 Make money\n📈 Push Genesis progression\n✨ Upgrade our equipment\n🏪 Trade with other players\n👑 Prepare for stronger mobs & bosses\n\n🌎 **WANT TO PLAY ON THE HYNOE SERVER?**\n\nThe server is **OPEN TO THE COMMUNITY!**\n\n💬 **JOIN THE DISCORD:**\nhttps://discord.gg/wYTePCkXd5\n\nGet the modpack, server information, guides, updates, and help getting started.\n\n🔥 **SERVER FEATURES**\n\n📈 Genesis Progression\n💼 Jobs+\n💰 EconomyCraft\n🏪 Player shops & businesses\n👹 Tons of new mobs\n👑 Boss progression\n🏰 Dungeons, castles, ruins & structures\n🧭 Waystones\n🎒 Traveler’s Backpacks\n📦 Expanded storage\n🌾 Farming & automation\n✨ Expanded enchantments\n🌎 100+ Mods\n\nWhether you want to grind progression, build an empire, run a shop, hunt bosses, explore, farm, mine, trade, or just chill with the community — there’s always something to work toward.\n\n💎 **SUPPORT THE STREAM & SERVER:**\nhttps://streamlabs.com/hynoe_geshi\n\n👍 **LIKE the stream**\n🔔 **SUBSCRIBE**\n💬 **JOIN THE DISCORD**\n\n**One Community. Endless Adventures.**\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Building a Minecraft Mob Farm in the Sky | Hynoe SMP",
        "description": "We're taking the Minecraft mob-farm project into the sky. I'm building and testing a setup intended to help with drops, XP, and progression on Hynoe SMP.\n\nSettle in for the original eight-hour-plus stream replay, with the building process and experimentation left in.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:Y3twBCQ7lIw",
      "action": "public_video_metadata",
      "resource_id": "Y3twBCQ7lIw",
      "title": "More Work on Our Modded Minecraft World | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Building My Modded Minecraft SMP Into a Long-Term World | Hynoe SMP",
        "description": "Hynoe SMP is a long-term modded Minecraft world we’re building one stream at a time.\n\nThis stream is about continuing the survival grind: improving the world, progressing through the modpack, building, exploring, and turning the server into something players can keep coming back to.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\nExpect progression, economy, jobs, bosses, farms, powerful gear, player businesses, exploration, and community projects as the server keeps growing.\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "More Work on Our Modded Minecraft World | Hynoe SMP",
        "description": "More time in the world, more projects to work on. I'm continuing the Hynoe SMP survival grind: building, exploring, and finding our way through the modpack.\n\nThis stream replay follows another long session in the world we're growing together. Catch the rest of the series below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:OWt4LJc3Oco",
      "action": "public_video_metadata",
      "resource_id": "OWt4LJc3Oco",
      "title": "My Minecraft Mob Farm Needs a Complete Rebuild | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "My Mob Farm Needs a COMPLETE Rebuild… | Hynoe SMP",
        "description": "Today the mob farm is getting a COMPLETE rebuild.\n\nIf you’re new here, this is Hynoe SMP — a modded survival server we’ve been building from the ground up live. It’s not just about beating Minecraft and moving on. We’re building towns, economies, farms, villager systems, massive bases, custom progression, and a world people can actually stick around in long-term.\n\nToday’s problem is the mob farm. The current setup needs serious work, so we’re rebuilding it, fixing the design, and seeing how much better we can make it while the server keeps growing around us.\n\nIf you like watching a Minecraft world actually develop over time — with real players, real problems, and builds that change every stream — you’ll fit right in here.\n\n🎮 JOIN THE HYNOE SMP:\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nCome hang out, ask questions, and if the server looks like your kind of Minecraft, jump in with us.\n\n#Minecraft #ModdedMinecraft #MinecraftLive #HynoeSMP #MobFarm\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My Minecraft Mob Farm Needs a Complete Rebuild | Hynoe SMP",
        "description": "The mob farm needs more than a small adjustment. I'm rebuilding the setup on Hynoe SMP, rethinking the design, and testing it in our modded Minecraft world.\n\nWatch the full building stream replay—from working through the problem to testing changes. What do you check first when a mob farm isn't working the way you expected?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:Zu2_dzt912Q",
      "action": "public_video_metadata",
      "resource_id": "Zu2_dzt912Q",
      "title": "Making a Living in Modded Minecraft | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "JOIN THE HYNOE MODDED MINECRAFT SERVER! 🔥 100+ Mods, Economy, Jobs+ & Progression",
        "description": "🔥 THE HYNOE MODDED MINECRAFT SERVER IS GROWING — COME JOIN US!\n\nToday we’re back LIVE building, exploring, grinding, making money, progressing through the server, and bringing more players into the world.\n\nThis is a long-term modded survival server built around actual progression and community — not just rushing to endgame.\n\n🌎 100+ Mods\n💰 Player Economy\n💼 Jobs+ & Leveling\n📈 Genesis Progression\n🏪 Player Shops & Businesses\n🧭 Waystones & Exploration\n🏰 Dungeons, Structures & Ruins\n👹 New Mobs & Bosses\n⚔️ Powerful Weapons & Armor\n🏠 Bases, Communities & Huge Builds\n\n🔥 WANT TO PLAY WITH US?\n\nJoin the Discord for the modpack, server information, updates, guides, and community:\n\nhttps://discord.gg/wYTePCkXd5\n\n💎 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\nCome start your journey and help us build this world into something huge.\n\nONE COMMUNITY. ENDLESS ADVENTURES.\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Making a Living in Modded Minecraft | Hynoe SMP",
        "description": "Building a base is only part of getting established on Hynoe SMP. I'm back for a long modded Minecraft session with survival progression, jobs, and the player economy in the mix.\n\nThis stream replay comes from the early server journey. Current modpack and joining information are linked below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:S14CL7sIP7k",
      "action": "public_video_metadata",
      "resource_id": "S14CL7sIP7k",
      "title": "New Mods, Tokens & a Bigger Grind | Hynoe SMP Update",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "I Just Gave My Minecraft SMP a HUGE Update… New Mods, Tokens & More",
        "description": "Hynoe SMP is getting one of its biggest updates yet.\n\nToday we’re continuing to build this server into a long-term Minecraft world where progression actually matters. We’ve added new mods, expanded what players can discover across all 3 dimensions, rebuilt parts of the economy, upgraded the Hynoe Token system for true late-game players, and fixed problems that were holding the server back.\n\n⚔️ TODAY’S UPDATE:\n• New mods + new world content\n• Major Hynoe Token Shop upgrade\n• Level 50 legendary enchantments\n• More Totems + late-game rewards\n• Boss Shrines + Waystones added to Tokens\n• Hundreds of new Server Shop items\n• Overworld, Nether & End progression improvements\n• Better Combat improvements\n• Exploit + duplication fixes\n• Server balancing and quality-of-life fixes\n\n💰 HYNOE TOKENS\nHynoe Dollars are meant to help players build and progress normally.\n\nHynoe Tokens are different.\n\nTokens are becoming the true late-game currency — earned by players who grind, explore, fight bosses and push deeper into the server. The best rewards are intentionally expensive so they actually mean something when you finally earn them.\n\n🌎 NEW TO HYNOE SMP?\n\nYou don’t have to already know the server to jump in.\n\nHynoe SMP is a long-term modded Minecraft survival server built around exploration, progression, jobs, an economy, player businesses, villages, bosses, powerful equipment, automation and a world we plan to keep building for a long time.\n\nCome watch the server grow — or join us and become part of it.\n\n🌐 SERVER + MODPACK:\nhttps://hynoesmp.com\n\n💬 JOIN THE COMMUNITY:\nhttps://discord.gg/wYTePCkXd5\n\n💜 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nIf you enjoy seeing a Minecraft server actually evolve over time, subscribe and stick around. We’re nowhere near finished.\n\n#Minecraft #MinecraftSMP #ModdedMinecraft\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "New Mods, Tokens & a Bigger Grind | Hynoe SMP Update",
        "description": "New mods and token-shop changes are reshaping the grind on Hynoe SMP. This Minecraft stream replay follows the progression and economy changes we were introducing and testing at this stage of the server.\n\nPublished during the September 2026 update work. Rewards, prices, and balancing can change; current details are on the server website.\n\nMore Hynoe SMP updates and behind the scenes:\nhttps://www.youtube.com/playlist?list=PLBEcWw2l2FS0\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:-o4RZZVfnv8",
      "action": "public_video_metadata",
      "resource_id": "-o4RZZVfnv8",
      "title": "I Built a Minecraft Server… Now I Finally Get to Play It",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "🔥 I FINALLY UNDERSTAND THE SERVER… NOW IT’S TIME TO GRIND | Hynoe Minecraft Server",
        "description": "🔥 **I FINALLY UNDERSTAND THE SERVER… NOW IT’S TIME TO GRIND.**\n\nYesterday we officially started the journey on the Hynoe Minecraft Server.\n\nToday? **I finally understand what’s going on.** 😂🔥\n\nI’ve spent so much time building this server, configuring mods, balancing progression, fixing crashes, setting up the economy, learning Genesis, testing equipment, and figuring out how everything connects that I haven’t really had the chance to just **PLAY**.\n\nThat changes today.\n\nNow that I understand the progression system, the economy, Jobs+, the gear paths, exploration, and what I actually need to be working toward…\n\n**IT’S GRIND TIME.** ⛏️⚔️\n\nToday we’re focusing on actually progressing through the server:\n\n📈 Grinding Genesis Ages\n💼 Leveling Jobs+\n💰 Making money\n⛏️ Gathering resources\n🧭 Exploring the world\n🏰 Finding structures & dungeons\n👹 Fighting new mobs\n⚔️ Upgrading weapons & equipment\n💎 Working toward better gear\n🏪 Building up the economy\n🌾 Expanding farms & automation\n📦 Improving storage & logistics\n🔥 Preparing for bosses & later progression\n\nThe server is designed so you **can’t just rush straight to the strongest equipment.**\n\nEverything connects.\n\n**Explore → Progress → Earn → Upgrade → Trade → Fight → Build → Repeat**\n\nAnd now I finally know what I need to do.\n\n🔥 **THE GRIND STARTS NOW.**\n\nThe long-term goal is still to work our way through the entire progression system:\n\n**VIBRANIUM → VULPUS → ENDERIUM**\n\nAlong with Genesis Ages, bosses, Ancient Cities, the Nether, ocean progression, rare structures, businesses, automation, and eventually the true end game.\n\nDefeating the Ender Dragon is only part of the journey.\n\nThis world is meant to keep growing for a LONG time.\n\n💎 **SUPPORT THE CHANNEL**\n\nIf you’d like to support everything I do — gaming, streaming, skateboarding, photography, and everything else I’m building — you can donate here:\n\nhttps://streamlabs.com/hynoe_geshi\n\n💬 **JOIN THE HYNOE COMMUNITY**\n\nDiscord:\n\nhttps://discord.gg/wYTePCkXd5\n\nIf you want to play on the server, follow the journey, meet the community, or watch this world grow from the beginning, join us.\n\n**Yesterday we launched.\nToday we grind.\nNow the real journey begins.** 🌎🔥\n\nOne Community. Endless Adventures.\n\nI’ll see y’all at the top. 🖤\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "I Built a Minecraft Server… Now I Finally Get to Play It",
        "description": "After all the configuring and testing, I finally get to spend more time playing Minecraft. I'm gathering resources, learning the progression, and working toward better equipment on Hynoe SMP.\n\nFrom setting up the systems to living in the world—this stream replay is where the grind starts making sense.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:KV7jwBls4iU",
      "action": "public_video_metadata",
      "resource_id": "KV7jwBls4iU",
      "title": "Building a Minecraft World Worth Staying In | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "How I’m Building Hynoe SMP Into a Long-Term Minecraft World",
        "description": "Every Hynoe SMP stream adds another piece to the world.\n\nToday we’re progressing, exploring, building, fixing things up, and continuing to grow the server into a long-term modded Minecraft community with campaigns, bosses, economy, jobs, rare gear, player businesses, and huge projects.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Building a Minecraft World Worth Staying In | Hynoe SMP",
        "description": "I want Hynoe SMP to be a Minecraft world we keep coming back to. This session is about the work between the big milestones: playing, exploring, improving the world, and deciding what needs attention next.\n\nSettle in for the full modded survival replay. What makes you stick with one Minecraft world instead of starting over?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:9hBw01ewJfE",
      "action": "public_video_metadata",
      "resource_id": "9hBw01ewJfE",
      "title": "My Friends Are Moving In | Building Our Minecraft World",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Building a Modded Minecraft Empire From Scratch | Hynoe SMP",
        "description": "🎮 **WANT TO JOIN THE HYNOE MODDED MINECRAFT SERVER?**\n\nJoin the Discord here to get the **modpack, server info, IP, updates, and everything you need to play:**\n\nhttps://discord.gg/wYTePCkXd5\n\n🔥 The Hynoe Modded Minecraft Server keeps getting bigger.\n\nYesterday we had our **longest stream yet at 8 HOURS**, explored more of the world, worked on the base, and got more friends moved over to our area.\n\nToday we’re jumping straight back in — expanding the base, progressing through the modpack, exploring, upgrading gear, making money, building the community, and seeing what kind of chaos happens along the way.\n\n🔥 SERVER FEATURES:\n\n💰 Economy & player trading\n💼 Jobs+ professions\n📈 Genesis progression\n🧭 Waystones\n🎒 Traveler’s Backpack\n👹 Alex’s Mobs\n🏰 Dungeons, structures & ruins\n⚔️ Tons of weapons, armor & enchantments\n🏪 Player businesses & shops\n🌎 100+ mods\n👥 Growing multiplayer community\n\nIf you want to actually **join the world you’re watching**, hit the Discord:\n\nhttps://discord.gg/wYTePCkXd5\n\n💎 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\n**One Community. Endless Adventures.**\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My Friends Are Moving In | Building Our Minecraft World",
        "description": "The base is growing and friends are settling nearby. I'm expanding our corner of Hynoe SMP while continuing the modded Minecraft grind and working through more of the world.\n\nWatch the stream replay. What would you build first if your friends started moving into the area around your base?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:opzc4eCiQeQ",
      "action": "public_video_metadata",
      "resource_id": "opzc4eCiQeQ",
      "title": "Finishing the Base That Built Hynoe SMP | Modded Minecraft",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Finishing the Base That Built Hynoe SMP | Modded Minecraft",
        "description": "The Hynoe Modded Minecraft Server is ALMOST READY. 🔥\n\nToday I’m finishing and decorating the base, cleaning up builds, and getting the server closer to where I want it before we really start growing the community.\n\nThis is a long-term modded survival server built around progression, exploration, economy, jobs, huge builds, powerful gear and a world that keeps evolving.\n\n💬 JOIN THE DISCORD / SERVER:\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nCome hang out, give me feedback on the base, and if the server looks like something you'd play — join us.\n\n#Minecraft #MinecraftLive #MinecraftServer #ModdedMinecraft #MinecraftSurvival\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Finishing the Base That Built Hynoe SMP | Modded Minecraft",
        "description": "The big Minecraft build still needs the small details. I'm decorating the Hynoe SMP base, cleaning up unfinished areas, and working on making the whole place feel more complete.\n\nA full building stream replay. Which detail makes the biggest difference in a survival base?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:YGh7kj5Md50",
      "action": "public_video_metadata",
      "resource_id": "YGh7kj5Md50",
      "title": "Can I Beat the Minecraft Campaign I Built? | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Can I Beat the Hynoe SMP Campaign? | Rewards, Realms & Progression",
        "description": "Today we’re jumping into the Hynoe SMP Campaign and actually playing through the progression system we’ve been building.\n\nThe campaign gives players real goals to work toward instead of just spawning in and wondering what to do next. We’ll be completing objectives, progressing through the campaign, unlocking rewards, working toward new realms, and seeing how the whole system feels during real gameplay.\n\nIf you’re new to Hynoe SMP, this is a long-term modded survival server built around progression, exploration, an economy, jobs, bosses, player businesses, communities, automation, powerful gear, huge structures and much more.\n\n🌐 JOIN / DOWNLOAD THE MODPACK:\nhttps://hynoesmp.com\n\n💬 Hynoe SMP Discord:\nhttps://discord.gg/wYTePCkXd5\n\n💰 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\nThe server IP is:\nhynoesmp.com\n\nIf you join and need help getting started, use:\n/trigger hynoe_server_handbook\n\nCome play, build your character, progress through the campaign and become part of the server.\n\n#Minecraft #HynoeSMP #ModdedMinecraft #MinecraftSMP #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Can I Beat the Minecraft Campaign I Built? | Hynoe SMP",
        "description": "I built a campaign for Hynoe SMP—now it's time to play through it. I'm taking on the objectives, working toward rewards, and finding out how the progression feels in our modded Minecraft world.\n\nCatch the stream replay, then follow the campaign journey below. Explore more campaign sessions in the playlist below.\n\nFollow the Hynoe SMP campaign:\nhttps://www.youtube.com/playlist?list=PLMMS96xqHUsE\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:4edQfuJlkmw",
      "action": "public_video_metadata",
      "resource_id": "4edQfuJlkmw",
      "title": "Growing Our Modded Minecraft World Together | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "My Modded Minecraft Server Is Getting Bigger Every Day | Hynoe SMP",
        "description": "The HYNOE Modded Minecraft Server keeps getting bigger — and today we’re LIVE building, exploring, progressing, and shaping this world with the community.\n\n🎮 WANT TO PLAY WITH US?\nJoin the Discord for the modpack, server access, updates, and the people building HYNOE with us:\nhttps://discord.gg/wYTePCkXd5\n\nHYNOE is a long-term modded survival world built around progression, exploration, economy, jobs, bosses, player shops, Waystones, powerful gear, and giving players room to make their own mark.\n\nBuild a base. Grind your way up. Start a business. Explore the world. Meet other players. Or just come hang out while we keep growing the server together.\n\nIf you’re finding HYNOE for the first time today, come say what’s up in chat and tell me what YOU would want to do first on the server.\n\n💜 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #MinecraftLive #MinecraftServer #Hynoe\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Growing Our Modded Minecraft World Together | Hynoe SMP",
        "description": "There's more room to build, more ground to explore, and more of the modpack to work through. I'm spending this Hynoe SMP session on the survival grind with the community around us.\n\nPull up for the stream replay. Follow the series below to see the world grow from its early days.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:6TJVrAEclac",
      "action": "public_video_metadata",
      "resource_id": "6TJVrAEclac",
      "title": "Fixing What's Broken on My Modded Minecraft Server | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Fixing What’s Broken on Hynoe SMP 🔧 | Server Fixes & Updates",
        "description": "Today we’re working behind the scenes on Hynoe SMP — fixing broken features, cleaning up issues, improving systems, and making the server smoother before we keep pushing forward.\n\nThis isn’t just a building stream. We’re actually going through the server, finding what isn’t working right, fixing problems, testing changes, and improving the overall experience for everyone playing.\n\nIf you’re already on the SMP, come hang out and see what’s changing. If you’re new, this is a good time to see how much work is going into building Hynoe SMP into a long-term modded survival server with progression, exploration, economy, custom systems, community projects, and a lot more still coming.\n\n🌐 JOIN / SERVER INFO:\nhttps://hynoesmp.com\n\n💬 HYNOE SMP DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nIf you notice something broken or have feedback while we’re live, let me know in chat.\n\n#Minecraft #MinecraftSMP #ModdedMinecraft #HynoeSMP #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Fixing What's Broken on My Modded Minecraft Server | Hynoe SMP",
        "description": "Running a modded Minecraft server means fixing the parts that break, too. I'm checking problems, testing changes, and working through the issues on Hynoe SMP in this behind-the-scenes stream replay.\n\nCome see the work behind keeping the world going. Playing on the server? Share current bug reports through the community links below.\n\nMore Hynoe SMP updates and behind the scenes:\nhttps://www.youtube.com/playlist?list=PLBEcWw2l2FS0\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:yfuq9YMt_g0",
      "action": "public_video_metadata",
      "resource_id": "yfuq9YMt_g0",
      "title": "My Minecraft Farm Wasn't Big Enough | Hynoe SMP Farm Part 2",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "The Farm Wasn’t Big Enough… So We’re EXPANDING IT | Hynoe SMP Farm Pt. 2",
        "description": "The Hynoe SMP farm is only getting bigger.\n\nYesterday we started building out the farm with crops, animals, and everything we need to keep the base growing. Today is PART 2 — more crops, more animals, more building, and turning this area into something that actually feels like a proper part of the world.\n\nIf this is your first Hynoe SMP stream, this isn’t just a normal Minecraft survival world. Hynoe SMP is a long-term modded survival server built around progression, exploration, economy, jobs, bosses, powerful gear, Minecraft Comes Alive, player businesses, villages, massive builds and a world we plan on playing for a LONG time.\n\nYou don’t have to just watch either — Hynoe SMP is open for players who want to actually become part of the world.\n\n🌎 PLAY HYNOE SMP\nhttps://hynoesmp.com\n\nThe website now walks you through installing the Hynoe SMP modpack with Modrinth, so you don’t have to manually mess around with your Minecraft mods folder.\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM / SERVER\nhttps://streamlabs.com/hynoe_geshi\n\nIf you're new, say something in chat and tell me what you’d build first if you joined the server.\n\nToday’s mission:\n🌾 Expand the crop fields\n🐄 Build out the animal side of the farm\n🏡 Make the farm actually fit the base\n📈 Keep pushing Hynoe SMP forward\n\nSubscribe if you want to watch this world grow from where it is now into something massive.\n\n#Minecraft #MinecraftSMP #ModdedMinecraft #HynoeSMP #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My Minecraft Farm Wasn't Big Enough | Hynoe SMP Farm Part 2",
        "description": "The farm needs more room. In part 2 of the Hynoe SMP farm build, I'm expanding the crop and animal areas and working on making the whole setup fit the base.\n\nWatch the full Minecraft building replay. The first farm session is linked below, so you can follow the project from the start.\n\nStart with the original farm build:\nhttps://www.youtube.com/watch?v=ENPzt7DoWKU\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:FxFsSI0OPqU",
      "action": "public_video_metadata",
      "resource_id": "FxFsSI0OPqU",
      "title": "Hunting Spartan Cores | Halo Infinite Campaign Part 7",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough Part 7- Spartan Cores",
        "description": "Support the stream: https://streamlabs.com/hynoe_geshi What's up yall we are back playing Halo Infinite Campaign and today we are grabbing spartan cores!!\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Hunting Spartan Cores | Halo Infinite Campaign Part 7",
        "description": "Spartan Cores are the focus in part 7 of my Halo Infinite campaign playthrough. I'm heading back into the game to work on that hunt and keep the run moving.\n\nWatch the full April 2022 stream replay, with the original gameplay and commentary. Earlier sessions are linked below.\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:3IQpeV2i4Tc",
      "action": "public_video_metadata",
      "resource_id": "3IQpeV2i4Tc",
      "title": "Gears of War: E-Day on Insane — I Can’t Stop Playing",
      "topic": "Gears",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "GEARS OF WAR: E-DAY on INSANE Difficulty 🔥 I CAN’T STOP PLAYING THIS",
        "description": "We’re back on **Gears of War: E-Day** and continuing the campaign on **INSANE difficulty**. 🔥\n\nI’m actually having way too much fun with this game, so today we’re pushing even deeper into the story and seeing how far we can make it.\n\nExpect tough fights, clutch moments, some deaths 😂 and plenty of Gears chaos.\n\nHuge shoutout to Alex for donating the game and putting me onto it. 🙏🏾\n\n💰 **Support the stream / donate:**  \nhttps://streamlabs.com/hynoe_geshi\n\n🎮 Want to see me play a certain game?  \nDonate toward it or game share it with me and I may run it on stream.\n\n💬 **Join the Discord:**  \nhttps://discord.gg/wYTePCkXd5\n\n👍 Like the stream  \n💬 Come talk to me in chat  \n🔔 Subscribe so you don’t miss the next one\n\n#GearsofWar #GearsOfWarEDay #InsaneDifficulty #Xbox #Gaming #LiveGaming #Hynoe"
      },
      "target": {
        "title": "Gears of War: E-Day on Insane — I Can’t Stop Playing",
        "description": "I'm having too much fun with Gears of War: E-Day to put it down. The Insane difficulty campaign continues in this stream replay, with the gameplay and my reactions as they happened.\n\nBig thanks to Alex for gifting the game and getting this run started. What difficulty are you playing on?\n\nMore from the Gears of War: E-Day playthrough:\nhttps://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#GearsOfWarEDay #GearsOfWar #InsaneDifficulty"
      }
    },
    {
      "key": "video:UIpDma0r8UQ",
      "action": "public_video_metadata",
      "resource_id": "UIpDma0r8UQ",
      "title": "Rare Gear & a Changing World | Modded Minecraft on Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "100+ Mods, Bosses & Rare Loot Changed Our Minecraft Server | Hynoe SMP",
        "description": "🔴 WE’RE LIVE ON THE HYNOE MODDED MINECRAFT SERVER!\n\nToday we’re jumping back into the server and continuing the grind through our long-term modded survival world.\n\nWe’ve been making some HUGE server changes lately — balancing progression, improving the server shop, adjusting rare ores, fixing crafting systems, resetting world content, and making sure the endgame actually takes time to reach.\n\n🔥 SERVER FEATURES:\n\n⚔️ Massive armor & weapon progression\n💎 Vibranium → Vulpus → Enderium → World Breaker\n👹 Bosses, champions & dangerous mobs\n🏰 Dungeons, structures & ruins\n💰 Player economy & server shop\n💼 Jobs+\n📈 Genesis progression\n🧭 Waystones\n🎒 Traveler’s Backpacks\n🏪 Player trading & businesses\n🌎 100+ mods\n🔥 Long-term survival progression\n\nWant to join the server?\n\n🎮 JOIN THE DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\nDownload the modpack, get the server info, meet the community, and come play with us.\n\n💎 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\nOne Community. Endless Adventures.\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Rare Gear & a Changing World | Modded Minecraft on Hynoe SMP",
        "description": "The gear grind is changing as Hynoe SMP develops. I'm back in modded Minecraft with equipment progression, rare ores, and the economy all part of what we're working toward.\n\nThis full replay reflects an earlier stage of server balancing. Equipment paths and rewards may differ from the current version.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:ndk2vyb2c0c",
      "action": "public_video_metadata",
      "resource_id": "ndk2vyb2c0c",
      "title": "Gears of War: E-Day on Insane | Campaign Stream Replay",
      "topic": "Gears",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "GEARS OF WAR: E-DAY on INSANE Difficulty 🔥 We’re Locked In",
        "description": "We’re back on Gears of War: E-Day and continuing the campaign on INSANE difficulty. The challenge is real, but we’re locked in and having fun pushing through it.\n\nI’m playing Gears of War: E-Day and pushing the campaign on Insane difficulty for the challenge, story and co-op moments.\n\n💬 https://discord.gg/wYTePCkXd5\n💛 https://streamlabs.com/hynoe_geshi\n▶️ https://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\n#GearsOfWarEDay #GearsOfWar #Gaming #Hynoe"
      },
      "target": {
        "title": "Gears of War: E-Day on Insane | Campaign Stream Replay",
        "description": "We're locked into the Gears of War: E-Day campaign on Insane difficulty. I'm here for the challenge and the story, but mostly because I'm enjoying the game.\n\nSettle in for this full campaign stream replay. Earlier sessions are linked below for anyone catching up on the run.\n\nMore from the Gears of War: E-Day playthrough:\nhttps://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#GearsOfWarEDay #GearsOfWar #InsaneDifficulty"
      }
    },
    {
      "key": "video:ENPzt7DoWKU",
      "action": "public_video_metadata",
      "resource_id": "ENPzt7DoWKU",
      "title": "All This Minecraft Progress… and Still No Proper Farm",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "The Server Can't Progress Without Farms... | Hynoe SMP",
        "description": "🌾 THE SERVER NEEDS A REAL FARM.\n\nWe've spent a lot of time progressing through Hynoe SMP, building up the base, working with villagers, exploring the modpack, upgrading gear, and figuring out what this world actually needs next.\n\nAnd somehow...\n\nI STILL DON'T HAVE A PROPER FARM. 😂\n\nSo today we're fixing that.\n\nThis isn't just me throwing down a few crops and calling it finished either. I want to start building an actual farming area that fits into the world we're creating — crops, animals, food production, renewable resources, and something we can continue expanding as the server grows.\n\n🌾 TODAY'S GOAL\n\nWe're working on:\n\n• Building the main crop farm\n• Setting up animal pens\n• Bringing in cows, pigs, sheep, chickens and whatever else we need\n• Creating a reliable food supply\n• Getting renewable farming resources established\n• Making the farm actually look like part of the base\n• Breeding animals and growing the population\n• Planning room for future expansion\n• Improving the surrounding area as we build\n• Setting up another important piece of the server's infrastructure\n\nThis is one of those builds that doesn't look like \"end-game progression\" at first...\n\nBut everything we're doing later depends on having the basics handled first.\n\nFood.\nAnimals.\nCrops.\nResources.\nVillagers.\nStorage.\nAutomation.\n\nIt all starts connecting together.\n\n⚒️ THIS IS WHAT HYNOE SMP IS ABOUT\n\nIf you're finding the channel for the first time, Hynoe SMP is a long-term modded Minecraft survival world/server that we're building and progressing through together.\n\nThis isn't a world where the goal is just:\n\nSpawn → get diamonds → kill the Ender Dragon → quit.\n\nWe're building something that's supposed to keep growing.\n\nThere are different progression systems, new equipment, ores, jobs, an economy, player businesses, villagers, exploration, structures, dungeons, bosses, automation, massive builds and a lot more that we're still discovering and developing as we play.\n\nThe world isn't finished.\n\nThat's part of the point.\n\nYou're watching it get built from the ground up.\n\nEvery stream adds another piece.\n\nToday, that piece is the farm. 🌾🐄\n\nAnd once this is done, we can keep pushing into the bigger projects.\n\n━━━━━━━━━━━━━━━━━━━━\n\n🌎 PLAY HYNOE SMP\n\nWant to actually join the server instead of only watching us build it?\n\nServer website:\nhttps://hynoesmp.com\n\nThat's the main place to learn about Hynoe SMP and get started.\n\n━━━━━━━━━━━━━━━━━━━━\n\n💬 JOIN THE HYNOE COMMUNITY\n\nCome into the Discord, meet everybody playing on the server, ask questions, share your builds and keep up with what's happening between streams.\n\nDiscord:\nhttps://discord.gg/wYTePCkXd5\n\nEven if you're brand new, come through. You don't need to already know the modpack or have some insane Minecraft build ready.\n\nA lot of us are still learning and progressing through the world together.\n\n━━━━━━━━━━━━━━━━━━━━\n\n❤️ SUPPORT THE CHANNEL\n\nIf you're enjoying the streams and want to directly support what I'm building — the server, content, streaming setup and everything else around Hynoe — you can leave a tip here:\n\nhttps://streamlabs.com/hynoe_geshi\n\nWatching, liking, subscribing and hanging out during the stream helps too. 🤝\n\n━━━━━━━━━━━━━━━━━━━━\n\n🌾 THE FARM STARTS TODAY.\n\nAnimals.\nCrops.\nFood.\nResources.\n\nAnother piece of Hynoe SMP gets built.\n\nLet's get to work. ⛏️\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #MinecraftServer #SurvivalMinecraft #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "All This Minecraft Progress… and Still No Proper Farm",
        "description": "We've worked on gear, villagers, and the base—but somehow we still need a proper Minecraft farm. I'm starting the crop fields and animal setup on Hynoe SMP so the bigger projects have food and resources behind them.\n\nCatch the full farm-building stream replay, then continue with the expansion in part 2 below.\n\nWatch the farm expansion in part 2:\nhttps://www.youtube.com/watch?v=yfuq9YMt_g0\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:iRhkfKl2M28",
      "action": "public_video_metadata",
      "resource_id": "iRhkfKl2M28",
      "title": "My First Time Playing High on Life | Playthrough Part 1",
      "topic": "High on Life",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "High on Life Walkthrough Part 1 | Full Gameplay Livestream",
        "description": "Yo it's Geshi and today we are Playing High on Life for the first time! I hope you all enjoy. Have a wonderful day!\n\nThank you all for watching and have a wonderful day!\n\n For all updates on Hynoe make sure yall join the discord server \nhttps://discord.gg/wYTePCkXd5\n\nFeel free to support the channel by liking, leaving a comment, or subscribing to the channel! Thank you!!\n\n━━━━━━━━━━━━━━━━━━\nHigh on Life archive replay from Hynoe.\n\n▶️ WATCH THE FULL HIGH ON LIFE SERIES\nhttps://www.youtube.com/playlist?list=PLbAf2oQTYw9c\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My First Time Playing High on Life | Playthrough Part 1",
        "description": "My first time playing High on Life starts here. Catch my original reactions as I get into the game in part 1 of the playthrough.\n\nThis is the full January 2023 stream replay. Settle in for the opening session, then continue with part 2 below.\n\nContinue with part 2:\nhttps://www.youtube.com/watch?v=9ZKFT7KYGcU\n\nMore from the High on Life playthrough:\nhttps://www.youtube.com/playlist?list=PLbAf2oQTYw9c\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HighOnLife #Gameplay #Hynoe"
      }
    },
    {
      "key": "video:pULE2g2kOxI",
      "action": "public_video_metadata",
      "resource_id": "pULE2g2kOxI",
      "title": "Bringing Fall to Minecraft | Hynoe Harvest 2026",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Hynoe SMP FALL UPDATE Is LIVE! 🍂 New Rewards, Seasonal Events & Autumn Ambience",
        "description": "The Fall Update is officially live on Hynoe SMP 🍂\n\nI’ve been working behind the scenes getting the server ready for the season, and now the world is starting to actually feel different.\n\nThis update includes:\n🍁 Hynoe Harvest\n🌙 Longer Nights\n🎃 After Dark\n🏡 Homecoming\n🏆 Limited seasonal rewards\n🪙 Hynoe Token rewards\n👹 Rare mob hunt challenges\n🌾 Seasonal farming objectives\n🍂 Autumn ambience, falling leaves, and fall-themed visuals\n\nThe goal was to make the server feel alive for the season without messing up the main Hynoe SMP progression, economy, bosses, and long-term world.\n\n🌐 Server Website:\nhttps://hynoesmp.com\n\n💬 Discord:\nhttps://discord.gg/wYTePCkXd5\n\n❤️ Donate / Support the Server:\nhttps://streamlabs.com/hynoe_geshi\n\nIf you want to be part of a long-term modded survival world with progression, economy, exploration, bosses, businesses, and seasonal content, tap in now.\n\n#HynoeSMP #MinecraftSMP #ModdedMinecraft #MinecraftServer #MinecraftUpdate\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Bringing Fall to Minecraft | Hynoe Harvest 2026",
        "description": "I'm working on bringing fall to Hynoe SMP: Hynoe Harvest, autumn visuals, farming goals, and seasonal rewards. This Minecraft stream replay follows the ideas and rollout behind our Fall 2026 update.\n\nPublished during the September 2026 rollout. Seasonal features and rewards can change; current event information is on the server website below.\n\nMore Hynoe SMP updates and behind the scenes:\nhttps://www.youtube.com/playlist?list=PLBEcWw2l2FS0\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:dNIpuRFpDfA",
      "action": "public_video_metadata",
      "resource_id": "dNIpuRFpDfA",
      "title": "Our Modded Minecraft Journey Starts Here | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Our Modded Minecraft Server Journey Starts Here | Hynoe SMP",
        "description": "The Hynoe Minecraft Server is officially live — now it’s time to START THE JOURNEY. 🌎🔥\n\nAfter all the planning, testing, balancing, modding, building, configuring, crashing, fixing, and upgrading, we can finally jump into the world and actually experience everything we’ve been building.\n\nWhat started as my personal Minecraft world has become a huge long-term modded survival server built around progression, exploration, economy, jobs, bosses, player businesses, communities, powerful equipment, massive structures, automation, and much more.\n\n🔥 SERVER FEATURES:\n\n💰 EconomyCraft currency & player economy\n💼 Jobs+ professions & progression\n📈 Genesis Age progression\n🏪 Player shops, trading & businesses\n👨‍🌾 Villagers & trading\n🧭 Waystones & exploration\n🎒 Traveler’s Backpacks\n📦 Compact Storage & Logistics\n🌾 Farming systems & automation\n🏰 Massive structures, dungeons & ruins\n👹 New mobs & multiple bosses\n⚔️ Better Combat & expanded weapons\n🏹 New bows & ranged combat\n🛡️ More Totems & specialized equipment\n💎 Immersive Ores\n✨ Mythic Upgrades & gemstone abilities\n⚔️ Vibranium → Vulpus → Enderium progression\n🌊 Ocean progression\n🌑 Ancient Cities & Sculk progression\n🔥 Nether progression\n🐉 End-game progression\n🌎 Overhauled world generation\n📖 Full in-game Hynoe Server Handbook\n💵 Cash rewards for major Genesis milestones\n🔥 And a TON more\n\n📈 PROGRESSION MATTERS\n\nThis isn’t a server where you join and immediately rush straight to the strongest gear.\n\nGenesis controls progression through major Ages while the economy, Jobs+, exploration, bosses, and modded equipment give you something to constantly work toward.\n\nExplore → Progress → Earn → Upgrade → Trade → Fight → Build → Repeat\n\nThere should always be another goal.\n\n💰 BUILD YOUR OWN PATH\n\nBecome a fighter, miner, farmer, builder, explorer, merchant, boss hunter, collector, community builder, job specialist — or a little bit of everything.\n\nPlayers can build shops, create businesses, trade resources, specialize in different jobs, and eventually build entire economies and communities inside the world.\n\n🏆 TRUE END GAME\n\nDefeating the Ender Dragon isn’t where this server ends.\n\nLate-game progression continues into powerful modded equipment, harder bosses, rare structures, advanced automation, large-scale businesses, massive builds, and equipment tiers such as:\n\nVIBRANIUM → VULPUS → ENDERIUM\n\nThe goal is to create a world where there is ALWAYS something to build, explore, fight, earn, trade, upgrade, or work toward.\n\nThis is just the beginning.\n\n💎 SUPPORT THE CHANNEL\n\nIf you’d like to support everything I do — from gaming and streaming to skateboarding and photography — you can donate below. My goal is to eventually create and produce content full time!\n\nSupport the stream:\nhttps://streamlabs.com/hynoe_geshi\n\n💬 JOIN THE HYNOE COMMUNITY\n\nDiscord:\nhttps://discord.gg/wYTePCkXd5\n\nIf you want to play on the server, follow its development, meet the community, or be involved as it grows, make sure you join the Discord.\n\nEvery view, like, comment, subscription, and donation helps more than you know.\n\nOne Community. Endless Adventures.\n\nI’ll see y’all at the top. 🖤\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Our Modded Minecraft Journey Starts Here | Hynoe SMP",
        "description": "The server is up, and it's time to start living in the Minecraft world we've been building. I'm getting established and finding my way through the modpack in this early Hynoe SMP stream replay.\n\nFollow the survival journey from the beginning. Features shown here reflect the original server version and may have changed.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:DZ5DA14lF5w",
      "action": "public_video_metadata",
      "resource_id": "DZ5DA14lF5w",
      "title": "Turning Minecraft Builds Into a World | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "I’M TRANSFORMING MY MODDED MINECRAFT SERVER 🔥 | Hynoe SMP",
        "description": "🔥 THE HYNOE WORLD IS CHANGING.\n\nToday we’re back on the Hynoe Modded Minecraft Server finishing builds, decorating the world, and making the server feel more complete.\n\nThis isn’t just about throwing blocks down anymore — we’re turning the server into an actual world people want to explore, build in, grind in, and be part of.\n\n⚒️ TODAY:\n• Finishing unfinished builds\n• Decorating and improving the server\n• Upgrading the area around the portal\n• Continuing the long-term Hynoe world\n\n🌎 Want to join the server?\nJoin the Hynoe Discord:\nhttps://discord.gg/wYTePCkXd5\n\n💎 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\nIf you like modded Minecraft, progression, economy, exploration, huge builds and long-term multiplayer survival, subscribe and come be part of the world.\n\n#Minecraft #ModdedMinecraft #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Turning Minecraft Builds Into a World | Hynoe SMP",
        "description": "Unfinished builds, decoration, and the portal area all need some attention. I'm working on the look and feel of Hynoe SMP so the separate Minecraft builds start to feel like one place.\n\nCatch the stream replay and watch the world take shape between the larger projects.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:_KMshZFGDxk",
      "action": "public_video_metadata",
      "resource_id": "_KMshZFGDxk",
      "title": "Inside Hynoe SMP: Campaigns, Bosses, Economy & Rare Gear",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Inside Hynoe SMP: Campaigns, Bosses, Economy & Rare Gear",
        "description": "What actually makes Hynoe SMP different from a normal Minecraft survival server?\n\nThe server is built around a connected progression loop: campaign objectives, bosses, jobs, economy, exploration, rare ores and gear, player shops, structures, and long-term community building.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\nIf you want a modded Minecraft SMP where there is always another goal to chase, this stream gives you a look at the world we’re building.\n\n#Minecraft #MinecraftSMP #ModdedMinecraft #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Inside Hynoe SMP: Campaigns, Bosses, Economy & Rare Gear",
        "description": "A look inside Hynoe SMP: modded Minecraft survival built around campaign objectives, bosses, jobs, an economy, exploration and rare gear. This replay shows the world and systems we’re building.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent server information and modpack:\nhttps://hynoesmp.com\n\nJoin the community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:PtsRdWK1IB4",
      "action": "public_video_metadata",
      "resource_id": "PtsRdWK1IB4",
      "title": "How Far Can We Push This Minecraft Campaign? | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Pushing Deeper Into the Hynoe SMP Campaign — How Far Can We Get?",
        "description": "We’re back on the Hynoe SMP and continuing through the CAMPAIGN! 🔥\n\nToday we’re pushing deeper into the progression system, completing more challenges, earning rewards, and seeing how far we can make it through the campaign.\n\nIf you’re new here, Hynoe SMP is a long-term modded Minecraft survival server built around progression, exploration, an economy, jobs, bosses, player businesses, powerful gear, huge structures and a full campaign to keep you moving forward.\n\n🌎 JOIN HYNOE SMP:\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\n💰 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nCome join the server, start your own campaign, and see if you can catch up with us. 👀\n\n#Minecraft #HynoeSMP #ModdedMinecraft #MinecraftSurvival #MinecraftSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "How Far Can We Push This Minecraft Campaign? | Hynoe SMP",
        "description": "More campaign objectives, more reasons to keep the Minecraft grind going. I'm pushing farther into Hynoe SMP's progression and working toward the next rewards in this stream replay.\n\nFollow the campaign playlist to catch the earlier sessions. Which objectives do you enjoy most: combat, gathering, or exploration?\n\nFollow the Hynoe SMP campaign:\nhttps://www.youtube.com/playlist?list=PLMMS96xqHUsE\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:2ZKVaOuTm9I",
      "action": "public_video_metadata",
      "resource_id": "2ZKVaOuTm9I",
      "title": "Pushing Through the Story | Halo Infinite Campaign Part 6",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough Part 6 making insane amounts of progress",
        "description": "What's up yall we are back playing Halo Infinite Campaign and man are we flying through this game!! It's such a fun game I definitely recommend it!\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Pushing Through the Story | Halo Infinite Campaign Part 6",
        "description": "We're making our way farther through the Halo Infinite campaign in part 6. I'm enjoying the run and continuing the story in this stream replay from April 2022.\n\nFollow the playthrough from my first Halo session using the series below.\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:OsXXFm8F9-M",
      "action": "public_video_metadata",
      "resource_id": "OsXXFm8F9-M",
      "title": "No Big Mission. Just Modded Minecraft. | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "No Big Mission — Just Living in Our Modded Minecraft World | Hynoe SMP",
        "description": "Not every Hynoe SMP stream needs one giant mission. This one is about actually living in the world: building, exploring, progressing, hanging out, and working on whatever catches our attention next.\n\nHynoe SMP is a long-term modded Minecraft server with campaign progression, bosses, economy, jobs, rare gear, player businesses, automation, exploration, and community builds.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #MinecraftSMP #ModdedMinecraft #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "No Big Mission. Just Modded Minecraft. | Hynoe SMP",
        "description": "No giant mission this time—just living in our modded Minecraft world. I'm spending this Hynoe SMP session building, exploring, and working on whatever needs attention along the way.\n\nA laid-back stream replay for the everyday side of survival. Settle in and hang out with us.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:9WE5wdPY5dI",
      "action": "public_video_metadata",
      "resource_id": "9WE5wdPY5dI",
      "title": "My First Time Playing Halo… Ever | Halo Infinite Campaign",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough Live",
        "description": "Geshi plays Halo infinite Campaign for the first time however not only is it his first time playing Halo infinite it is his first time playing Halo EVER!!\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My First Time Playing Halo… Ever | Halo Infinite Campaign",
        "description": "My first time playing Halo—not just Halo Infinite, but Halo at all. This is where my campaign playthrough begins, with my original reactions and commentary.\n\nWatch the full first-session replay from March 2022, then continue the journey below.\n\nContinue with part 2:\nhttps://www.youtube.com/watch?v=DXC5OSN8mrs\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:oETynDMeOGw",
      "action": "public_video_metadata",
      "resource_id": "oETynDMeOGw",
      "title": "Minecraft Comes Alive Is Turning My Base Into a Village",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Minecraft Comes Alive Is Taking Over My Base... | Hynoe SMP",
        "description": "Minecraft Comes Alive is completely changing my base.\n\nToday we're expanding the village, building out homes for the villagers, growing the community, and seeing how far we can push the village-life side of Hynoe SMP.\n\n🌎 DOWNLOAD THE MODPACK + JOIN HYNOE SMP\nhttps://hynoesmp.com\n\n🎮 SERVER IP\nhynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM / SERVER\nhttps://streamlabs.com/hynoe_geshi\n\n━━━━━━━━━━━━━━━━━━\n\nTODAY IN HYNOE SMP:\n• Expand the villager neighborhood\n• Work deeper into Minecraft Comes Alive\n• Grow the settlement around my base\n• Keep progressing through the Hynoe SMP world\n• Get more players involved in the server\n\nHynoe SMP is a long-term modded Minecraft survival server built around progression, exploration, economy, villages, bosses, rare gear, player communities, and a world meant to last.\n\nEverything you need — modpack download, progression guide, Minecraft Comes Alive guide, server information and updates — is at:\n\nhttps://hynoesmp.com\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #HynoeSMP #MinecraftComesAlive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Minecraft Comes Alive Is Turning My Base Into a Village",
        "description": "Minecraft Comes Alive is turning the base into more of a settlement. I'm expanding the villager homes and working on the village-life side of Hynoe SMP in this stream replay.\n\nCome watch the neighborhood grow. What building would you add for the villagers next?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #MinecraftComesAlive #HynoeSMP"
      }
    },
    {
      "key": "video:oWrPf47kMUQ",
      "action": "public_video_metadata",
      "resource_id": "oWrPf47kMUQ",
      "title": "Trying to Optimize a 100+ Mod Minecraft Server | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "I Tried to Fully Optimize My 100+ Mod Minecraft Server | Hynoe SMP",
        "description": "🔥 THE HYNOE MODDED MINECRAFT SERVER IS ALMOST FULLY OPTIMIZED!\n\nWe’ve been testing, balancing, fixing progression, adjusting the economy, working on ore rarity, mobs, server performance, and getting the entire experience ready for more players.\n\nToday we’re jumping back in, continuing the grind, testing the latest changes, and getting the server closer to being fully ready for everyone.\n\n🌎 WANT TO JOIN THE SERVER?\n\nJoin the Discord first:\nhttps://discord.gg/wYTePCkXd5\n\n💎 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\nThe Discord has the modpack, server information, rules, updates, announcements, and everything you need to get into the server.\n\nIf you’ve been waiting to join, NOW is a great time to get established before the server gets even busier.\n\n🔥 SERVER FEATURES:\n\n💰 Player economy & server shops\n💼 Jobs & progression\n⚔️ Custom ores, armor & equipment\n🏰 Dungeons, structures & ruins\n👹 New mobs & bosses\n🧭 Exploration & Waystones\n🎒 100+ mods\n🏪 Player trading & businesses\n🌎 Long-term multiplayer survival\n\nCome join the world and be part of the community as we continue building the server.\n\nOne Community. Endless Adventures.\n\n#Minecraft #ModdedMinecraft #MinecraftServer #MinecraftLive #SMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Trying to Optimize a 100+ Mod Minecraft Server | Hynoe SMP",
        "description": "A 100+ mod Minecraft server means a lot of systems to balance. I'm testing progression, the economy, ore rarity, mobs, and performance as Hynoe SMP takes shape.\n\nWatch the testing and troubleshooting in this stream replay. These are the changes we were working through at this stage of the server.\n\nMore Hynoe SMP updates and behind the scenes:\nhttps://www.youtube.com/playlist?list=PLBEcWw2l2FS0\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:yRGSFU0wfLo",
      "action": "public_video_metadata",
      "resource_id": "yRGSFU0wfLo",
      "title": "Building, Exploring & Getting Established | Modded Minecraft",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Building, Exploring & Pushing Progression on Hynoe SMP",
        "description": "We’re back in Hynoe SMP pushing the world forward through building, exploration, farming, progression, and whatever the modpack throws at us next.\n\nHynoe SMP is a long-term modded Minecraft survival server built around campaigns, bosses, jobs, economy, rare gear, player businesses, structures, and a world designed to keep growing.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #MinecraftSMP #ModdedMinecraft #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Building, Exploring & Getting Established | Modded Minecraft",
        "description": "Some Minecraft sessions are about a little of everything. I'm back on Hynoe SMP for building, exploration, and progression as we keep putting more work into the world.\n\nA stream replay from our long-term modded survival series. Hang out and see what gets attention between the bigger projects.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:x2ZYTHfkn4U",
      "action": "public_video_metadata",
      "resource_id": "x2ZYTHfkn4U",
      "title": "Trying to Get Through This Level | Halo Infinite Campaign Part 5",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough Part 5 getting through this level",
        "description": "What's up yall we are back playing Halo Infinite Campaign Trying to beat these intense levels.\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Trying to Get Through This Level | Halo Infinite Campaign Part 5",
        "description": "Back in Halo Infinite for part 5, working through the campaign and trying to get past the challenge in front of us. Catch the attempts and commentary in this stream replay.\n\nPublished in March 2022 during my first Halo run. The earlier sessions are linked below.\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:qylA-J2cxic",
      "action": "public_video_metadata",
      "resource_id": "qylA-J2cxic",
      "title": "Upgrading the Server Behind Our Minecraft World | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "We MASSIVELY Upgraded Our Modded Minecraft Server! | Hynoe SMP",
        "description": "🔥 **THE HYNOE MODDED MINECRAFT SERVER JUST GOT A MASSIVE UPGRADE!** 🔥\n\nThe server is growing, more players are joining, and today we’re jumping back in with **MORE POWER** behind the Hynoe Minecraft Server.\n\nWe’ve upgraded the server hardware to give us more room for players, exploration, progression, builds, mobs, farms, businesses, and everything else this world is becoming.\n\n🌎 **THE SERVER FEATURES:**\n\n💰 EconomyCraft & player economy\n💼 Jobs+ professions & progression\n📈 Genesis Progression\n🏪 Player shops, trading & businesses\n👨‍🌾 Villagers & trading\n🧭 Waystones & exploration\n🎒 Traveler’s Backpacks\n📦 Storage & logistics\n🌾 Farming & automation\n🏰 Massive structures, dungeons & ruins\n👹 New mobs & bosses\n⚔️ Better Combat & expanded weapons\n✨ Powerful enchantments & equipment\n🌎 **100+ mods**\n\nThis isn't just a world we're playing for a few weeks. **Hynoe is being built as a long-term modded Minecraft community** where players can grind, explore, build businesses, become powerful, create communities, conquer bosses, and leave their mark on the world.\n\n🔥 **WANT TO JOIN THE HYNOE MODDED MINECRAFT SERVER?**\n\nJoin the Discord to **download the modpack**, get the server information, read the guides, receive updates, and join the community:\n\n**Discord:**\nhttps://discord.gg/wYTePCkXd5\n\n💎 **SUPPORT THE CHANNEL:**\n\nIf you'd like to support the streams, server, and everything we're building:\n\n**Streamlabs:**\nhttps://streamlabs.com/hynoe_geshi\n\nIf you enjoy the stream, make sure to **LIKE, SUBSCRIBE, and join us for the journey.**\n\n**One Community. Endless Adventures.**\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Upgrading the Server Behind Our Minecraft World | Hynoe SMP",
        "description": "Hynoe SMP has had a hardware upgrade, and I'm heading back into the Minecraft world. More room for the community, builds, and exploration is what we're working toward.\n\nThis stream replay captures an early step in growing the server. Hardware and server details discussed here are historical.\n\nMore Hynoe SMP updates and behind the scenes:\nhttps://www.youtube.com/playlist?list=PLBEcWw2l2FS0\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:Wkl4QHGYHJM",
      "action": "public_video_metadata",
      "resource_id": "Wkl4QHGYHJM",
      "title": "Back to Exploring Our Modded Minecraft World | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "The Modded Minecraft Adventure Keeps Getting Bigger | Hynoe SMP",
        "description": "The grind continues on the Hynoe Modded Minecraft Server! Today we’re jumping back into the world to explore, progress, improve the base, face new dangers, and see what this massive modpack throws at us next.\n\nThis is a long-term modded survival server featuring:\n\n⚔️ Powerful weapons and armor\n🏰 Massive structures and dungeons\n👹 New mobs and bosses\n📈 Genesis progression\n💰 Player economy and jobs\n🧭 Exploration and Waystones\n🏪 Player trading and businesses\n🌎 More than 100 mods\n\n🔥 WANT TO JOIN THE SERVER?\n\nDownload the modpack, meet the community, and get the server information through Discord:\n\nhttps://discord.gg/wYTePCkXd5\n\n💎 SUPPORT THE STREAM:\n\nhttps://streamlabs.com/hynoe_geshi\n\nSubscribe and join us as we continue building one of the biggest modded Minecraft adventures yet.\n\nOne Community. Endless Adventures.\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Back to Exploring Our Modded Minecraft World | Hynoe SMP",
        "description": "There's still more of Hynoe SMP to explore. I'm returning to the modded Minecraft grind, working on the base, and seeing where the next stretch of progression takes us.\n\nCatch the stream replay, then follow the early survival sessions in the series below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:ANm85qJowis",
      "action": "public_video_metadata",
      "resource_id": "ANm85qJowis",
      "title": "Giving My Minecraft Villagers a Real Neighborhood | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "BUILDING A VILLAGER NEIGHBORHOOD IN MY BASE! | Hynoe SMP",
        "description": "Today we’re expanding the Hynoe world and finally giving the villagers a proper place to live.\n\nI’m building out a full villager housing area inside/around the base and getting everything ready for the population to start growing with Minecraft Comes Alive.\n\nThis is another big step toward turning this base into an actual living city instead of just a giant build.\n\n🏠 Villager Homes\n👥 Growing the Village\n🏰 Expanding the Base\n⚙️ Modded Survival Progression\n\nWant to play on the server and be part of the world?\n\nJOIN THE DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\nSUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nCome hang out, give me ideas for the villager area, and watch the base keep evolving.\n\n#Minecraft #ModdedMinecraft #MinecraftLive #MinecraftBuilds #MinecraftComesAlive #SurvivalMinecraft\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Giving My Minecraft Villagers a Real Neighborhood | Hynoe SMP",
        "description": "The villagers need somewhere to live. I'm building a housing area around the base and making room for a growing Minecraft Comes Alive neighborhood on Hynoe SMP.\n\nWatch the stream replay as we work on turning the base into a place for villagers, not just a collection of buildings.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #MinecraftComesAlive #HynoeSMP"
      }
    },
    {
      "key": "video:w3LGdL0nELA",
      "action": "public_video_metadata",
      "resource_id": "w3LGdL0nELA",
      "title": "Farming for Blockheads — Upgrading My Minecraft Farm",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Farming for Blockheads Is Taking Over Hynoe SMP! 🌾",
        "description": "🌾 FARMING FOR BLOCKHEADS TAKES OVER HYNOE SMP!\n\nToday we’re diving into Farming for Blockheads and expanding the farming side of Hynoe SMP.\n\nThis isn’t just normal Minecraft farming. Farming for Blockheads adds an entire farming system around things like the Market, seed and sapling trading, sprinklers, fertilizers, Chicken Nests, Feeding Troughs and more — and today we’re putting those systems to work on the SMP.\n\nIf you’ve never seen Hynoe SMP before, welcome.\n\nHynoe SMP is a long-term modded survival server built around progression, exploration, an economy, jobs, bosses, powerful gear, player businesses, communities, automation and massive builds. The goal is to create a world where there is ALWAYS something worth working toward.\n\n🌐 JOIN / DOWNLOAD THE MODPACK:\nhttps://hynoesmp.com\n\n💬 JOIN THE HYNOE SMP DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nToday’s main focus:\n🌱 Farming for Blockheads\n🛒 Using and learning the Market system\n🌾 Expanding our farming setup\n⚙️ Working more modded farming systems into the base\n🏗️ Continuing the long-term Hynoe SMP build\n\nWhether you want to join the server, learn the modpack, watch the world grow, or just hang out while we build — you’re welcome here.\n\nIf you enjoy the stream, hit LIKE and SUBSCRIBE. It helps more Minecraft players find Hynoe SMP and helps us continue growing this community.\n\n#Minecraft #ModdedMinecraft #FarmingForBlockheads #MinecraftMods #MinecraftSMP #HynoeSMP #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Farming for Blockheads — Upgrading My Minecraft Farm",
        "description": "The Minecraft farm gets a modded upgrade with Farming for Blockheads. I'm learning the Market system and working on expanding the farming side of our Hynoe SMP base.\n\nWatch the setup and experimentation in this stream replay. Which farming mod would you add to a survival world?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #FarmingForBlockheads #HynoeSMP"
      }
    },
    {
      "key": "video:2uVsZMEM_rg",
      "action": "public_video_metadata",
      "resource_id": "2uVsZMEM_rg",
      "title": "Build, Trade or Chase the Campaign? | Modded Minecraft SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "This Minecraft SMP Never Stops Growing — Here’s What You Can Do | Hynoe SMP",
        "description": "Hynoe SMP keeps expanding because the goal is simple: there should always be another reason to log back in.\n\nBuild a base, earn money, complete the campaign, hunt bosses, explore massive structures, collect rare gear, run a shop, work through progression, or build your own part of the community.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\nThis is a long-term modded Minecraft survival server built around progression instead of short resets.\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Build, Trade or Chase the Campaign? | Modded Minecraft SMP",
        "description": "Build a base, run a shop, or chase the next campaign goal. I'm continuing life on Hynoe SMP, a modded Minecraft survival world with different paths to work toward.\n\nHang out for the stream replay. Which path would you take in a world like this?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:_ysmNpH_1WU",
      "action": "public_video_metadata",
      "resource_id": "_ysmNpH_1WU",
      "title": "Going Deeper Into the End in Modded Minecraft | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "We Went DEEP Into The END… What Will We Find? | Hynoe SMP",
        "description": "Tonight we’re leaving the base behind and heading deep into The End to see what’s actually out there.\n\nThis isn’t just a quick End City run — Hynoe SMP has expanded structures, dangerous areas, rare loot, massive builds to discover, and plenty of things we haven’t seen yet. We’re going as far as we can and seeing what we find along the way.\n\nIf you’re new here, Hynoe SMP is a long-term modded survival server built around exploration, progression, bosses, jobs, economy, powerful gear, player businesses, huge builds and a world that keeps getting bigger.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE HYNOE SMP DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE STREAM\nhttps://streamlabs.com/hynoe_geshi\n\nCome chill, explore with us and see what’s hiding deeper in The End.\n\n#Minecraft #HynoeSMP #MinecraftLive #ModdedMinecraft #MinecraftSMP #TheEnd\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Going Deeper Into the End in Modded Minecraft | Hynoe SMP",
        "description": "We're leaving the base behind and heading farther into the End on Hynoe SMP. The goal is to explore beyond familiar ground and see what structures and loot we can find.\n\nCatch the full modded Minecraft exploration replay. What's the best discovery you've made in the End?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:k6lKQCE7pLw",
      "action": "public_video_metadata",
      "resource_id": "k6lKQCE7pLw",
      "title": "Minecraft With Jobs, Shops & Progression | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "JOIN MY MODDED MINECRAFT SERVER! | 100+ Mods, Jobs, Economy & Progression",
        "description": "🔥 WANT TO JOIN THE HYNOE MODDED MINECRAFT SERVER? 🔥\n\nJoin the Discord for the modpack, server info, updates, and community:\nhttps://discord.gg/wYTePCkXd5\n\nThis is a long-term modded Minecraft server built around progression, economy, exploration, multiplayer community, and grinding your way through the world.\n\n💰 EconomyCraft\n💼 Jobs+\n📈 Genesis Progression\n🧭 Waystones\n🎒 Traveler’s Backpack\n👹 Alex’s Mobs\n🏰 Dungeons, structures & ruins\n✨ Powerful enchantments\n🏪 Player market\n🌎 100+ mods\n\nIf you want a modded Minecraft server with real progression, community, trading, exploration, and long-term goals, this is the place.\n\nDownload the modpack through the Discord and come join the journey.\n\n💎 Support the channel:\nhttps://streamlabs.com/hynoe_geshi\n\nOne Community. Endless Adventures.\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Minecraft With Jobs, Shops & Progression | Hynoe SMP",
        "description": "Jobs, trading, and progression give us different ways to get established on Hynoe SMP. This full replay is an early look at life in our modded Minecraft survival world.\n\nCome see the server journey from near the beginning. Current modpack and joining instructions are linked below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:f0-ekAylY4M",
      "action": "public_video_metadata",
      "resource_id": "f0-ekAylY4M",
      "title": "A Minecraft SMP With More Than One Goal | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "A Modded Minecraft SMP Built for Long-Term Progression | Hynoe SMP",
        "description": "Hynoe SMP is built for players who want more than rushing diamonds, beating the dragon, and running out of goals. This is a long-term modded Minecraft world with campaign progression, bosses, economy, jobs, rare equipment, exploration, shops, and constant server development.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\nThis stream is a look at the kind of progression Hynoe SMP is built around and what players can work toward when they join.\n\n#Minecraft #MinecraftSMP #ModdedMinecraft #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "A Minecraft SMP With More Than One Goal | Hynoe SMP",
        "description": "The campaign isn't the only reason to log back into Hynoe SMP. I'm back in our modded Minecraft world, where building, progression, and the player economy give us different things to work toward.\n\nThis stream replay continues the survival journey. Would you focus on the campaign, a base, or a business first?\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:iQhvzmpWPSQ",
      "action": "public_video_metadata",
      "resource_id": "iQhvzmpWPSQ",
      "title": "Choosing 100+ Minecraft Mods | Hynoe SMP Pre-Launch Archive",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "ARCHIVE: 100+ Mods Before the Current Hynoe SMP",
        "description": "⚠️ ARCHIVE / HISTORICAL SERVER VERSION\nThis stream covers an older pre-launch version of the server. The current Hynoe SMP has changed substantially since this was recorded.\n\nFor the current Hynoe SMP, use:\n🌐 https://hynoesmp.com\n💬 https://discord.gg/wYTePCkXd5\n\n💛 Support Hynoe\nhttps://streamlabs.com/hynoe_geshi\n\n--- Original stream description ---\n🔴 WE’RE LIVE!\n\nToday we’re going through ALL the mods we’ve added to my Minecraft world as we continue turning it into a full modded server!\n\nThis isn’t just a normal survival world anymore. We’re building an entire server experience with tons of new content, progression, exploration, and things to grind for.\n\n🏰 New structures & dungeons to discover\n👨‍🌾 Expanded villagers & trading\n💰 A full economy & currency system\n🏪 Player shops & ways to make money\n💼 Jobs & progression systems\n👹 New bosses to find and fight\n🐲 New mobs & creatures throughout the world\n⚔️ New weapons, armor & gear\n🗺️ More exploration & world content\n🌎 Overhauled villages and locations\n📦 Storage & quality-of-life upgrades\n⚙️ Automation and server improvements\n🔥 And a TON more!\n\nToday we’re checking out what we’ve added, talking about how these mods will work together, deciding what belongs on the server, and planning where we take the world next.\n\nThe goal is to create a server where there’s always something to build, explore, fight, trade, collect, upgrade, or grind toward.\n\nIf you enjoy Minecraft, modded survival, huge builds, automation, bosses, exploration, economies, and watching a server develop from the very beginning, subscribe and follow the journey!\n\n💎 SUPPORT THE CHANNEL\n\nIf you’d like to support everything I do—from gaming and streaming to skateboarding and photography—you can donate below. My goal is to eventually create and produce content full time!\n\nSupport the stream:\n\nhttps://streamlabs.com/hynoe_geshi\n\n💬 JOIN THE COMMUNITY\n\nJoin my Discord server:\n\nhttps://discord.gg/wYTePCkXd5\n\nEvery view, like, comment, subscription, and donation helps more than you know. I appreciate everyone who’s been supporting me while I build this channel and this world into something huge.\n\nI’ll see y’all at the top. 🖤\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Choosing 100+ Minecraft Mods | Hynoe SMP Pre-Launch Archive",
        "description": "Before Hynoe SMP launched, I was working through the Minecraft mods and deciding how the server should fit together. This stream replay looks back at those plans for exploration, progression, and the economy.\n\nHistorical pre-launch version. This is not the current mod list; the latest modpack and setup information are on the website below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:ye1L0zK-na8",
      "action": "public_video_metadata",
      "resource_id": "ye1L0zK-na8",
      "title": "Gears of War: E-Day — Insane Difficulty Is Getting Brutal",
      "topic": "Gears",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "GEARS OF WAR: E-DAY on INSANE Is Getting BRUTAL 😭🔥",
        "description": "We’re back on Gears of War: E-Day and I’m still running it on INSANE difficulty. 💀\n\nToday we’re pushing deeper into the campaign and seeing just how bad this difficulty can really get. Expect deaths, chaos, Locust, and probably some rage 😂\n\nIf you enjoy the stream, hit the LIKE button and SUBSCRIBE — it helps a lot.\n\n💸 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\n💬 Join the Discord:\nhttps://discord.gg/wYTePCkXd5\n\n#GearsofWar #GearsofWarEDay #EDay #Gears #Gaming #InsaneDifficulty #Hynoe"
      },
      "target": {
        "title": "Gears of War: E-Day — Insane Difficulty Is Getting Brutal",
        "description": "Back into Gears of War: E-Day on Insane difficulty. I'm sticking with the challenge and working through the next stretch of the campaign in this stream replay.\n\nPull up for the gameplay, the commentary, and the attempts along the way. What's one tip you wish you knew before starting an Insane run?\n\nMore from the Gears of War: E-Day playthrough:\nhttps://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#GearsOfWarEDay #GearsOfWar #InsaneDifficulty"
      }
    },
    {
      "key": "video:c8Fmxla0lLU",
      "action": "public_video_metadata",
      "resource_id": "c8Fmxla0lLU",
      "title": "750 Mob Kills for One Minecraft Campaign Stage? | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Stage 6 Is INSANE… Can We Finish It Today?! 😳 | Hynoe SMP",
        "description": "We made it to STAGE 6 of the Hynoe SMP Campaign… and the grind just got serious. 🔥\n\nToday we’re taking on the Bronze Proving Grounds and trying to push through some of the biggest campaign challenges yet:\n\n⚔️ 750 Mob Kills\n🧙 Witches, Blazes, Guardians, Shulkers, Evokers & Ravagers\n⛏️ Ancient Debris\n💎 Diamond Ore\n❄️ Defeat the Iceologer\n\nThe goal is simple: FINISH STAGE 6 and keep pushing deeper into the Hynoe SMP campaign.\n\nExpect exploration, fighting, grinding, upgrades, and probably some chaos along the way. 😂\n\n🌎 JOIN HYNOE SMP:\nhttps://hynoesmp.com\n\nIf you’re playing on the server, start working through the campaign and see if you can catch us!\n\n#Minecraft #HynoeSMP #ModdedMinecraft #MinecraftSMP #MinecraftSurvival\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "750 Mob Kills for One Minecraft Campaign Stage? | Hynoe SMP",
        "description": "Stage 6 of the Hynoe SMP campaign has a serious checklist: 750 mob kills, resource hunts, and the Iceologer. I'm taking on the Bronze Proving Grounds and trying to work through it in this modded Minecraft replay.\n\nWatch the full attempt. These objectives reflect the server version played during this stream; current campaign details may differ.\n\nFollow the Hynoe SMP campaign:\nhttps://www.youtube.com/playlist?list=PLMMS96xqHUsE\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:99vdNBEGG-w",
      "action": "public_video_metadata",
      "resource_id": "99vdNBEGG-w",
      "title": "Launching My Modded Minecraft Server | Hynoe SMP Begins",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "HYNOE SERVER LAUNCH! 🔴 Modded Minecraft Server Goes LIVE",
        "description": "🔴 THE HYNOE MINECRAFT SERVER IS OFFICIALLY LIVE!\n\nAfter all the planning, testing, balancing, modding, building, configuring, crashing, fixing, and upgrading — today we finally launch the server.\n\nWhat started as my personal Minecraft world has turned into a huge long-term modded survival server built around progression, exploration, economy, jobs, bosses, player businesses, communities, powerful equipment, massive structures, and much more.\n\nTonight we’re jumping in and actually experiencing everything we’ve been building.\n\n🔥 THE SERVER FEATURES:\n\n💰 EconomyCraft currency & player economy\n💼 Jobs+ professions & progression\n📈 Genesis Age progression\n🏪 Player shops, trading & businesses\n👨‍🌾 Villagers & trading\n🧭 Waystones & exploration\n🎒 Traveler’s Backpacks\n📦 Compact Storage & Logistics\n🌾 Farming systems & automation\n🏰 Massive structures, dungeons & ruins\n👹 New mobs & multiple bosses\n⚔️ Better Combat & expanded weapons\n🏹 New bows & ranged combat\n🛡️ More Totems & specialized equipment\n💎 Immersive Ores\n✨ Mythic Upgrades & gemstone abilities\n⚔️ Vibranium → Vulpus → Enderium progression\n🌊 Ocean progression\n🌑 Ancient Cities & Sculk progression\n🔥 Nether progression\n🐉 End-game progression\n🌎 Overhauled world generation\n📖 Full in-game Hynoe Server Handbook\n💵 Cash rewards for major Genesis milestones\n🔥 And a TON more\n\n📈 PROGRESSION MATTERS\n\nThis isn’t a server where you join and immediately rush straight to the strongest gear.\n\nGenesis controls progression through major Ages while the economy, Jobs+, exploration, bosses and modded equipment give you something to constantly work toward.\n\nExplore → Progress → Earn → Upgrade → Trade → Fight → Build → Repeat\n\nThere should always be another goal.\n\n💰 BUILD YOUR OWN PATH\n\nBecome a:\n\n⚔️ Fighter\n⛏️ Miner\n🌾 Farmer\n🏗️ Builder\n🧭 Explorer\n💰 Merchant\n👹 Boss Hunter\n💎 Collector\n🏘️ Community Builder\n📈 Job Specialist\n\nOr become a little bit of everything.\n\nPlayers can build shops, create businesses, trade resources, specialize in different jobs and eventually build entire economies and communities inside the world.\n\n🏆 TRUE END GAME\n\nDefeating the Ender Dragon isn’t where this server ends.\n\nLate-game progression continues into powerful modded equipment, harder bosses, rare structures, advanced automation, large-scale businesses, massive builds and equipment tiers such as:\n\nVIBRANIUM → VULPUS → ENDERIUM\n\nThe goal is to build a world people actually look forward to logging into — somewhere there is always something to build, explore, fight, earn, trade, upgrade or work toward.\n\nTonight is the beginning.\n\nBring your questions, ideas and suggestions, and come watch the Hynoe Server officially come to life.\n\n💎 SUPPORT THE CHANNEL\n\nIf you’d like to support everything I do — from gaming and streaming to skateboarding and photography — you can donate below. My goal is to eventually create and produce content full time!\n\nSupport the stream:\n\nhttps://streamlabs.com/hynoe_geshi\n\n💬 JOIN THE HYNOE COMMUNITY\n\nDiscord:\n\nhttps://discord.gg/wYTePCkXd5\n\nIf you want to play on the server, follow its development, meet the community or be involved as it grows, make sure you join the Discord.\n\nEvery view, like, comment, subscription and donation helps more than you know.\n\nThank you to everybody who has been watching this server go from an idea to something we can finally play together.\n\nOne Community. Endless Adventures.\n\nI’ll see y’all at the top. 🖤\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Launching My Modded Minecraft Server | Hynoe SMP Begins",
        "description": "After the planning, testing, and fixing, we finally head into the modded Minecraft server we've been building. This is the original Hynoe SMP launch broadcast, saved as a stream replay.\n\nRevisit the start of the multiplayer journey. For the current server and modpack, use the website below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:U2w--hwaOmE",
      "action": "public_video_metadata",
      "resource_id": "U2w--hwaOmE",
      "title": "My Minecraft Base Is Becoming a City | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "MY BASE IS BECOMING A CITY… | Hynoe SMP",
        "description": "🔥 THE HYNOE MODDED MINECRAFT SERVER KEEPS GROWING!\n\nYesterday turned into my LONGEST STREAM EVER — over 8 HOURS of Minecraft.\n\nWe finished the mob farm, explored a ton more of the world, made more progress, and even started getting some of my friends established around my base.\n\nToday we’re jumping right back in and continuing to build this world into something massive.\n\n🏠 Expanding the main base\n👥 Friends joining the area\n👹 Using & improving the mob farm\n🧭 More exploration\n💰 Economy & Jobs+ progression\n📈 Genesis progression\n🏪 Building toward player businesses\n🏰 Dungeons, structures & ruins\n⚔️ Better gear, mobs & bosses\n🌎 100+ mods\n\nThe goal is to turn this into a huge long-term Minecraft world where players can build towns, businesses, communities, farms, bases, and eventually entire empires.\n\n🔥 WANT TO JOIN THE HYNOE MODDED MINECRAFT SERVER?\n\nJoin the Discord for the modpack, server information, updates, and community:\n\nhttps://discord.gg/wYTePCkXd5\n\n💎 Support the stream:\nhttps://streamlabs.com/hynoe_geshi\n\nOne Community. Endless Adventures.\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My Minecraft Base Is Becoming a City | Hynoe SMP",
        "description": "My Minecraft base is starting to feel like somewhere people can settle. I'm continuing the Hynoe SMP build as friends establish themselves nearby and our plans for the area get bigger.\n\nHang out for the full replay and share an idea for turning a group of bases into a neighborhood.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:uO4wawY8TiA",
      "action": "public_video_metadata",
      "resource_id": "uO4wawY8TiA",
      "title": "Planning a Minecraft Community | Hynoe SMP Pre-Launch Archive",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "ARCHIVE: Planning the Hynoe SMP Launch — Staff & Server Setup",
        "description": "⚠️ ARCHIVE / HISTORICAL SERVER VERSION\nThis is a historical planning stream from before the current Hynoe SMP launch. Staff plans and server systems shown here may no longer apply.\n\nFor the current Hynoe SMP, use:\n🌐 https://hynoesmp.com\n💬 https://discord.gg/wYTePCkXd5\n\n💛 Support Hynoe\nhttps://streamlabs.com/hynoe_geshi\n\n--- Original stream description ---\n🔴 WE’RE LIVE!\n\nToday we’re getting into one of the biggest parts of building the Hynoe Minecraft Server — THE PEOPLE.\n\nWe’ll be talking about admins, staff, players joining the server, how the community will work, what we expect from people who join, and how we’re going to manage this world as it continues growing.\n\nThis started as my personal Minecraft world, but we’re turning it into a HUGE long-term modded Minecraft server with an economy, jobs, progression, exploration, bosses, businesses, communities, automation, and much more.\n\nToday we’re talking about things like:\n\n👑 Admins & server staff\n🛡️ Staff roles & responsibilities\n👥 Who will be able to join\n🌎 Growing the server community\n📋 Server rules & expectations\n🏠 Claims & protecting player builds\n🤝 Parties, teams & communities\n💰 Economy management & balancing\n🏪 Player shops & businesses\n💼 Jobs & progression\n⚔️ PvP, combat & player interactions\n🚫 Preventing griefing, cheating & abuse\n💬 Discord & community organization\n🔧 How admins will manage problems\n📈 Preparing the server to grow\n🎮 What the player experience should feel like\n🔥 Future server plans & ideas\n\nAnd of course, we’ll still be talking about the massive modded world we’re building.\n\n🏰 Structures & dungeons\n👹 Bosses & new mobs\n⚔️ Weapons, armor & gear\n🧭 Exploration & Waystones\n👨‍🌾 Villagers & trading\n📦 Storage systems\n⚙️ Automation & farms\n💰 Economy & currency\n💼 Jobs & progression\n🌎 Overhauled world generation\n🔥 And a TON more!\n\nI want the community involved in this process BEFORE everything is finished.\n\nIf you’re interested in eventually playing on the server, becoming part of the community, helping us build it, or potentially taking on a bigger role in the future, this is the stream to be in.\n\nBring your questions, ideas and suggestions.\n\nThe goal is to create more than another Minecraft server.\n\nI want to build a world people actually look forward to logging into — where there’s always something to build, explore, fight, earn, trade, upgrade or work toward.\n\nWe’re building this from the ground up, and you’re watching it happen from the beginning.\n\n💎 SUPPORT THE CHANNEL\n\nIf you’d like to support everything I do — from gaming and streaming to skateboarding and photography — you can donate below. My goal is to eventually create and produce content full time!\n\nSupport the stream:\n\nhttps://streamlabs.com/hynoe_geshi\n\n💬 JOIN THE COMMUNITY\n\nJoin my Discord server:\n\nhttps://discord.gg/wYTePCkXd5\n\nIf you’re interested in the Minecraft server, make sure you join the community so you can follow development and be there as we get closer to bringing players in.\n\nEvery view, like, comment, subscription and donation helps more than you know.\n\nThank you to everyone supporting me while we build the channel, the server and the Hynoe community into something huge.\n\nOne Community. Endless Adventures.\n\nI’ll see y’all at the top. 🖤\n\n– Hynoe\n\n#Minecraft #ModdedMinecraft #MinecraftServer\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Planning a Minecraft Community | Hynoe SMP Pre-Launch Archive",
        "description": "Before Hynoe SMP launched, we had to figure out the community as well as the Minecraft world. This replay revisits the early discussion around staff, player expectations, and running the server.\n\nHistorical pre-launch planning stream. Proposed rules and staff plans discussed here are not current policies; updated server information is linked below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:hNHIpEEIV5I",
      "action": "public_video_metadata",
      "resource_id": "hNHIpEEIV5I",
      "title": "Halo Infinite Campaign — Is This the End? | Part 8",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough Part 8 - Is this the end",
        "description": "Support the stream: https://streamlabs.com/hynoe_geshi yoooooo wha'ts upp it's Geshi and this may be the last episode of this halo infinite Campaign series.\nI appreciate everyone who joined me along the way and shout out to all of the new subscribers! I hope you all have a wonderful day.\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Halo Infinite Campaign — Is This the End? | Part 8",
        "description": "Is this the end of my Halo Infinite campaign run? Part 8 picks the journey back up in this stream replay from April 2022.\n\nThanks to everyone who followed my first Halo experience. The earlier campaign sessions are linked below.\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:qFglY4OS_xY",
      "action": "public_video_metadata",
      "resource_id": "qFglY4OS_xY",
      "title": "High on Life Playthrough — Part 3 | Stream Replay",
      "topic": "High on Life",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "High on Life Walkthrough Part 3 | Full Gameplay Livestream",
        "description": "Yo it's Geshi and today we are Playing High on Life part 3! I hope you all enjoy the stream and have a wonderful day!\n\nThank you all for watching and have a wonderful day!\n\n For all updates on Hynoe make sure yall join the discord server \nhttps://discord.gg/wYTePCkXd5\n\nFeel free to support the channel by liking, leaving a comment, or subscribing to the channel! Thank you!!\n\n━━━━━━━━━━━━━━━━━━\nHigh on Life archive replay from Hynoe.\n\n▶️ WATCH THE FULL HIGH ON LIFE SERIES\nhttps://www.youtube.com/playlist?list=PLbAf2oQTYw9c\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "High on Life Playthrough — Part 3 | Stream Replay",
        "description": "Back for part 3 of my High on Life playthrough. I'm continuing the game with my commentary and reactions in this stream replay from January 2023.\n\nCatching up on the run? Parts 1 and 2 are linked below.\n\nStart with part 1:\nhttps://www.youtube.com/watch?v=iRhkfKl2M28\n\nWatch part 2:\nhttps://www.youtube.com/watch?v=9ZKFT7KYGcU\n\nMore from the High on Life playthrough:\nhttps://www.youtube.com/playlist?list=PLbAf2oQTYw9c\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HighOnLife #Gameplay #Hynoe"
      }
    },
    {
      "key": "video:vCAb1OO9Qjo",
      "action": "public_video_metadata",
      "resource_id": "vCAb1OO9Qjo",
      "title": "My First Gears of War: E-Day Run — Co-op With Alex",
      "topic": "Gears",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Alex Donated Me Gears of War: E-Day… So We’re Playing It Together 🔥",
        "description": "Alex really donated me Gears of War: E-Day, so it only felt right that we jumped on and played it together. 😂🔥\n\nThis is my FIRST time playing E-Day, so everything you see is a genuine first reaction. No spoilers — just chaos, chainsaws, deaths and us figuring everything out as we go.\n\nBig shoutout to Alex for making this stream happen. 🙏🏾 Stuff like this genuinely helps me branch out, try more games and bring different content to the channel.\n\n🎮 If there’s a game you want to see me play, come hang out and let me know.\n\n💰 Support the streams / help fund future games:\nhttps://streamlabs.com/hynoe_geshi\n\n💬 Join the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\n🌐 Hynoe:\nhttps://hynoesmp.com\n\nIf you’re enjoying the stream, LIKE + SUBSCRIBE. Even just watching and hanging out helps a lot.\n\nAnd again — shoutout Alex for E-Day. 🫡\n\n#GearsOfWarEDay #GearsOfWar #Hynoe #Gaming\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL GEARS OF WAR: E-DAY SERIES\nhttps://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "My First Gears of War: E-Day Run — Co-op With Alex",
        "description": "Alex gifted me Gears of War: E-Day, so we jumped into the campaign together. This is my first session with the game: co-op gameplay, first reactions, and us figuring it out as we go.\n\nShoutout to Alex for making this stream happen. Catch the full replay, then follow the playthrough below.\n\nContinue into the Insane difficulty run:\nhttps://www.youtube.com/watch?v=ndk2vyb2c0c\n\nMore from the Gears of War: E-Day playthrough:\nhttps://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#GearsOfWarEDay #GearsOfWar #CoopGaming"
      }
    },
    {
      "key": "video:fsDQd2Oi_n8",
      "action": "public_video_metadata",
      "resource_id": "fsDQd2Oi_n8",
      "title": "Halo Infinite Campaign Playthrough — Part 3 Continued",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Campaign Walkthrough live pt3 w/ Geshi",
        "description": "Hey guys, It's Geshi and today we are back at it going through the halo campaign and boy am I excited!\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Halo Infinite Campaign Playthrough — Part 3 Continued",
        "description": "My first Halo journey continues as I return to the Halo Infinite campaign. This stream replay picks up the run after the earlier part 3 session.\n\nPublished in March 2022, with the original gameplay and reactions. Catch the earlier broadcasts in the series below.\n\nWatch the earlier part 3 session:\nhttps://www.youtube.com/watch?v=McqUmyb1LqI\n\nContinue with part 4:\nhttps://www.youtube.com/watch?v=A2Tei4FrJ_g\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:I_lASVqYos0",
      "action": "public_video_metadata",
      "resource_id": "I_lASVqYos0",
      "title": "Hynoe SMP v1.3.0: Reworking Progression | Minecraft Archive",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "ARCHIVE: Hynoe SMP v1.3.0 — Historical Server Version",
        "description": "⚠️ ARCHIVE / HISTORICAL SERVER VERSION\nThis stream documents Hynoe SMP version 1.3.0. Claims, travel, campaign systems and other features shown here are not a reliable guide to the current server.\n\nFor the current Hynoe SMP, use:\n🌐 https://hynoesmp.com\n💬 https://discord.gg/wYTePCkXd5\n\n💛 Support Hynoe\nhttps://streamlabs.com/hynoe_geshi\n\n--- Original stream description ---\nHynoe SMP just got one of its BIGGEST updates yet. 🔥\n\nToday we're checking out v1.3.0 and the new direction of the server. Hynoe SMP is becoming much more progression-focused, meaning the longer you play, the more systems, rewards, territory and conveniences you earn.\n\n⚔️ WHAT CHANGED:\n• A new Campaign progression system\n• Major Hynoe Token overhaul\n• Auction House added to the economy\n• Claims are now tied into progression\n• Waystone access becomes something you earn\n• Homes and additional claim territory unlock as you progress\n• Towns and parties were reworked around long-term communities\n• More economy, server and progression cleanup\n• Continued work on endgame progression and Worldbreaker Ascendant\n\nThe goal is to make Hynoe SMP feel like a world you can play for MONTHS instead of joining, getting everything immediately and running out of things to work toward.\n\nIf you're new, Hynoe SMP is a long-term modded Minecraft survival server built around exploration, bosses, jobs, an economy, player businesses, towns, powerful gear, huge structures, progression and a growing campaign.\n\n🌐 JOIN / DOWNLOAD THE MODPACK:\nhttps://hynoesmp.com\n\n💬 HYNOE SMP DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\n❤️ SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nCome build a town, start a business, grind the campaign or just explore the server with us.\n\n#Minecraft #HynoeSMP #ModdedMinecraft #MinecraftSMP #MinecraftLive\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Hynoe SMP v1.3.0: Reworking Progression | Minecraft Archive",
        "description": "Campaign progression, Hynoe Tokens, and a new direction for the server. This Minecraft stream replay revisits the changes we were introducing in Hynoe SMP v1.3.0.\n\nHistorical server version. Claims, travel access, homes, and rewards shown here may differ from the current server. Updated information is linked below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:A2Tei4FrJ_g",
      "action": "public_video_metadata",
      "resource_id": "A2Tei4FrJ_g",
      "title": "Halo Infinite Campaign Playthrough — Part 4",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Campaign Walkthrough live pt4 w/ Geshi",
        "description": "Yooooo it's Geshi and today we are back on Halo for the long run!\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Halo Infinite Campaign Playthrough — Part 4",
        "description": "Part 4 of my Halo Infinite campaign playthrough picks up my first Halo journey. I'm back in the game for another session, with the original gameplay and commentary.\n\nThis stream replay was published in March 2022, when I introduced myself as Geshi. Follow the rest of the run below.\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:9ZKFT7KYGcU",
      "action": "public_video_metadata",
      "resource_id": "9ZKFT7KYGcU",
      "title": "High on Life Playthrough — Part 2 | Stream Replay",
      "topic": "High on Life",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "High on Life Walkthrough Part 2 | Full Gameplay Livestream",
        "description": "Yo it's Geshi and today we are Playing High on Life part 2! I hope you all enjoy the stream and have a wonderful day!\n\nThank you all for watching and have a wonderful day!\n\n For all updates on Hynoe make sure yall join the discord server \nhttps://discord.gg/wYTePCkXd5\n\nFeel free to support the channel by liking, leaving a comment, or subscribing to the channel! Thank you!!\n\n━━━━━━━━━━━━━━━━━━\nHigh on Life archive replay from Hynoe.\n\n▶️ WATCH THE FULL HIGH ON LIFE SERIES\nhttps://www.youtube.com/playlist?list=PLbAf2oQTYw9c\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "High on Life Playthrough — Part 2 | Stream Replay",
        "description": "The High on Life playthrough continues in part 2. Jump back into the game with me for the next session, with the original gameplay and commentary from January 2023.\n\nThis is the stream replay. Start with part 1 below, then keep going with the series.\n\nStart with part 1:\nhttps://www.youtube.com/watch?v=iRhkfKl2M28\n\nContinue with part 3:\nhttps://www.youtube.com/watch?v=qFglY4OS_xY\n\nMore from the High on Life playthrough:\nhttps://www.youtube.com/playlist?list=PLbAf2oQTYw9c\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HighOnLife #Gameplay #Hynoe"
      }
    },
    {
      "key": "video:Rk518Bjvr-M",
      "action": "public_video_metadata",
      "resource_id": "Rk518Bjvr-M",
      "title": "The Minecraft Campaign Grind Continues | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Continuing the Hynoe SMP Campaign — The Grind Gets Harder",
        "description": "We’re back on the Hynoe SMP and continuing through the CAMPAIGN! 🔥\n\nToday we’re pushing deeper into the progression system, completing more challenges, earning rewards, and seeing how far we can make it through the campaign.\n\nIf you’re new here, Hynoe SMP is a long-term modded Minecraft survival server built around progression, exploration, an economy, jobs, bosses, player businesses, powerful gear, huge structures and a full campaign to keep you moving forward.\n\n🌎 JOIN HYNOE SMP:\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD:\nhttps://discord.gg/wYTePCkXd5\n\n💰 SUPPORT THE STREAM:\nhttps://streamlabs.com/hynoe_geshi\n\nCome join the server, start your own campaign, and see if you can catch up with us. 👀\n\n#Minecraft #HynoeSMP #ModdedMinecraft #MinecraftSurvival #MinecraftSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "The Minecraft Campaign Grind Continues | Hynoe SMP",
        "description": "The next set of campaign challenges is waiting on Hynoe SMP. I'm back in modded Minecraft, working through the objectives in front of us and keeping the progression moving.\n\nThis is a stream replay from the ongoing campaign run. Earlier sessions are in the playlist below.\n\nFollow the Hynoe SMP campaign:\nhttps://www.youtube.com/playlist?list=PLMMS96xqHUsE\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:6-onuxkcaCY",
      "action": "public_video_metadata",
      "resource_id": "6-onuxkcaCY",
      "title": "Modded Minecraft With a Campaign, Economy & Bosses | Hynoe SMP",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "This Modded Minecraft SMP Has a Full Campaign, Economy & Bosses | Hynoe SMP",
        "description": "Most Minecraft servers give you gear and leave you wondering what to do next. Hynoe SMP is built around a full campaign, bosses, economy, jobs, rare gear, exploration, player shops, and long-term progression.\n\n🌐 JOIN / DOWNLOAD THE MODPACK\nhttps://hynoesmp.com\n\n💬 JOIN THE DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE SERVER / STREAM\nhttps://streamlabs.com/hynoe_geshi\n\nIn this stream, we’re playing through Hynoe SMP and showing the systems that give players something to keep working toward: campaign objectives, money, jobs, bosses, exploration, equipment progression, shops, and community builds.\n\nIf you want a modded Minecraft world designed to keep growing instead of resetting every few weeks, come check it out and start your own progression.\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #HynoeSMP\n\n━━━━━━━━━━━━━━━━━━\n▶️ WATCH THE FULL HYNOE SMP SERIES\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n🌐 HYNOE SMP / MODPACK\nhttps://hynoesmp.com\n\n💬 DISCORD\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Modded Minecraft With a Campaign, Economy & Bosses | Hynoe SMP",
        "description": "A campaign inside Minecraft gives the survival grind a direction. I'm playing Hynoe SMP and working through a world built around objectives, an economy, and modded progression.\n\nCatch this stream replay for a look at the server in action. Follow the campaign sessions below to see the journey continue.\n\nFollow the Hynoe SMP campaign:\nhttps://www.youtube.com/playlist?list=PLMMS96xqHUsE\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:McqUmyb1LqI",
      "action": "public_video_metadata",
      "resource_id": "McqUmyb1LqI",
      "title": "Halo Infinite Campaign Playthrough — Part 3",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough w/ Geshi pt3",
        "description": "Yo, What's up it's Geshi and we are back at it with Halo Infinite Campaign pushing full steam ahead\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Halo Infinite Campaign Playthrough — Part 3",
        "description": "My Halo Infinite playthrough keeps moving in part 3. I'm heading back into the campaign for the next stretch of my first Halo experience.\n\nWatch the original March 2022 stream replay, then keep going with the next session below.\n\nContinue with the next session:\nhttps://www.youtube.com/watch?v=fsDQd2Oi_n8\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:sb71On0l5tI",
      "action": "public_video_metadata",
      "resource_id": "sb71On0l5tI",
      "title": "Hynoe SMP 1.2: Tokens, Homes & Progression | Minecraft Archive",
      "topic": "Minecraft",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "ARCHIVE: Hynoe SMP Update 1.2 — Historical Server Version",
        "description": "⚠️ ARCHIVE / HISTORICAL SERVER VERSION\nThis stream documents Hynoe SMP version 1.2. Features, balancing and progression have changed since this version.\n\nFor the current Hynoe SMP, use:\n🌐 https://hynoesmp.com\n💬 https://discord.gg/wYTePCkXd5\n\n💛 Support Hynoe\nhttps://streamlabs.com/hynoe_geshi\n\n--- Original stream description ---\nHynoe SMP Update 1.2 expanded the server with new token rewards, home/progression changes, economy balancing and boss progression. This replay walks through the update and how it changed the long-term grind.\n\nHynoe SMP is my long-term modded Minecraft survival server built around campaign progression, economy, jobs, bosses, rare gear and exploration.\n\n🌐 https://hynoesmp.com\n💬 https://discord.gg/wYTePCkXd5\n💛 https://streamlabs.com/hynoe_geshi\n▶️ https://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\n#Minecraft #ModdedMinecraft #MinecraftSMP #HynoeSMP"
      },
      "target": {
        "title": "Hynoe SMP 1.2: Tokens, Homes & Progression | Minecraft Archive",
        "description": "Hynoe SMP Update 1.2 brought another round of token rewards, home progression, and economy balancing to discuss. This Minecraft stream replay looks back at that stage of the server.\n\nHistorical version. Rules, rewards, and progression shown here are not a current server guide. Updated information is on the website below.\n\nMore of the Hynoe SMP journey:\nhttps://www.youtube.com/playlist?list=PLYPnPq5j4l3Y\n\nCurrent Hynoe SMP information and modpack:\nhttps://hynoesmp.com\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#Minecraft #ModdedMinecraft #HynoeSMP"
      }
    },
    {
      "key": "video:DXC5OSN8mrs",
      "action": "public_video_metadata",
      "resource_id": "DXC5OSN8mrs",
      "title": "Halo Infinite Campaign Playthrough — Part 2",
      "topic": "Halo",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "Halo Infinite Campaign Walkthrough w/ Geshi pt2",
        "description": "Yo, What's up it's Geshi and we are back at it with Halo Infinite Campaign pushing full steam ahead\nI hope you all enjoyed the stream and I hope you have a wonderful day. Thanks for watching!\n\n━━━━━━━━━━━━━━━━━━\nHalo Infinite archive replay from Hynoe.\n\n▶️ WATCH THE FULL HALO INFINITE SERIES\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\n💬 HYNOE COMMUNITY\nhttps://discord.gg/wYTePCkXd5\n\n💛 SUPPORT THE CHANNEL\nhttps://streamlabs.com/hynoe_geshi"
      },
      "target": {
        "title": "Halo Infinite Campaign Playthrough — Part 2",
        "description": "My first Halo journey continues in Halo Infinite campaign part 2. I'm returning after the opening session and finding my way farther through the game.\n\nThis is the original stream replay from March 2022. Start with part 1 below to follow the run from the beginning.\n\nStart with my first Halo session:\nhttps://www.youtube.com/watch?v=9WE5wdPY5dI\n\nContinue with part 3:\nhttps://www.youtube.com/watch?v=McqUmyb1LqI\n\nMore of my Halo Infinite campaign:\nhttps://www.youtube.com/playlist?list=PLH0ljnxIrW3A\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#HaloInfinite #HaloCampaign #Hynoe"
      }
    },
    {
      "key": "video:9R5FrX2ueis",
      "action": "public_video_metadata",
      "resource_id": "9R5FrX2ueis",
      "title": "Gears of War: E-Day Launch Week — Staying on Insane",
      "topic": "Gears",
      "note": "Title and description only. Original ID and current visibility retained. Full footage has not been re-reviewed.",
      "before": {
        "title": "GEARS OF WAR: E-DAY LIVE 🔥 LAUNCH DAY ON INSANE",
        "description": "Gears of War: E-Day is officially here and I’m live on launch day continuing my INSANE difficulty run. I’ve already been playing since Early Access, so tonight we’re locking in and seeing how far I can push this campaign without lowering the difficulty. If you’re into Gears, pull up and vibe with me live.\n💬 Discord: https://discord.gg/wYTePCkXd5\n❤️ Support the stream: https://streamlabs.com/hynoe_geshi\n📺 Subscribe: https://youtube.com/@hynoe  \n#GearsofWarEDay #GearsofWar #Live"
      },
      "target": {
        "title": "Gears of War: E-Day Launch Week — Staying on Insane",
        "description": "Gears of War: E-Day on Insane difficulty, and I'm keeping the challenge turned up. We're continuing the campaign in this launch-week stream replay—here for the story, the fights, and a good time with y'all.\n\nI've been playing since early access, so this picks up an ongoing run. Catch the beginning below, or settle in here and tell me where you are in the campaign.\n\nMore from the Gears of War: E-Day playthrough:\nhttps://www.youtube.com/playlist?list=PLPc8nLKcyUY0\n\nJoin the Hynoe community:\nhttps://discord.gg/wYTePCkXd5\n\nSupport the channel (optional):\nhttps://streamlabs.com/hynoe_geshi\n\n#GearsOfWarEDay #GearsOfWar #InsaneDifficulty"
      }
    }
  ],
  "playlists": [
    {
      "key": "playlist:PLBEcWw2l2FS0",
      "action": "public_playlist_description",
      "resource_id": "PLBEcWw2l2FS0",
      "title": "Hynoe SMP Updates & Behind the Scenes",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "Server updates, fixes, optimization and behind-the-scenes development from the current Hynoe SMP."
      },
      "target": {
        "description": "Server updates, fixes and development from Hynoe SMP. These replays cover the work behind the modded Minecraft world. Older versions shown here may differ from the current server.\n\nCurrent server information:\nhttps://hynoesmp.com"
      }
    },
    {
      "key": "playlist:PLMMS96xqHUsE",
      "action": "public_playlist_description",
      "resource_id": "PLMMS96xqHUsE",
      "title": "Hynoe SMP Campaign — Progression Journey",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "Campaign progression, stages, rewards and long-term objectives from the current Hynoe SMP."
      },
      "target": {
        "description": "Follow the Hynoe SMP campaign through stages, objectives, rewards and modded Minecraft progression. Watch the stream replays to see the journey unfold.\n\nCurrent Hynoe SMP information:\nhttps://hynoesmp.com"
      }
    },
    {
      "key": "playlist:PLFYg7OF2Vbdo",
      "action": "public_playlist_description",
      "resource_id": "PLFYg7OF2Vbdo",
      "title": "Minecraft Shorts | Hynoe",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "Minecraft Shorts and vertical moments from Hynoe, including selected archive moments and current SMP clips."
      },
      "target": {
        "description": "Minecraft Shorts and vertical moments from Hynoe. Archive clips are labelled separately from the current Hynoe SMP world.\n\nCurrent Hynoe SMP information:\nhttps://hynoesmp.com"
      }
    },
    {
      "key": "playlist:PLd1WqDYEqFtI",
      "action": "public_playlist_description",
      "resource_id": "PLd1WqDYEqFtI",
      "title": "Sports Games Archive — NBA 2K & Madden | Hynoe",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "The strongest public NBA 2K and Madden streams on Hynoe, preserved because they still have discovery/watch-hour value."
      },
      "target": {
        "description": "NBA 2K24 MyCAREER on PC and Madden NFL 25 on the hardest difficulty. Revisit the court and the field with Hynoe in these stream replays from earlier years of the channel.\n\nPick a game and settle in for the original gameplay and commentary."
      }
    },
    {
      "key": "playlist:PLUOIVuhvnXz4",
      "action": "public_playlist_description",
      "resource_id": "PLUOIVuhvnXz4",
      "title": "Call of Duty: Vanguard Zombies Walkthroughs | Hynoe",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "Full Call of Duty: Vanguard Zombies walkthroughs from the Hynoe archive."
      },
      "target": {
        "description": "Call of Duty: Vanguard Zombies walkthroughs without commentary. Watch the Der Anfang and Terra Maledicta replays from the Hynoe archive."
      }
    },
    {
      "key": "playlist:PLPc8nLKcyUY0",
      "action": "public_playlist_description",
      "resource_id": "PLPc8nLKcyUY0",
      "title": "Gears of War: E-Day — Insane Difficulty Playthrough | Hynoe",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "My Gears of War: E-Day playthrough, including co-op and the push through Insane difficulty. Follow the series from the start and keep going with the next stream."
      },
      "target": {
        "description": "Gears of War: E-Day campaign replays with Hynoe, including the first co-op session with Alex and the Insane difficulty run. Start with the opening session and follow the campaign from there."
      }
    },
    {
      "key": "playlist:PLH0ljnxIrW3A",
      "action": "public_playlist_description",
      "resource_id": "PLH0ljnxIrW3A",
      "title": "Halo Infinite Campaign — Full Livestream Playthrough | Hynoe",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "My complete Halo Infinite campaign playthrough, streamed live from start to finish.\n\nThis playlist includes every full livestream in order, covering the campaign, missions, combat, upgrades, exploration, and boss fights.\n\nThe full campaign is complete."
      },
      "target": {
        "description": "Follow Hynoe’s Halo Infinite campaign playthrough, from the first Halo experience through later campaign sessions and the search for Spartan Cores. These original stream replays were published in March and April 2022."
      }
    },
    {
      "key": "playlist:PLbAf2oQTYw9c",
      "action": "public_playlist_description",
      "resource_id": "PLbAf2oQTYw9c",
      "title": "High on Life — Full Livestream Playthrough | Hynoe",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "My complete High on Life playthrough, streamed live from beginning to end.\n\nThis playlist includes the full livestreams in order, covering the story, bosses, weapons, exploration, and everything that happened along the way.\n\nThe full playthrough is complete."
      },
      "target": {
        "description": "High on Life gameplay and commentary with Hynoe. Follow the playthrough from the first session through parts 2 and 3 in these original stream replays from January 2023."
      }
    },
    {
      "key": "playlist:PLYPnPq5j4l3Y",
      "action": "public_playlist_description",
      "resource_id": "PLYPnPq5j4l3Y",
      "title": "Hynoe SMP — Modded Minecraft Survival, Campaign & Progression",
      "topic": "Playlist",
      "note": "Description only. Playlist title, membership, ordering and visibility retained.",
      "before": {
        "description": "The full Hynoe SMP journey: modded Minecraft survival, campaign progression, economy, jobs, bosses, rare gear, farms, builds, server updates and the long-term world growing stream by stream. Join the server and download the modpack at https://hynoesmp.com."
      },
      "target": {
        "description": "Follow the Hynoe SMP journey through modded Minecraft survival, campaign progression, farms, builds, exploration and server development. These stream replays show the world growing over time.\n\nCurrent server information and modpack:\nhttps://hynoesmp.com"
      }
    }
  ]
};
