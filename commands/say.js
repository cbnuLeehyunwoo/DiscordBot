const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus,
    AudioPlayerStatus 
} = require('@discordjs/voice');
const { getAudioUrl } = require('google-tts-api');

module.exports = {
    async execute(message, text) { 
        const member = message.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return message.reply('먼저 음성 채널에 입장해야 해요!');
        }
        
        if(!text){
            return message.reply('읽어줄 내용을 입력해주세요!');
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        const player = createAudioPlayer();
        
        connection.on(VoiceConnectionStatus.Ready, async () => {
            console.log('Connection is ready. Creating TTS audio resource...');
            try {
                const audioUrl = getAudioUrl(text, {
                  lang: 'ko',
                  slow: false,
                  host: 'https://translate.google.com',
                });
                
                // 볼륨 조절을 위해 inlineVolume: true 옵션 추가
                const resource = createAudioResource(audioUrl, { inlineVolume: true }); 
                // 볼륨을 1.0 (100%)으로 설정합니다.
                resource.volume.setVolume(2.0);

                connection.subscribe(player);
                player.play(resource);
                console.log('Audio playback started.');

            } catch (error) {
                console.error('TTS 오디오 리소스 생성 또는 재생 중 오류:', error);
                message.channel.send('메시지를 읽어주는 데 문제가 발생했어요.');
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
            }
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio player is idle. Destroying connection.');
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        });
        
        player.on('error', error => {
            console.error(`AudioPlayer Error: ${error.message}`);
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        });
        
        connection.on(VoiceConnectionStatus.Disconnected, () => {
             if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        });
    },
};