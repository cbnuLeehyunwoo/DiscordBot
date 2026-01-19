// commands/clear.js
const { PermissionsBitField } = require('discord.js');

module.exports = {
    async execute(message, args) {





        // 2. 개수 확인: !청소 뒤에 숫자를 적었는지 확인
        // args[0]은 명령어 뒤의 첫 번째 단어입니다.
        const amount = parseInt(args[0]);

        if (isNaN(amount)) {
            return message.reply('지울 개수를 숫자로 적어주세요! (예: `!청소 10`)');
        } else if (amount < 1 || amount > 99) {
            return message.reply('한 번에 1개에서 99개까지만 지울 수 있어요.');
        }

        // 3. 삭제 실행
        try {
            // bulkDelete(개수, 필터링여부)
            // true 옵션: 14일이 지난 메시지는 삭제하려다 에러가 나는데, 그걸 무시하고 지울 수 있는 것만 지우게 함
            await message.channel.bulkDelete(amount, true);

            // 4. 완료 메시지 (3초 뒤에 사라짐)
            const sentMsg = await message.channel.send(`🧹 **${amount}개**의 메시지를 삭제했습니다!`);
            setTimeout(() => sentMsg.delete().catch(() => {}), 3000);

        } catch (error) {
            console.error(error);
            message.channel.send('메시지를 지우는 중에 오류가 발생했어요. (혹시 메시지가 너무 오래되었나요?)');
        }
    },
};
