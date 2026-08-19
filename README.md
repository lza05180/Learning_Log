# 채윤이의 학습 기록표 — Vercel 프로젝트

채윤이의 수업 일정을 달력으로 보여주고, 선생님이 비밀번호로 로그인하여 수업 기록을 추가·수정·삭제할 수 있는 웹사이트입니다. 이 폴더는 일반적인 **Next.js + PostgreSQL** 프로젝트이므로 Vercel에서 실행할 수 있습니다.

## 들어 있는 기능

- 학부모님은 별도의 로그인 없이 공개 링크로 달력과 수업 기록 열람
- 수업한 날짜를 형광 노란색으로 표시
- 날짜를 누르면 수업 시간, 진도, 과제, 과제 수행도, 선생님 메모 표시
- 과제 수행도: 매우 좋음 / 좋음 / 보통 / 미흡 / 매우 미흡
- `/manage`에서 선생님 비밀번호 확인
- 로그인 후 수업 기록 추가, 수정, 삭제
- 비밀번호는 소스 코드가 아닌 Vercel 환경변수로 관리
- 수업 기록은 Neon PostgreSQL에 영구 저장

## 사용 기술

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4 및 사이트 전용 CSS
- Neon Serverless PostgreSQL
- Drizzle ORM
- Vercel

별도의 웹폰트 파일은 사용하지 않습니다. 기기에 설치된 시스템 글꼴을 사용하므로 폰트 라이선스나 외부 폰트 서버가 필요 없습니다. 공유 미리보기 이미지는 `public/og.png`에 들어 있습니다.

## 프로젝트 구조

```text
chaeyoon-study-log-vercel/
├─ app/
│  ├─ api/
│  │  ├─ editor-session/route.ts   # 선생님 로그인/로그아웃
│  │  └─ lessons/                  # 기록 조회·추가·수정·삭제 API
│  ├─ manage/                      # 선생님 기록 관리 화면
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx                     # 학부모님용 달력
├─ db/
│  ├─ index.ts                     # Neon 연결 및 최초 테이블 준비
│  └─ schema.ts                    # 수업 기록 구조
├─ drizzle/                        # 데이터베이스 변경 이력
├─ lib/                            # 인증과 입력값 검사
├─ public/og.png                   # 링크 공유 이미지
├─ scripts/
│  ├─ generate-session-secret.mjs
│  └─ migrate-existing-data.mjs
├─ .env.example
├─ package.json
└─ README.md
```

## 1. 내 컴퓨터에서 실행하기

### 준비물

- Node.js 22.13 이상. 현재 설치하신 Node.js 24도 사용할 수 있습니다.
- Visual Studio Code
- Neon PostgreSQL 연결 주소

PowerShell의 실행 정책 때문에 `npm` 명령이 막히는 경우가 있으므로 아래에서는 이전에 성공한 `npm.cmd`, `npx.cmd` 형식을 사용합니다.

### 처음 한 번만 하는 작업

VS Code에서 이 폴더를 연 뒤, 상단 메뉴의 **터미널 → 새 터미널**을 누르고 실행합니다.

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run secret:generate
```

마지막 명령이 출력한 긴 영문·숫자 문자열을 복사합니다. VS Code에서 `.env.local`을 열어 다음 세 값을 수정합니다.

```dotenv
DATABASE_URL=Vercel에서_받은_Neon_연결_주소
TEACHER_PASSWORD=200612
TEACHER_SESSION_SECRET=방금_생성한_긴_문자열
```

그다음 실행합니다.

```powershell
npm.cmd run dev
```

터미널에 표시되는 `http://localhost:3000`을 `Ctrl` 키를 누른 채 클릭하거나, 브라우저 주소창에 직접 입력합니다.

- 학부모님 화면: `http://localhost:3000`
- 선생님 화면: `http://localhost:3000/manage`

서버를 종료할 때는 터미널에서 `Ctrl + C`를 누릅니다. 그 이후부터는 코드를 수정할 때마다 보통 다음 한 줄만 실행하면 됩니다.

```powershell
npm.cmd run dev
```

## 2. Vercel에 배포하기

### 방법 A — GitHub에서 가져오기

1. 이 폴더의 파일을 본인의 GitHub 저장소에 올립니다. `.env.local`은 올리면 안 됩니다. `.gitignore`가 이를 막도록 구성되어 있습니다.
2. Vercel에서 **Add New → Project**를 누르고 해당 GitHub 저장소를 선택합니다.
3. Framework Preset이 **Next.js**인지 확인합니다. Build Command는 `npm run build`, Output 설정은 기본값을 그대로 둡니다.
4. 프로젝트를 만든 뒤 Vercel의 **Storage** 또는 **Marketplace**에서 **Neon Postgres**를 연결합니다. 연결하면 `DATABASE_URL`이 프로젝트 환경변수로 추가됩니다.
5. Vercel 프로젝트의 **Settings → Environment Variables**에서 아래 값을 추가합니다.

   - `TEACHER_PASSWORD`: 원하는 선생님 비밀번호. 기존 값을 유지하려면 `200612`
   - `TEACHER_SESSION_SECRET`: `npm.cmd run secret:generate`로 만든 긴 문자열

   두 값은 Production, Preview, Development에 모두 적용하는 것이 편리합니다.
