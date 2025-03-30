/**
 * Financial Insight Hub Pro - 대시보드 페이지
 * 
 * 메인 대시보드는 애플리케이션의 모든 기능과 정보를 한눈에 볼 수 있는 중앙 페이지입니다.
 */

import SectorPieChart from '../visualization/SectorPieChart.js';
import SentimentGauge from '../visualization/SentimentGauge.js';
import ArticleTable from '../components/ArticleTable.js';
import InsightsList from '../components/InsightsList.js';
import KeywordCloud from '../visualization/KeywordCloud.js';

class Dashboard {
  constructor(containerId, financialInsightHub) {
    console.log(`Dashboard 생성자 호출: containerId=${containerId}`);
    console.log('Hub 객체 상태:', financialInsightHub ? 'OK' : 'Missing');
    
    this.container = document.getElementById(containerId);
    this.hub = financialInsightHub;
    this.charts = {};
    this.components = {};
    
    if (!this.container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다.`);
      return;
    }
    
    console.log('UI 초기화 시작');
    this.initUI();
    
    console.log('이벤트 핸들러 등록 시작');
    this.registerEventHandlers();
    
    console.log('대시보드 데이터 로드 시작');
    // 대시보드 데이터 로드
    this.loadDashboardData();
  }
  
  /**
   * UI 초기화
   */
  initUI() {
    console.log('대시보드 UI HTML 생성');
    this.container.innerHTML = `
      <div class="dashboard p-4">
        <header class="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-lg shadow-lg">
          <h1 class="text-3xl font-bold mb-2">금융 인사이트 허브</h1>
          <p class="text-blue-100">실시간 금융 데이터 분석 및 시장 인사이트</p>
        </header>
        
        <div class="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2" id="status-indicator"></div>
            <div class="text-sm" id="connection-status">연결됨</div>
            <div class="mx-3 text-gray-300">|</div>
            <div class="text-sm text-gray-600" id="last-update-time">최근 업데이트: 진행 중...</div>
          </div>
          
          <button id="refresh-dashboard" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>
        
        <!-- 데이터 로딩 인디케이터 -->
        <div id="loading-indicator" class="hidden mb-6 bg-blue-50 p-4 rounded-lg shadow text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-2"></div>
          <span class="text-blue-700 font-medium">데이터 로딩 중...</span>
        </div>
        
        <!-- 데이터 없음 알림 -->
        <div id="no-data-alert" class="hidden mb-6 bg-yellow-50 p-4 rounded-lg shadow border-l-4 border-yellow-400">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                분석할 데이터가 없습니다. 새로고침을 클릭하거나 아래 버튼을 눌러 샘플 데이터를 로드하세요.
              </p>
              <div class="mt-4">
                <button id="load-sample-data" class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:border-yellow-300 focus:shadow-outline-yellow active:bg-yellow-200 transition ease-in-out duration-150">
                  샘플 데이터 로드
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 인사이트 요약 카드 섹션 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 class="text-sm font-medium text-gray-700">분석된 기사</h3>
            </div>
            <div class="flex items-end">
              <div id="articles-count" class="text-3xl font-bold text-blue-600">0</div>
              <div class="text-sm text-gray-500 ml-2">건</div>
            </div>
            <div class="text-xs text-gray-400 mt-1">최근 24시간</div>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium text-gray-700">금융 관련성</h3>
            </div>
            <div class="flex items-end">
              <div id="relevance-score" class="text-3xl font-bold text-green-600">0</div>
              <div class="text-sm text-gray-500 ml-2">%</div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div id="relevance-bar" class="bg-green-500 h-2 rounded-full" style="width: 0%"></div>
            </div>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 class="text-sm font-medium text-gray-700">평균 감성 지수</h3>
            </div>
            <div class="flex items-end">
              <div id="sentiment-score" class="text-3xl font-bold text-purple-600">0</div>
              <div id="sentiment-label" class="text-sm ml-2 px-2 py-1 rounded bg-gray-100">중립</div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>부정적</span>
              <span>중립</span>
              <span>긍정적</span>
            </div>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 class="text-sm font-medium text-gray-700">인사이트 수</h3>
            </div>
            <div class="flex items-end">
              <div id="insights-count" class="text-3xl font-bold text-red-600">0</div>
              <div class="text-sm text-gray-500 ml-2">개</div>
            </div>
            <div class="text-xs text-gray-400 mt-1">생성된 금융 인사이트</div>
          </div>
        </div>
        
        <!-- 메인 콘텐츠 영역 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 섹터 분석 차트 -->
          <div class="col-span-1 bg-white p-4 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-gray-700">섹터 분석</h3>
              <div class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">실시간</div>
            </div>
            <div id="sector-chart-container" class="h-64">
              <!-- 섹터 차트가 여기에 렌더링됩니다 -->
            </div>
          </div>
          
          <!-- 감성 게이지 -->
          <div class="col-span-1 bg-white p-4 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-gray-700">시장 심리 지수</h3>
              <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">실시간</div>
            </div>
            <div id="sentiment-gauge-container" class="h-64">
              <!-- 감성 게이지가 여기에 렌더링됩니다 -->
            </div>
          </div>
          
          <!-- 키워드 클라우드 -->
          <div class="col-span-1 bg-white p-4 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-gray-700">주요 키워드</h3>
              <div class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">실시간</div>
            </div>
            <div id="keyword-cloud-container" class="h-64">
              <!-- 키워드 클라우드가 여기에 렌더링됩니다 -->
            </div>
          </div>
        </div>
        
        <!-- 하단 탭 영역 -->
        <div class="mt-6 bg-white rounded-lg shadow">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              <button id="tab-insights" class="tab-btn active px-6 py-3 border-b-2 border-blue-500 font-medium text-sm leading-5 text-blue-600 focus:outline-none focus:text-blue-800 focus:border-blue-700">
                인사이트
              </button>
              <button id="tab-articles" class="tab-btn px-6 py-3 border-b-2 border-transparent font-medium text-sm leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300">
                최근 기사
              </button>
            </nav>
          </div>
          <div class="p-4">
            <div id="insights-container" class="tab-content">
              <h3 class="text-lg font-medium mb-4">최근 생성된 인사이트</h3>
              <div id="insights-list-container">
                <!-- 인사이트 목록이 여기에 렌더링됩니다 -->
              </div>
            </div>
            <div id="articles-container" class="tab-content hidden">
              <h3 class="text-lg font-medium mb-4">최근 분석된 기사</h3>
              <div id="article-table-container">
                <!-- 기사 테이블이 여기에 렌더링됩니다 -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 탭 전환 이벤트 리스너 설정
    const tabInsights = document.getElementById('tab-insights');
    const tabArticles = document.getElementById('tab-articles');
    const insightsContainer = document.getElementById('insights-container');
    const articlesContainer = document.getElementById('articles-container');
    
    tabInsights.addEventListener('click', () => {
      tabInsights.classList.add('active', 'border-blue-500', 'text-blue-600');
      tabInsights.classList.remove('border-transparent', 'text-gray-500');
      tabArticles.classList.remove('active', 'border-blue-500', 'text-blue-600');
      tabArticles.classList.add('border-transparent', 'text-gray-500');
      
      insightsContainer.classList.remove('hidden');
      articlesContainer.classList.add('hidden');
    });
    
    tabArticles.addEventListener('click', () => {
      tabArticles.classList.add('active', 'border-blue-500', 'text-blue-600');
      tabArticles.classList.remove('border-transparent', 'text-gray-500');
      tabInsights.classList.remove('active', 'border-blue-500', 'text-blue-600');
      tabInsights.classList.add('border-transparent', 'text-gray-500');
      
      articlesContainer.classList.remove('hidden');
      insightsContainer.classList.add('hidden');
    });
    
    // 샘플 데이터 로드 버튼 이벤트 리스너
    const loadSampleDataBtn = document.getElementById('load-sample-data');
    if (loadSampleDataBtn) {
      loadSampleDataBtn.addEventListener('click', () => {
        this.loadSampleData();
      });
    }
    
    console.log('대시보드 UI 초기화 완료');
  }
  
  /**
   * 샘플 데이터 로드
   */
  loadSampleData() {
    // 로딩 인디케이터 표시
    this.showLoadingIndicator();
    
    // 샘플 데이터 로드 요청
    const hub = this.hub;
    if (hub && hub.rssProxyService) {
      // 모든 뉴스 소스에서 기사 가져오기
      hub.rssProxyService.fetchAllSources().then(articles => {
        console.log(`샘플 데이터 로드 완료: ${articles.length}개 기사`);
        
        if (articles.length > 0) {
          // 로딩된 기사 분석 시작
          if (hub.articleAnalyzer) {
            hub.articleAnalyzer.analyzeArticleBatch(articles);
          }
          
          // 대시보드 데이터 다시 로드
          setTimeout(() => {
            this.loadDashboardData();
          }, 1000);
        } else {
          // 데이터가 없는 경우 알림 표시
          this.showNoDataAlert();
          this.hideLoadingIndicator();
        }
      }).catch(error => {
        console.error('샘플 데이터 로드 오류:', error);
        this.hideLoadingIndicator();
        this.showErrorMessage('데이터 로드 중 오류가 발생했습니다.');
      });
    } else {
      this.hideLoadingIndicator();
      this.showErrorMessage('데이터 소스에 접근할 수 없습니다.');
    }
  }

  /**
   * 로딩 인디케이터 표시
   */
  showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const noDataAlert = document.getElementById('no-data-alert');
    
    if (loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
    }
    
    if (noDataAlert) {
      noDataAlert.classList.add('hidden');
    }
  }
  
