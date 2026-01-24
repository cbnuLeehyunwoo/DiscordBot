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

// 파일 삭제 전용 안전 함수
function safeDelete(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`[파일 삭제 실패] ${filePath}:`, err.message);
    }
}

// ---------------------------------------------------------
// [변경점] playTTS 함수가 lang(언어)도 인자로 받음
// ---------------------------------------------------------
async function playTTS(guildId, text, lang = 'ko') {
    if (!guildAudioMap.has(guildId)) {
        guildAudioMap.set(guildId, { isPlaying: false, queue: [] });
    }
    const serverState = guildAudioMap.get(guildId);

    // [변경점] 텍스트만 넣는 게 아니라 { text, lang } 객체를 넣음
    serverState.queue.push({ text, lang });

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

    // [변경점] 큐에서 꺼낼 때 객체 구조 분해 할당
    const { text, lang } = serverState.queue.shift();

    // 임시 파일 경로 정의
    const tempFileName = `temp_${guildId}_${Date.now()}.mp3`;
    const tempFilePath = path.join(process.cwd(), tempFileName);

    try {
        // [변경점] 전달받은 lang 변수를 여기에 적용
        const audioUrl = getAudioUrl(text, {
            lang: lang, // 사용자가 설정한 언어 적용!
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
            safeDelete(tempFilePath); 
            processQueue(guildId);
        });

        player.on('error', error => {
            console.error('[TTS Player Error]', error);
            safeDelete(tempFilePath); 
            processQueue(guildId);
        });

    } catch (error) {
        console.error('[TTS 로직 에러]', error);
        safeDelete(tempFilePath); 
        processQueue(guildId);
    }
}

module.exports = playTTS;