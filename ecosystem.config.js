module.exports = {
  apps: [
    {
      name: "mindring-app",
      // 직접 Next.js 바이너리를 실행하여 불필요한 npm 프로세스 방지
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max", // CPU 코어 수만큼 인스턴스 실행
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // 로그 관리
      output: "./logs/access.log",
      error: "./logs/error.log",
      // 메모리 제한 (선택사항, 필요시 조정)
      max_memory_restart: "1G",
    },
  ],
};
