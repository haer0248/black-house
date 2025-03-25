require('dotenv').config();

const { Client, GatewayIntentBits, ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, PermissionsBitField, ActivityType, ChannelType, Partials } = require('discord.js');

const path = require('path');

const Logger = require('./Modules/Logger');
const Help = require('./Modules/Help');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message
    ]
});

global.client = client;
global.Logger = Logger;

client.once('ready', () => {
    Logger.info('Bot 已啟動!');

    const totalGuilds = client.guilds.cache.size;
    const activityMessage = `🔧 小黑屋正在 ${totalGuilds} 個伺服器提供塞人服務`;

    client.user.setPresence({
        activities: [{
            type: ActivityType.Custom,
            name: activityMessage
        }],
        status: 'dnd'
    });

    setInterval(() => {
        client.user.setPresence({
            activities: [{
                type: ActivityType.Custom,
                name: activityMessage
            }],
            status: 'dnd'
        });
    }, 60000 * 10);
});

client.on('ready', async () => {
    const messageCommand = new ContextMenuCommandBuilder()
        .setName('塞進小黑屋')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

    const userCommand = new ContextMenuCommandBuilder()
        .setName('塞進小黑屋')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

    await client.application.commands.create(messageCommand);
    await client.application.commands.create(userCommand);
});

client.on('guildCreate', async (guild) => {
    Logger.info(`已加入伺服器: ${guild.name} (${guild.id})`);

    const imagePath = path.join(__dirname, 'black-house.png');
    const guildOwner = await client.users.fetch(guild.ownerId)
    await guildOwner.send({
        embeds: [Help().embeds],
        components: [Help().button],
        files: [{
            attachment: imagePath,
            name: 'black-house.png'
        }]
    }).catch(error => {
        Logger.error(error.stack);
    });
});

client.on('guildDelete', async (guild) => {
    Logger.info(`已離開伺服器: ${guild.name} (${guild.id})`);
});

client.on('messageCreate', async (message) => {
    if (message.author.id === process.env.CLIENT_ID) return;
    if (message.author.bot) return;
    if (message?.reference) return;

    if (message.channel.type === ChannelType.DM) {
        const imagePath = path.join(__dirname, 'black-house.png');
        message.channel.send({
            embeds: [Help().embeds],
            components: [Help().button],
            files: [{
                attachment: imagePath,
                name: 'black-house.png'
            }]
        })
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isContextMenuCommand()) {
        let targetUser;
        if (interaction.commandType === ApplicationCommandType.Message) {
            targetUser = interaction.targetMessage.author;
        } else if (interaction.commandType === ApplicationCommandType.User) {
            targetUser = interaction.targetUser;
        }

        const modalCustomId = `form_${targetUser.id}`;
        const modal = new ModalBuilder().setCustomId(modalCustomId).setTitle('塞進小黑屋');

        const numberInput = new TextInputBuilder()
            .setCustomId('number_input')
            .setLabel('輸入要將觀眾塞進小黑屋的分鐘數或輸入 0 來取消（最長 40320 分鐘）')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('0 ~ 40320');

        modal.addComponents(
            new ActionRowBuilder().addComponents(numberInput)
        );

        if (targetUser.id === process.env.CLIENT_ID) {
            return await interaction.reply({ content: '欸！不要用我的魔法攻擊我 Q_Q', flags: MessageFlags.Ephemeral });
        }

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('form_')) {
            const minute = interaction.fields.getTextInputValue('number_input');
            const [, user_id] = interaction.customId.split('_');

            if (isNaN(minute)) {
                await interaction.reply({ content: '錯誤：請輸入有效的數字！', flags: MessageFlags.Ephemeral });
            } else if (minute > 40320) {
                await interaction.reply({ content: '錯誤：最長不能超過 28 天，不如直接把他丟出去了吧。', flags: MessageFlags.Ephemeral });
            } else {
                const fetchGuild = interaction.guild;
                const fetchUser = await fetchGuild.members.fetch(user_id);
                if (!fetchUser) return interaction.reply({ content: `錯誤：找不到使用者 ID \`${user_id}\``, flags: MessageFlags.Ephemeral })

                const user_tag = fetchUser.user.tag;
                const user_name = fetchUser.user.globalName;

                const currentTimeoutEnd = fetchUser.communicationDisabledUntil;
                let timeOutLength, isExtend = false;
                if (currentTimeoutEnd && currentTimeoutEnd > new Date()) {
                    isExtend = true;
                    const remainingTime = currentTimeoutEnd - new Date();
                    const newTimeoutDuration = remainingTime + (minute * 60 * 1000);
                    timeOutLength = newTimeoutDuration;
                } else {
                    timeOutLength = (minute * 60 * 1000);
                }

                try {
                    if (minute <= 0) {
                        await fetchUser.timeout(null)
                    } else {
                        await fetchUser.timeout(timeOutLength)
                    }
                } catch (error) {
                    Logger.error(`塞進小黑屋時發生錯誤：${error.stack}`);
                    await interaction.reply({ content: `塞進小黑屋時發生錯誤，請檢查使用者是可以被禁言的、機器人擁有權限。`, flags: MessageFlags.Ephemeral });
                }

                try {
                    if (minute <= 0) {
                        await interaction.reply({
                            content: `把 ${user_name} (${user_tag}) 從小黑屋抓出來ㄌ。`,
                            flags: MessageFlags.Ephemeral
                        });

                        Logger.info(`把 ${user_name} (${user_tag}) 從小黑屋抓出來ㄌ。`);
                    } else {
                        if (isExtend) {
                            await interaction.reply({
                                content: `已經把 ${user_name} (${user_tag}) 塞進小黑屋。`,
                                flags: MessageFlags.Ephemeral
                            });

                            await interaction.channel.send({
                                content: `<:twitchModerator:1347843054488260618> ${user_name} (${user_tag}) 在小黑屋的時間已經被延長了 ${minute} 分鐘 <:haha:1347935605467648070>`
                            })

                            Logger.info(`成功將使用者 ${user_name} (${user_tag}) 在小黑屋的時間已經被延長了 ${minute} 分鐘`);
                        } else {
                            await interaction.reply({
                                content: `已經把 ${user_name} (${user_tag}) 塞進小黑屋。`,
                                flags: MessageFlags.Ephemeral
                            });

                            await interaction.channel.send({
                                content: `<:twitchModerator:1347843054488260618> ${user_name} (${user_tag}) 已經被塞進小黑屋 ${minute} 分鐘 <:haha:1347935605467648070>`
                            })

                            Logger.info(`${user_name} (${user_tag}) 已經被塞進小黑屋 ${minute} 分鐘`);
                        }
                    }
                } catch (error) {
                    Logger.error(`發送頻道訊息時發生錯誤：${error.stack}`);
                }
            }
        }
    }
});

client.login(process.env.TOKEN)

process.on('uncaughtException', (e) => {
    Logger.error(e.stack)
})