const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = () => {
    const embed = new EmbedBuilder()
        .setTitle('小黑屋')
        .setDescription('使用機器人前請先調整機器人的身分組「小黑屋」在其他身分組之上，否則會無法正常將使用者塞進小黑屋。\n\n若有設置僅限某個身分組可以發送訊息，記得將小黑屋身分組加入在該頻道發送訊息的權限。')
        .setColor(0xABD1E8)
        .addFields({
            name: '使用方式',
            value: '在側邊右鍵使用者、右鍵訊息（手機版長按），點選「應用程式／塞入小黑屋」即可顯示輸入視窗。'
        }, {
            name: '為什麼叫小黑屋',
            value: '沒為什麼，反正就是讓他進小黑屋冷靜。'
        })
        .setThumbnail('https://image.haer0248.me/avatar/aaypLw.png');

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('加機器人')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/oauth2/authorize?client_id=1347824381824335932')
        )
        .addComponents(
            new ButtonBuilder()
                .setLabel('關於貓又飯糰')
                .setStyle(ButtonStyle.Link)
                .setURL('https://haer0248.me/')
        )
        .addComponents(
            new ButtonBuilder()
                .setLabel('Github')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/haer0248/black-house')
        );

	return {
		embeds: embed.toJSON(),
		button: buttons.toJSON()
	}
}