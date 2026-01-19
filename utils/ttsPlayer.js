const { 
    createAudioPlayer, 
    createAudioResource, 
    getVoiceConnection, 
    AudioPlayerStatus 
} = require('@discordjs/voice');
const { getAudioUrl } = require('google-tts-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 서버별 대기열 관리
const guildAudioMap = new Map();

// 파일 삭제 전용 안전 함수 (에러나도 무시함)
function safeDelete(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`[파일 삭제 실패] ${filePath}:`, err.message);
    }
}

async function playTTS(guildId, text) {
    if (!guildAudioMap.has(guildId)) {
        guildAudioMap.set(guildId, { isPlaying: false, queue: [] });
    }
    const serverState = guildAudioMap.get(guildId);

    serverState.queue.push(text);

    if (!serverState.isPlaying) {
        processQueue(guildId);
    }
}

async function processQueue(guildId) {
    const serverState = guildAudioMap.get(guildId);
    const connection = getVoiceConnection(guildId);

    if (!serverState || !serverState.queue.length || !connection) {
        if (serverState) serverState.isPlaying = false;
        return;
    }

    serverState.isPlaying = true;
    const text = serverState.queue.shift();

    // 임시 파일 경로 정의 (블록 밖에서도 쓰기 위해 미리 선언)
    const tempFileName = `temp_${guildId}_${Date.now()}.mp3`;
    const tempFilePath = path.join(process.cwd(), tempFileName);

    try {
        const audioUrl = getAudioUrl(text, {
            lang: 'ko',
            slow: false,
            host: 'https://translate.google.com',
        });

        const writer = fs.createWriteStream(tempFilePath);
        const response = await axios({
            url: audioUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(tempFilePath, { inlineVolume: true });
        resource.volume.setVolume(1.0);

        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            safeDelete(tempFilePath); // 안전 삭제
            processQueue(guildId);
        });

        player.on('error', error => {
            console.error('[TTS Player Error]', error);
            safeDelete(tempFilePath); // 안전 삭제
            processQueue(guildId);
        });

    } catch (error) {
        console.error('[TTS 로직 에러]', error);
        safeDelete(tempFilePath); // 에러 발생 시에도 파일은 지워야 함
        processQueue(guildId);
    }
}

module.exports = playTTS;
