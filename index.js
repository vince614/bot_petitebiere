const {
    Client,
    Util
} = require('discord.js');
const client = new Client({
    disableEveryone: true
});
const config = require('./assets/json/config.json');
const mysql = require('mysql');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const youtube = new YouTube(config.GOOGLE_API_KEY);
const queue = new Map();
const prefix = config.prefix;

//Connection bdd bot
const con = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.databaseBot
});

//Vérif la connection avec la bdd site
con.connect(function (err) {
    if (err) return;
    console.log("Connected to database !");
});

client.on('warn', console.warn);
client.on('error', console.error);


client.on('ready', () => {

    console.log("Bots is ready !");

    //Status du bot
    client.user.setPresence({
        game: {
            name: '--help | MP pour contacter le staff',
            type: 0
        }
    });

    //Set interval (ms)
    var interval = 60000;

    //function interval
    setInterval(function () {

        //Mute
        const guilds = client.guilds.array(x => (x));
        var guildsCount = client.guilds.map(x => (x)).length;

        var i = 0;
        while (i < guildsCount) {

            let roleID = "480369695745114112";
            let membersWithRole = guilds[i].roles.get(roleID).members;
            let memberId = membersWithRole.map(x => (x.user.id));
            let userAvatar = membersWithRole.map(x => (x.user.avatarURL));
            let userTag = membersWithRole.map(x => (x.user.tag));
            let memberWithRoleSize = membersWithRole.size;
            let role = guilds[i].roles.get(roleID);
            let guildName = guilds[i].name;
            let guildAvatar = guilds[i].iconURL;

            var x = 0;
            while (x < memberWithRoleSize) {

                let memberIdx = memberId[x];
                let memberAvatar = userAvatar[x];
                let memberTag = userTag[x];

                con.query("SELECT COUNT(*) AS nb FROM mute WHERE memberId = ?", [memberIdx], function (err, result, fields) {

                    if (result[0].nb != 0) {

                        con.query("SELECT * FROM mute WHERE memberId = ?", [memberIdx], function (err, results, fields) {


                            let timestampLeft = results[0].timestampLeft;
                            let modoId = results[0].modoId;

                            //timestamp
                            var date = new Date();
                            var timestamp = date.getTime();

                            if (timestampLeft < timestamp) {

                                //Mettre un message dans le channel #sanction
                                channelSanction = client.channels.get("381554735192342538");

                                //Si le channel existe
                                if (channelSanction) {

                                    channelSanction.send({
                                        embed: {
                                            color: (0x4DE44D),
                                            author: {
                                                name: `${memberTag} Viens d'être démute !`,
                                                icon_url: memberAvatar
                                            },
                                            fields: [{
                                                name: 'Membre',
                                                value: `<@${memberIdx}>`,
                                                inline: true
                                            }, {
                                                name: 'Modérateur',
                                                value: `<@${modoId}>`,
                                                inline: true
                                            }, {
                                                name: 'Raison du demute',
                                                value: 'Auto',
                                                inline: true
                                            }],
                                            timestamp: Date.now(),
                                            footer: {
                                                icon_url: guildAvatar,
                                                text: guildName,
                                            }
                                        }
                                    });

                                }

                                const guildsOn = client.guilds.array(x => (x));

                                let memberDeleteRole = guildsOn[0].members.get(memberIdx);

                                //Enlever le rôle
                                memberDeleteRole.removeRole(role).catch(console.error);
                                memberDeleteRole.send(`:mega: Vous avez été démute dans le serveur **${guildsOn[0].name}**`);

                                //Delete tout ce qui concerne le mute
                                con.query("DELETE FROM mute WHERE memberId = ?", [memberIdx], function (err, results, fields) {
                                    console.log("Number of records deleted: " + result.affectedRows);
                                });

                            }




                        });

                    }

                });

                x++;

            }

            i++;

        }

    }, interval);

});

// Initialize the invite cache
const invites = {};

// A pretty useful method to create a delay without blocking the whole script.
const wait = require('util').promisify(setTimeout);

client.on('ready', () => {
  // "ready" isn't really ready. We need to wait a spell.
  wait(1000);

  // Load all invites for all guilds and save them to the cache.
  client.guilds.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    });
  });
});

