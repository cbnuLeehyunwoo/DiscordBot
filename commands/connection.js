// commands/connection.js
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    // !입장, !퇴장 등 명령어를 처리
    async execute(message, args, commandName) {
        const voiceChannel = message.member.voice.channel;

        if (commandName === '입장') {
            if (!voiceChannel) return message.reply('음성 채널에 먼저 들어가주세요!');

            // 음성 채널 연결
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            // ★ 핵심: 이 길드(서버)에서 TTS가 켜졌다는 것을 표시합니다.
            // 간단하게 client 객체에 저장하거나, 별도의 Map을 써도 됩니다.
            message.client.ttsStatus = message.client.ttsStatus || {};
            message.client.ttsStatus[message.guild.id] = true;

            message.reply('📢 음성 채널에 입장했습니다! 이제 채팅을 치면 읽어드릴게요.');

        } else if (commandName === '퇴장') {
            const connection = getVoiceConnection(message.guild.id);
            if (connection) {
                connection.destroy();
                
                // TTS 상태 끄기
                if (message.client.ttsStatus) {
                    message.client.ttsStatus[message.guild.id] = false;
                }
                message.reply('👋 음성 채널에서 나갑니다.');
            } else {
                message.reply('저는 지금 음성 채널에 없어요.');
            }
        }
    }
};