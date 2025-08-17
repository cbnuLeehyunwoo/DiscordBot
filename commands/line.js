// commands/라인.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: {
        name: '라인',
        aliases: ['롤'],
        description: '리그 오브 레전드 라인을 배정합니다.',
    },
    async execute(message, args) {
        // --- 1. 참가자 결정 (버그를 완전히 수정한 최종 로직) ---
        let players = [];
        // 멘션된 멤버 중 봇이 아닌 멤버만 필터링
        const mentionedMembers = message.mentions.members.filter(member => !member.user.bot);

        if (mentionedMembers.size > 0) {
            // 우선순위 1: 멘션이 있으면, 무조건 멘션된 사람들만 참가자로 확정합니다.
            players = Array.from(mentionedMembers.values());
        } else {
            // 우선순위 2: 멘션이 없으면, 음성 채널을 확인합니다.
            const voiceChannel = message.member.voice.channel;
            if (voiceChannel && voiceChannel.members.size > 0) {
                const vcMembers = Array.from(voiceChannel.members.filter(member => !member.user.bot).values());
                // 음성 채널에 실제 유저가 있을 경우에만 참가자로 확정
                if (vcMembers.length > 0) {
                    players = vcMembers;
                }
            }
        }
        
        // 최종 확인: 위 모든 방법으로 참가자를 한 명도 못 찾았다면, 명령어 작성자만 포함합니다.
        if (players.length === 0) {
            players.push(message.member);
        }

        const playerNames = players.map(member => member.nickname || member.user.globalName || member.user.username).join(', ');

        // --- 2. 초기 UI 생성 및 전송 (이하 동일) ---
        let selectedLanes = new Set();
        
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎲 라인 배정 준비')
            .setDescription('아래 버튼을 눌러 포함할 라인을 선택한 후, `배정 시작`을 눌러주세요!')
            .addFields(
                { name: '👥 참가자', value: playerNames },
                { name: '📋 선택된 라인', value: '아직 없음' }
            );

        const buildRows = () => {
            const laneMap = { top: '탑', jungle: '정글', mid: '미드', adc: '원딜', support: '서폿' };
            const emojiMap = { top: '⚔️', jungle: '🌳', mid: '🧙', adc: '🏹', support: '🛡️' };
            
            const row1 = new ActionRowBuilder();
            Object.keys(laneMap).forEach(key => {
                const laneName = `${emojiMap[key]} ${laneMap[key]}`;
                const isSelected = selectedLanes.has(laneName);
                row1.addComponents(
                    new ButtonBuilder()
                        .setCustomId(key)
                        .setLabel(laneName)
                        .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary)
                );
            });

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('start').setLabel('🚀 배정 시작!').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('reset').setLabel('🔄 초기화').setStyle(ButtonStyle.Danger)
            );
            return [row1, row2];
        };
        
        const reply = await message.reply({ embeds: [embed], components: buildRows() });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000
        });

        collector.on('collect', async i => {
            if ((i.customId === 'start' || i.customId === 'reset') && i.user.id !== message.author.id) {
                return i.reply({ content: '명령어를 실행한 유저만 시작/초기화할 수 있습니다.', ephemeral: true });
            }

            const laneMap = { top: '⚔️ 탑', jungle: '🌳 정글', mid: '🧙 미드', adc: '🏹 원딜', support: '🛡️ 서폿' };

            if (Object.keys(laneMap).includes(i.customId)) {
                const laneName = laneMap[i.customId];
                if (selectedLanes.has(laneName)) selectedLanes.delete(laneName);
                else selectedLanes.add(laneName);
            }

            if (i.customId === 'reset') {
                selectedLanes.clear();
            }

            if (i.customId === 'start') {
                let desiredLanes = Array.from(selectedLanes);
                if (desiredLanes.length === 0) desiredLanes = Object.values(laneMap);

                if (players.length > desiredLanes.length) {
                    return i.reply({ content: `인원 수(${players.length}명)보다 선택한 라인(${desiredLanes.length}개)이 적어요!`, ephemeral: true });
                }

                const shuffle = arr => arr.sort(() => Math.random() - 0.5);
                const shuffledPlayers = shuffle(players);
                const shuffledLanes = shuffle(desiredLanes);

                let resultDescription = '';
                for (let j = 0; j < shuffledPlayers.length; j++) {
                    const member = shuffledPlayers[j];
                    const displayName = member.nickname || member.user.globalName || member.user.username;
                    resultDescription += `${displayName}  ➡️  **${shuffledLanes[j]}**\n`;
                }

                const resultEmbed = new EmbedBuilder().setColor(0x57F287).setTitle('✅ 라인 배정 완료!').setDescription(resultDescription).setTimestamp().setFooter({ text: '즐거운 게임 되세요!' });

                await i.update({ embeds: [resultEmbed], components: [] });
                collector.stop();
                return;
            }

            const updatedEmbed = EmbedBuilder.from(embed);
            const selectedLanesText = selectedLanes.size > 0 ? Array.from(selectedLanes).join('\n') : '아직 없음';
            updatedEmbed.setFields(
                { name: '👥 참가자', value: playerNames },
                { name: '📋 선택된 라인', value: selectedLanesText }
            );

            await i.update({ embeds: [updatedEmbed], components: buildRows() });
        });

        collector.on('end', collected => {
            const disabledRows = reply.components.map(row => {
                 const newRow = ActionRowBuilder.from(row);
                 newRow.components.forEach(comp => comp.setDisabled(true));
                 return newRow;
            });
            reply.edit({ components: disabledRows }).catch(() => {});
        });
    },
};