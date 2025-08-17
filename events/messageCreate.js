const { Events } = require('discord.js');
const champions = require('../num2champ.json');
const championInfoHandler = require('../champion.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.content.startsWith('!')) return;
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));
        if (command) {
            try { await command.execute(message, args); } catch (error) { console.error(error); await message.reply({ content: '명령어 실행 중 오류 발생!', ephemeral: true }); }
            return;
        }
        const fullName = message.content.slice(1).trim().toLowerCase();
        if (champions[fullName] || champions[commandName]) {
            try { await championInfoHandler(message, champions[fullName] ? fullName : commandName); } catch (error) { console.error(error); await message.reply({ content: '챔피언 정보 처리 중 오류 발생!', ephemeral: true }); }
        }
    },
};