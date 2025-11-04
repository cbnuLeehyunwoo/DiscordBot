const { Events } = require('discord.js');
const champions = require('../num2champ.json');
const championInfoHandler = require('../champion.js');
// 1. dialogues.json 파일을 불러옵니다.
const dialogueMap = require('../dialogues.json'); 
// 2. MP3 재생을 처리할 별도의 함수를 불러옵니다.
const playDialogue = require('../commands/playdialogue.js'); // 아래 3단계에서 생성할 파일 경로

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.content.startsWith('!')) return;
        
        // 접두사('!')를 제외한 전체 메시지 내용
        const fullContent = message.content.slice(1).trim();
        
        // 소문자로 변환하여 매핑 파일에서 키를 찾기 위해 준비합니다.
        const normalizedContent = fullContent.toLowerCase(); 

        // ----------------------------------------------------
        // ⭐️ 새로운 대사 MP3 재생 로직 ⭐️
        // ----------------------------------------------------
        if (dialogueMap[normalizedContent]) {
            try {
                // 3. 해당 대사와 연결된 MP3 파일의 상대 경로를 가져옵니다.
                const mp3Path = dialogueMap[normalizedContent];
                
                // 4. 별도의 MP3 재생 함수를 호출합니다.
                await playDialogue.execute(message, mp3Path); 
                
                return; // 대사가 처리되었으므로 함수 종료
            } catch (error) {
                console.error(`대사 MP3 재생 중 오류 발생: ${error}`);
                await message.reply({ content: '대사 MP3 재생 중 오류 발생!', ephemeral: true });
                return;
            }
        }
        
        // ----------------------------------------------------
        // 기존 명령어 및 챔피언 정보 처리 로직 (변동 없음)
        // ----------------------------------------------------
        const args = fullContent.split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));
        
        if (command) {
            try { await command.execute(message, args); } catch (error) { console.error(error); await message.reply({ content: '명령어 실행 중 오류 발생!', ephemeral: true }); }
            return;
        }

        const fullName = fullContent.toLowerCase(); // 이미 소문자로 변환된 fullContent 사용
        if (champions[fullName] || champions[commandName]) {
            try { await championInfoHandler(message, champions[fullName] ? fullName : commandName); } catch (error) { console.error(error); await message.reply({ content: '챔피언 정보 처리 중 오류 발생!', ephemeral: true }); }
        }
    },
};