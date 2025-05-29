# Discord Leveling Bot (WangBot)

Discord 서버용 레벨링 시스템 봇입니다. 사용자 활동을 추적하고 경험치를 부여하며, 웹 대시보드와 연동됩니다.

## 주요 기능

- 📈 **자동 경험치 시스템**: 메시지 및 음성 채팅 활동으로 XP 획득
- 🎯 **레벨 시스템**: 경험치에 따른 자동 레벨업
- 🎮 **프로필 카드**: `/프로필` 명령어로 사용자 통계 확인
- 💰 **포인트 시스템**: 활동으로 포인트 획득
- 🌐 **웹 대시보드 연동**: 실시간 통계 및 설정 관리

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정 (`.env` 파일 생성):
```env
DISCORD_BOT_TOKEN=your_bot_token_here
MONGODB_URI=your_mongodb_connection_string
DASHBOARD_URL=https://your-dashboard-url.com
```

3. 봇 실행:
```bash
npm start
```

## 환경 변수

- `DISCORD_BOT_TOKEN`: Discord 봇 토큰
- `MONGODB_URI`: MongoDB 연결 문자열
- `DASHBOARD_URL`: 웹 대시보드 URL (프로필 카드 API용)

## 사용법

### 슬래시 명령어

- `/프로필 [유저]`: 사용자의 프로필 카드 표시

### 자동 기능

- **메시지 XP**: 메시지 작성 시 자동으로 XP 획득
- **음성 XP**: 음성 채널 참여 시 자동으로 XP 획득
- **레벨업 알림**: 레벨업 시 자동 알림

## 기술 스택

- **Discord.js**: Discord API 상호작용
- **MongoDB**: 사용자 데이터 저장
- **Canvas**: 프로필 카드 이미지 생성
- **Node.js**: 런타임 환경

## 웹 대시보드 연동

이 봇은 웹 대시보드와 완전히 연동됩니다:
- 실시간 통계 조회
- 서버 설정 관리
- 사용자 프로필 커스터마이징
- 리더보드 확인

## 라이선스

MIT License