# Discord Leveling Dashboard (WangBot Dashboard)

Discord 레벨링 봇을 위한 웹 관리 대시보드입니다. 서버 관리자가 봇 설정을 관리하고 사용자 통계를 확인할 수 있습니다.

## 주요 기능

### 🎛️ 서버 관리
- **채널 설정**: 채널별 XP 배율 및 비활성화 설정
- **레벨 역할**: 레벨별 자동 역할 부여 설정
- **알림 설정**: 레벨업 알림 채널 및 메시지 커스터마이징

### 📊 통계 및 분석
- **실시간 리더보드**: 서버 내 사용자 순위
- **상세 통계**: 메시지, 음성 활동 분석
- **채널별 활동**: 채널별 사용량 통계
- **성장 추이**: 시간별 서버 활동 그래프

### 🎨 사용자 커스터마이징
- **프로필 카드**: 개인 프로필 카드 디자인 편집
- **색상 테마**: 개인별 색상 및 그라데이션 설정
- **배경 이미지**: 커스텀 배경 업로드 및 적용

### 🏆 성취 시스템
- **업적 관리**: 서버별 업적 생성 및 편집
- **보상 설정**: 업적 달성 시 포인트 보상
- **희귀도 시스템**: 업적 등급별 분류

### 🛒 마켓플레이스
- **배경 판매**: 커스텀 배경 이미지 판매
- **포인트 결제**: 게임 내 포인트로 아이템 구매
- **크리에이터 수익**: 배경 제작자 수익 분배

## 기술 스택

### Frontend
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 반응형 디자인
- **Shadcn/ui**: 현대적인 UI 컴포넌트
- **TanStack Query**: 효율적인 데이터 패칭
- **Wouter**: 경량 라우팅

### Backend
- **Node.js**: 서버 런타임
- **Express**: 웹 프레임워크
- **MongoDB**: NoSQL 데이터베이스
- **Passport.js**: Discord OAuth 인증
- **Canvas**: 프로필 카드 이미지 생성

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정 (`.env` 파일 생성):
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Session
SESSION_SECRET=your_session_secret
```

3. 개발 서버 실행:
```bash
npm run dev
```

## 환경 변수

### 필수 환경 변수
- `MONGODB_URI`: MongoDB 연결 문자열
- `DISCORD_CLIENT_ID`: Discord 애플리케이션 클라이언트 ID
- `DISCORD_CLIENT_SECRET`: Discord 애플리케이션 시크릿
- `SESSION_SECRET`: 세션 암호화 키

### 선택적 환경 변수
- `NODE_ENV`: 환경 설정 (development/production)
- `PORT`: 서버 포트 (기본값: 5000)

## 배포

### Railway 배포
1. Railway 계정 연결
2. GitHub 리포지토리 연결
3. 환경 변수 설정
4. 자동 배포 활성화

### Vercel 배포
1. Vercel 계정 연결
2. 프로젝트 임포트
3. 환경 변수 설정
4. 배포 실행

## API 엔드포인트

### 인증
- `GET /auth/discord` - Discord OAuth 로그인
- `GET /auth/discord/callback` - OAuth 콜백
- `POST /auth/logout` - 로그아웃

### 서버 관리
- `GET /api/servers` - 사용자 서버 목록
- `GET /api/servers/:id` - 서버 상세 정보
- `PATCH /api/servers/:id/settings` - 서버 설정 업데이트

### 통계
- `GET /api/servers/:id/stats` - 서버 통계
- `GET /api/servers/:id/leaderboard` - 리더보드
- `GET /api/servers/:id/activity` - 활동 로그

### 프로필
- `GET /api/profile-card/:userId/:serverId` - 프로필 카드 이미지 생성

## Discord Bot 연동

이 대시보드는 Discord 봇과 완전히 연동됩니다:
- MongoDB 데이터베이스 공유
- 실시간 통계 동기화
- 프로필 카드 API 연동
- 설정 변경 실시간 반영

## 라이선스

MIT License

## 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 연락해주세요.