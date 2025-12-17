const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 유저 선택 메뉴가 아니면 무시
        if (!interaction.isUserSelectMenu()) return;

        // 아까 설정한 ID인지 확인
        if (interaction.customId === 'select_tts_users') {
            
            // 1. 선택된 유저들의 ID 리스트를 가져옵니다.
            const selectedUserIds = interaction.values;

            // 2. 봇 메모리에 저장합니다. (서버별로 따로 관리)
            // client.ttsTargetUsers[서버ID] = [유저ID1, 유저ID2...] 형태
            interaction.client.ttsTargetUsers = interaction.client.ttsTargetUsers || {};
            interaction.client.ttsTargetUsers[interaction.guildId] = selectedUserIds;

            // 3. 확인 메시지 보내기 (메뉴를 수정해서 결과를 보여줌)
            await interaction.update({
                content: `✅ 설정 완료! 이제 **${selectedUserIds.length}명**의 채팅만 읽어드립니다.\n(다시 바꾸려면 '!설정'을 입력하세요)`,
                components: [] // 메뉴 제거
            });
            
            console.log(`TTS 타겟 변경됨 (서버: ${interaction.guildId}):`, selectedUserIds);
        }
    },
};