const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 유저 선택 메뉴가 아니면 무시
        if (!interaction.isUserSelectMenu()) return;

        // 설정한 ID인지 확인
        if (interaction.customId === 'select_tts_users') {
            
            // 1. 선택된 유저들의 ID 리스트를 가져옵니다.
            const selectedUserIds = interaction.values;

            // ---------------------------------------------------------
            // [수정됨] ID 리스트를 이용해 유저 닉네임 가져오기
            // ---------------------------------------------------------
            const names = selectedUserIds.map(id => {
                // interaction.members에는 선택된 유저의 정보가 담겨있습니다.
                const member = interaction.members.get(id);
                // 닉네임(displayName)이 있으면 그걸 쓰고, 없으면 기본값 처리
                return member ? member.displayName : '알 수 없는 유저';
            }).join(', '); // 쉼표로 연결 (예: "철수, 영희")


            // 2. 봇 메모리에 저장합니다. (서버별로 따로 관리)
            interaction.client.ttsTargetUsers = interaction.client.ttsTargetUsers || {};
            interaction.client.ttsTargetUsers[interaction.guildId] = selectedUserIds;

            // 3. 확인 메시지 보내기 (이름 리스트 출력)
            await interaction.update({
                content: `✅ 설정 완료! 이제 **${names}** 님의 채팅만 읽어드립니다.\n(다시 바꾸려면 '!설정'을 입력하세요)`,
                components: [] // 메뉴 제거
            });
            
            console.log(`TTS 타겟 변경됨 (서버: ${interaction.guildId}):`, selectedUserIds);
        }
    },
};
