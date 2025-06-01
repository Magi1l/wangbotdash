# GitHub 업로드 가이드

## 주요 변경사항

### 데이터베이스 연결 문제 해결
- MongoDB 데이터베이스 "levelbot"로 통합
- 봇과 대시보드가 동일한 데이터베이스 사용
- 실제 사용자 데이터 정상 연동 (레벨 2, 105 XP, 100 포인트)

### 봇 기본 프로필 설정 구현
- 대시보드 API 실패 시 기본값으로 프로필 카드 생성
- 기본 색상: 배경 #36393F, 액센트 #5865F2
- 사용자가 커스터마이징하지 않아도 프로필 카드 표시

### 변경된 주요 파일
1. `discord-bot/commands/profile.js` - 기본 프로필 설정 추가
2. `server/routes.ts` - 실제 데이터 API 연동
3. `server/mongodb-storage.ts` - MongoDB 연결 최적화
4. `server/mongodb.js` - levelbot 데이터베이스 설정

## Git 명령어

```bash
git add -A
git commit -m "Fix data connectivity and implement default profile card settings

- Fixed critical MongoDB database connection issue between bot and dashboard
- Successfully migrated user data to consistent 'levelbot' database
- Implemented real Discord user integration with proper username and avatar display
- Modified bot to use default profile settings when dashboard API is unavailable
- Added fallback mechanism for profile card generation with default colors
- Real user data now properly displayed: Level 2, 105 XP, 100 points
- Enhanced error handling for profile card generation"

git push origin main
```

## 검증사항
- ✅ 실제 디스코드 사용자 데이터 표시
- ✅ 프로필 카드 기본 설정 동작
- ✅ MongoDB levelbot 데이터베이스 연결
- ✅ API 엔드포인트 정상 응답