//Welcome
client.on('guildMemberAdd', member => {

    let welcomeChannel = client.channels.get("328279276342345729");
    let generalChannel = client.channels.get("326331455745556481");
    let guildname = member.guild.name;
    let guildAvatar = member.guild.iconURL;
    let memberAvatar = member.user.avatarURL ? member.user.avatarURL : 'https://cdn.discordapp.com/embed/avatars/0.png';
    let memberName = member.user.username;
    let memberId = member.user.id;
    let memberCount = member.guild.memberCount;
    let memberCreateDate = member.user.createdTimestamp;

    //Convertissions du timestamp en temps
    var date = new Date();
    var timestampNow = date.getTime();
    var timestampNowFinal = parseInt(timestampNow / 1000);
    var memberCreateDateFinal = parseInt(memberCreateDate / 1000);

    timeLeft = timestampNowFinal - memberCreateDateFinal;

    var days = Math.floor(timeLeft / 86400);
    var hours = Math.floor((timeLeft - (days * 86400)) / 3600);
    var minutes = Math.floor((timeLeft - (days * 86400) - (hours * 3600)) / 60);

    //invites
    member.guild.fetchInvites().then(guildInvites => {
        let welcomeChannel = client.channels.get("328279276342345729");
        const ei = invites[member.guild.id];
        invites[member.guild.id] = guildInvites;
        const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses);
        const inviter = client.users.get(invite.inviter.id);

        //Welcome message dans le channel #join
        welcomeChannel.send({
            embed: {
                color: 3447003,
                author: {
                    name: guildname,
                    icon_url: guildAvatar
                },
                thumbnail: {
                    url: memberAvatar
                },
                fields: [{
                    name: "Bienvenue 🛡",
                    value: `<@${memberId}> viens de nous rejoindre !`
                }, {
                    name: "Position 🔰",
                    value: `**${memberCount} ème** personnes`
                }, {
                    name: "Création de compte 📆",
                    value: `Compte crée il y **${days} jours , ${hours} heures et ${minutes} minutes** `
                }, {
                    name: "Invitation 📎",
                    value: `**${invite.code}** créé par **${inviter.tag}** [**${invite.uses}** invites]`
                }],
                timestamp: Date.now(),
                footer: {
                    icon_url: memberAvatar,
                    text: memberName,
                }
            }
        });

    });



    //Welcome message dans le #général
    generalChannel.send(`**Bienvenue <@${memberId}> !**`);

    //Welcome message on private
    member.send(`**-------------------- \n|  :bell: Bienvenue  | \n--------------------** \n \nBienvenue <@${memberId}> sur **${guildname}** ! \n \nTu es le **${memberCount} ème** ... Hum un peu en retard :stopwatch: \n \nPense à lire le **<#475675267537567779>**  ! \n \n:beginner: **Si vous avez un moindre soucis, le staff est là pour vous**:beginner:\n \n**-------------------------------
    | :crown: Owner : <@224505938206392321> :crown: |
    -------------------------------** \n \n**-----------------
    |  :shield:    Rôles  |
    -----------------** \n \nN'oublie pas de configurer tes <#480757234020909057>`);

    //Mettre un rôle
    let joinsRoleId = '480383301576818688';
    member.addRole(member.guild.roles.find(role => role.id === joinsRoleId));



});

//Left
client.on('guildMemberRemove', member => {

    let welcomeChannel = client.channels.get("328279276342345729");
    let guildname = member.guild.name;
    let guildAvatar = member.guild.iconURL;
    let memberAvatar = member.user.avatarURL ? member.user.avatarURL : 'https://cdn.discordapp.com/embed/avatars/0.png';
    let memberName = member.user.username;
    let memberId = member.user.id;

    //Leave message dans le channel #join
    welcomeChannel.send({
        embed: {
            color: (0xF95467),
            author: {
                name: guildname,
                icon_url: guildAvatar
            },
            thumbnail: {
                url: memberAvatar
            },
            fields: [{
                name: "Aurevoir !",
                value: `**${memberName}** viens de nous quitter !`
            }],
            timestamp: Date.now(),
            footer: {
                icon_url: memberAvatar,
                text: memberName,
            }
        }
    });

});

