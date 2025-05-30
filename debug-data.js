import { MongoClient } from 'mongodb';

async function checkData() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('levelbot');
    
    console.log('MongoDB 연결 성공');
    
    // 특정 사용자 데이터 검색
    const targetUserId = '284280254216798211';
    const targetServerId = '719536686140227674';
    
    const userServer = await db.collection('userServers').findOne({ 
      userId: targetUserId, 
      serverId: targetServerId 
    });
    
    console.log('검색 조건:');
    console.log('- userId:', targetUserId);
    console.log('- serverId:', targetServerId);
    console.log('검색 결과:', userServer);
    
    // 모든 userServers 컬렉션 데이터 확인
    const allUserServers = await db.collection('userServers').find({}).toArray();
    console.log('\n모든 userServers 데이터:');
    allUserServers.forEach((item, index) => {
      console.log(`${index + 1}.`, {
        userId: item.userId,
        serverId: item.serverId,
        level: item.level,
        xp: item.xp
      });
    });
    
    await client.close();
  } catch (error) {
    console.error('MongoDB 확인 오류:', error);
  }
}

checkData();