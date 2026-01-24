const { Events } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

const champions = require('../num2champ.json');
const championInfoHandler = require('../champion.js');
const dialogueMap = require('../dialogues.json');

const playDialogue = require('../commands/playdialogue.js'); 
const connectionCmd = require('../commands/connection.js');
const ttsSetting = require('../commands/ttsSetting.js'); 
const clearCommand = require('../commands/clear.js'); 
const playTTS = require('../utils/ttsPlayer.js'); // TTS 플레이어 (중복 선언 제거함)

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
        // ⭐️ 자동 TTS 로직 (큐 적용됨)
        // ----------------------------------------------------
        const connection = getVoiceConnection(message.guild.id);
        
        // 연결되어 있고 + 명령어가 아니라면
        if (connection && !isCommand) {
            
            // 타겟 유저 확인
            const targetUsers = message.client.ttsTargetUsers?.[message.guild.id];
            
            // 타겟 설정이 있는데 리스트에 없는 사람이면 무시
            if (targetUsers && !targetUsers.includes(message.author.id)) {
                return; 
            }

            // 글자수 제한
            if (fullContent.length > 50) return; 

            // ---------------------------------------------------------
            // [변경점] 설정된 국적 가져오기 (없으면 'ko' 한국어 기본)
            // ---------------------------------------------------------
            const currentLang = message.client.ttsLanguage?.[message.guild.id] || 'ko';

            // 큐에 추가 (텍스트와 언어를 같이 넘김)
            await playTTS(message.guild.id, fullContent, currentLang);
            return;
        }

        // ----------------------------------------------------
        // 기존 명령어 로직
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