// //Infos users
client.on('message', message => {

    if (message.channel.type === 'text') {

        //guild
        let guildName = message.guild.name;
        let guildAvatar = message.guild.iconURL;

        //channel
        let defaultChannel = message.channel;

        //user
        let userTag = message.author.tag;
        let userId = message.author.id;
        let userName = message.author.username;
        let userAvatar = message.author.avatarURL;


        if (message.author.bot) return;
        if (message.content === prefix + "ui") {

            let memberCreateTimestamp = message.author.createdTimestamp;
            let memberJoinTimestamp = message.member.joinedTimestamp;
            let memberCreateDate = message.author.createdAt;
            let memberJoinDate = message.member.joinedAt;
            let userStatus = message.author.presence.status;
            let userRoles = message.member.roles.map(roles => (roles.name)).join(' | ');
            let memberRolesCount = message.member.roles.map(roles => (roles)).length;
            let memberBestRole = message.member.highestRole.name;
            let memberColor = message.member.displayHexColor;


            //status
            if (userStatus == 'offline') {
                status = 'Hors ligne';
            } else if (userStatus == 'dnd') {
                status = 'Ne pas déranger';
            } else if (userStatus == 'online') {
                status = 'En ligne';
            } else if (userStatus == 'idle') {
                status = 'Inactif';
            }

            //Création du compte
            var date = new Date();
            var timestampNow = date.getTime();
            var timestampNowFinal = parseInt(timestampNow / 1000);
            var memberCreateDateFinal = parseInt(memberCreateTimestamp / 1000);
            var memberJoinDateFinal = parseInt(memberJoinTimestamp / 1000);

            //Create
            timeLeftCreate = timestampNowFinal - memberCreateDateFinal;

            var daysC = Math.floor(timeLeftCreate / 86400);
            var hoursC = Math.floor((timeLeftCreate - (daysC * 86400)) / 3600);
            var minutesC = Math.floor((timeLeftCreate - (daysC * 86400) - (hoursC * 3600)) / 60);

            //Join
            timeLeftJoin = timestampNowFinal - memberJoinDateFinal;

            var daysJ = Math.floor(timeLeftJoin / 86400);
            var hoursJ = Math.floor((timeLeftJoin - (daysJ * 86400)) / 3600);
            var minutesJ = Math.floor((timeLeftJoin - (daysJ * 86400) - (hoursJ * 3600)) / 60);

            defaultChannel.send({
                embed: {
                    color: 3447003,
                    author: {
                        name: userName,
                        icon_url: userAvatar
                    },
                    thumbnail: {
                        url: userAvatar
                    },
                    fields: [{
                        name: 'ID',
                        value: userId,
                        inline: true
                    }, {
                        name: 'Tag',
                        value: userTag,
                        inline: true
                    }, {
                        name: 'Username',
                        value: userName,
                        inline: true
                    }, {
                        name: 'Mention',
                        value: `<@${userId}>`,
                        inline: true
                    }, {
                        name: 'Couleur',
                        value: memberColor,
                        inline: true
                    }, {
                        name: 'Création du compte',
                        value: `Compte crée il y **${daysC} jours , ${hoursC} heures et ${minutesC} minutes** | ${memberCreateDate}`,
                    }, {
                        name: 'Arrivée dans le serveur',
                        value: `Rejoint il y **${daysJ} jours , ${hoursJ} heures et ${minutesJ} minutes** | ${memberJoinDate}`,
                    }, {
                        name: 'Status',
                        value: status,
                        inline: true
                    }, {
                        name: `Rôles [${memberRolesCount}]`,
                        value: userRoles,
                    }, {
                        name: 'Plus haut rôle',
                        value: memberBestRole,
                    }],
                    timestamp: Date.now(),
                    footer: {
                        icon_url: guildAvatar,
                        text: guildName,
                    }
                }
            });

        }

        let memberMention = message.mentions.members.first() ? message.mentions.members.first() : false;

        //Si mention
        if (memberMention !== false) {

            let memberTag = memberMention.user.tag;

            if (message.content.startsWith(prefix + "ui")) {



                //user
                let userTagM = memberMention.user.tag;
                let userIdM = memberMention.user.id;
                let userNameM = memberMention.user.username;
                let userAvatarM = memberMention.user.avatarURL;
                let memberCreateTimestampM = memberMention.user.createdTimestamp;
                let memberJoinTimestampM = memberMention.joinedTimestamp;
                let memberCreateDateM = memberMention.user.createdAt;
                let memberJoinDateM = memberMention.joinedAt;
                let userStatusM = memberMention.user.presence.status;
                let userRolesM = memberMention.roles.map(roles => (roles.name)).join(' | ');
                let memberRolesCountM = memberMention.roles.map(roles => (roles)).length;
                let memberBestRoleM = memberMention.highestRole.name;
                let memberColorM = memberMention.displayHexColor;




                //status
                if (userStatusM == 'offline') {
                    status = 'Hors ligne';
                } else if (userStatusM == 'dnd') {
                    status = 'Ne pas déranger';
                } else if (userStatusM == 'online') {
                    status = 'En ligne';
                } else if (userStatusM == 'idle') {
                    status = 'Inactif';
                }

                //Création du compte
                var date = new Date();
                var timestampNow = date.getTime();
                var timestampNowFinal = parseInt(timestampNow / 1000);
                var memberCreateDateFinal = parseInt(memberCreateTimestampM / 1000);
                var memberJoinDateFinal = parseInt(memberJoinTimestampM / 1000);

                //Create
                timeLeftCreate = timestampNowFinal - memberCreateDateFinal;

                var daysC = Math.floor(timeLeftCreate / 86400);
                var hoursC = Math.floor((timeLeftCreate - (daysC * 86400)) / 3600);
                var minutesC = Math.floor((timeLeftCreate - (daysC * 86400) - (hoursC * 3600)) / 60);

                //Join
                timeLeftJoin = timestampNowFinal - memberJoinDateFinal;

                var daysJ = Math.floor(timeLeftJoin / 86400);
                var hoursJ = Math.floor((timeLeftJoin - (daysJ * 86400)) / 3600);
                var minutesJ = Math.floor((timeLeftJoin - (daysJ * 86400) - (hoursJ * 3600)) / 60);

                //channel
                let defaultChannel = message.channel;

                defaultChannel.send({
                    embed: {
                        color: 3447003,
                        author: {
                            name: userNameM,
                            icon_url: userAvatarM
                        },
                        thumbnail: {
                            url: userAvatarM
                        },
                        fields: [{
                            name: 'ID',
                            value: userIdM,
                            inline: true
                        }, {
                            name: 'Tag',
                            value: userTagM,
                            inline: true
                        }, {
                            name: 'Username',
                            value: userNameM,
                            inline: true
                        }, {
                            name: 'Mention',
                            value: `<@${userIdM}>`,
                            inline: true
                        }, {
                            name: 'Couleur',
                            value: memberColorM,
                            inline: true
                        }, {
                            name: 'Création du compte',
                            value: `Compte crée il y **${daysC} jours , ${hoursC} heures et ${minutesC} minutes** | ${memberCreateDateM}`,
                        }, {
                            name: 'Arrivée dans le serveur',
                            value: `Rejoint il y **${daysJ} jours , ${hoursJ} heures et ${minutesJ} minutes** | ${memberJoinDateM}`,
                        }, {
                            name: 'Status',
                            value: status,
                            inline: true
                        }, {
                            name: `Rôles [${memberRolesCountM}]`,
                            value: userRolesM,
                        }, {
                            name: 'Plus haut rôle',
                            value: memberBestRoleM,
                        }],
                        timestamp: Date.now(),
                        footer: {
                            icon_url: guildAvatar,
                            text: guildName,
                        }
                    }
                });

            }
        }

    }

})

