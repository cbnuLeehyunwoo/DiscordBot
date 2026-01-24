const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // --- A. 유저 선택 처리 (기존 코드 유지) ---
        if (interaction.isUserSelectMenu() && interaction.customId === 'select_tts_users') {
            const selectedUserIds = interaction.values;
            const names = selectedUserIds.map(id => {
                const member = interaction.members.get(id);
                return member ? member.displayName : '알 수 없는 유저';
            }).join(', ');

            interaction.client.ttsTargetUsers = interaction.client.ttsTargetUsers || {};
            interaction.client.ttsTargetUsers[interaction.guildId] = selectedUserIds;

            await interaction.update({
                content: `✅ 읽어줄 사람이 **${names}** 님으로 변경되었습니다!`,
                components: []
            });
            return;
        }

        // --- B. [추가됨] 국적(언어) 선택 처리 ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_tts_lang') {
            const selectedLang = interaction.values[0];

            // 봇 메모리에 언어 설정 저장 (기본값은 'ko')
            interaction.client.ttsLanguage = interaction.client.ttsLanguage || {};
            interaction.client.ttsLanguage[interaction.guildId] = selectedLang;

            // 보기 좋게 이름 매핑
            const langNames = {
                'ko': '🇰🇷 한국어', 'en': '🇺🇸 영어', 'ja': '🇯🇵 일본어',
                'zh-CN': '🇨🇳 중국어', 'zh-TW': '🇹🇼 대만어', 'es': '🇪🇸 스페인어',
                'fr': '🇫🇷 프랑스어', 'de': '🇩🇪 독일어', 'ru': '🇷🇺 러시아어',
                'it': '🇮🇹 이탈리아어', 'pt': '🇵🇹 포르투갈어', 'vi': '🇻🇳 베트남어',
                'th': '🇹🇭 태국어', 'id': '🇮🇩 인도네시아어', 'hi': '🇮🇳 힌디어',
                'ar': '🇸🇦 아랍어', 'nl': '🇳🇱 네덜란드어', 'tr': '🇹🇷 터키어',
                'pl': '🇵🇱 폴란드어', 'sv': '🇸🇪 스웨덴어', 'fi': '🇫🇮 핀란드어',
                'el': '🇬🇷 그리스어', 'uk': '🇺🇦 우크라이나어', 'cs': '🇨🇿 체코어',
                'da': '🇩🇰 덴마크어'
            };
            const langLabel = langNames[selectedLang] || selectedLang;

            await interaction.update({
                content: `✅ 목소리 국적이 **${langLabel}** 로 변경되었습니다!`,
                components: []
            });
        }
    },
};