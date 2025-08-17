// C:\DiscordBot\champion.js (라인 선택 기능 추가 버전)
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const champions = require('./num2champ.json');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

module.exports = async (message, champName) => {
    const champData = champions[champName];
    
    if (!champData || !champData.name) {
        console.error(`champion.js: '${champName}'에 대한 데이터나 영문 이름을 찾을 수 없습니다.`);
        // messageCreate.js에서 오류 메시지를 처리하므로 여기서는 조용히 종료합니다.
        return;
    }

    const champId = champData.id;
    const champEnName = champData.name.toLowerCase().replace(/[^a-z]/g, '');

    // 1. 라인 선택 임베드 및 버튼 생성
    const laneSelectEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`**${champName}** 정보 (op.gg)`)
        .setDescription('분석할 라인을 선택해주세요.\n(5분 이상 응답이 없으면 버튼이 비활성화됩니다.)')
        .setThumbnail(`https://opgg-static.akamaized.net/images/lol/champion/${champEnName}.png`)
        .setImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champData.name}_0.jpg`)
        .setFooter({ text: '데이터 제공: op.gg' });

    const laneSelectRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`lane_top_${champId}`).setLabel('탑').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`lane_jungle_${champId}`).setLabel('정글').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`lane_mid_${champId}`).setLabel('미드').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`lane_adc_${champId}`).setLabel('원딜').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`lane_support_${champId}`).setLabel('서폿').setStyle(ButtonStyle.Success)
    );

    const reply = await message.reply({ embeds: [laneSelectEmbed], components: [laneSelectRow] });
    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

    const createInfoSelectRow = (lane) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`info_counter_${lane}_${champId}`).setLabel('카운터').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`info_items_${lane}_${champId}`).setLabel('아이템').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`info_skills_${lane}_${champId}`).setLabel('스킬').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`info_runes_${lane}_${champId}`).setLabel('룬').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`info_power_${lane}_${champId}`).setLabel('파워 그래프').setStyle(ButtonStyle.Danger)
    );

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            await i.reply({ content: '명령어를 실행한 유저만 버튼을 누를 수 있습니다.', ephemeral: true });
            return;
        }
        
        await i.deferUpdate(); // 모든 상호작용에 대해 즉시 응답

        const [type, ...args] = i.customId.split('_');
        
        // 2. 라인 선택 시 -> 정보 선택 버튼 표시
        if (type === 'lane') {
            const [lane] = args;
            const infoSelectEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`**${champName} (${lane.toUpperCase()})** 정보`)
                .setDescription('원하는 정보를 선택하세요.')
                .setThumbnail(`https://opgg-static.akamaized.net/images/lol/champion/${champEnName}.png`)
                .setFooter({ text: '데이터 제공: op.gg' });

            const infoSelectRow = createInfoSelectRow(lane);
            
            const backToLaneSelectRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`back_lane_${champId}`).setLabel('라인 다시 선택').setStyle(ButtonStyle.Secondary)
            );

            await i.editReply({ embeds: [infoSelectEmbed], components: [infoSelectRow, backToLaneSelectRow] });
        
        // 3. 정보 선택 시 -> 데이터 크롤링 및 표시
        } else if (type === 'info') {
            const [action, lane] = args;

            const resultEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setThumbnail(`https://opgg-static.akamaized.net/images/lol/champion/${champEnName}.png`)
                .setFooter({ text: '데이터 제공: op.gg' });

            try {
                const targetUrl = (action === 'counter' || action === 'power')
                    ? `https://op.gg/ko/lol/champions/${champEnName}/counters/${lane}`
                    : `https://op.gg/ko/lol/champions/${champEnName}/build/${lane}`;

                resultEmbed.setTitle(`**${champName} (${lane.toUpperCase()})** - ${action.charAt(0).toUpperCase() + action.slice(1)}`);

                const { data } = await axios.get(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
                    }
                });
                const $ = cheerio.load(data);

                if (action === 'counter') {
                    $("p").each((_, el) => {
                        const pText = $(el).text();
                        if (pText.includes('상대하기 쉬운 챔피언은') && pText.includes('상대하기 어려운 챔피언은')) {
                            const pHtml = $(el).html();
                            const hardPart = pHtml.split('상대하기 어려운 챔피언은')[1];
                            const easyPart = pHtml.split('상대하기 어려운 챔피언은')[0].split('상대하기 쉬운 챔피언은')[1];

                            const easyCounters = [];
                            if (easyPart) {
                                const $easy = cheerio.load(easyPart);
                                $easy('img').each((_, img) => { const alt = $(img).attr('alt'); if (alt) easyCounters.push(alt); });
                            }

                            const hardCounters = [];
                            if (hardPart) {
                                const $hard = cheerio.load(hardPart);
                                $hard('img').each((_, img) => { const alt = $(img).attr('alt'); if (alt) hardCounters.push(alt); });
                            }

                            const formatWithEmoji = (counterList) => {
                                if (!counterList || counterList.length === 0) return '정보 없음';
                                return counterList.map(koreanName => {
                                    const champInfo = champions[koreanName];
                                    const emojiName = champInfo ? champInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '') : koreanName.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    const emoji = i.client.emojis.cache.find(e => e.name === emojiName);
                                    return emoji ? `${emoji} **${koreanName}**` : `∙ **${koreanName}**`;
                                }).join('\n');
                            };

                            if (hardCounters.length > 0 || easyCounters.length > 0) {
                                resultEmbed.addFields(
                                    { name: '상대하기 어려운 챔피언', value: formatWithEmoji(hardCounters), inline: false },
                                    { name: '상대하기 쉬운 챔피언', value: formatWithEmoji(easyCounters.filter(c => c !== champName)), inline: false }
                                );
                            }
                            return false;
                        }
                    });
                } else if (action === 'power') {
                    $("p").each((_, el) => {
                        const pText = $(el).text();
                        if (pText.includes('가장 강한 모습을 보이고') && pText.includes('가장 약합니다')) {
                            const lines = pText.split('\n').map(line => line.trim()).filter(line => line);
                            const tierLine = lines.find(line => line.includes('티어를 기록하고 있으며'));
                            const powerGraphLine = lines.find(line => line.includes('가장 강한 모습을 보이고'));

                            if (tierLine && powerGraphLine) {
                                const cleanedTierLine = tierLine.split(', 많이 가는 빌드는')[0].replace('있으며', '있습니다.');
                                const finalDescription = `${cleanedTierLine}\n\n${powerGraphLine}`;
                                resultEmbed.setDescription(finalDescription);
                            }
                            return false;
                        }
                    });
                } else {
                    const buildData = JSON.parse($("script#__NEXT_DATA__").html());
                    const championData = buildData.props.pageProps.data;
                    let description = '';
                    switch (action) {
                        case 'items':
                            const startingItems = championData.summoner_spell_build.starting_items.map(item => item.name).join(', ');
                            const shoes = championData.summoner_spell_build.shoes.map(item => item.name).join(', ');
                            const coreItems = championData.core_item_build.map(item => item.name).join(' → ');
                            description = `**시작 아이템**: ${startingItems}\n**신발**: ${shoes}\n**코어 빌드**: ${coreItems}`;
                            break;
                        case 'skills':
                            description = `**스킬 선마 순서**: ${championData.skill_masteries.map(skill => skill.id).join(' → ')}`;
                            break;
                        case 'runes':
                            const primaryRunes = championData.rune_pages[0].primary_page.runes.map(r => r.name).join(', ');
                            const secondaryRunes = championData.rune_pages[0].secondary_page.runes.map(r => r.name).join(', ');
                            const statMods = championData.rune_pages[0].stat_mods.map(r => r.name).join(', ');
                            description = `**주요 룬**: ${primaryRunes}\n**보조 룬**: ${secondaryRunes}\n**파편**: ${statMods}`;
                            break;
                    }
                    if (description) {
                        resultEmbed.setDescription(description);
                    }
                }
            } catch (error) {
                console.error(`[오류] ${champName} (${lane}) ${action} 정보 크롤링 실패:`, error.message);
            }

            if (!resultEmbed.data.fields && !resultEmbed.data.description) {
                resultEmbed.setDescription('관련 정보를 찾을 수 없습니다. 해당 챔피언은 현재 이 라인에서 잘 사용되지 않을 수 있습니다.');
            }

            const backToInfoSelectRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`back_info_${lane}_${champId}`).setLabel('뒤로').setStyle(ButtonStyle.Secondary)
            );
            await i.editReply({ embeds: [resultEmbed], components: [backToInfoSelectRow] });

        // 4. 뒤로가기 버튼 처리
        } else if (type === 'back') {
            const [target, lane] = args;
            if (target === 'lane') {
                // 라인 선택으로 돌아가기
                await i.editReply({ embeds: [laneSelectEmbed], components: [laneSelectRow] });
            } else if (target === 'info') {
                // 정보 선택으로 돌아가기
                const infoSelectEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`**${champName} (${lane.toUpperCase()})** 정보`)
                    .setDescription('원하는 정보를 선택하세요.')
                    .setThumbnail(`https://opgg-static.akamaized.net/images/lol/champion/${champEnName}.png`)
                    .setFooter({ text: '데이터 제공: op.gg' });

                const infoSelectRow = createInfoSelectRow(lane);

                const backToLaneSelectRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`back_lane_${champId}`).setLabel('라인 다시 선택').setStyle(ButtonStyle.Secondary)
                );

                await i.editReply({ embeds: [infoSelectEmbed], components: [infoSelectRow, backToLaneSelectRow] });
            }
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