//logs message
client.on('message', message => {

    if (message.channel.type === 'text') {

        //guild
        let guildName = message.guild.name;
        let guildAvatar = message.guild.iconURL;

        //channel
        let logsChannel = client.channels.get("512694479283683328");
        let channelContent = message.channel.id;

        //user
        let userTag = message.author.tag;
        let userId = message.author.id;
        let userAvatar = message.author.avatarURL;
        let messageContent = message.content;

        logsChannel.send({
            embed: {
                color: 3447003,
                author: {
                    name: userTag,
                    icon_url: userAvatar
                },
                thumbnail: {
                    url: userAvatar
                },
                fields: [{
                    name: 'Member',
                    value: `<@${userId}>`,
                    inline: true
                }, {
                    name: 'Message content',
                    value: messageContent
                }, {
                    name: 'Channel',
                    value: `<#${channelContent}>`
                }],
                timestamp: Date.now(),
                footer: {
                    icon_url: guildAvatar,
                    text: guildName,
                }
            }
        });

    }

});

//logs vocal
client.on('voiceStateUpdate', (oldMember, newMember) => {

    let newUserChannel = newMember.voiceChannel;
    let oldUserChannel = oldMember.voiceChannel;

    let logsChannel = client.channels.get("512694479283683328");

    if (oldUserChannel === undefined && newUserChannel !== undefined) {

        let userName = newMember.user.username;
        let userId = newMember.id;
        let userAvatar = newMember.user.avatarURL;
        let guildName = oldMember.guild.name;
        let guildAvatar = oldMember.guild.avatarURL;
        let voiceChannelName = newMember.voiceChannel.name;

        // User Joins a voice channel
        logsChannel.send({
            embed: {
                color: (0x4DE44D),
                author: {
                    name: userName,
                    icon_url: userAvatar
                },
                thumbnail: {
                    url: userAvatar
                },
                fields: [{
                    name: 'Member',
                    value: `<@${userId}>`,
                    inline: true
                }, {
                    name: 'Channel',
                    value: `**${userName}** viens de se connecter au vocal **${voiceChannelName}**`
                }],
                timestamp: Date.now(),
                footer: {
                    icon_url: guildAvatar,
                    text: guildName,
                }
            }
        });


    } else if (newUserChannel === undefined) {

        let userName = oldMember.user.username;
        let userId = oldMember.id;
        let userAvatar = oldMember.user.avatarURL;
        let guildName = oldMember.guild.name;
        let guildAvatar = oldMember.guild.avatarURL;
        let voiceChannelName = oldMember.voiceChannel.name;

        // User left a voice channel
        logsChannel.send({
            embed: {
                color: (0xF95467),
                author: {
                    name: userName,
                    icon_url: userAvatar
                },
                thumbnail: {
                    url: userAvatar
                },
                fields: [{
                    name: 'Member',
                    value: `<@${userId}>`,
                    inline: true
                }, {
                    name: 'Channel',
                    value: `**${userName}** viens de se déconnecter du vocal **${voiceChannelName}**`
                }],
                timestamp: Date.now(),
                footer: {
                    icon_url: guildAvatar,
                    text: guildName,
                }
            }
        });


    }

});

