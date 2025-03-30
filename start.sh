#!/bin/bash

echo "Financial Insight Hub Pro 시작 중..."
echo

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "오류: Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 https://nodejs.org/에서 다운로드 및 설치한 후 다시 시도하세요."
    echo
    read -p "계속하려면 아무 키나 누르세요..."
    exit 1
fi

# 의존성 확인 및 설치
if [ ! -d "node_modules" ]; then
    echo "의존성 설치 중..."
    npm install
    if [ $? -ne 0 ]; then
        echo "오류: 의존성 설치에 실패했습니다."
        read -p "계속하려면 아무 키나 누르세요..."
        exit 1
    fi
fi

# 실행 권한 부여
chmod +x server.js

# 애플리케이션 실행
echo "애플리케이션 시작 중..."
npm start

read -p "계속하려면 아무 키나 누르세요..." 