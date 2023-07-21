const Discord = require('discord.js')
const bot = new Discord.Client({
    partials: ["GUILD", "MEMBERS"]
});
const { token, prefix, main_color: color, bot_owners: owners, counter_number_reach, ignore_channel_id, ignore_channel_toggle, xp_system_levelrate, xp_system_rate, xp_system_toggle, report_system_channel, mod_logs_color, report_system_toggle, suggest_system_channel, suggest_system_toggle, status_type, command_cooldown_time, command_cooldown_toggle, anti_self_bot_message, anti_selfbot_toggle, mod_logs_channel, mod_logs_toggle, bot_name, anti_bad_word_toggle, anti_bad_words, welcome_message_channel, welcome_message_server, welcome_message_enabled, status_url, bot_status, status_change_interval } = require('./config.json')
const { MessageEmbed } = require('discord.js')
const fs = require('fs')
const { Player } = require('discord-player');
const ms = require('ms');
const bank = require('./db/bank.json');
const wallet = require('./db/wallet.json');
const bans = new Map();
const anti = require('./database/antibot.json')
const noWords = anti_bad_words
let userlogs = require('./database/user-logs.json')
const superagent = require('superagent')
const api = require('covidapi');
let warns = JSON.parse(fs.readFileSync('./database/warns.json', 'utf8'));
const fetch = require('node-fetch')
const { Buffer } = require('buffer');
const xp = require('./database/xp.json')
const axios = require('axios');
const heat = new Map();
let count = 0;
const player = new Player(bot);
bot.player = player
bot.afk = new Map();
bot.locked = new Map();
const cooldown = new Set();

bot.on("ready", () => {
    console.log(`Ready ${bot.user.username}`)
    function pickStatus() {
        const status = bot_status
        let Status = Math.floor(Math.random() * status.length);

        bot.user.setActivity(status[Status], {
            type: status_type
        })
    }

    setInterval(pickStatus, status_change_interval * 1000)
})

bot.on("guildMemberAdd", (member) => {
    try {
        const usage = require('./database/antibot.json')[member.guild.id].anti
        if (usage === true) {
            if (member.user.bot) {
                member.ban({
                    reason: "Anti bot is enabled"
                })
            }
        }
    } catch (error) {
        console.log(error);
    }
})

bot.on('guildBanAdd', (guild, user) => {
    guild.fetchAuditLogs({
        type: 'MEMBER_BAN_ADD',
        limit: 1,
    }).then(x => x.entries.first()).then(xx => {
        let u = xx.executor
        if (!bans.has(u.id)) {
            bans.set(u.id, {
                heat: 20
            }) 
        } else {
            try {
            if (bans.get(u.id).heat >= 100) {
                
                let uID = u.id
                let use = guild.members.cache.get(uID)
                for (let i = 0; i < use.roles.cache.array().length; i++) {
                        use.roles.remove(use.roles.cache.array()[i].id).then(() => {
                                guild.members.cache.get(guild.ownerID).send(`${user.tag} Is banning to many members in ${guild.name}. I have removed their roles!`);
                        })
                    }
                return; 
            }
            bans.set(u.id, {
                heat: bans.get(u.id).heat + 100
            })
            setTimeout(() => {
                bans.set(u.id, {
                    heat: bans.get(u.id).heat - 20
                }, 100 * 1000)
            })
        } catch(e) {

        }
        } 
    })
})

fs.readdir('./player-events/', (err, files) => {
    if (err) return console.log(err);
    files.forEach(file => {
        const event = require(`./player-events/${file}`);
        let eventName = file.split(".")[0];
        console.log(`Loading player event ${eventName}`);
        bot.player.on(eventName, event.bind(null, bot));
    });
});

bot.mcount = 0
bot.on("guildMemberAdd", (member) => {
    if (welcome_message_enabled === true) {
        console.log("Mmeber joined!")
        if (member.guild.id !== welcome_message_server) return;
        bot.mcount++
        console.log(`Member joined! We not have ${bot.mcount} joined!`);
        bot.guilds.cache.get(welcome_message_server).channels.cache.get(welcome_message_channel).send(`Welcome **<@${member.id}>** to **${member.guild.name}**`)
    } else { }
})



const auto1 = new Map();
const auto2 = new Map();


bot.on("message", message => {
    if (require('./config.json').counter === true) {
        if (count !== counter_number_reach) {
            if (message.author.id === bot.user.id) return;
            const takeAway = Math.floor(Math.random() * 40);
            if (message.channel.id !== require('./config.json').counter_channel) return;
            if (message.content.includes(count)) {
                count++
                if (count === counter_number_reach) {
                    const doneEmbed = new MessageEmbed()
                        .setColor(color)
                        .setDescription(`Gongrats! The counter of \`${counter_number_reach}\` has been reached!`)
                        .setFooter("I will know longer be counting..")

                    message.channel.send(doneEmbed)
                }

                let Num = 5 //Math.floor(Math.random() * 150);
                const curse = Math.floor(Math.random() * 70)
                if (Num === 5) {
                    const bonusEmbed = new MessageEmbed()
                        .setColor(color)
                        .setTitle("You just found a powerup!")
                        .setDescription(`I have added ${takeAway} to the Count! \n \n Start counting from ${count + takeAway}`);
                    console.log('Takeaway is ' + takeAway)
                    message.channel.send(`<@${message.author.id}> You have found a power up!`, bonusEmbed)
                    console.log("Before " + count)
                    count += takeAway
                    console.log("After: " + count)
                }
                if (Num === 1) {
                    const curseEmbed = new MessageEmbed()
                        .setColor()
                        .setDescription(`U found a curse! \n \n Taking away ${curse} \n Start counting from ${count - curse}`)
                    // message.channel.send(`U found a curse! \n \n Taking away ${curse} \n Start counting from ${count - curse}`);
                    count -= curse
                    message.channel.send(curseEmbed)
                }

            } else {
                message.delete();
            }
        } else { }
    } else { }

})

bot.on("message", message => {
    if (require('./config.json').xp_system_toggle === true) {
        if (message.author.bot) return;
        if (!message.content.includes(`${prefix}buy`)) {
            let xpAdd = Math.floor(Math.random() * 7) + xp_system_rate;

            if (!xp[message.author.id]) {
                xp[message.author.id] = {
                    xp: 0,
                    level: 1
                }
            }

            let curxp = xp[message.author.id].xp
            let curlvl = xp[message.author.id].level
            let nxtLvl = xp[message.author.id].level * xp_system_levelrate
            xp[message.author.id].xp = curxp + xpAdd;
            if (nxtLvl <= xp[message.author.id].xp) {
                xp[message.author.id].level = curlvl + 1;
                let lvlup = new MessageEmbed()
                    .setColor(color)
                    .setTitle("Level up!")
                    .addField("New level", curlvl + 1)

                message.reply(lvlup).then(msg => msg.delete({ timeout: '7000' }))
            }
            fs.writeFile('./database/xp.json', JSON.stringify(xp, null, 2), (err) => {
                if (err) console.log(err);
            });
        } else {
            console.log("Buy command")
        }
    } else { }
})