6. **Deployments → Redeploy**를 눌러 새 환경변수가 적용된 상태로 다시 배포합니다.
7. 배포 주소 뒤에 `/manage`를 붙여 비밀번호 로그인과 기록 추가를 시험합니다.

처음 API가 실행될 때 `lessons` 테이블과 날짜 중복 방지 인덱스를 자동으로 준비하므로, 별도의 SQL 입력 없이도 작동합니다.

### 방법 B — VS Code 터미널에서 배포하기

```powershell
npm.cmd install
npx.cmd vercel link
npx.cmd vercel env pull .env.local
npm.cmd run build
npx.cmd vercel
npx.cmd vercel --prod
```

`vercel link`에서 기존 프로젝트를 선택하거나 새 프로젝트를 만들 수 있습니다. Neon 연결과 `TEACHER_PASSWORD`, `TEACHER_SESSION_SECRET` 입력은 Vercel 대시보드에서 먼저 완료해야 합니다.

## 3. 환경변수 설명

| 이름 | 필요한 위치 | 용도 |
|---|---|---|
| `DATABASE_URL` | 로컬, Vercel | Neon PostgreSQL 연결 주소 |
| `TEACHER_PASSWORD` | 로컬, Vercel | `/manage` 로그인 비밀번호 |
| `TEACHER_SESSION_SECRET` | 로컬, Vercel | 12시간짜리 로그인 쿠키의 위조 방지 서명 |
| `LEGACY_SITE_URL` | 데이터 이전을 실행할 내 컴퓨터 | 기존 ChatGPT Sites 주소 |

실제 비밀번호가 든 `.env.local`은 다른 사람에게 보내거나 GitHub에 올리지 마세요. `200612`처럼 짧은 숫자 비밀번호는 추측하기 쉬우므로 실제 공개 운영에서는 더 긴 비밀번호를 권장합니다.

## 4. 기존 기록 옮기기

자세한 설명은 [DATA_MIGRATION.md](DATA_MIGRATION.md)를 참고하세요. 요약하면 새 Neon 데이터베이스가 연결된 `.env.local`을 준비한 뒤 아래 한 줄을 실행합니다.

```powershell
npm.cmd run data:migrate
```

이 명령은 기존 사이트의 `/api/lessons` 기록을 내려받아 `data/`에 JSON 백업을 만든 후, 같은 날짜를 기준으로 새 데이터베이스에 추가하거나 갱신합니다. 같은 명령을 다시 실행해도 같은 날짜의 기록이 중복 생성되지 않습니다.

## 5. 자주 사용하는 명령

| 명령 | 의미 |
|---|---|
| `npm.cmd install` | 필요한 패키지 설치. 처음 또는 package.json 변경 후 실행 |
| `npm.cmd run dev` | 개발용 서버 실행 |
| `npm.cmd run build` | Vercel과 같은 방식으로 배포용 빌드 검사 |
| `npm.cmd run start` | 빌드된 결과를 내 컴퓨터에서 실행 |
| `npm.cmd run lint` | 코드 문법과 규칙 검사 |
| `npm.cmd run secret:generate` | 안전한 세션 비밀키 생성 |
| `npm.cmd run data:migrate` | 기존 ChatGPT Sites 기록 이전 |
| `npm.cmd run db:generate` | 데이터베이스 구조 변경 SQL 생성 |
| `npm.cmd run db:migrate` | 생성한 구조 변경을 데이터베이스에 적용 |

## 6. 사이트 수정 위치

- 제목, 달력, 상세 보기: `app/page.tsx`
- 색상, 크기, 배치: `app/globals.css`
- 선생님 관리 화면: `app/manage/ManageLessons.tsx`
- 로그인 화면: `app/manage/TeacherLogin.tsx`
- 입력 가능 항목과 검사: `lib/lesson.ts`
- 데이터베이스 항목: `db/schema.ts`

VS Code에서 수정한 내용은 로컬 개발 서버에는 바로 보이지만, 실제 Vercel 사이트에는 자동 또는 수동 재배포가 완료되어야 반영됩니다.

## 보안 구조

브라우저는 비밀번호를 보낸 뒤 서버가 발급한 `HttpOnly`, `SameSite=Strict`, `Secure` 쿠키를 사용합니다. 원래 비밀번호는 쿠키나 브라우저 저장소에 보관하지 않습니다. 기록 추가·수정·삭제 API는 유효한 선생님 로그인 쿠키가 있을 때만 실행됩니다. 학부모님용 기록 조회 API만 공개되어 있습니다.
