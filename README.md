# Discord Level Bot Dashboard

Discord 서버 레벨링 시스템을 위한 웹 대시보드입니다.

## 기능

- 🎮 **레벨링 시스템**: 메시지 및 음성 채팅 활동 추적
- 🏆 **업적 시스템**: 다양한 목표 달성으로 특별 보상
- 🎨 **프로필 커스터마이징**: 개인 프로필 카드 디자인 변경
- 📊 **분석 대시보드**: 서버 활동 통계 및 리더보드
- ⚙️ **세부 설정**: 채널별 XP 배율 및 쿨다운 조정
- 🛒 **마켓플레이스**: 프로필 배경 구매 시스템

## 기술 스택

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB + PostgreSQL
- **Authentication**: Discord OAuth 2.0

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
```bash
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
MONGODB_URI=your_mongodb_connection_string
DATABASE_URL=your_postgresql_connection_string
```

3. 개발 서버 실행:
```bash
npm run dev
```

## Discord 애플리케이션 설정

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 새 애플리케이션 생성
2. OAuth2 섹션에서 리다이렉트 URI 추가:
   - `http://localhost:5000/auth/discord/callback` (개발용)
   - `https://yourdomain.com/auth/discord/callback` (프로덕션용)
3. 스코프: `identify`, `guilds`

## 라이선스

MIT License