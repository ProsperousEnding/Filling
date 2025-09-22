@echo off
echo 启动开发环境...

REM 启动Rust后端
start cmd /k "cd rust-backend && cargo run"

REM 等待后端启动
timeout /t 5

REM 启动前端
start cmd /k "npm run dev"

echo 开发环境已启动!
echo 后端API: http://localhost:8080/api
echo 前端应用: http://localhost:5173
