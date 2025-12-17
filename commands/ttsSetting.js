const { ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
    async execute(message) {
        // 1. 유저 선택 메뉴 생성
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId('select_tts_users') // 이 ID로 나중에 이벤트를 식별합니다.
            .setPlaceholder('목소리를 읽어줄 유저들을 선택하세요')
            .setMinValues(1) // 최소 1명
            .setMaxValues(25); // 최대 25명까지 동시 선택 가능

        // 2. 컴포넌트는 Row(행)에 담아야 합니다.
        const row = new ActionRowBuilder().addComponents(userSelect);

        // 3. 메시지로 전송
        await message.reply({
            content: '🎙️ **TTS 설정**: 누구의 채팅을 읽어드릴까요? 아래 메뉴에서 선택해주세요.',
            components: [row],
        });
    },
};