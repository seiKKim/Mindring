# 운영 환경 설정 가이드

## 세션 쿠키 도메인 설정 (COOKIE_DOMAIN)

운영 서버에서 서브도메인 간 세션을 유지하려면 `COOKIE_DOMAIN` 환경 변수를 설정해야 합니다.

### 설정 방법

**.env.production** 또는 운영 서버 환경 변수에 다음을 추가:

```env
# 서브도메인을 포함하여 쿠키를 공유하려면 점(.)으로 시작
COOKIE_DOMAIN=.mindring.com
```

### 사용 예시

1. **서브도메인 포함 (권장)**:
   ```env
   COOKIE_DOMAIN=.example.com
   ```
   - `www.example.com`, `app.example.com`, `api.example.com` 등 모든 서브도메인에서 쿠키 공유

2. **단일 도메인만**:
   ```env
   COOKIE_DOMAIN=example.com
   ```
   - `example.com`에서만 쿠키 사용

3. **로컬 개발 환경**:
   - 설정하지 않음 (기본 동작 사용)

### 주의사항

⚠️ **보안**: `.com`이나 `.co.kr` 같은 최상위 도메인을 사용하지 마세요. 반드시 소유한 도메인을 지정하세요.

⚠️ **HTTPS**: 운영 환경에서는 HTTPS를 사용해야 하며, `Secure` 속성이 자동으로 활성화됩니다.

### 적용되는 쿠키

- `dn.sid`: 세션 쿠키
- `dn.oauth.tmp`: OAuth 임시 쿠키

### 문제 해결

세션이 끊기는 경우:
1. 브라우저 개발자 도구 → Application/저장소 → Cookies 확인
2. `dn.sid` 쿠키의 `Domain` 값이 올바른지 확인
3. `COOKIE_DOMAIN` 환경 변수 설정 확인

## 기타 필수 환경 변수

```env
# 세션 보안 키 (필수)
SESSION_SECRET=your-strong-random-secret

# 데이터베이스
DATABASE_URL=your-database-url

# OAuth (사용하는 제공자만 설정)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_REDIRECT_URI=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_REDIRECT_URI=
```