  /**
   * 로딩 인디케이터 숨김
   */
  hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
    }
  }
  
  /**
   * 데이터 없음 알림 표시
   */
  showNoDataAlert() {
    const noDataAlert = document.getElementById('no-data-alert');
    
    if (noDataAlert) {
      noDataAlert.classList.remove('hidden');
    }
  }
  
  /**
   * 오류 메시지 표시
   */
  showErrorMessage(message) {
    // 임시 경고 메시지 표시
    alert(message);
  }

  /**
   * 대시보드 데이터 로드
   */
  loadDashboardData() {
    console.log('대시보드 데이터 로드 시작');
    
    // 로딩 인디케이터 표시
    this.showLoadingIndicator();
    
    // 데이터 매니저가 있는지 확인
    if (!this.hub || !this.hub.dataManager) {
      console.error('데이터 매니저가 초기화되지 않았습니다.');
      this.hideLoadingIndicator();
      this.showNoDataAlert();
      return;
    }
    
    // 현재 시간 업데이트
    this.updateLastUpdateTime();
    
    try {
      // 기사 데이터 가져오기
      const articles = this.hub.dataManager.getArticles();
      
      // 기사 수 업데이트
      this.updateArticlesCount(articles.length);
      
      // 기사가 없는 경우
      if (articles.length === 0) {
        console.warn('분석할 기사가 없습니다');
        this.hideLoadingIndicator();
        this.showNoDataAlert();
        return;
      }
      
      // 분석 데이터가 있는 기사만 필터링
      const analyzedArticles = articles.filter(article => 
        this.hub.dataManager.getAnalysis(article.id)
      );
      
      // 분석 결과 집계
      const aggregatedData = this.aggregateAnalysisData(analyzedArticles);
      
      // 인사이트 가져오기
      const insights = this.hub.dataManager.getInsights();
      
      // UI 업데이트
      this.updateDashboardUI(aggregatedData, insights);
      
      // 로딩 인디케이터 숨김
      this.hideLoadingIndicator();
      
      // 데이터가 있으므로 데이터 없음 알림 숨김
      const noDataAlert = document.getElementById('no-data-alert');
      if (noDataAlert) {
        noDataAlert.classList.add('hidden');
      }
      
      console.log('대시보드 데이터 로드 완료');
    } catch (error) {
      console.error('대시보드 데이터 로드 중 오류 발생:', error);
      this.hideLoadingIndicator();
      this.showErrorMessage('데이터 로드 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 기사 수 업데이트
   * @param {number} count - 기사 수
   */
  updateArticlesCount(count) {
    const element = document.getElementById('articles-count');
    if (element) {
      element.textContent = count;
    }
  }
  
  /**
   * 마지막 업데이트 시간 표시
   */
  updateLastUpdateTime() {
    const element = document.getElementById('last-update-time');
    if (element) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR');
      element.textContent = `마지막 업데이트: ${timeString}`;
    }
  }
  
  /**
   * 분석 결과 집계
   * @param {Array} articles - 분석된 기사 배열
   * @returns {Object} 집계된 분석 데이터
   */
  aggregateAnalysisData(articles) {
    // 구현 필요
    return {};
  }
  
  /**
   * 대시보드 UI 업데이트
   * @param {Object} aggregatedData - 집계된 분석 데이터
   * @param {Array} insights - 인사이트 배열
   */
  updateDashboardUI(aggregatedData, insights) {
    // 구현 필요
  }
  
  /**
   * 이벤트 핸들러 등록
   */
  registerEventHandlers() {
    // 새로고침 버튼
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadDashboardData());
    }
    
    // 허브 이벤트 리스너 등록
    if (this.hub) {
      // 새 기사 이벤트
      this.hub.on('newArticle', (article) => {
        console.log('새 기사 이벤트 수신:', article.title);
        this.loadDashboardData();
      });
      
      // 새 인사이트 이벤트
      this.hub.on('newInsight', (insight) => {
        console.log('새 인사이트 이벤트 수신:', insight.title);
        this.loadDashboardData();
      });
    } else {
      console.warn('허브가 초기화되지 않았습니다. 이벤트 핸들러 등록을 건너뜁니다.');
    }
  }
  
  /**
   * 리소스 정리
   */
  cleanup() {
    console.log('대시보드 리소스 정리 중...');
    
    // 컴포넌트 정리
    Object.keys(this.components).forEach(key => {
      const component = this.components[key];
      if (component && typeof component.cleanup === 'function') {
        try {
          component.cleanup();
          console.log(`컴포넌트 정리 완료: ${key}`);
        } catch (error) {
          console.error(`컴포넌트 정리 중 오류 (${key}):`, error);
        }
      }
    });
    
    // 이벤트 리스너 제거
    if (this.hub) {
      try {
        this.hub.off('newArticle');
        this.hub.off('newInsight');
        console.log('허브 이벤트 리스너 제거 완료');
      } catch (error) {
        console.error('허브 이벤트 리스너 제거 중 오류:', error);
      }
    }
    
    // DOM 이벤트 리스너 제거
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.removeEventListener('click', () => this.loadDashboardData());
    }
    
    const viewAllArticlesLink = document.getElementById('view-all-articles');
    if (viewAllArticlesLink) {
      viewAllArticlesLink.removeEventListener('click', () => {});
    }
    
    console.log('대시보드 리소스 정리 완료');
  }
}

export default Dashboard; 