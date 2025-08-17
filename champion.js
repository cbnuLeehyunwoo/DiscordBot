// C:\DiscordBot\champion.js (최종 수정 - 안정화 버전)
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const champions = require('./num2champ.json'); // champion.js와 같은 폴더에 있으므로 ./ 사용
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

module.exports = async (message, champName) => {
    // champName을 기반으로 데이터를 찾습니다.
    const champData = champions[champName];
    
    // 이 파일 안에서 한 번 더 확인합니다.
    if (!champData) {
        // 이 메시지는 messageCreate.js에서 처리하므로 여기서는 그냥 함수를 종료합니다.
        console.error(`champion.js: '${champName}'에 대한 데이터를 찾을 수 없습니다.`);
        return;
    }

    const champId = champData.id;
    const champEnName = champData.en_name.toLowerCase();

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`**${champName}** 정보 (op.gg)`)
        .setDescription('아래 버튼을 눌러 원하는 정보를 확인하세요.\n(5분 이상 응답이 없으면 버튼이 비활성화됩니다.)')
        .setThumbnail(`https://opgg-static.akamaized.net/images/lol/champion/${champEnName}.png`)
        .setFooter({ text: '데이터 제공: op.gg' });
    
    // 이하 코드는 이전과 동일합니다.
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`counter_${champId}`).setLabel('카운터').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`items_${champId}`).setLabel('아이템').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`skills_${champId}`).setLabel('스킬').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`runes_${champId}`).setLabel('룬').setStyle(ButtonStyle.Primary)
    );
    
    const reply = await message.reply({ embeds: [embed], components: [row] });

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            await i.reply({ content: '명령어를 실행한 유저만 버튼을 누를 수 있습니다.', ephemeral: true });
            return;
        }

        const [action] = i.customId.split('_');
        
        if (action === 'main') {
            await i.update({ embeds: [embed], components: [row] });
            return;
        }
        
        await i.deferUpdate();
        const buildURL = `https://www.op.gg/champions/${champEnName}/build`;
        
        try {
            const { data } = await axios.get(buildURL, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7' 
                }
            });
            
            fs.writeFileSync(`opgg_debug_${champEnName}.html`, data);

            const $ = cheerio.load(data);
            let resultEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setThumbnail(`https://opgg-static.akamaized.net/images/lol/champion/${champEnName}.png`)
                .setFooter({ text: '데이터 제공: op.gg' });

            let description = '';

            switch (action) {
                case 'counter':
                    resultEmbed.setTitle(`**${champName}**의 카운터 챔피언`);
                    $('h3:contains("상대하기 어려운 챔피언")').next('div').find('a').slice(0, 3).each((idx, el) => {
                        const name = $(el).find('strong').text().trim();
                        const winRate = $(el).find('span').text().trim();
                        if (name && winRate) {
                            description += `**${name}**: 승률 ${winRate}\n`;
                        }
                    });
                    break;
                
                case 'items':
                    resultEmbed.setTitle(`**${champName}**의 아이템 빌드`);
                    const summaryDiv = $('div > p:contains("스펠")').parent().parent();
                    
                    const startItems = [];
                    summaryDiv.find('p:contains("시작 아이템")').next('div').find('img').each((idx, el) => {
                        const itemName = $(el).attr('alt');
                        if (itemName) startItems.push(itemName);
                    });
                    if (startItems.length > 0) {
                        description += `**시작 아이템**: ${startItems.join(', ')}\n\n`;
                    }
                    
                    const boots = [];
                     summaryDiv.find('p:contains("신발")').next('div').find('img').each((idx, el) => {
                        const itemName = $(el).attr('alt');
                        if (itemName) boots.push(itemName);
                    });
                    if(boots.length > 0){
                        description += `**추천 신발**: ${boots.join(', ')}\n\n`;
                    }

                    const coreItems = [];
                    summaryDiv.find('p:contains("코어 빌드")').next('div').find('img').each((idx, el) => {
                        const itemName = $(el).attr('alt');
                        if (itemName) coreItems.push(itemName);
                    });
                    if (coreItems.length > 0) {
                        description += `**추천 코어 빌드**: ${coreItems.join(' → ')}`;
                    }
                    break;

                case 'skills':
                    resultEmbed.setTitle(`**${champName}**의 스킬 빌드`);
                    const skillOrder = [];
                    $('p:contains("스킬 빌드")').next('div').find('div > span').each((idx, el) => {
                        const skillKey = $(el).text().trim();
                        if (skillKey && /^[QWER]$/.test(skillKey)) {
                           skillOrder.push(skillKey);
                        }
                    });
                    if (skillOrder.length > 0) {
                       description = `**선마 순서**: ${skillOrder.join(' → ')}`;
                    }
                    break;

                case 'runes':
                    resultEmbed.setTitle(`**${champName}**의 룬 정보`);
                    const runeContainer = $('p:contains("룬")').next('div');
                    const runes = [];
                    runeContainer.find('img').each((idx, el) => {
                        const runeName = $(el).attr('alt');
                        if(runeName) runes.push(runeName);
                    });

                    if (runes.length >= 9) {
                        description += `**핵심 룬**: ${runes[0]}\n`;
                        description += `**주요 룬**: ${runes.slice(1, 4).join(', ')}\n`;
                        description += `**보조 룬**: ${runes.slice(4, 6).join(', ')}\n\n`;
                        description += `**파편**: ${runes.slice(6, 9).join(', ')}`;
                    }
                    break;
            }
            
            if (!description) {
                description = '정보를 가져올 수 없습니다. OP.GG의 구조가 변경되었을 수 있습니다.';
            }

            resultEmbed.setDescription(description);
            const backButton = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`main_${champId}`).setLabel('메인으로').setStyle(ButtonStyle.Secondary));
            await i.editReply({ embeds: [resultEmbed], components: [backButton] });

        } catch (error) {
            console.error(`[오류] ${champName} 정보 크롤링 실패:`, error.message);
            await i.editReply({ content: '정보를 가져오는 중 오류가 발생했습니다. OP.GG에서 일시적으로 차단했거나 페이지 구조가 변경되었을 수 있습니다.', embeds: [], components: [] });
        }
    });

    collector.on('end', () => { 
        if (reply.components.length > 0) { 
            const disabledRow = ActionRowBuilder.from(reply.components[0]); 
            disabledRow.components.forEach(c => c.setDisabled(true)); 
            reply.edit({ components: [disabledRow] }).catch(() => {}); 
        }
    });
};