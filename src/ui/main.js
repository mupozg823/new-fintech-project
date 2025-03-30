/**
 * Financial Insight Hub Pro - 메인 UI 모듈
 * 
 * 이 모듈은 애플리케이션의 사용자 인터페이스를 관리합니다.
 * 레이아웃, 테마, 네비게이션 등의 UI 관련 기능을 제공합니다.
 */

import Dashboard from './pages/Dashboard.js';
import FinancialInsightData from '../infrastructure/data_structure/data-structure.js';

/**
 * 메인 UI 클래스
 * 애플리케이션의 사용자 인터페이스 관리
 */
class MainUI {
  constructor(financialInsightHub) {
    console.log('MainUI 생성자 호출됨');
    
    this.hub = financialInsightHub;
    this.activePage = null;
    this.activePageInstance = null;
    this.components = {};
    
    // 라우트 정의
    this.routes = {
      dashboard: {
        id: 'dashboard',
        title: '대시보드',
        className: Dashboard
      },
      articles: {
        id: 'articles',
        title: '뉴스 기사',
        className: null // 아직 구현되지 않음
      },
      analyze: {
        id: 'analyze',
        title: '분석',
        className: null // 아직 구현되지 않음
      }
    };
    
    // 현재 라우트
    this.currentRoute = 'dashboard';
    
    // 메인 컨테이너 찾기
    this.container = document.getElementById('app');
    if (!this.container) {
      console.error('앱 컨테이너를 찾을 수 없습니다');
      throw new Error('앱 컨테이너를 찾을 수 없습니다');
    }
    
    console.log('MainUI 생성자 완료');
  }
  
