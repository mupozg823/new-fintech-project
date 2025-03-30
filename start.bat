@echo off
echo Financial Insight Hub Pro 시작 중...
echo.

:: Node.js 설치 확인
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 오류: Node.js가 설치되어 있지 않습니다.
    echo Node.js를 https://nodejs.org/에서 다운로드 및 설치한 후 다시 시도하세요.
    echo.
    pause
    exit /b 1
)

:: 의존성 확인 및 설치
if not exist node_modules (
    echo 의존성 설치 중...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo 오류: 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

:: 애플리케이션 실행
echo 애플리케이션 시작 중...
call npm start

pause 