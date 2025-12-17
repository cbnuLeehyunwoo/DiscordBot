// utils/ttsPlayer.js
const { createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const { getAudioUrl } = require('google-tts-api');

// 큐(Queue) 시스템 없이 간단하게 구현 (말하고 있을 때 또 말하면 끊고 새로 말함)
async function playTTS(guildId, text) {
    const connection = getVoiceConnection(guildId);
    if (!connection) return; // 연결이 없으면 재생 안 함

    try {
        const audioUrl = getAudioUrl(text, {
            lang: 'ko',
            slow: false,
            host: 'https://translate.google.com',
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(audioUrl, { inlineVolume: true });
        resource.volume.setVolume(1.0);

        connection.subscribe(player);
        player.play(resource);

        // ★ 중요: 재생이 끝나도 connection.destroy()를 하지 않습니다!
        // 왜냐하면 봇은 계속 채널에 남아서 다음 채팅을 기다려야 하니까요.
        
    } catch (error) {
        console.error('TTS 재생 에러:', error);
    }
}

module.exports = playTTS;