  /**
   * UI 초기화
   * @param {Object} config - 설정 객체
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    console.log('UI 초기화 중...');
    
    try {
      // TailwindCSS 로드
      this.loadTailwindCSS();
      
      // 앱 컨테이너 확인
      const appContainer = document.getElementById('app');
      if (!appContainer) {
        throw new Error('앱 컨테이너 요소를 찾을 수 없습니다');
      }
      
      // 레이아웃 생성
      this.createLayout(appContainer);
      
      // 테마 설정
      this.setupTheme();
      
      // 네비게이션 이벤트 핸들러 등록
      this.setupNavigation();
      
      // 초기 페이지 로드
      await this.navigateTo(this.currentRoute);
      
      console.log('UI 초기화 완료');
      return true;
    } catch (error) {
      console.error('UI 초기화 실패:', error);
      return false;
    }
  }
  
  /**
   * TailwindCSS 로드
   */
  loadTailwindCSS() {
    // 이미 로드되었는지 확인
    if (document.getElementById('tailwind-css')) {
      return;
    }
    
    // 스타일시트 링크 요소 생성
    const link = document.createElement('link');
    link.id = 'tailwind-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    
    // head에 추가
    document.head.appendChild(link);
    
    // 추가 스타일 적용
    const style = document.createElement('style');
    style.textContent = `
      /* 텍스트 라인 제한 (line-clamp) */
      .line-clamp-1, .line-clamp-2, .line-clamp-3 {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .line-clamp-1 { -webkit-line-clamp: 1; }
      .line-clamp-2 { -webkit-line-clamp: 2; }
      .line-clamp-3 { -webkit-line-clamp: 3; }
      
      /* 부드러운 전환 */
      .transition-all {
        transition: all 0.3s ease;
      }
      
      /* 다크 모드 지원 */
      .dark body {
        background-color: #1a202c;
        color: #e2e8f0;
      }
      
      /* 로딩 스피너 */
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 레이아웃 생성
   * @param {HTMLElement} container - 앱 컨테이너
   */
  createLayout(container) {
    container.innerHTML = `
      <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
        <!-- 사이드바 -->
        <div id="sidebar" class="w-64 bg-white dark:bg-gray-800 shadow-md z-20 transition-all">
          <div class="flex flex-col h-full">
            <!-- 로고 및 앱 제목 -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 class="text-xl font-bold text-gray-800 dark:text-white">
                <span class="text-blue-500">Financial</span> Insight Hub
              </h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">Pro Edition</p>
            </div>
            
            <!-- 네비게이션 메뉴 -->
            <nav class="flex-1 px-2 py-4 overflow-y-auto">
              <ul>
                <li class="mb-2">
                  <a href="#dashboard" class="nav-link flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" data-route="dashboard">
                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    대시보드
                  </a>
                </li>
                <li class="mb-2">
                  <a href="#articles" class="nav-link flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" data-route="articles">
                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    기사 목록
                  </a>
                </li>
                <li class="mb-2">
                  <a href="#analyze" class="nav-link flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" data-route="analyze">
                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    분석 도구
                  </a>
                </li>
              </ul>
            </nav>
            
            <!-- 테마 토글 및 푸터 -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-700">
              <button id="theme-toggle" class="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 w-full">
                <svg id="theme-toggle-dark-icon" class="w-5 h-5 mr-3 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
                <svg id="theme-toggle-light-icon" class="w-5 h-5 mr-3 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <span id="theme-toggle-text">테마 변경</span>
              </button>
              
              <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Financial Insight Hub Pro v1.0.0
              </div>
            </div>
          </div>
        </div>
        
        <!-- 메인 콘텐츠 -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- 상단 헤더 -->
          <header class="bg-white dark:bg-gray-800 shadow-sm z-10">
            <div class="flex items-center justify-between p-4">
              <!-- 모바일 메뉴 토글 버튼 -->
              <button id="sidebar-toggle" class="p-1 mr-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
              
              <!-- 페이지 제목 -->
              <h2 id="page-title" class="text-xl font-bold text-gray-800 dark:text-white">대시보드</h2>
              
              <!-- 새로고침 버튼 -->
              <button id="refresh-btn" class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
            </div>
          </header>
          
          <!-- 콘텐츠 영역 -->
          <main id="content" class="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
            <!-- 페이지 콘텐츠는 동적으로 로드됨 -->
            <div id="page-container" class="h-full"></div>
          </main>
        </div>
      </div>
    `;
  }
  
  /**
   * 테마 설정
   */
  setupTheme() {
    // 테마 토글 버튼 및 아이콘
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    const themeText = document.getElementById('theme-toggle-text');
    
    // 사용자 테마 선호도 확인
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 저장된 테마 설정 가져오기
    const savedTheme = localStorage.getItem('theme');
    
    // 초기 테마 설정
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
      document.documentElement.classList.add('dark');
      darkIcon.classList.add('hidden');
      lightIcon.classList.remove('hidden');
      themeText.textContent = '라이트 모드로 변경';
    } else {
      document.documentElement.classList.remove('dark');
      lightIcon.classList.add('hidden');
      darkIcon.classList.remove('hidden');
      themeText.textContent = '다크 모드로 변경';
    }
    
    // 테마 토글 이벤트
    themeToggleBtn.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        // 다크 모드에서 라이트 모드로 변경
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        lightIcon.classList.add('hidden');
        darkIcon.classList.remove('hidden');
        themeText.textContent = '다크 모드로 변경';
      } else {
        // 라이트 모드에서 다크 모드로 변경
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
        themeText.textContent = '라이트 모드로 변경';
      }
    });
  }
  
  /**
   * 네비게이션 설정
   */
  setupNavigation() {
    const navLinks = this.container.querySelectorAll('.app-nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = link.getAttribute('href').substring(1);
        this.navigateTo(hash);
      });
    });
  }
  
  /**
   * 특정 페이지로 이동
   * @param {string} routeId - 라우트 ID (ex: 'dashboard', 'articles')
   * @param {Object} params - 라우트 파라미터
   */
  navigateTo(routeId, params = {}) {
    console.log(`navigateTo 호출됨: ${routeId}`);
    
    // 유효한 라우트인지 확인
    if (!this.routes[routeId]) {
      console.error(`유효하지 않은 라우트: ${routeId}`);
      return false;
    }
    
    // 현재 활성화된 페이지가 있으면 리소스 정리
    if (this.activePageInstance && typeof this.activePageInstance.cleanup === 'function') {
      try {
        this.activePageInstance.cleanup();
      } catch (error) {
        console.error('페이지 정리 중 오류:', error);
      }
    }
    
    // 새 페이지로 컨테이너 준비
    this.prepareContainer(routeId);
    
    // 새 페이지 인스턴스 생성
    const route = this.routes[routeId];
    if (!route.className) {
      console.warn(`${route.title} 페이지는 아직 구현되지 않았습니다`);
      this.showNotImplemented(route.title);
      return false;
    }
    
    try {
      // 컨테이너 ID 생성
      const containerId = `${routeId}-container`;
      
      // 새 페이지 인스턴스 생성
      this.activePageInstance = new route.className(containerId, this.hub);
      this.currentRoute = routeId;
      
      // URL 해시 업데이트
      window.location.hash = `#${routeId}`;
      
      console.log(`${route.title} 페이지로 이동 완료`);
      return true;
    } catch (error) {
      console.error(`${route.title} 페이지 초기화 중 오류:`, error);
      this.showError(`${route.title} 페이지를 로드할 수 없습니다: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 페이지 컨테이너 준비
   * @param {string} routeId - 라우트 ID
   */
  prepareContainer(routeId) {
    // 컨테이너 내용 초기화
    this.container.innerHTML = '';
    
    // 기본 레이아웃 구성
    this.container.innerHTML = `
      <div class="app-layout">
        <header class="app-header">
          <h1 class="app-title">금융 인사이트 허브 Pro</h1>
          <nav class="app-nav">
            <ul>
              <li><a href="#dashboard" class="${routeId === 'dashboard' ? 'active' : ''}">대시보드</a></li>
              <li><a href="#articles" class="${routeId === 'articles' ? 'active' : ''}">뉴스 기사</a></li>
              <li><a href="#analyze" class="${routeId === 'analyze' ? 'active' : ''}">분석</a></li>
            </ul>
          </nav>
        </header>
        <main class="app-content">
          <div id="${routeId}-container" class="page-container"></div>
        </main>
        <footer class="app-footer">
          <p>© 2023 Financial Insight Hub Pro</p>
        </footer>
      </div>
    `;
    
    // 네비게이션 이벤트 설정
    this.setupNavigation();
  }
  
  /**
   * 구현되지 않은 페이지 표시
   * @param {string} pageTitle - 페이지 제목
   */
  showNotImplemented(pageTitle) {
    const containerId = `${this.currentRoute}-container`;
    const container = document.getElementById(containerId);
    
    if (container) {
      container.innerHTML = `
        <div class="not-implemented">
          <h2>${pageTitle} 페이지</h2>
          <div class="message">
            <p>이 페이지는 아직 개발 중입니다.</p>
            <button id="back-to-dashboard" class="btn">대시보드로 돌아가기</button>
          </div>
        </div>
      `;
      
      const backButton = document.getElementById('back-to-dashboard');
      if (backButton) {
        backButton.addEventListener('click', () => {
          this.navigateTo('dashboard');
        });
      }
    }
  }
  
  /**
   * 오류 메시지 표시
   * @param {string} message - 오류 메시지
   */
  showError(message) {
    const containerId = `${this.currentRoute}-container`;
    const container = document.getElementById(containerId);
    
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h2>오류 발생</h2>
          <div class="message">
            <p>${message}</p>
            <button id="try-again" class="btn">다시 시도</button>
          </div>
        </div>
      `;
      
      const tryAgainButton = document.getElementById('try-again');
      if (tryAgainButton) {
        tryAgainButton.addEventListener('click', () => {
          this.navigateTo(this.currentRoute);
        });
      }
    }
  }
  
