const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus 
} = require('@discordjs/voice');
const { SlashCommandBuilder } = require('discord.js');
const { join } = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playmp3')
        .setDescription('봇을 음성 채널에 연결하고 MP3 파일을 재생합니다.'),
    async execute(interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: '음성 채널에 먼저 입장해주세요!', ephemeral: true });
        }

        // 1. 음성 채널 연결
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false, // 봇이 듣는 것을 허용
        });

        // 2. AudioPlayer 생성
        const player = createAudioPlayer();
        
        // 연결이 준비되면 오디오를 재생합니다.
        connection.on(VoiceConnectionStatus.Ready, () => {
            try {
                // 3. AudioResource 생성 (MP3 파일 경로를 지정)
                // 예: 프로젝트 루트 폴더의 'music' 폴더 안에 'test.mp3' 파일이 있다고 가정
                const audioFile = join(process.cwd(), 'music', 'test.mp3'); 
                const resource = createAudioResource(audioFile); 

                // 4. 연결에 플레이어 구독 및 5. 오디오 재생
                connection.subscribe(player);
                player.play(resource);

                interaction.reply(`\`${voiceChannel.name}\` 채널에서 음악 재생을 시작합니다!`);

            } catch (error) {
                console.error(error);
                interaction.reply({ content: '오디오 파일을 재생하는 데 오류가 발생했습니다.', ephemeral: true });
                connection.destroy(); // 오류 발생 시 연결 끊기
            }
        });

        // 플레이어 상태 변화 및 에러 처리
        player.on('error', error => {
            console.error(`AudioPlayer Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        player.on(VoiceConnectionStatus.Disconnected, () => {
            // 연결이 끊어지면 정리합니다.
            connection.destroy();
        });
    },
};