bot.on("message", async message => {
    if (bot.afk.has(message.author.id)) {
        bot.afk.delete(message.author.id);
        try {
            if (message.member.nickname.includes("[AFK]")) {
                if (message.member.manageable) {
                    message.member.setNickname(`${message.member.user.username.substring("[AFK]")}`)
                }
            }
        } catch (e) { }
        message.channel.send(`Welcome back <@${message.member.id}>! I have removed your AFK`)
    }
    if (message.mentions.users.first()) {
        if (bot.afk.has(message.mentions.users.first().id)) {
            if (message.author.id === bot.user.id) return;
            message.reply(`${message.mentions.users.first().username} is Afk (Time: ${(Date.now) - bot.afk.date}): ${bot.afk.get(message.mentions.users.first().id).reason}`);
        }
    }
    let badwordIs = false;
    var i
    for (i = 0; i < noWords.length; i++) {

        if (message.content.toLowerCase().includes(noWords[i].toLowerCase())) badwordIs = true;
    }
    if (anti_bad_word_toggle === true) {
        if (badwordIs) {
            message.delete()
            return message.reply("Watch your language!");
        } else { }
    }
    const whitelistee = require('./config.json').whitelisted
    let wlisted = false
    whitelistee.forEach(id => {
        if (message.author.id === id) wlisted = true;
    })
    if (anti_selfbot_toggle === true) {
        if (message.embeds.length) {
            if (!message.author.bot) {
                if (wlisted === true) return;
                message.delete().then(() => {
                    return message.reply(anti_self_bot_message);
                })
            }
        }
    }

    const { content } = message;

   if (content.includes('discord.gg/')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("No self advertising!");
            })
        } else { }
    }
    if (content.includes('https')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("No self advertising!");
            })
        } else { }
    }
    if (content.includes('.com')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("No self advertising!");
            })
        } else { }
    }

    if (message.channel.type === 'dm') {
      console.log("")   
    }

    const aboveRole = new MessageEmbed()
        .setColor(color)
        .setDescription('That user is a higher role than you!')

    const userWhitelisted = new MessageEmbed()
        .setColor(color)
        .setDescription("That user is whitelisted! I can't do that!");

    const userStaff = new MessageEmbed()
        .setColor(color)
        .setDescription('That user is a mod/admin, I can\'t do that')

    const noMusicChannel = new MessageEmbed()
        .setColor(color)
        .setDescription("You are not in a voice channel.");

    const userOwner = new MessageEmbed()
        .setColor(color)
        .setDescription("That user is a bot owner! I can't do that.")

    const noError = new MessageEmbed()
        .setColor(color)
        .setDescription('There was a error but I could not find the error.');

    const noMember = new MessageEmbed()
        .setColor(color)
        .setDescription('No member was mentioned, Try mentioning a user.');

    const noChannel = new MessageEmbed()
        .setColor(color)
        .setDescription('No channel was mentioned.');

    const noPerms = new MessageEmbed()
        .setColor(color)
        .setDescription('Member is missing required permissions')
    if (!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLocaleLowerCase();

    if (!message.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send('I am Missing `ADMINISTRATOR` Permissions.. ')

    if (command_cooldown_toggle === true) {

        if (cooldown.has(message.author.id)) {
            return message.reply("A little to quick there.")
        }
        if (!owners.includes(message.author.id)) {
            cooldown.add(message.author.id)

            setTimeout(() => {
                cooldown.delete(message.author.id)
            }, command_cooldown_time * 1000)
        }
    } else { }

    if (ignore_channel_toggle === true) {
        if (ignore_channel_id.includes(message.channel.id)) {
            message.member.send(`You cannot use commands in <#${message.channel.id}>`)
            return;
        }
    }

    if (command === 'antibot') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            if (args[0] === '?on') {
                if (!anti[message.guild.id]) anti[message.guild.id] = {
                    anti: true
                }
                anti[message.guild.id] = {
                    anti: true
                }
                const enabled = new MessageEmbed()
                    .setColor(color)
                    .setDescription("Anti bot is now **enabled** !");
                message.channel.send(enabled);
                fs.writeFile('./database/antibot.json', JSON.stringify(anti), (err) => { if (err) console.log(err) });
            } else {
                if (args[0] === '?off') {
                    if (!anti[message.guild.id]) anti[message.guild.id] = {
                        anti: false
                    }
                    anti[message.guild.id] = {
                        anti: false
                    }
                    const enabled = new MessageEmbed()
                        .setColor(color)
                        .setDescription("Anti bot is now **disabled** !");
                    message.channel.send(enabled);
                    fs.writeFile('./database/antibot.json', JSON.stringify(anti), (err) => { if (err) console.log(err) });
                }
            }
        } else {
            return message.channel.send(noPerms);
        }
    }

    if (command === 'help') {
        if (!args[0]) {
            const helpEmbed = new MessageEmbed()
                .setTitle('Help')
                .setDescription('List of commands below \n ')
                .setColor(color)
                .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/804717727280660550/car_pfp.gif")
                .addField('⚒️ help moderation', '_Shows a list of the moderation commands_')
                .addField("🥳 help fun", "_Shows a list Of all the fun commands_")
                .addField("❌ help antinuke ", "_Shows a list Of all the antinuke commands_")
                .addField("🎵 help music", "_Shows a list of all the music commands_")
                .addField("💼 help management", "_Shows a list Of all the Management commands_")
                .addField("📈 help economy", "_Shows a list Of all the economy commands_")
                .addField(":man_mage: help misc", "_Shows a list Of all the misc commands_")
            message.channel.send(helpEmbed)
        } else {
            if (args[0] === 'moderation') {
                const modHelp = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Moderation commands_ \n \n \`ban\` - Bans a member \n \`kick\` - Kicks a member \n \`mute\` - Mute a member so they cannot type \n \`unmute\` - Unmute a user if they\'re muted \n \`nuke\` - Clones channel to clear messages \n \`hackban\` - Ban a user by their ID \n \`unban\` - Unban a banned user. \n \`clean\` - Cleans all recent bot messages \n \`purge\` - Purges messages in a channel \n \`warn\` - Warn a user \n \`delwarn\` - Delete a warning for a user \n \`warnings\` - Get warnings on a user \n \`clearnwarnings\` - Clear all warnings for a user ');
                message.channel.send(modHelp);
            }

            if (args[0] === 'fun') {
                const funEmbed = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Fun commands_ \n \n \`hack\` - Fake hack someone \n \`say\` - Says inputted user message \n `8ball` - A working 8ball command\n \`gay\` - Shows user gayrate \n \`token\` - Shows users fake token \n \`calce\` - A working calculator  \n \`covid\` - Shows covid-19 statics \n \`meme\` - Shows random meme \n \`dog\` 0 Shows random dog picture \n \`cat\` - Shows random cat picture \n \`ascii\` - Rights user text in ascii format \n `didyouknow` - working did you know command \n `roast`- Roasts a user');
                message.channel.send(funEmbed);
            }

            if (args[0] === 'management') {
                const mngementEmbed = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Management commands_ \n \n `invites` - Shows all server invites \n `announce` - Create a announement using the bot \n `slowmode` - Set the slowmode for the channel \n `lock` - Lock a channel \n `unlock` - Unlock a channel \n `modlogs` - Get all moderator logs done on a user \n `dm` - DM\'s mentioned user(Good for dropping staff)');

                message.channel.send(mngementEmbed);
            }

            if (args[0] === 'music') {
                const musicEmbed = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Music commands_ \n \n `play` - Plays music given \n `join` - Joins voice channel \n `leave` - Leave voice channel \n `stop` - Stops music \n `pause` - Pauses music \n `loop` - Loops song or playlist \n `np` - Shows info on the current song')

                message.channel.send(musicEmbed);
            }

            if (args[0] === 'information') {
                const infoHelp = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Information commands_ \n \n `stats` - Gives stats on the bot \n `membercount` - Shows server membercount \n `uptime` - Shows bots uptime \n `config` - Shows all config settings');

                message.channel.send(infoHelp);
            }
            if (args[0] === 'misc') {
                const miscEmbed = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription("_Misc commands_ \n \n `snipe` - Snipes most recent deleted message \n `embed` - Writes inputted message in Embed \n `ping` - Shows bots ping \n `whois` - Shows user information \n `av` - Shows users avatar \n `suggest` - Create a suggestion \n `report` - Report a user \n `id` - Shows the ID of a member/role/channel \n `afk` - Set your self as AFK")

                message.channel.send(miscEmbed)
            }
            if (args[0] === 'economy') {
                const ecoEmbed = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Economy commands_ \n \n `level` - See user current level \n `addxp` - Add xp to a user')

                message.channel.send(ecoEmbed)
            }

            if (args[0] === 'antinuke') {
                const antiEmbed = new MessageEmbed()
                    .setColor(color)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setThumbnail("https://cdn.discordapp.com/attachments/799599883488067605/805160125064019988/idk_who_dis_is.gif")
                    .setDescription('_Antinuke commands_ \n \n `antibot` - Enable/Disable Antibot \n `lockall` - Lockall channels \n `unlockall` - Unlockall channels ')


                message.channel.send(antiEmbed);
            }
        }
    } 
                                                                                

    if (command === '8ball') {
        if (!args.join(" ")) return message.reply('Ask me something..')
        const responses = [
            "Yes , Definetly so.",
            "Ask again later",
            "NO! NOT!!",
            "Maybee mwah...",
            "Mosy likely",
            "My sources say no",
            "Maybe so..",
            "I don\'t know!!",
            "SHUT UP!!!!!!!!!!!!!!!!!!!!!!!!!",
            "Don\'t lie to your self...."
        ]

        message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
    }
    
    
    if (command === 'eval') {
         if (message.author.id !== '269918760733900800') return message.channel.send("You do not have permission to use this command!");
        const embed = new MessageEmbed()
            .setTitle('Evaluating...')
        const msg = await message.channel.send(embed);
        try {
            const data = eval(args.join(' ').replace(/```/g, ''));
            const embed = new MessageEmbed()
                .setTitle('output:')
                .setDescription(await data)
            .setColor('GREEN')
            await msg.edit(embed)
            await msg.react('✅')
            await msg.react('❌')
            const filter = (reaction, user) => (reaction.emoji.name === '❌' || reaction.emoji.name === '✅') && (user.id === message.author.id);
            msg.awaitReactions(filter, { max: 1 })
                .then((collected) => {
                    collected.map((emoji) => {
                        switch (emoji._emoji.name) {
                            case '✅':
                                msg.reactions.removeAll();
                                break;
                            case '❌':
                                msg.delete()
                                break;
                        }
                    })
                })
        } catch (e) {
            const embed = new MessageEmbed()
                .setTitle('error')
                .setDescription(e)
                .setColor("#FF0000")
            return await msg.edit(embed);
        }
    }


    if (command === 'gstart') {

        let time;
        let channel;
        let prize
        await message.channel.send('Starting automatic setup...').then(m => {
            setTimeout(() => {
                m.edit('How long do u want the giveaway to be? \n Examples: `1d` `2h` `5m`').then(() => {
                    const filter = m => message.author.id = m.author.id;

                    message.channel.awaitMessages(filter, { time: '15000', max: 1, errors: ['time'] })
                        .then(messages => {
                            if (messages.first().content) {
                                time = messages.first().content;
                                message.channel.send('Where would you like this giveaway to be?').then(() => {
                                    message.channel.awaitMessages(filter, { time: "15000", max: 1, errors: ['time'] })
                                        .then(msg => {

                                            if (msg.first().content) {
                                                channel = msg.first().channel.id;
                                                message.channel.send('What is the prize of this giveaway?').then(() => {
                                                    message.channel.awaitMessages(filter, { time: '15000', max: 1, errors: ['time'] })
                                                        .then(mg => {
                                                            if (mg.first().content) {
                                                                prize = mg.first().content
                                                                console.log(channel)
                                                                const giveAwayEmbed = new MessageEmbed()
                                                                    .setColor(color)
                                                                    .setDescription(`**${prize}** \n \n React with 🎉to enter! \n Time: ${time} \n Hosted by: <@${message.author.id}>`)
                                                                    .setFooter('Make sure to join!');
                                                                message.guild.channels.cache.get(channel).send("🎉 New giveaway! 🎉", giveAwayEmbed).then(mgs => {
                                                                    mgs.react('🎉').then(x => {
                                                                        setTimeout(() => {
                                                                            let winner = x.users.cache.random().id;

                                                                            message.guild.channels.cache.get(channel).send(`Congrats <@${winner}>! You won the **${prize}**`);
                                                                        }, ms(time));
                                                                    })
                                                                })
                                                            }
                                                        })
                                                })
                                            }
                                        })
                                })
                            }
                        })
                })
            }, 3 * 1000)
        })

    }

    if (command === 'unlockall') {
        if (message.member.hasPermission("ADMINISTRATOR") || owners.includes(message.author.id)) {

            message.guild.channels.cache.forEach(channel => {
                channel.updateOverwrite('793793766787645460', {
                    SEND_MESSAGES: true
                })
            })
            message.guild.channels.cache.filter(che => che.type !== 'voice').map(ch => {
                message.channel.send(`Unlocked channel: <#${ch.id}>`)
            })

        } else return message.channel.send(noPerms);
    }


    if (command === 'addxp') {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send(noMember);
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            const input = args[0]
            if (!input) return message.channel.send('You did not enter a amount to add..')
            const newXp = xp[message.author.id].xp + input;
            xp[user.id] = {
                xp: newXp
            }

            fs.writeFile('./database/xp', JSON.stringify(xp), (err) => { if (err) console.log(err) });

            message.channel.send(`I have added **${newXp}** to **${user.username}**`)
        } else {
            return message.channel.send(noPerms);
        }
    }

    if (command === 'clearwarns') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {

            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const noWarns = new MessageEmbed()
                .setColor(color)
                .setDescription("The user has no warnings")

            if (!warns[user.id]) {
                return message.channel.send(noWarns);
            }

            let warnss = warns[user.id].warns

            const clearedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`I have cleared \`${warnss}\` warnings from a user.`)

            message.channel.send(clearedEmbed)

            warns[user.id].warns -= warnss;

            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => { if (err) console.log(err) })



        } else return message.channel.send(noPerms)
    }

    if (command === 'config') {
        let xpsystem = "";
        if (xp_system_toggle === true) xpsystem = 'Enabled'
        if (xp_system_toggle === false) xpsystem = 'Disabled'
        const configEmbed = new MessageEmbed()
            .setDescription(`Configuration settings for ${bot_name}`)
            .addField("Anti self bot", anti_selfbot_toggle, true)
            .addField('Xp system', xpsystem, true)
            .addField("Command cooldowns", command_cooldown_toggle, true)
            .addField("Mod logs", mod_logs_toggle, true)
            .addField('Welcome message', welcome_message_enabled, true)
            .addField("Whitelisted", require('./config.json').whitelisted.join(", "), true)
            .addField("Blacklisted", blacklistedUser.join(" , "), true)
            .addField("Report System", report_system_toggle, true)
            .addField("Suggest System", suggest_system_toggle, true)
            .addField("Ignore channels", ignore_channel_toggle, true)
            .addField("Status Type", status_type, true)
            .addField("Community Counter", require('./config.json').counter, true)
            .addField("Bot Prefix", prefix, true)
            .addField("Bot owners", owners.join(", "), true)
            .addField('Mute role', `<@&${require('./config.json').mute_role}>`, true)

        message.channel.send(configEmbed)
    }

    if (command === 'boteval') {
        if (!args[0]) return message.reply("Enter code to execute!");

        try {
            // 
            const toEval = args.join(" ");
            const evalulated = eval(toEval);


        } catch (e) {
            message.channel.send('Incorrect form of **javascript** code ' + '\n\n `' + e + '`');
        }
    }

    if (command === 'afk') {
        bot.afk.set(message.author.id, {
            guild: message.guild.id,
            date: (Date.now),
            reason: args.join(" ") || "No reason given"
        })
        message.reply("I have set you as AFK.").then(() => {
            if (message.member.manageable) {
                message.guild.members.cache.find(mm => mm.id === message.member.id).setNickname(`[AFK]${message.member.user.username}`);
            } else { }
        })
    }



    if (command === 'uptime') {
        var seconds = parseInt((bot.uptime / 1000) & 60),
            minutes = parseInt((bot.uptime / (1000 * 60)) % 60),
            hours = parseInt((bot.uptime / (1000 * 60 * 60)) % 24);
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        let embed = new MessageEmbed()
            .setColor(color)
            .setDescription(`⌛𝘏𝘰𝘶𝘳: ${hours}\n\n⏱𝘔𝘪𝘯𝘶𝘵𝘦𝘴: ${minutes}\n\n⌚𝘚𝘦𝘤𝘰𝘯𝘥𝘴: ${seconds}`)
        message.channel.send(embed)

    }

   /* if (command === 'owners') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            owners.map(owner => message.channel.send(`<@${owner}>`))
        } else return message.channel.send(noPerms);
    }*/

    if (command === 'level') {
        if (require('./config.json').xp_system_toggle === true) {
            if (!message.mentions.users.first()) {
                if (!xp[message.author.id]) {
                    xp[message.author.id] = {
                        xp: 0,
                        level: 1
                    }
                }
                let curxp = xp[message.author.id].xp
                let curlvl = xp[message.author.id].level

                let lvlEmbed = new MessageEmbed()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setColor(color)
                    .addField("Level", curlvl, true)
                    .addField("XP", curxp, true)

                message.channel.send(lvlEmbed)
            } else {
                try {
                    const user = message.mentions.users.first();

                    if (!xp[user.id]) {
                        xp[message.author.id] = {
                            xp: 0,
                            level: 1
                        }
                    }
                    let curxp = xp[user.id].xp
                    let curlvl = xp[user.id].level

                    let lvlEmbed = new MessageEmbed()
                        .setAuthor(user.username, user.displayAvatarURL({dynamic: true})())
                        .setColor(color)
                        .addField("Level", curlvl, true)
                        .addField("XP", curxp, true)

                    message.channel.send(lvlEmbed)
                } catch (e) {
                    message.channel.send("The user is not on my database, Meaning the user has not typed.")
                }
            }
        } else {
            return message.channel.send("The XP system is Disabled.")
        }
    }




    if (command === 'delwarn') {
        if (message.member.hasPermission("MANAGE_CHANNELS") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const ownUser = new MessageEmbed()
                .setColor(color)
                .setDescription("You cannot delete your own warnning.")

            if (user.id === message.author.id) return message.channel.send(ownUser)

            const noWarns = new MessageEmbed()
                .setColor(color)
                .setDescription("The user has no warnings.")

            if (!warns[user.id]) {
                return message.channel.send(noWarns)
            }

            warns[user.id].warns--

            const delWarned = new MessageEmbed()
                .setColor(color)
                .setDescription(`I have deleted \`1\` warning of <@${user.id}>`)

            message.channel.send(delWarned)

            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => {
                if (err) console.log(err)
            })

        } else return message.channel.send(noPerms)
    }

    if (command === 'warn') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.members.first();
            if (!user) return message.channel.send(noMember);
            if (user.hasPermission("MANAGE_MESSAGES")) return message.channel.send(userStaff)

            let reason = args.slice(1).join(" ");
            if (!reason) reason = 'No reason given';

            if (!warns[user.id]) {
                warns[user.id] = {
                    warns: 0,
                    reason: "None"
                }
            }

            warns[user.id].warns++



            const warnedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`_<@${user.id}> has been warned_ | ${reason}`)

            message.channel.send(warnedEmbed)
            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => {
                if (err) console.log(err)
            })
            if (!userlogs[user.id]) {
                userlogs[user.id] = {
                    logs: 0
                }
            }
            userlogs[user.id].logs++
            fs.writeFile('./database/user-logs.json', JSON.stringify(userlogs), (err) => {
                if (err) console.log(err)
            })
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'modlogs') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember)


            try {
                const modlogsEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`<@${user.id}> has ${userlogs[user.id].logs || "None"} total modlogs cases.`)

                message.channel.send(modlogsEmbed);
            } catch (e) {
                const modlogsEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`<@${user.id}> has 0 total modlogs cases.`)

                message.channel.send(modlogsEmbed);
            }
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'warnings') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const warningsEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(user.username, user.displayAvatarURL({dynamic: true}))
                .setDescription(`Warnings for <@${user.id}> \n \n Warns: ${warns[user.id].warns || 'None'}`)

            message.channel.send(warningsEmbed)

        } else {
            return message.channel.send(noPerms)
        }


    }


    if (command === 'report') {
        if (report_system_toggle === true) {
            const userBot = new MessageEmbed()
                .setColor(color)
                .setDescription("That user is a bot, You can't report bots!")
            const reportUser = message.mentions.users.first();
            if (!reportUser) return message.channel.send(noMember);
            if (reportUser.bot) return message.channel.send(userBot)
            const reportReason = args.slice(1).join(" ");

            const noReportReason = new MessageEmbed()
                .setColor(color)
                .setDescription("You did not mention any reason for the report.")

            if (!reportReason) return message.channel.send(noReportReason);

            const reportEmbed = new MessageEmbed()
                .setColor(color)
                .setTimestamp()
                .setAuthor(reportUser.username, reportUser.displayAvatarURL({dynamic: true}))
                .setFooter(message.guild.name, message.guild.iconURL())
                .setDescription(`**Member:** ${reportUser.username} (${reportUser.id})
                **Reported By:** ${message.member.user.username} (${message.member.id})
                **Reported in:** <#${message.channel.id}> (${message.channel.id})
                **Reason:** ${args.slice(1).join(" ")}`)


            const reportRecived = new MessageEmbed()
                .setColor(color)
                .setDescription("Report recieved! Please wait well we proccess your report.")

            message.channel.send(reportRecived);

            bot.channels.cache.get(report_system_channel).send(reportEmbed)


        } else {
            message.channel.send("The report system Is disabled.")
        }
    }

    if (command === 'suggest') {
        if (suggest_system_toggle === true) {
            const suggestion = args.join(" ");
            const noSuggestion = new MessageEmbed()
                .setColor(color)
                .setDescription("No suggestion was provided.")
            if (!suggestion) return message.channel.send(noSuggestion)
            const suggestEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(message.author.tag + ' has made a suggestion', message.author.displayAvatarURL({dynamic: true}))
                .setDescription(suggestion)
                .setTimestamp()

            const suggestionSent = new MessageEmbed()
                .setColor(color)
                .setDescription("The suggestion has been sent.")

            message.channel.send(suggestionSent)

            bot.channels.cache.get(suggest_system_channel).send(suggestEmbed).then(m => m.react("🟢") && m.react("🔴"))
        } else {
            message.channel.send("The suggestion system is disabled.")
        }
    }

    if (command === 'purge') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const noPurge = new MessageEmbed()
                .setColor(color)
                .setDescription('Mention the amount of messages to purge!')
            const deleteCount = args[0];
            if (!deleteCount) return message.channel.send(noPurge)

            message.channel.bulkDelete(deleteCount);
        } else {
            return message.channel.send(noPerms);
        }
    }




    if (command === 'softban') {
        if (message.member.hasPermission("BAN_MEMBERS")) {
            const user = message.mentions.members.first();
            if (!user) return message.channel.send(noMember);

            if (message.member.roles.highest.position < user.roles.highest.position) return message.channel.send(aboveRole);
            if (owners.includes(user.id)) return message.channel.send(userOwner)
            user.ban({
                reason: `Softbanning user | Authorized by ${message.author.tag}`,
                days: 7
            }).then(() => {
                message.guild.members.unban(user.id).then(() => {
                    const banned = new MessageEmbed()
                        .setColor(color)
                        .setDescription(`<@${user.id}> Has been softbanned!`)
                    message.channel.send(banned)
                })
            })
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'roast') {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send(noMember);
        let msg = await message.channel.send("Getting a roast...");
        fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json')
            .then(res => res.json())
            .then(json => {
                const roastEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(user.username + ` ${json.insult}`)
                msg.edit(roastEmbed)
            })
    }

    if (command === 'invites') {
        const { MessageEmbed } = require('discord.js')
        const { guild } = message

        guild.fetchInvites().then((invites) => {
            const inviteCount = {}

            invites.forEach((invite) => {
                const { uses, inviter } = invite
                const { username, discriminator } = inviter

                const name = `${username}#${discriminator}`

                inviteCount[name] = (inviteCount[name] || 0) + uses
            })

            let replText = 'Invites:'



            for (const invite in inviteCount) {
                const count = inviteCount[invite]
                replText += `\n${invite} has  invited ${count} member(s)`
            }
            try {
                let e = new MessageEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setDescription(replText)
                    .setColor(color)
                message.channel.send(e);
            } catch (e) {
                message.channel.send("I cannot list all the invites as it is more than 2000 characters to write out.")
            }
        })
    }

    if (command === 'id') {
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();
        const user = message.mentions.users.first();
        const n = new MessageEmbed()
            .setColor(color)
            .setDescription("Mention a member/role/channel")
        if (!role && !channel && !user) return message.channel.send(n)
        if (role) {
            message.channel.send(`${role.name} ID is: ${role.id}`)
        } else {
            if (channel) {
                message.channel.send(`${channel.name} ID is: ${channel.id}`)
            } else {
                if (user) {
                    message.channel.send(user.tag + ' ID is: ' + user.id)
                }
            }
        }
    }

    if (command === 'docs') {
        const noQuery = new MessageEmbed()
            .setColor(color)
            .setDescription("Enter a query for me to Search!")
        const uri = `https://djsdocs.sorta.moe/v2/embed?src=stable&q=${encodeURIComponent(args.join(" "))}`;
        if (!args[0]) return message.channel.send(noQuery)
        axios.get(uri)
            .then((embed) => {
                const { data } = embed

                if (data && !data.error) {
                    message.channel.send({
                        embed: data
                    })
                } else {
                    const noFind = new MessageEmbed()
                        .setColor(color)
                        .setDescription('There was no results for that query')
                    message.reply(noFind)
                }
            })
            .catch(err => {

            })

    }

    if (command === 'stats') {
        let embed = new MessageEmbed()
            .setColor(color)
            .setDescription(`**${bot_name} Bot Stats** \n \n Statics on the bot`)
            .addField("Info", `-\`Latency:\` ${bot.ws.ping}ms \n -\`Prefix:\` ${require('./config.json').prefix}\n -\`Libary:\` discord.js`)
            .addField("Bot Guild Info", `-\`Channels\` ${bot.channels.cache.size} \n -\`Emojis\` ${bot.emojis.cache.size} \n -\`Shards\` ${bot.options.shardCount}`)
            .addField("Procces Usage", `-\`Memory Usage\` ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB \n -\`Cpu Usage\` ${(process.cpuUsage().system).toFixed(1)}% \n -\`Recourse Usage\` ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + (process.cpuUsage().system).toFixed(1)}`)
        message.channel.send(embed);
    }


    if (command === 'loop') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);
        const repeatMode = player.getQueue(message).repeatMode;

        if (repeatMode) {
            player.setRepeatMode(message, false);
            return message.channel.send('Repeat mode **disabled** !');
        } else {
            player.setRepeatMode(message, true);
            return message.channel.send('Repeat mode **enabled** !');
        };
    }

    if (command === 'pause') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        if (!player.getQueue(message)) return message.channel.send('No music currently playing!');

        player.pause(message);

        message.channel.send(`Song ${player.getQueue(message).playing.title} **paused** !`);

    }

    if (command === 'resume') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        if (!player.getQueue(message)) return message.channel.send('No music currently playing!');

        player.resume(message);

        message.channel.send(`Song ${player.getQueue(message).playing.title} **Resumed** !`);
    }


    if (command === 'np') {
        const track = await player.nowPlaying(message);
        const filters = [];

        Object.keys(player.getQueue(message).filters).forEach((filterName) => {
            if (player.getQueue(message).filters[filterName]) filters.push(filterName);
        });

        message.channel.send({
            embed: {
                color: color,
                author: { name: track.title },
                footer: { text: `${bot_name} Music` },
                fields: [
                    { name: 'Channel', value: track.author, inline: true },
                    { name: 'Requested by', value: track.requestedBy.username, inline: true },
                    { name: 'From playlist', value: track.fromPlaylist ? 'Yes' : 'No', inline: true },

                    { name: 'Views', value: track.views, inline: true },
                    { name: 'Duration', value: track.duration, inline: true },
                    { name: 'Filters activated', value: filters.length, inline: true },

                    { name: 'Progress bar', value: player.createProgressBar(message, { timecodes: true }), inline: true }
                ],
                thumbnail: { url: track.thumbnail },
                timestamp: new Date(),
            },
        });

    }

    if (command === 'stop') {
        const musicStopped = new MessageEmbed()
            .setColor(color)
            .setDescription("I have stopped the music.")
        player.setRepeatMode(message, false)
        player.stop(message)
        message.channel.send(musicStopped)
    }

    if (command === 'membercount') {
        const mCount = new MessageEmbed()
            .setColor(color)
            .setDescription(`**${message.guild.name}** has: \n \n ${message.guild.memberCount} members!`)

        message.channel.send(mCount)
    }

    if (command === 'ascii') {
        const figlet = require('figlet')
        if (!args[0]) return message.channel.send('Please provide a text!');

        let msg = args.join(" ");

        figlet.text(msg, function (err, data) {
            if (err) {
                console.log('Sometyhing went wromng!');
                console.dir(err);
            }

            if (data.length > 2000) return message.reply('Please privde text that is under 2000 characters!');

            message.channel.send('```' + data + '```')
        })
    }

    if (command === 'cat') {

        let msg = await message.channel.send('Generating...')

        let { body } = await superagent
            .get('https://aws.random.cat/meow')
        //console.log(body.file)
        if (!{ body }) return message.channel.send('I cant! Please try again')

        const catEmbed = new MessageEmbed()


            .setAuthor('cat!')
            .setColor(color)
            .setImage(body.file)
            .setTimestamp()

        message.channel.send(catEmbed)

        msg.delete();
    }

    if (command === 'dog') {
        let msg = await message.channel.send('Generating...')

        let { body } = await superagent
            .get('https://dog.ceo/api/breeds/image/random')
        //console.log(body.file)
        if (!{ body }) return message.channel.send('I cant! Please try again')

        const dogEmbed = new MessageEmbed()


            .setAuthor('dog!')
            .setColor(color)
            .setImage(body.message)
            .setTimestamp()


        message.channel.send(dogEmbed)//.then(msg => msg.delete({timeout: "10000"}));

        msg.delete();
    }

    if (command === 'join') {
        const Iam = new MessageEmbed()
            .setColor(color)
            .setDescription("I am already in a voice a channel!")
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);
        if (message.guild.me.voice.channel) return message.channel.send(Iam)

        message.member.voice.channel.join().then(() => {
            const joined = new MessageEmbed()
                .setColor(color)
                .setDescription(`I have joined **${message.member.voice.channel.name}**`)

            message.channel.send(joined)
        })
    }

    if (command === 'leave') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        message.member.voice.channel.leave()
        const joined = new MessageEmbed()
            .setColor(color)
            .setDescription(`I have left **${message.member.voice.channel.name}**`)

        message.channel.send(joined)

    }

    if (command === 'play') {

        if (!message.member.voice.channel) return message.channel.send(noMusicChannel)

        player.play(message, args.join(" "));

        const eee = new MessageEmbed()
            .setColor(color)
            .setDescription("Searching for results..")

        message.channel.send(eee)

    }

    if (command === 'meme') {
        fetch('https://meme-api.herokuapp.com/gimme')
            .then(res => res.json())
            .then(async json => {
                let msg = await message.channel.send('Fetching you a meme...');
                const memeEmbed = new MessageEmbed()
                    .setColor(color)
                    .setTitle(json.title)
                    .setImage(json.url)
                    .setFooter(`Subredit : ${json.subreddit}`);

                msg.edit(memeEmbed);
            })
    }

    if (command === 'covid') {
        const data = await api.all()
        const coronaEmbed = new MessageEmbed()
            .setColor(color)
            .addField("Casses", data.cases)
            .addField("Deaths", data.deaths)
            .addField("Recoverd", data.recovered)
            .addField("Active", data.active)
            .addField("Today Cases", data.todayCases)
            .addField("Critical", data.critical)
            .addField("tests", data.tests)
            .addField("Today Deaths", data.todayDeaths)
            .addField("Cases Per million", data.casesPerOneMillion)
            .addField("Affected Countries", data.affectedCountries)

        message.channel.send(coronaEmbed);
    }







    if (command === 'calc') {
        let method = args[0];
        let firstNumber = Number(args[1]);
        let secondNumber = Number(args[2])
        const operations = ['add', 'subtract', 'multiply', 'divide'];

        if (!method) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        let noOperations = new MessageEmbed()
            .setColor(0xb51d36)
            .setDescription(' No operations mentioned.')
        if (!operations.includes(method)) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (!args[1]) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (!args[2]) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (isNaN(firstNumber)) return message.reply("The first number must be a number!");

        if (isNaN(secondNumber)) return message.reply("The second number must be a number!");

        if (method === 'add') {
            let doMath = firstNumber + secondNumber
            message.channel.send(`${firstNumber} + ${secondNumber} = ${doMath}`);
        }
        if (method === 'subtract') {
            let doMath = firstNumber - secondNumber
            message.channel.send(`${firstNumber} - ${secondNumber} = ${doMath}`);
        }
        if (method === 'multiply') {
            let doMath = firstNumber * secondNumber
            message.channel.send(`${firstNumber} x ${secondNumber} = ${doMath}`);
        }
        if (method === 'divide') {
            let doMath = firstNumber / secondNumber
            message.channel.send(`${firstNumber} / ${secondNumber} = ${doMath}`);
        }

    }

    if (command === 'av') {
        if (args[0]) {
            const user = message.mentions.users.first();
            if (!user) return message.reply('Please mention a user to access their profile picture.');

            const otherIconEmbed = new MessageEmbed()
                .setTitle(`${user.username}'s avatar!`)
                .setImage(user.displayAvatarURL({dynamic: true}));

            return message.channel.send(otherIconEmbed).catch(err => console.log(err));
        }

        const myIconEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${message.author.username}'s Avatar!`)
            .setImage(message.author.tag, message.author.displayAvatarURL({dynamic: true}))

        return message.channel.send(myIconEmbed).catch(err => console.log(err));
    }

    if (command === 'unban') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            if (!args[0]) return message.channel.send(noMember)
            let bannedU = await bot.users.fetch(args[0])
            const notFound = new MessageEmbed()
                .setColor(color)
                .setDescription(`  The user was not found! Please make sure to give the user ID.`)
            if (!bannedU) return message.channel.send(notFound);

            const unbanned = new MessageEmbed()
                .setColor(color)
                .setDescription(` ${bannedU.username} has been unbanned!`)

            message.channel.send(unbanned)

            message.guild.members.unban(bannedU);
        } else return message.channel.send(noPerms);
    }

    if (command === 'didyouknow' || command === 'dyk') {
        let responses = [
            "North Korea and Cuba are the only places you cant buy Coca-Cola. ...",
            "The entire world\'s population could fit inside Los Angeles. ...",
            "The hottest chili pepper in the world is so hot it could kill you.",
            "The Paris Agreement on climate change was signed by the largest number of countries ever in one day.",
            "More people visit France than any other country.",
            "The world's most densely populated island is the size of two soccer fields.",
            "The world's quietest room is located at Microsoft's headquarters in Washington state.",
            "There are only three countries in the world that don't use the metric system.",
            "More than 52 percent of the world\'s population is under 30 years old.",
            "Four babies are born every second.",
            "The coldest temperature ever recorded was -144 degrees Fahrenheit.",
            "Africa and Asia are home to nearly 90 percent of the world\'s rural population.",
            "The Earth's ozone layer will make a full recovery in 50 years.",
            "There are around 4 quadrillion quadrillion bacteria on Earth",
            "Muhammad is thought to be the most popular name in the world.",
            "People who are currently alive represent about 7 percent of the total number of people who have ever lived.",
            "Only two countries use purple in their national flags.",
            "A record-breaking 92 countries competed in the 2018 Winter Olympics.",
            "South Sudan is the youngest country in the world",
            "Four babies are born every second.",
            "More than 52 percent of the world's population is under 30 years old.",
            "There are more than 24 time zones around the world.",
            "Nearly half of the world's population watched both the 2010 and 2014 FIFA World Cup games.",
            "California is home to the \"Artichoke Capital of the World.\"",
            "There are 43 countries that still have a royal family.",
            "All giant pandas in zoos around the world are on loan from China."
        ]

        message.channel.send(responses[Math.floor(Math.random() * responses.length)])
    }

    if (command === 'unmute') {
        if (message.member.hasPermission("MANAGE_ROLES") || owners.includes(message.author.id)) {
            const user = message.guild.member(message.mentions.users.first());
            if (!user) return message.channel.send(noMember);

            const muteRole = require('./database/muterole.json')[message.guild.id].role

            user.roles.remove(muteRole).then(() => {

                const removed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`I have unmuted <@${user.id}>`)

                message.channel.send(removed)
            })
        } else return message.channel.send(noPerms);
    }

    if (command === 'embed') {
        message.delete();
        const embedSay = args.join(" ")
        let noEmbedSay = new MessageEmbed()
            .setColor(color)
            .setDescription("Noting was mention to say!")
        if (!embedSay) return message.channel.send(noEmbedSay)
        const embedembed = new MessageEmbed()
            .setColor(color)
            .setDescription(embedSay)

        message.channel.send(embedembed)
    }

    if (command === 'say') {
        message.delete();
        const noSaY = new MessageEmbed()
            .setColor(color)
            .setDescription('There was nothing mentioned for me to say!')
        if (!args) return message.channel.send(noSaY)
        message.channel.send(args.join(" "))
    }

    if (command === 'snipe') {
        try {

            const msg = bot.snipes.get(message.channel.id)
            if (!msg) return message.channel.send(noSnipe)
            const snipedEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({dynamic: true})())
                .setDescription(msg.content)
                .setTimestamp()
            message.channel.send(snipedEmbed)
        } catch (e) {

            const noSnipe = new MessageEmbed()
                .setColor(color)
                .setDescription('I could not find anything to snipe!')
            message.channel.send(noSnipe)
        }
    }


    if (command === 'ping') {
        message.channel.send("Pinging...").then(msgs => {
            const ping = msgs.createdTimestamp - message.createdTimestamp;

            msgs.edit(`Pong!🏓 Response ping is: \`${ping}\`ms | Discord API latency is: \`${bot.ws.ping}\`ms`)
        })
    }

    if (mod_logs_toggle === true) {
        if (message.member.hasPermission("MANAGE_MESSAGES")) {

            const logEmbed = new MessageEmbed()
                .setColor(mod_logs_color)
                .setDescription(`<@${message.author.id}> has used \`${message.content}\` in <#${message.channel.id}>`);

            bot.channels.cache.get(mod_logs_channel).send(logEmbed);

        }
    } else {

    }



  
    if (command === 'serverinfo') {
        const owner = message.guild.ownerID
        let embed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${message.guild.name}`)
            .addField("**Owner:**", `<@${owner}>`, true)
            .addField("Region", message.guild.region, true)
            .addField("Text Channels", message.guild.channels.cache.size, true)
            .addField("Members", message.guild.memberCount, true)
            .addField("**Role list**", message.guild.roles.cache.size, true)
            .setThumbnail(message.guild.iconURL())
            .setFooter(`${message.author.username}`, message.author.displayAvatarURL({dynamic: true}))

        message.channel.send(embed)
    }


    if (command === 'kick') {
        if (message.member.hasPermission("KICK_MEMBERS") || owners.includes(message.author.id)) {
            const member = message.guild.member(message.mentions.users.first());
            if (!member) return message.channel.send(noMember);
            let reason = args.slice(1).join(" ")
            if (!reason) reason = 'No reason given';
            if (message.member.roles.highest.position < member.roles.highest.position) return message.channel.send(aboveRole);

            if (owners.includes(member.id)) return message.channel.send(userOwner);

            member.kick(member, `Authorized by ${message.author.tag}`).then(() => {
                const kickedEmbec = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${member.user.username} has been kicked`)
                message.channel.send(kickedEmbec)
            })
        } else return message.channel.send(noPerms)
    }


    if (command === 'ban') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const member = message.guild.member(message.mentions.users.first());
            if (!member) return message.channel.send(noMember);
            let reason = args.slice(1).join(" ")
            if (!reason) reason = 'No reason given';
            if (message.member.roles.highest.position < member.roles.highest.position) return message.channel.send(aboveRole);
            if (owners.includes(member.id)) return message.channel.send(userOwner);

            member.ban({
                reason: `Autorized by ${message.author.tag}`
            }).then(() => {
                const kickedEmbec = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${member.user.username} has been banned`)
                message.channel.send(kickedEmbec)
            })
        } else {
            return message.channel.send(noPerms);
        }
    }



    if (command === 'mute') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const wUser = message.guild.member(message.mentions.users.first())
            if (wUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send(userStaff)
            if (!wUser) return message.channel.send(noMember)
            let time = args[1]

            const noTimeEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription("No time was mentioned")


            if (!time) return message.channel.send(noTimeEmbed);
            if (owners.includes(wUser.id)) return message.channel.send(userOwner);

            let muteRole = require('./config.json').mute_role
            if (muteRole === 'MUTE ROLE HERE') muteRole = message.guild.roles.cache.find(role => role.name === 'Muted')
            if (wUser.roles.cache.has(muteRole)) return message.reply("The user is already muted.")

            wUser.roles.add(muteRole)

            const mutedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`${wUser.user.username} has been muted for ${time}`)

            message.channel.send(mutedEmbed);

            if (!userlogs[wUser.id]) userlogs[wUser.id] = {
                logs: 0
            }

            userlogs[wUser.id].logs++

            fs.writeFile('./database/user-logs.json', JSON.stringify(userlogs), (err) => {
                if (err) console.log(err);
            })


            setTimeout(() => {
                let unmkutedEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${wUser.user.username} has now been unmuted!`)
                wUser.roles.remove(muteRole).then(() => {
                    message.channel.send(unmkutedEmbed)
                })
            }, (ms(time)))
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'gay') {
        //   console.log(bot.locked.get(message.channel.id).perms)
        let gayMember = message.mentions.users.first()
        if (!gayMember) gayMember = message.author
        const gayEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${gayMember.tag} gayrate is:`)
            .setDescription(`${gayMember.tag} is ${Math.floor(Math.random() * 100)}% gay`)

        message.channel.send(gayEmbed)
    }

    if (command === 'whois' || command === 'userinfo') {
        if (message.mentions.users.last()) {
            const wuser = message.mentions.users.first();
            const mUser = message.mentions.members.first();
            const embed = new MessageEmbed()
                .setColor(color)
                .setTitle(`User info for ${wuser.username}`)
                .addFields(
                    {
                        name: "User tag",
                        value: mUser.user.tag,
                        inline: true
                    },
                    {
                        name: 'Is bot',
                        value: mUser.user.bot,
                        inline: true
                    },
                    {
                        name: 'Nickname',
                        value: mUser.nickname || 'None',
                        inline: true
                    },
                    {
                        name: 'Joined server',
                        value: new Date(mUser.joinedTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: 'Joined Discord',
                        value: new Date(wuser.createdTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: 'Role count',
                        value: mUser.roles.cache.size - 1,
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: mUser.roles.cache.map(role => `<@&${role.id}>`),
                        inline: true
                    },
                )
            message.channel.send(embed)
        } else {

            //        if (message.mentions.users.last().id !== this.client.user.id || message.mentions.users.last().id === this.client.user.id) {
            const e = new MessageEmbed()
                .setColor(color)
                .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                .setTitle(`User info for ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL({dynamic: true}))
                .addFields(
                    {
                        name: 'User tag',
                        value: message.author.tag,
                        inline: true
                    },
                    {
                        name: 'Is bot',
                        value: message.author.bot,
                        inline: true
                    },
                    {
                        name: "Nickname",
                        value: message.member.nickname || 'None',
                        inline: true
                    },
                    {
                        name: 'Joined server',
                        value: new Date(message.member.joinedTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: "Joined discord",
                        value: new Date(message.author.createdTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: "Role count",
                        value: message.member.roles.cache.size - 1,
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: message.member.roles.cache.map(role => `<@&${role.id}>`),
                        inline: true
                    },
                )
            //    }
            message.channel.send(e)
        }
    }

    if (command === 'unban')


        if (command === 'lock') {
            const channel = message.mentions.channels.first();

            if (!channel) return message.channel.send(noChannel);

            const mainRole = message.guild.roles.everyone.id
            bot.locked.set(channel.id, {
                perms: channel.permissionOverwrites
            })

            channel.createOverwrite(mainRole, {
                SEND_MESSAGES: false
            }).then(() => {
                const locked = new MessageEmbed()
                    .setColor(color)
                    .setDescription("The channel has been locked!");
                message.channel.send(locked);
            })
        }

    if (command === 'unlock') {
        const channel = message.mentions.channels.first();

        if (!channel) return message.channel.send(noChannel);

        const mainRole = message.guild.roles.everyone.id

        channel.updateOverwrite(mainRole, {
            SEND_MESSAGES: null
        }).then(() => {
            const locked = new MessageEmbed()
                .setColor(color)
                .setDescription("The channel has been unlocked!");
            message.channel.send(locked);
        })
    }

    if (command === 'hackban') {
        try {
            if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(noPerms)
            const user = await bot.users.fetch(args[0]);
            if (!args[0]) return message.channel.send(noMember)
            if (!user) return message.channel.send(noMember);
            if (owners.includes(user.id)) return message.channel.send(userOwner);
            message.guild.members.ban(user);

            const hackbanned = new MessageEmbed()
                .setColor(color)
                .setDescription(`I have banned ${user.username} from the server!`)

            message.channel.send(hackbanned)


        } catch (color) {

            message.channel.send(noError)
        }
    }


    if (command === 'token') {
        const tokenEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription("Mention a users token I must grab")
        try {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(tokenEmbed)
            message.channel.send(Buffer.from(user.id).toString("base64") + Buffer.from(user.lastMessageID).toString("base64"))
        } catch (e) {
            message.channel.send("The user has not typed recently Which is required for me to pull their token.")
        }
    }

    if (command === 'dm') {
        if (!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send(noPerms)
        message.delete();
        const user = message.mentions.users.first();

        if (!user) return message.channel.send(noMember);

        user.send(args.slice(1).join(" "))
    }

})

