# 서버 클린 설치 및 보안 가이드

서버에 악성코드(채굴기)가 의심되는 경우, 기존의 오염된 파일들을 모두 삭제하고 깨끗한 상태에서 다시 시작해야 합니다. 아래 절차를 순서대로 진행해 주세요.

## 1. 기존 프로세스 완벽 종료
실행 중인 모든 PM2 프로세스와 Node.js 프로세스를 종료합니다.
```bash
pm2 kill
killall node
```

## 2. 오염된 의존성 삭제 (가장 중요)
프로젝트 폴더 내의 `node_modules` 폴더와 `package-lock.json` 파일이 감염되었을 수 있으므로 완전히 삭제합니다.
```bash
# 프로젝트 루트 경로에서 실행
rm -rf node_modules
rm package-lock.json
```

## 3. npm 캐시 정리
npm 캐시에 악성 코드가 남아있을 수 있으므로 정리합니다.
```bash
npm cache clean --force
```

## 4. 의존성 재설치
공식 npm 저장소에서 깨끗한 패키지들을 다시 받아옵니다.
```bash
npm install
```

## 5. 보안 감사 (Audit) 확인
설치 직후 알려진 취약점을 확인합니다.
```bash
npm audit
```

## 6. 안전한 PM2 시작
새로 생성한 `ecosystem.config.js` 파일을 사용하여 서버를 시작합니다. 이 설정은 `npm start` 대신 검증된 Next.js 실행 파일을 직접 사용합니다.
```bash
pm2 start ecosystem.config.js
pm2 save
```

## 7. 모니터링
서버 실행 후 CPU 사용량을 확인하여 비정상적으로 높지 않은지 확인합니다.
```bash
pm2 monit
# 또는
top
```