//logs update member
client.on('guildMemberUpdate', (oldMember, newMember) => {



});

//Infos serveur
client.on('message', message => {

    if (message.channel.type === 'text') {

        if (message.author.bot) return;
        if (message.content === prefix + "si") {
            //GuildId
            let guildId = message.guild.id;
            let guildname = message.guild.name;
            let guildAvatar = message.guild.iconURL;
            let clientAvatar = message.author.avatarURL;
            let clientName = message.author.username;
            let memberCount = message.guild.memberCount;
            let botCount = message.guild.members.filter(m => m.user.bot).size;
            let onlineCount = message.guild.members.filter(m => m.presence.status == 'online').size + message.guild.members.filter(m => m.presence.status == 'idle').size + message.guild.members.filter(m => m.presence.status == 'dnd').size;
            let offlineCount = (memberCount + botCount) - onlineCount;
            let textChannelCount = message.guild.channels.filter(channel => channel.type === 'text').size;
            let voiceChannelCount = message.guild.channels.filter(channel => channel.type === 'voice').size;
            let ownerAvatar = message.guild.owner.user.avatarURL ? message.guild.owner.user.avatarURL : 'http://discordinvites.net/assets/img/discord_icon.png';
            let ownerId = message.guild.owner.user.id;
            let afkChannel = message.guild.afkChannel.name;
            let guildRolesCount = message.guild.roles.map(roles => (roles)).length;
            let guildRegion = message.guild.region;
            let guildVerificationLevel = message.guild.verificationLevel;
            let guildEmojisCount = message.guild.emojis.map(emojis => (emojis)).length;

            message.channel.send({
                embed: {
                    color: 3447003,
                    author: {
                        name: guildname,
                        icon_url: guildAvatar
                    },
                    description: `Voici les informations du serveur **${guildname}**`,
                    thumbnail: {
                        url: guildAvatar
                    },
                    fields: [{
                        name: "ID",
                        value: guildId,
                        inline: true
                    }, {
                        name: "Membres",
                        value: memberCount ? memberCount : '-',
                        inline: true
                    }, {
                        name: "Bots",
                        value: botCount ? botCount : '-',
                        inline: true
                    }, {
                        name: "Channels textuel",
                        value: textChannelCount ? textChannelCount : '-',
                        inline: true
                    }, {
                        name: "Salons vocal",
                        value: voiceChannelCount ? voiceChannelCount : '-',
                        inline: true
                    }, {
                        name: "Membres en ligne",
                        value: onlineCount ? onlineCount : '-',
                        inline: true
                    }, {
                        name: "Membres hors ligne",
                        value: offlineCount ? offlineCount : '-',
                        inline: true
                    }, {
                        name: "Owner",
                        value: ownerId ? '<@' + ownerId + '>' : '-',
                        inline: true
                    }, {
                        name: "Channel AFK",
                        value: afkChannel,
                        inline: true
                    }, {
                        name: `Nombre de rôles`,
                        value: guildRolesCount,
                        inline: true
                    }, {
                        name: `Région du serveur`,
                        value: guildRegion,
                        inline: true
                    }, {
                        name: `Niveau de vérification`,
                        value: guildVerificationLevel,
                        inline: true
                    }, {
                        name: `Nombre d'émojis`,
                        value: guildEmojisCount,
                    }],
                    timestamp: Date.now(),
                    footer: {
                        icon_url: clientAvatar,
                        text: clientName + ' | ' + guildId,
                    }
                }
            });




        }

    }



});

