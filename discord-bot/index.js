import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { levelSystem } from './utils/levelSystem.js';
import { connectDatabase } from './utils/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();
client.voiceSessions = new Map(); // Track voice sessions

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📁 명령어 폴더에서 ${commandFiles.length}개의 파일을 발견했습니다:`, commandFiles);

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  try {
    const command = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      console.log(`✅ 명령어 로드됨: ${command.default.data.name}`);
    } else {
      console.log(`❌ [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  } catch (error) {
    console.error(`❌ 명령어 로드 실패 (${file}):`, error);
  }
}

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = await import(filePath);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

// Ready event
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} is online!`);
  
  try {
    // Connect to database
    await connectDatabase();
    
    // 자동으로 슬래시 명령어 등록
    await deployCommands();
    
    // Set bot status
    client.user.setActivity('레벨링 시스템 | /profile', { type: 'WATCHING' });
    
    console.log('🎉 봇이 완전히 준비되었습니다!');
  } catch (error) {
    console.error('❌ 봇 초기화 중 오류:', error);
    // 데이터베이스 연결 실패해도 봇은 계속 실행
  }
});

// 자동 명령어 배포 함수
async function deployCommands() {
  const { REST, Routes } = await import('discord.js');
  
  try {
    console.log('🔄 슬래시 명령어 등록을 시작합니다...');
    
    // 명령어 데이터 수집
    const commands = [];
    for (const [name, command] of client.commands) {
      commands.push(command.data.toJSON());
    }
    
    console.log(`📋 ${commands.length}개의 명령어를 발견했습니다:`, commands.map(cmd => cmd.name));
    
    // Discord REST API 클라이언트 생성
    const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);
    
    // 기존 명령어 삭제
    console.log('🗑️  기존 글로벌 명령어를 삭제합니다...');
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] });
    
    // 새 명령어 등록
    console.log('🚀 새로운 글로벌 명령어를 등록합니다...');
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ ${data.length}개의 슬래시 명령어가 성공적으로 등록되었습니다!`);
    console.log('명령어 목록:', data.map(cmd => `/${cmd.name}`).join(', '));
    
  } catch (error) {
    console.error('❌ 명령어 등록 실패:', error);
    if (error.code === 50001) {
      console.error('권한 오류: 봇에게 applications.commands 권한이 있는지 확인하세요.');
    }
  }
}

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = '명령어 실행 중 오류가 발생했습니다.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Enhanced error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
});

// Login to Discord with proper error handling
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN이 설정되지 않았습니다!');
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Discord 로그인 실패:', error);
  process.exit(1);
});

export { client };
