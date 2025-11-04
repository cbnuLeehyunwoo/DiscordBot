const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus,
    AudioPlayerStatus 
} = require('@discordjs/voice');
const { join } = require('path');

module.exports = {
    // message와 mp3Path (dialogues.json에서 가져온 상대 경로)를 인수로 받습니다.
    async execute(message, mp3RelativePath) { 
        const member = message.member;
        const voiceChannel = member.voice.channel;

        // 사용자가 음성 채널에 없으면 처리하지 않습니다.
        if (!voiceChannel) {
            return message.reply('음성 채널에 먼저 입장해야 대사를 재생할 수 있어요!');
        }

        // --- 1. 음성 채널 연결 ---
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        const player = createAudioPlayer();
        
        // --- 2. 경로 설정 및 재생 ---
        connection.on(VoiceConnectionStatus.Ready, () => {
            try {
                // 프로젝트 루트 경로와 JSON 파일의 상대 경로를 합쳐 절대 경로를 만듭니다.
                // MP3 파일은 프로젝트 루트 기준 경로에 있어야 합니다.
                const audioFile = join(process.cwd(), mp3RelativePath); 
                
                // MP3 재생 리소스 생성
                const resource = createAudioResource(audioFile); 

                connection.subscribe(player);
                player.play(resource);

                // 재생 시작 메시지 (선택 사항)
                // message.channel.send(`대사 재생 시작: \`${mp3RelativePath}\``);

            } catch (error) {
                console.error('오디오 리소스 생성 또는 재생 중 오류:', error);
                message.channel.send('대사를 재생하는 데 문제가 발생했어요. (파일 경로 확인 요망)');
                connection.destroy();
            }
        });

        // --- 3. 재생 종료 시 연결 끊기 ---
        player.on(AudioPlayerStatus.Idle, () => {
            if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
                // message.channel.send('대사 재생 완료.'); // 완료 메시지 (선택 사항)
            }
        });
        
        player.on('error', error => {
            console.error(`AudioPlayer Error: ${error.message}`);
            connection.destroy();
        });
        
        // 연결이 끊어졌을 때 정리
        connection.on(VoiceConnectionStatus.Disconnected, () => {
             connection.destroy();
        });
    },
};