//Support
client.on('message', message => {

    let supportChannel = client.channels.get("512739590088425472");

    if (message.channel.type === 'dm' && message.author.id !== '512359952686252033') {

        //user
        let userTag = message.author.tag;
        let userId = message.author.id;
        let userName = message.author.username;
        let userAvatar = message.author.avatarURL;

        //content
        let messageContent = message.content;

        //timestamp
        var date = new Date();
        var timestamp = date.getTime();

        //envoie à la bdd
        var sql = "INSERT INTO support (memberId , timestamp) VALUES ?";
        var values = [
            [userId, timestamp],
        ];
        con.query(sql, [values]);

        //selection de l'id
        con.query("SELECT * FROM support WHERE timestamp = ?", [timestamp], function (err, result, fields) {

            supportChannel.send({
                embed: {
                    color: 3447003,
                    author: {
                        name: userTag,
                        icon_url: userAvatar
                    },
                    thumbnail: {
                        url: userAvatar
                    },
                    fields: [{
                        name: 'Membre',
                        value: `<@${userId}>`,
                        inline: true
                    }, {
                        name: 'Contenu du support',
                        value: messageContent
                    }, {
                        name: 'ID de réponse',
                        value: result[0].id
                    }],
                    timestamp: Date.now(),
                }
            });

        });




        //message bien recu
        message.author.send('**Votre message à bien été envoyé :white_check_mark: !** \n\n :beginner: Veuillez patienter , un staff va vous répondre le plus vite possible ... \n Contenu du message : ```' + messageContent + '``` *(tout abus est sanctionnable)*');

    }

    if (message.content.startsWith(prefix + 'rep') && message.channel.id === '512739590088425472') {

        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (command === 'rep') {

            let id = args[0];
            let reponse = args.slice(1).join(" ");

            //Récupération de l'id du membre
            con.query("SELECT * FROM support WHERE id = ?", [id], function (err, result, fields) {

                let userId = result[0].memberId;
                let member = message.guild.members.get(userId);
                let modoName = message.author.username;

                member.send(`:beginner: **[${modoName}]** :  ${reponse}`);

                message.reply(`Réponse envoyée ! \n \n ${reponse}`);



            });


        }


    }

});