  /**
   * 페이지 제목 가져오기
   * @param {string} route - 라우트
   * @returns {string} 페이지 제목
   */
  getPageTitle(route) {
    switch (route) {
      case 'dashboard':
        return '대시보드';
      case 'articles':
        return '기사 목록';
      case 'analyze':
        return '분석 도구';
      default:
        return '대시보드';
    }
  }
  
  /**
   * 페이지 컴포넌트 로드
   * @param {string} route - 라우트
   * @param {string} containerId - 컨테이너 ID
   */
  async loadPageComponent(route, containerId) {
    console.log(`페이지 컴포넌트 로드 시작: ${route}`);
    
    // 컨테이너 확인
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다`);
      throw new Error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다`);
    }
    
    // 이전 컴포넌트 정리
    if (this.activePage) {
      console.log('이전 활성 페이지 정리 중...');
      if (typeof this.activePage.cleanup === 'function') {
        try {
          this.activePage.cleanup();
          console.log('이전 활성 페이지 정리 완료');
        } catch (error) {
          console.error('이전 페이지 정리 중 오류:', error);
        }
      }
      this.activePage = null;
    }
    
    // 라우트에 따라 적절한 컴포넌트 로드
    console.log(`라우트 처리 중: ${route}`);
    try {
      switch (route) {
        case 'dashboard':
          console.log('대시보드 페이지 로드 시작');
          // 대시보드가 이미 생성되었는지 확인
          if (!this.components.dashboard) {
            console.log('새 대시보드 인스턴스 생성');
            this.components.dashboard = new Dashboard(containerId, this.hub);
          } else {
            console.log('대시보드 다시 렌더링');
            // 컨테이너 비우기
            container.innerHTML = '';
            // 대시보드 다시 렌더링
            this.components.dashboard = new Dashboard(containerId, this.hub);
          }
          
          this.activePage = this.components.dashboard;
          console.log('대시보드 페이지 로드 완료');
          break;
        
        case 'articles':
          console.log('기사 목록 페이지 로드');
          // 기사 목록 페이지 (ArticlesPage 컴포넌트 필요)
          container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
              <h2 class="text-xl font-bold mb-2">기사 목록</h2>
              <p class="text-gray-600 dark:text-gray-300">
                이 페이지는 아직 구현되지 않았습니다.
              </p>
            </div>
          `;
          break;
        
        case 'analyze':
          console.log('분석 도구 페이지 로드');
          // 분석 도구 페이지 (AnalyzePage 컴포넌트 필요)
          container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
              <h2 class="text-xl font-bold mb-2">분석 도구</h2>
              <p class="text-gray-600 dark:text-gray-300">
                이 페이지는 아직 구현되지 않았습니다.
              </p>
            </div>
          `;
          break;
        
        default:
          console.error(`알 수 없는 라우트: ${route}`);
          throw new Error(`알 수 없는 라우트: ${route}`);
      }
    } catch (error) {
      console.error(`페이지 컴포넌트 로드 오류: ${error.message}`);
      throw error;
    }
    
    console.log(`페이지 컴포넌트 로드 완료: ${route}`);
  }
  
  /**
   * 현재 페이지 새로고침
   */
  refreshCurrentPage() {
    // 현재 활성 페이지가 있고 새로고침 메소드가 있는 경우
    if (this.activePage && typeof this.activePage.loadDashboardData === 'function') {
      this.activePage.loadDashboardData();
    } else {
      // 활성 페이지가 없거나 새로고침 메소드가 없는 경우 페이지 전체 로드
      this.navigateTo(this.currentRoute);
    }
  }
  
  /**
   * 리소스 정리
   */
  cleanup() {
    // 활성 페이지 정리
    if (this.activePage && typeof this.activePage.cleanup === 'function') {
      this.activePage.cleanup();
    }
    
    // 컴포넌트 정리
    for (const key in this.components) {
      const component = this.components[key];
      if (component && typeof component.cleanup === 'function') {
        component.cleanup();
      }
    }
    
    // 이벤트 리스너 제거 등 추가 정리 작업
    console.log('UI 리소스 정리 완료');
  }
}

export default MainUI; 