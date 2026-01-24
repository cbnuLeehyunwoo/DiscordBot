const { SlashCommandBuilder, ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: '설정', // !설정
    async execute(message) {
        // 1. 유저 선택 메뉴 (기존 기능)
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId('select_tts_users')
            .setPlaceholder('내 채팅을 읽어줄 사람을 선택하세요')
            .setMinValues(1)
            .setMaxValues(10);

        // 2. [수정됨] 국적(언어) 선택 메뉴 (최대 25개 꽉 채움, 설명 제거)
        const langSelect = new StringSelectMenuBuilder()
            .setCustomId('select_tts_lang')
            .setPlaceholder('목소리의 국적을 선택하세요')
            .addOptions([
                { label: '🇰🇷 한국어', value: 'ko' },
                { label: '🇺🇸 영어', value: 'en' },
                { label: '🇯🇵 일본어', value: 'ja' },
                { label: '🇨🇳 중국어 (간체)', value: 'zh-CN' },
                { label: '🇹🇼 대만어 (번체)', value: 'zh-TW' },
                { label: '🇪🇸 스페인어', value: 'es' },
                { label: '🇫🇷 프랑스어', value: 'fr' },
                { label: '🇩🇪 독일어', value: 'de' },
                { label: '🇷🇺 러시아어', value: 'ru' },
                { label: '🇮🇹 이탈리아어', value: 'it' },
                { label: '🇵🇹 포르투갈어', value: 'pt' },
                { label: '🇻🇳 베트남어', value: 'vi' },
                { label: '🇹🇭 태국어', value: 'th' },
                { label: '🇮🇩 인도네시아어', value: 'id' },
                { label: '🇮🇳 힌디어', value: 'hi' },
                { label: '🇸🇦 아랍어', value: 'ar' },
                { label: '🇳🇱 네덜란드어', value: 'nl' },
                { label: '🇹🇷 터키어', value: 'tr' },
                { label: '🇵🇱 폴란드어', value: 'pl' },
                { label: '🇸🇪 스웨덴어', value: 'sv' },
                { label: '🇫🇮 핀란드어', value: 'fi' },
                { label: '🇬🇷 그리스어', value: 'el' },
                { label: '🇺🇦 우크라이나어', value: 'uk' },
                { label: '🇨🇿 체코어', value: 'cs' },
                { label: '🇩🇰 덴마크어', value: 'da' },
            ]);

        // 3. 각각 다른 줄(Row)에 담기
        const row1 = new ActionRowBuilder().addComponents(userSelect);
        const row2 = new ActionRowBuilder().addComponents(langSelect);

        await message.reply({
            content: '⚙️ **TTS 설정 패널**입니다.\n아래에서 **읽어줄 사람**과 **목소리 국적**을 변경할 수 있습니다.',
            components: [row1, row2]
        });
    },
};