//Commande modérateurs
client.on("message", message => {
    //Si on arrive pas à recup la guild
    if (!message.guild) return
    let args = message.content.trim().split(/ +/g)

    if (args[0].toLowerCase() === prefix + "clear") {

        //On verifie les perms de l'utilisateur de la commande
        if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.reply(" :mega: Vous n'avez pas la permission d'utiliser cette commande");
        let count = args[1];

        //Verif si son as bien préciser le nombre de messages à supprimer et qu'il se trouve entre 1 et 100
        if (!count) return message.reply(" :mega: Veuillez indiquer un nombre de messages à supprimer");
        if (isNaN(count)) return message.reply(" :mega: Veuillez indiquer un nombre valide");
        if (count < 1 || count > 99) return message.reply(" :mega: Veuillez indiquer un nombre entre 1 et 99")

        //Si tout est bon supprimer les messages
        message.channel.bulkDelete(parseInt(count) + 1);

        //Message de comfirmation
        message.reply(`${count} messages on été éffacés :white_check_mark:`);
    }

    if (args[0].toLowerCase() === prefix + "mute") {

        //On verifie les permisions de l'utilisateur
        if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send(" :mega: Vous n'avez pas la permission d'utiliser cette commande")
        let member = message.mentions.members.first()

        //On verif que le membre existe , et que le bot et l'utilisateur puisse mute la personne désiré
        if (!member) return message.channel.send(" :mega: Membre introuvable")
        if (member.highestRole.calculatedPosition >= message.member.highestRole.calculatedPosition && message.author.id !== message.guild.ownerID) return message.channel.send(" :mega: Vous ne pouvez pas mute ce membre");
        if (member.highestRole.calculatedPosition >= message.guild.me.highestRole.calculatedPosition || member.id === message.guild.ownerID) return message.channel.send(" :mega: Je ne peux pas mute ce membre");
        let minutes = args[2];

        //On vérifie si le nombre de minutes est préciser et si il est bien entre 1 et 120
        if (!minutes) return message.reply(" :mega: Veuillez indiquer un temps de mute (en minutes)");
        if (minutes < 1 || minutes > 120) return message.reply(" :mega: Veuillez indiquer un temps entre **1** et **120** minutes");
        let raison = args.slice(3).join(" ");

        //On verif si le modérateur à bien préciser la raison du mute ici
        if (!raison) return message.reply(" :mega: Veuillez indiquer la raison de votre mute");

        //On verif si le rôle mute existe , si non on en creer un !
        let muterole = message.guild.roles.get("480369695745114112");
        if (muterole) {

            //Mettre le role mute
            member.addRole(muterole);
            message.channel.send(member + ' a été mute :white_check_mark:');

            //message
            member.send(':mega: Vous venez d\' être mute **' + minutes + '** minutes par **' + message.member.user.username + '** pour la raison suivante : ` ' + raison + '`');

            //infos
            let userTag = member.user.tag;
            let userAvatar = member.user.avatarURL ? member.user.avatarURL : 'https://cdn.discordapp.com/embed/avatars/0.png';
            let userId = member.id;
            let modoId = message.author.id;
            let guildName = message.guild.name;
            let guildAvatar = message.guild.iconURL;

            //timestamp
            var date = new Date();
            var timestamp = date.getTime();

            var timestampLeft = timestamp + 1000 * 60 * minutes;


            //Mettre dans la base de donnée
            var sql = "INSERT INTO mute (memberId ,  modoId , timestamp, timestampLeft) VALUES ?";
            var values = [
                [userId, modoId, timestamp, timestampLeft],
            ];
            con.query(sql, [values]);

            //Mette dans le channel sanction
            channelSanction = client.channels.get("381554735192342538");

            //Si le channel existe
            if (channelSanction) {

                channelSanction.send({
                    embed: {
                        color: (0xF95467),
                        author: {
                            name: `${userTag} à été mute !`,
                            icon_url: userAvatar
                        },
                        fields: [{
                            name: 'Membre',
                            value: `<@${userId}>`,
                            inline: true
                        }, {
                            name: 'Modérateur',
                            value: `<@${modoId}>`,
                            inline: true
                        }, {
                            name: 'Temps du mute',
                            value: `**${minutes}** min`,
                            inline: true
                        }, {
                            name: 'Raison du mute',
                            value: raison
                        }],
                        timestamp: Date.now(),
                        footer: {
                            icon_url: guildAvatar,
                            text: guildName,
                        }
                    }
                });

            } else {

                message.reply(':mega: Le **channel** pour les logs est introuvable');

            }

        }
    }

    //umute 
    if (args[0].toLowerCase() === prefix + "unmute") {

        //Rôle mute 
        let muterole = message.guild.roles.get("480369695745114112");

        //On verifie les permisions de l'utilisateur
        if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send(" :mega: Vous n'avez pas la permission d'utiliser cette commande")
        let member = message.mentions.members.first()

        //infos
        let userTag = member.user.tag;
        let userAvatar = member.user.avatarURL ? member.user.avatarURL : 'https://cdn.discordapp.com/embed/avatars/0.png';
        let userId = member.id;
        let modoId = message.author.id;
        let guildName = message.guild.name;
        let guildAvatar = message.guild.iconURL;

        //On verif que le membre existe , et que le bot et l'utilisateur puisse mute la personne désiré
        if (!member) return message.channel.send(" :mega: Membre introuvable")
        if (!member.roles.has(muterole.id)) return message.channel.send(':mega: Le membre que vous avez mentionné n \'es pas mute !');
        if (member.highestRole.calculatedPosition >= message.member.highestRole.calculatedPosition && message.author.id !== message.guild.ownerID) return message.channel.send(" :mega: Vous ne pouvez pas demute ce membre");
        if (member.highestRole.calculatedPosition >= message.guild.me.highestRole.calculatedPosition || member.id === message.guild.ownerID) return message.channel.send(" :mega: Je ne peux pas demute ce membre");

        //Rôle enelevé 
        member.removeRole(muterole);

        //Delete tout ce qui concerne le mute
        con.query("DELETE FROM mute WHERE memberId = ?", [userId], function (err, results, fields) {
            console.log("Number of records deleted: " + results.affectedRows);
        });

        message.channel.send(`**${member.user.username}** viens d'être unmute ! `);
        member.send(`Vous venez d'être unmute par **${message.member.user.tag}** !`);

        //Mette dans le channel sanction
        channelSanction = client.channels.get("381554735192342538");

        //Si le channel existe
        if (channelSanction) {

            channelSanction.send({
                embed: {
                    color: 3447003,
                    author: {
                        name: `${userTag} à été unmute !`,
                        icon_url: userAvatar
                    },
                    fields: [{
                        name: 'Membre',
                        value: `<@${userId}>`,
                        inline: true
                    }, {
                        name: 'Modérateur',
                        value: `<@${modoId}>`,
                        inline: true
                    }],
                    timestamp: Date.now(),
                    footer: {
                        icon_url: guildAvatar,
                        text: guildName,
                    }
                }
            });

        } else {

            message.reply(':mega: Le **channel** pour les logs est introuvable');

        }

    }
})

//help
client.on('message', message => {

    if (message.channel.type === 'text') {

        //guild
        let guildName = message.guild.name;
        let guildAvatar = message.guild.iconURL;

        //channel
        let defaultChannel = message.channel;

        //user
        let userName = message.author.username;
        let userAvatar = message.author.avatarURL;

        if (message.content === prefix + "help") {
            defaultChannel.send({
                embed: {
                    color: 3447003,
                    author: {
                        name: userName,
                        icon_url: userAvatar
                    },
                    description: 'Bot développé par vince. | Prefix : `--`',
                    fields: [{
                        name: 'Commandes utilisateur',
                        value: '`ui` `ui @mention`'
                    }, {
                        name: 'Commandes serveur',
                        value: '`si`'
                    }, {
                        name: 'Commandes staff',
                        value: '`clear` `mute`'
                    }],
                    timestamp: Date.now(),
                    footer: {
                        icon_url: guildAvatar,
                        text: guildName,
                    }
                }
            });
        }
    }



});

