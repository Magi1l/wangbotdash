// 디스코드 봇의 레벨 계산 로직 테스트
const BASE_XP_PER_LEVEL = 100;
const XP_MULTIPLIER = 1.2;

function calculateLevel(xp) {
  let level = 1;
  let requiredXP = BASE_XP_PER_LEVEL;
  
  while (xp >= requiredXP) {
    level++;
    requiredXP = Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, XP_MULTIPLIER));
  }
  
  return level;
}

function calculateRequiredXP(level) {
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, XP_MULTIPLIER));
}

function calculateLevelProgress(xp, level) {
  const currentLevelXP = level === 1 ? 0 : calculateRequiredXP(level - 1);
  const nextLevelXP = calculateRequiredXP(level);
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  
  return {
    currentXP: progressXP,
    requiredXP,
    percentage: Math.floor((progressXP / requiredXP) * 100)
  };
}

console.log('=== 레벨 계산 테스트 ===');
console.log('105 XP로 계산된 레벨:', calculateLevel(105));
console.log('레벨 1 필요 XP:', calculateRequiredXP(1));
console.log('레벨 2 필요 XP:', calculateRequiredXP(2)); 
console.log('레벨 3 필요 XP:', calculateRequiredXP(3));

console.log('\n=== 진행도 계산 테스트 ===');
const progress = calculateLevelProgress(105, 2);
console.log('레벨 2에서 105 XP 진행도:', progress);

// 다양한 XP 값에 대한 레벨 계산
console.log('\n=== 다양한 XP 값의 레벨 ===');
for (let xp = 0; xp <= 200; xp += 20) {
  console.log(`${xp} XP = 레벨 ${calculateLevel(xp)}`);
}