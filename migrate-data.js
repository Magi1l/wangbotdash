import { MongoClient } from 'mongodb';

async function migrateData() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const defaultDb = client.db();
    const levelbotDb = client.db('levelbot');
    
    console.log('데이터 마이그레이션 시작...');
    
    // 컬렉션 목록
    const collections = ['users', 'userServers', 'servers', 'channelConfigs', 'achievements', 'backgrounds', 'activityLogs'];
    
    for (const collectionName of collections) {
      console.log(`\n${collectionName} 컬렉션 마이그레이션 중...`);
      
      const sourceCollection = defaultDb.collection(collectionName);
      const targetCollection = levelbotDb.collection(collectionName);
      
      // 기존 데이터 확인
      const existingData = await sourceCollection.find({}).toArray();
      console.log(`- 기존 데이터: ${existingData.length}개`);
      
      if (existingData.length > 0) {
        // 타겟 컬렉션의 기존 데이터 확인
        const targetData = await targetCollection.find({}).toArray();
        console.log(`- 타겟 데이터: ${targetData.length}개`);
        
        if (targetData.length === 0) {
          // 데이터 복사
          await targetCollection.insertMany(existingData);
          console.log(`- ✅ ${existingData.length}개 데이터 복사 완료`);
        } else {
          console.log(`- ⚠️ 타겟에 이미 데이터가 있어서 건너뜀`);
        }
      } else {
        console.log(`- 복사할 데이터 없음`);
      }
    }
    
    console.log('\n✅ 데이터 마이그레이션 완료');
    await client.close();
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
  }
}

migrateData();