bot.on("channelCreate", (guildchannel, dmchannel) => {
    if (guildchannel.type === 'dm') return;
    const channelCreated = new MessageEmbed()
        .setColor(mod_logs_color)
        .setDescription(`_A channel has been created_ \n \n **Channel:** <#${guildchannel.id}> \n **Channel ID:** ${guildchannel.id}\n **Channel type:** ${guildchannel.type}`)
    if (mod_logs_toggle === true) {
        bot.channels.cache.get(mod_logs_channel).send(channelCreated);
    } else { }
})

bot.on("messageUpdate", (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return;
    const messageEditedEmbed = new MessageEmbed()
        .setColor(mod_logs_color)
        .setAuthor(oldMessage.author.tag, oldMessage.author.displayAvatarURL({dynamic: true})())
        .setDescription(`Message Updated in <#${oldMessage.channel.id}> \n \n **Old Message:** \n ${oldMessage.content} \n **New Message:** \n ${newMessage.content}`)
    if (mod_logs_toggle === true) {

        bot.channels.cache.get(mod_logs_channel).send(messageEditedEmbed)

    } else { }
})






bot.on("messageDelete", (message) => {
    if (message.embeds.length) return;
    if (mod_logs_toggle === true) {
        const messageDeletedEmebd = new MessageEmbed()
            .setColor(mod_logs_color)
            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
            .setDescription(`Message deleted in **<#${message.channel.id}>** \n \`${message.content}\``)
            .setTimestamp()
        bot.channels.cache.get(mod_logs_channel).send(messageDeletedEmebd)
    } else { }
    bot.snipes = new Map();
    bot.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author
    })
})

bot.login(token)