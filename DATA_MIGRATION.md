# 기존 ChatGPT Sites 데이터 이전 안내

이 작업은 기존 사이트의 기록을 삭제하지 않습니다. 기존 기록을 JSON 파일로 백업한 뒤 새 Neon PostgreSQL에 복사합니다.

## 이전 전에 확인할 것

1. 기존 사이트가 열리는지 확인합니다.
2. 기존 사이트에서 달력의 수업 기록 개수를 대략 확인합니다.
3. Vercel 프로젝트에 Neon이 연결되어 있는지 확인합니다.
4. 새 사이트에는 중요한 기록을 아직 직접 입력하지 않는 편이 확인하기 쉽습니다.

## 1. Vercel 환경변수 내려받기

프로젝트 폴더의 VS Code 터미널에서 실행합니다.

```powershell
npx.cmd vercel link
npx.cmd vercel env pull .env.local
```

`.env.local`을 열어 `DATABASE_URL`이 있는지 확인합니다. 없다면 Vercel Marketplace에서 Neon을 연결한 뒤 다시 `env pull`을 실행합니다.

## 2. 기존 사이트 주소 입력

`.env.local` 마지막에 다음 줄을 추가합니다.

```dotenv
LEGACY_SITE_URL=https://chaeyoon-study-log.jeongso121113.chatgpt.site
```

주소 끝의 `/` 유무는 상관없습니다.

## 3. 기록 이전 실행

```powershell
npm.cmd install
npm.cmd run data:migrate
```

성공하면 터미널에 다음 내용이 표시됩니다.

- 기존 기록을 불러온 사이트 주소
- `data/legacy-lessons-backup-날짜.json` 백업 파일 위치
- 이전한 수업 기록 개수

같은 수업 날짜가 새 데이터베이스에 이미 있으면 기존 행을 중복으로 만들지 않고 가져온 내용으로 갱신합니다. 따라서 네트워크 문제 등으로 중간에 실패했다면 같은 명령을 다시 실행해도 됩니다.

## 4. 결과 확인

1. 새 Vercel 사이트의 달력에서 수업 날짜를 확인합니다.
2. 날짜를 눌러 시간, 진도, 과제 수행도, 메모를 비교합니다.
3. `/manage`에서 로그인하여 기록 목록과 개수를 확인합니다.
4. 모두 맞으면 `data/`의 JSON 백업을 안전한 개인 폴더에 보관할 수 있습니다. 이 폴더의 JSON 파일은 `.gitignore`에 의해 GitHub에 올라가지 않습니다.

## 오류별 확인 방법

### `DATABASE_URL이 없습니다`

Vercel에 Neon을 연결하고 `npx.cmd vercel env pull .env.local`을 다시 실행합니다.

### `기존 기록 조회 실패: HTTP ...`

브라우저에서 기존 사이트가 열리는지 확인하고, `.env.local`의 `LEGACY_SITE_URL`이 정확한지 확인합니다.

### 기록 개수가 다름

JSON 백업 파일을 열어 `lessons` 배열의 기록 개수를 확인합니다. 이전 명령을 다시 실행한 뒤 새 사이트를 새로고침합니다.

### 기존 사이트 API가 더 이상 열리지 않음

자동 이전은 기존 `/api/lessons`에 접속할 수 있을 때만 가능합니다. 기존 사이트가 폐쇄되기 전에 먼저 이전하는 것이 안전합니다. 이미 받아 둔 JSON만 있는 경우에는 `scripts/migrate-existing-data.mjs`를 JSON 입력 방식으로 바꾸어 복구할 수 있으므로 백업 파일을 보관하세요.
