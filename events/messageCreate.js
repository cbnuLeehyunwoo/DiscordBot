const { Events } = require('discord.js');
// 1. [추가] 실제 연결 상태를 확인하기 위해 가져옵니다.
const { getVoiceConnection } = require('@discordjs/voice'); 

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
        if (message.author.bot) return;

        // --- 명령어 처리 ---
        if (message.content === '!설정') {
            await ttsSetting.execute(message);
            return;
        }

        if (message.content === '!입장' || message.content === '!퇴장') {
            await connectionCmd.execute(message, null, message.content.substring(1));
            return;
        }

        const fullContent = message.content.trim();
        const isCommand = fullContent.startsWith('!');

        // ----------------------------------------------------
        // ⭐️ 3. 자동 TTS 로직 수정됨 ⭐️
        // ----------------------------------------------------
        
        // [수정] 메모리 변수(ttsStatus) 대신 "실제로 연결되어 있는지" 확인합니다.
        // 이렇게 하면 봇이 재부팅되어도 연결만 유지되면 계속 읽어줍니다.
        const connection = getVoiceConnection(message.guild.id);
        
        // 연결이 되어 있고 + 명령어가 아니라면 읽기 시도
        if (connection && !isCommand) {
            
            // A. 타겟 유저 확인
            const targetUsers = message.client.ttsTargetUsers?.[message.guild.id];
            
            // 타겟 리스트가 '설정된 적이 있는데', 말한 사람이 리스트에 없다면 무시
            if (targetUsers && !targetUsers.includes(message.author.id)) {
                return; 
            }
            
            // (만약 타겟 설정이 아예 없으면 -> 모두 읽거나, 아무도 안 읽게 정책 결정)
            // 여기서는 "타겟 설정이 없으면 모두 읽음"으로 동작합니다. 
            // 만약 "설정 안 하면 안 읽게" 하려면 아래 주석을 해제하세요.
            // if (!targetUsers) return; 

            // B. 글자수 제한
            if (fullContent.length > 50) return; 

            // C. 목소리 타입 가져오기 (기본값 female)
            const voiceType = message.client.ttsVoiceType?.[message.guild.id] || 'female';

            // D. 재생
            await playTTS(message.guild.id, fullContent, voiceType);
            return;
        }

        // ----------------------------------------------------
        // 4. 명령어 처리 로직
        // ----------------------------------------------------
        if (!isCommand) return; 

        const contentWithoutPrefix = fullContent.slice(1).trim();
        const args = contentWithoutPrefix.split(/ +/);
        const commandName = args.shift().toLowerCase();
        const normalizedContent = contentWithoutPrefix.toLowerCase();

        if (commandName === '청소' || commandName === 'clear') {
            await clearCommand.execute(message, args);
            return;
        }

        if (dialogueMap[normalizedContent]) {
            await playDialogue.execute(message, dialogueMap[normalizedContent]);
            return;
        }
        
        if (champions[normalizedContent] || champions[commandName]) {
             try { 
                 await championInfoHandler(message, champions[normalizedContent] ? normalizedContent : commandName); 
             } catch (error) { 
                 console.error('챔피언 정보 에러:', error); 
             }
        }
    },
};