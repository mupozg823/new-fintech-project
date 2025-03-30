/**
 * Financial Insight Hub Pro - 로컬 개발 서버
 * 
 * 이 스크립트는 로컬 개발 환경에서 애플리케이션을 실행하기 위한
 * 간단한 정적 파일 서버를 구현합니다.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME 타입 지원
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon'
};

// 환경 변수에서 포트를 가져오거나 기본값으로 3001 사용
const port = process.env.PORT || 3001;

/**
 * HTTP 서버 생성
 */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // favicon.ico 요청 처리
  if (req.url === '/favicon.ico') {
    const favicon = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(favicon)) {
      res.setHeader('Content-Type', 'image/x-icon');
      fs.createReadStream(favicon).pipe(res);
    } else {
      res.statusCode = 404;
      res.end();
    }
    return;
  }
  
  // URL 파싱
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;
  
  // 기본 인덱스 파일
  if (pathname === './') {
    pathname = './index.html';
  }
  
  // 파일 경로 정규화
  const filePath = path.normalize(pathname);
  
  // 파일 확장자 가져오기
  const extname = path.extname(filePath);
  
  // 기본 Content-Type 설정
  let contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // 파일 읽기 (비동기)
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 파일을 찾을 수 없음
      if (err.code === 'ENOENT') {
        // SPA 지원: 모든 경로를 index.html로 리다이렉트
        if (req.url.startsWith('/api/')) {
          res.writeHead(404);
          res.end('404 Not Found');
        } else {
          fs.readFile('./index.html', (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading index.html');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        }
      } else {
        // 서버 오류
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    // 성공: 파일 제공
    res.writeHead(200, { 
      'Content-Type': contentType,
      ...(extname === '.js' || extname === '.mjs' ? {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      } : {})
    });
    res.end(data);
  });
});

/**
 * 서버 시작
 */
server.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}/`);
  console.log('종료하려면 Ctrl+C를 누르세요');
}); 