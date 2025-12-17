const { Events } = require('discord.js');
const champions = require('../num2champ.json');
const championInfoHandler = require('../champion.js');
const dialogueMap = require('../dialogues.json');

// --- 명령어 및 유틸 파일 불러오기 ---
const playDialogue = require('../commands/playdialogue.js'); 
const connectionCmd = require('../commands/connection.js');
const playTTS = require('../utils/ttsPlayer.js'); 
const ttsSetting = require('../commands/ttsSetting.js'); 
const clearCommand = require('../commands/clear.js'); 

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // 1. 봇이 보낸 메시지는 무시
        if (message.author.bot) return;

        // 2. 고정 명령어 처리 (!설정, !입장, !퇴장)
        if (message.content === '!설정') {
            await ttsSetting.execute(message);
            return;
        }

        if (message.content === '!입장' || message.content === '!퇴장') {
            // !입장, !퇴장 뒤의 명령어 텍스트를 제거하고 '입장' or '퇴장'만 넘김
            await connectionCmd.execute(message, null, message.content.substring(1));
            return;
        }

        const fullContent = message.content.trim();
        const isCommand = fullContent.startsWith('!');

        // ----------------------------------------------------
        // ⭐️ 3. 자동 TTS 로직 (명령어가 아닐 때만 실행)
        // ----------------------------------------------------
        // 봇이 해당 서버에서 TTS 모드이고 + 명령어가 아니라면 읽어줍니다.
        const isTTSActive = message.client.ttsStatus && message.client.ttsStatus[message.guild.id];
        
        if (!isCommand && isTTSActive) {
            // A. 타겟 유저 확인 (설정된 유저만 읽기)
            const targetUsers = message.client.ttsTargetUsers?.[message.guild.id];
            
            // 타겟 리스트가 존재하는데, 말한 사람이 리스트에 없다면 무시
            if (targetUsers && !targetUsers.includes(message.author.id)) {
                return; 
            }

            // B. 글자수 제한 (너무 긴 도배 방지)
            if (fullContent.length > 50) return; 

            // C. 목소리 타입 확인 (저장된 설정이 없으면 'female' 기본값)
            // (EdgeTTS를 쓰기로 했으므로 'female' or 'male'이 넘어갑니다)
            const voiceType = message.client.ttsVoiceType?.[message.guild.id] || 'female';

            // D. 재생
            await playTTS(message.guild.id, fullContent, voiceType);
            return;
        }

        // ----------------------------------------------------
        // ⭐️ 4. 명령어 처리 로직 (!로 시작하는 경우)
        // ----------------------------------------------------
        if (!isCommand) return; // 명령어도 아니고 TTS 대상도 아니면 여기서 끝

        // 접두사(!) 제거 및 파싱
        const contentWithoutPrefix = fullContent.slice(1).trim();
        const args = contentWithoutPrefix.split(/ +/);
        const commandName = args.shift().toLowerCase(); // 첫 단어를 명령어로 인식
        const normalizedContent = contentWithoutPrefix.toLowerCase(); // 전체 문장 소문자화 (대사 검색용)

        // A. 청소 명령어 (!청소 10 or !clear 10)
        if (commandName === '청소' || commandName === 'clear') {
            await clearCommand.execute(message, args);
            return;
        }

        // B. 대사 MP3 재생 (!아리, !가렌 등 dialogues.json에 있는 키워드)
        if (dialogueMap[normalizedContent]) {
            await playDialogue.execute(message, dialogueMap[normalizedContent]);
            return;
        }
        
        // C. 챔피언 정보 및 기타 명령어 (!가렌, !garen)
        // normalizedContent는 "!가렌" 전체, commandName은 "가렌"만 해당
        // 챔피언 데이터에 키가 있는지 확인
        if (champions[normalizedContent] || champions[commandName]) {
             try { 
                 // 챔피언 정보 핸들러 호출
                 await championInfoHandler(message, champions[normalizedContent] ? normalizedContent : commandName); 
             } catch (error) { 
                 console.error('챔피언 정보 에러:', error); 
             }
        }
    },
};