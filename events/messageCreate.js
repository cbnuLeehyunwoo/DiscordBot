// events/messageCreate.js
const { Events } = require('discord.js');
const champions = require('../num2champ.json');
const championInfoHandler = require('../champion.js');
const dialogueMap = require('../dialogues.json');
const playDialogue = require('../commands/playdialogue.js'); 
const connectionCmd = require('../commands/connection.js'); // 새로 만든 입장/퇴장 파일
const playTTS = require('../utils/ttsPlayer.js'); // 새로 만든 재생 유틸
const ttsSetting = require('../commands/ttsSetting.js'); // 새로 만든 설정 커맨드

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        // !설정 명령어 연결
        if (message.content === '!설정') {
            await ttsSetting.execute(message);
            return;
        }
        // 1. '!입장', '!퇴장' 명령어 처리
        if (message.content === '!입장' || message.content === '!퇴장') {
            await connectionCmd.execute(message, null, message.content.substring(1));
            return;
        }

        const fullContent = message.content.trim();
        const isCommand = fullContent.startsWith('!');

        // ----------------------------------------------------
        // ⭐️ 자동 TTS 로직 (명령어가 아닐 때만 실행) ⭐️
        // ----------------------------------------------------
        // 봇이 해당 서버에서 TTS 모드이고 + 명령어가 아니라면 읽어줍니다.
        const isTTSActive = message.client.ttsStatus && message.client.ttsStatus[message.guild.id];
        
        if (!isCommand && isTTSActive) {
            // 1. 현재 서버의 타겟 리스트를 가져옴
            const targetUsers = message.client.ttsTargetUsers?.[message.guild.id];

            // 2. 타겟 리스트가 설정되어 있는데, 말한 사람이 리스트에 없으면 -> 무시!
            // (만약 리스트가 없으면 모두 읽거나, 아무도 안 읽게 설정 가능. 여기선 '리스트가 없으면 모두 읽음'으로 처리)
            if (targetUsers && !targetUsers.includes(message.author.id)) {
                return; // 이 사람은 읽지 마!
            }

            if (fullContent.length > 50) return; 
            await playTTS(message.guild.id, fullContent);
            return;
        }

        // --- 기존 로직 (명령어일 경우에만 실행) ---
        if (!isCommand) return; // 명령어도 아니고 TTS 대상도 아니면 무시

        const contentWithoutPrefix = fullContent.slice(1).trim();
        const normalizedContent = contentWithoutPrefix.toLowerCase();

        // 대사 MP3 재생
        if (dialogueMap[normalizedContent]) {
            await playDialogue.execute(message, dialogueMap[normalizedContent]);
            return;
        }
        
        // 챔피언 정보 및 기타 명령어
        const args = contentWithoutPrefix.split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // ... (기존 챔피언 처리 로직 유지) ...
        const fullName = normalizedContent;
        if (champions[fullName] || champions[commandName]) {
             try { await championInfoHandler(message, champions[fullName] ? fullName : commandName); } 
             catch (error) { console.error(error); }
        }
    },
};