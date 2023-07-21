# Discord Bot

## Description
This is a Discord bot built using Node.js and the Discord.js library. The bot has various functionalities, including moderation commands, fun commands, music playing, economy, and more.

## Repo No Longer Maintained
This repository is no longer actively maintained, and full ownership goes to @realrxin.

## Setup
1. Clone this repository to your local machine.
2. Make sure you have Node.js installed on your computer.
3. Install the required packages by running the following command in the project directory:
```
npm install
```
4. Create a `config.json` file in the project directory and provide the necessary configuration. Here's an example of the `config.json` structure:
```json
{
    "token": "",
    "prefix": ".",
    "bot_name": "",
    "main_color": "",
    "bot_owners": [""],
    "anti_bad_word_toggle": false,
    "anti_bad_words": [""],
    "counter": false,
    "counter_channel": "",
    "counter_number_reach": 999999999999999,
    "blacklisted": ["ID 1","ID 2","ID 3"],
    "whitelisted": ["ID"],
    "ignore_channel_toggle": false,
    "ignore_channel_id": [""],
    "anti_link_toggle": false,
    "mute_role": "MUTE ROLE HERE",
    "command_cooldown_toggle": false,
    "command_cooldown_time": "",
    "xp_system_toggle": false,
    "xp_system_rate": 10,
    "xp_system_levelrate": 300,
    "suggest_system_toggle": false,
    "suggest_system_channel": "",
    "report_system_toggle": true,
    "report_system_channel": "",
    "mod_logs_toggle": false,
    "mod_logs_channel": "",
    "mod_logs_color": "",
    "anti_selfbot_toggle": false,
    "anti_self_bot_message": "No self bots allowed!",
    "status_type": "WATCHING",
    "bot_status": [""],
    "status_change_interval": "2",
    "welcome_message_enabled": false,
    "welcome_message_server": "",
    "welcome_message_channel": ""
}
```
5. Run the bot executing the following command in the project directory:
```
node index.js
```

The bot should be online and ready to use.

## Features
- Moderation commands
- Fun commands
- Music playing
- Economy system
- Anti-bad word filter
- Counter feature
- Blacklist and whitelist
- Channel ignore toggle
- Anti-link protection
- Command cooldown toggle
- XP system for users
- Suggestion and report systems
- Mod logs
- Anti-selfbot protection
- Customizable bot status
- Welcome message
- Bot evaluation command
- User-related commands

## Commands
Below are the commands available in this Discord bot:

### Moderation Commands
- `ban`: Bans a member
- `kick`: Kicks a member
- `mute`: Mutes a member
- `unmute`: Unmutes a member
- `nuke`: Clones channel to clear messages
- `hackban`: Bans a user by their ID
- `unban`: Unbans a banned user
- `clean`: Cleans all recent bot messages
- `purge`: Purges messages in a channel
- `warn`: Warns a user
- `delwarn`: Deletes a warning for a user
- `warnings`: Get warnings on a user
- `clearnwarnings`: Clear all warnings for a user
- `softban`: Softbans a user (bans and then unbans)

### Fun Commands
- `8ball`: Get a random response from the magic 8-ball
- `hack`: Fake hack someone
- `say`: Repeat the inputted user message
- `gay`: Shows user gayrate
- `token`: Shows user's fake token
- `calce`: A working calculator
- `covid`: Shows COVID-19 statistics
- `meme`: Shows a random meme
- `dog`: Shows a random dog picture
- `cat`: Shows a random cat picture
- `ascii`: Converts user text to ASCII format
- `didyouknow`: Working "Did you know?" command
- `roast`: Roasts a user

### Management Commands
- `invites`: Shows all server invites
- `announce`: Create an announcement using the bot
- `slowmode`: Set the slowmode for the channel
- `lock`: Lock a channel
- `unlock`: Unlock a channel
- `modlogs`: Get all moderator logs done on a user
- `dm`: DMs mentioned user (Good for dropping staff)

### Music Commands
- `play`: Plays music given
- `join`: Joins a voice channel
- `leave`: Leaves a voice channel
- `stop`: Stops music
- `pause`: Pauses music
- `loop`: Loops a song or playlist
- `np`: Shows info on the current song

### Information Commands
- `stats`: Gives stats on the bot
- `membercount`: Shows server member count
- `uptime`: Shows bot's uptime
- `config`: Shows all config settings

### Misc Commands
- `snipe`: Snipes the most recent deleted message
- `embed`: Writes inputted message in Embed
- `ping`: Shows bot's ping
- `whois`: Shows user information
- `av`: Shows user's avatar
- `suggest`: Create a suggestion
- `report`: Report a user
- `id`: Shows the ID of a member/role/channel
- `afk`: Set yourself as AFK

### Economy Commands
- `level`: See user's current level
- `addxp`: Add XP to a user
- `clearwarns`: Clears all warnings for a user

### Antinuke Commands
- `antibot`: Enable/Disable Antibot
- `lockall`: Lock all channels
- `unlockall`: Unlock all channels

### Bot Evaluation Command
- `boteval`: Evaluate JavaScript code (restricted to authorized users)

### User-related Commands
- `level`: See user's current level and XP
- `modlogs`: Get the number of moderator logs for a user
- `warnings`: Get the number of warnings for a user
- `delwarn`: Delete one warning for a user

### Reporting and Suggesting Commands
- `report`: Report a user (if the report system is enabled)
- `suggest`: Create a suggestion (if the suggestion system is enabled)

### Utility Commands
- `uptime`: Shows the bot's uptime
- `config`: Shows all current configuration settings


**Note**: Some commands might require certain permissions or be restricted to specific roles or users. Ensure the bot has the necessary permissions and that you are authorized to use certain commands.

## Additional Notes
- The bot's configuration settings can be customized by editing the config.json file.
- The xp_system_toggle, report_system_toggle, and suggest_system_toggle in the configuration can enable or disable the XP system, report system, and suggestion system, respectively.
- The owners field in the config.json file should contain the Discord IDs of users authorized to execute restricted commands like addxp and boteval.
- Feel free to explore and modify the code to suit your needs. Enjoy using the Discord bot!