//musique
client.on('message', async message => {

    if (message.author.bot) return undefined;
    if (!message.content.startsWith(prefix)) return undefined;

    //Commandes et arguments
    const args = message.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(message.guild.id);

    //Nom de la commande utilisée
    let command = message.content.toLowerCase().split(' ')[0];
    command = command.slice(prefix.length)

    //Commande play
    if (command === 'play') {

        //On recup le channel du membre utilisant la commande
        const voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return message.channel.send('Veuillez vous mettre dans un channel vocal !');

        //On vérifie les permissions
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) return message.channel.send('Je ne peux pas me connecter au channel vocal, veuillez vérifier les permissions !');
        if (!permissions.has('SPEAK')) return message.channel.send('Je ne peux pas parler dans se channel vocal , veuillez vérifiez les permissions');

        //Si c'est une playlist youtube
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {

            //Recup l'url de la playlist et ses vidéos
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();

            //PLacer dans la file d'attente
            for (const video of Object.values(videos)) {

                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, message, voiceChannel, true);

            }

            //return le nom de la playlist
            return message.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`);

        } else {

            try {

                //Si c"est un url
                var video = await youtube.getVideo(url);

            } catch (error) {

                try {

                    //Si c'est une vidéo , faire une recherche
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    message.channel.send(`__**Choisisez un son :**__ \n \n ${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')} \n\n **Entrez un nombre entre 1 et 10 pour choisir le son !**`);

                    try {

                        //Selection
                        var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });

                    } catch (err) {

                        //Si pas de reponse après 10 secondes
                        console.error(err);
                        return message.channel.send('Vous n\'avez pas entrez de nombre ou le nombre est incorrect ! \n Fermeture de la selection');

                    }

                    //Video
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);

                } catch (err) {

                    //Si pas de résultats
                    console.error(err);
                    return message.channel.send('Je n\'ai pas de résultats pour ce que vous venez de mettre ');
                }
            }

            //Function hadleVideo
            return handleVideo(video, message, voiceChannel);
        }

    } else if (command === 'skip') {

        if (!message.member.voiceChannel) return message.channel.send('Vous n\'êtes pas dans le channel vocal !');
        if (!serverQueue) return message.channel.send('Il n\'y as pas de sons qui joue , donc je ne peux pas skip ');
        serverQueue.connection.dispatcher.end('Skip !');
        return undefined;

    } else if (command === 'stop') {

        if (!message.member.voiceChannel) return message.channel.send('Vous n\'êtes pas dans le channel vocal !');
        if (!serverQueue) return message.channel.send('Il n\'y as pas de sons qui joue , donc je ne peux pas stopper la musique');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop!');
        return undefined;

    } else if (command === 'volume') {

        if (!message.member.voiceChannel) return message.channel.send('Vous n\'êtes pas dans le channel vocal !');
        if (!serverQueue) return message.channel.send('Il n\'y as pas de sons qui joue');
        if (!args[1]) return message.channel.send(`Le volume est de : **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return message.channel.send(`J'ai changer le volume par : **${args[1]}**`);

    } else if (command === 'np') {

        if (!serverQueue) return message.channel.send('There is nothing playing.');
        return message.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
    } else if (command === 'queue') {
        if (!serverQueue) return message.channel.send('There is nothing playing.');
        return message.channel.send(`__**Sons dans la liste:**__ \n\n ${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')} \n\n **Son joué:** ${serverQueue.songs[0].title}`);

    } else if (command === 'pause') {

        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send('⏸ musique en pause!');
        }
        return message.channel.send('Le bot ne joue pas de son');

    } else if (command === 'resume') {

        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send('▶ Musique resume !');
        }
        return message.channel.send('Le bot ne joue pas de son');

    }

    return undefined;

});

//Function handleVideo
async function handleVideo(video, message, voiceChannel, playlist = false) {

    const serverQueue = queue.get(message.guild.id);
    console.log(video);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(message.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`Je ne peux pas rejoindre le channel: ${error}`);
            queue.delete(message.guild.id);
            return message.channel.send(`Je ne peux pas rejoindre le channel: ${error}`);
        }
    } else {

        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if (playlist) return undefined;
        else return message.channel.send(`✅ **${song.title}** à été ajouté à la liste !`);

    }
    return undefined;
}

//Function play
function play(guild, song) {

    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
            if (reason === 'Le stream est un peu lent ... ') console.log('Le son est fini.');
            else console.log(reason);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`🎶 **${song.title}**`);
}


client.login(config.token);