import { connectMongoDB, getChannelConfigsCollection } from './server/mongodb.ts';

async function createTestChannelConfig() {
  try {
    await connectMongoDB();
    console.log('MongoDB 연결 완료');

    const collection = getChannelConfigsCollection();
    
    const testConfig = {
      id: Date.now(),
      channelId: '719536686140227674',
      serverId: '719536686140227674',
      messageXp: 25,
      voiceXpPerMinute: 10,
      cooldown: 30,
      minUsersForVoice: 3,
      enabled: true,
      createdAt: new Date()
    };

    await collection.insertOne(testConfig);
    console.log('테스트 채널 설정 생성:', testConfig);

    // 생성된 설정 확인
    const configs = await collection.find({ serverId: '719536686140227674' }).toArray();
    console.log('서버의 모든 채널 설정:', configs);

    process.exit(0);
  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

createTestChannelConfig();