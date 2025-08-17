// index.js (최종 디버깅 버전)
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[경고] ${filePath} 파일에 필요한 "data" 또는 "execute" 속성이 없습니다.`);
        }
    }
}

// --- 이벤트 핸들러 (결정적인 진단 로그 추가) ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log("\n--- [INDEX.JS] 이벤트 핸들러 로딩 시작 ---");
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
    
    console.log(`[INDEX.JS] 파일 발견: ${file}`);

	if (event.name && event.execute) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[INDEX.JS] => '${event.name}' 이벤트를 성공적으로 연결했습니다.\n`);
    } else {
        console.error(`[오류!] ${filePath} 파일에 'name' 또는 'execute' 속성이 없습니다. 건너뜁니다.\n`);
    }
}
console.log("--- [INDEX.JS] 이벤트 핸들러 로딩 완료 ---\n");


client.login(token);