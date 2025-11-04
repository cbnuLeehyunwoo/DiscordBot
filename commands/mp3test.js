const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus,
    AudioPlayerStatus // 재생 상태 확인용
} = require('@discordjs/voice');
const { join } = require('path');

module.exports = {
    // !라인처럼 name과 aliases 구조를 사용합니다.
    data: {
        name: '파이논', 
        aliases: ['노래', '음악'],
        description: '봇을 음성 채널에 연결하고 MP3 파일을 재생합니다.',
    },
    // execute 함수 구조를 message, args 인수를 받도록 변경합니다.
    async execute(message, args) {
        const member = message.member;
        const voiceChannel = member.voice.channel;
        
        // 봇이 이미 음성 채널에 있는지 확인하는 로직을 추가할 수도 있습니다.
        if (voiceChannel) {
            // 사용자가 음성 채널에 있는지 확인
            if (!voiceChannel) {
                return message.reply('음성 채널에 먼저 입장해주세요!');
            }
        }

        // --- 1. 음성 채널 연결 ---
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        // --- 2. AudioPlayer 생성 ---
        const player = createAudioPlayer();
        
        // 플레이어 상태 변화 시 이벤트 처리
        player.on(AudioPlayerStatus.Idle, () => {
            // 재생이 끝나면 (Idle 상태가 되면) 연결을 끊습니다.
            if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
                //message.channel.send('음악 재생이 완료되어 채널을 나갑니다.');
            }
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            try {
                // MP3 파일 경로 설정 (경로를 실제 파일 위치로 정확히 변경하세요)
                // 예시: 프로젝트 루트의 'music' 폴더 안의 'test.mp3'
                const audioFile = join(process.cwd(), 'music', 'test.mp3'); 
                
                // createAudioResource를 사용하여 리소스 생성
                const resource = createAudioResource(audioFile); 

                // 연결에 플레이어 구독 및 재생 시작
                connection.subscribe(player);
                player.play(resource);

                //message.channel.send(`\`${voiceChannel.name}\` 채널에서 음악 재생을 시작합니다!`);

            } catch (error) {
                console.error('오디오 재생 중 오류 발생:', error);
                message.reply('오디오 파일을 재생하는 데 오류가 발생했습니다.');
                connection.destroy();
            }
        });

        player.on('error', error => {
            console.error(`AudioPlayer Error: ${error.message}`);
            message.channel.send('오디오 플레이어에 오류가 발생했습니다. 연결을 종료합니다.');
            connection.destroy();
        });
        
        connection.on(VoiceConnectionStatus.Disconnected, () => {
             // 연결 끊김 처리 (선택 사항)
             connection.destroy();
        });
    },
};


