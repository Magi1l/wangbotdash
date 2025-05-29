import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

async function clearCommands() {
  try {
    console.log('🗑️ 기존 슬래시 명령어들을 삭제하는 중...');

    // 글로벌 명령어 삭제
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] });
    console.log('✅ 글로벌 슬래시 명령어가 모두 삭제되었습니다.');

    // 길드별 명령어도 삭제하고 싶다면 (특정 서버ID 필요)
    // await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, 'YOUR_GUILD_ID'), { body: [] });

    console.log('🎉 모든 명령어 정리가 완료되었습니다!');
  } catch (error) {
    console.error('❌ 명령어 삭제 중 오류 발생:', error);
  }
}

clearCommands();