/**
 * Financial Insight Hub Pro - 애플리케이션 시작점
 * 
 * 이 파일은 애플리케이션의 진입점으로, 앱을 초기화하고 필요한 
 * 모든 구성 요소를 로드합니다.
 */

// 핵심 모듈 가져오기
import financialInsightHub, { FinancialInsightHub } from './app-initializer.js';

// UI 모듈 로드
import MainUI from './ui/main.js';

// 전역 변수로 UI 객체 저장
let mainUI = null;

/**
 * 애플리케이션 부트스트랩
 */
async function bootstrap() {
  try {
    console.log('Financial Insight Hub Pro 애플리케이션 부트스트랩 시작');
    
    // 로딩 UI 표시
    showLoadingUI();
    
    // 시스템 상태 초기화
    window.appState = {
      initialized: false,
      loading: true,
      error: null,
      startTime: new Date().getTime(),
      steps: [],
      useDummyData: false // 더미 데이터 사용 비활성화
    };
    
    // 상태 업데이트 헬퍼 함수
    function updateState(step, status) {
      console.log(`[${step}] ${status}`);
      window.appState.steps.push({ step, status, time: new Date().getTime() });
    }
    
    updateState('bootstrap', '부트스트랩 시작');
    
    // Financial Insight Hub 인스턴스 생성
    updateState('hub-creation', 'Financial Insight Hub 인스턴스 생성 시작');
    
    let hub;
    try {
      hub = new FinancialInsightHub();
      window.globalHub = hub; // 디버깅용 전역 변수
      updateState('hub-creation', 'Financial Insight Hub 인스턴스 생성 완료');
    } catch (hubError) {
      updateState('hub-creation', `Financial Insight Hub 인스턴스 생성 실패: ${hubError.message}`);
      throw hubError; // 실제 데이터 사용을 위해 오류를 상위로 전파
    }
    
    // 초기화 타임아웃 설정 (30초)
    const initTimeout = setTimeout(() => {
      updateState('timeout', '초기화 타임아웃 발생: 30초 경과');
      if (!window.appState.initialized) {
        window.appState.error = '초기화 시간이 너무 오래 걸립니다. 네트워크 상태를 확인하거나 브라우저 캐시를 지워보세요.';
        showErrorUI('초기화 시간이 너무 오래 걸립니다. 네트워크 상태를 확인하거나 브라우저 캐시를 지워보세요.');
      }
    }, 30000);
    
    // 초기화 완료 이벤트 리스너 등록
    updateState('event-listener', '초기화 완료 이벤트 리스너 등록');
    hub.on('initializationComplete', (event) => {
      clearTimeout(initTimeout);
      
      if (event.success) {
        updateState('hub-initialization', 'Financial Insight Hub 초기화 성공');
        window.appState.initialized = true;
        window.appState.loading = false;
        
        // UI 초기화
        try {
          initializeUI(hub);
        } catch (uiError) {
          updateState('ui-initialization', `UI 초기화 중 오류: ${uiError.message}`);
          window.appState.error = `UI 초기화 중 오류: ${uiError.message}`;
          showErrorUI(`UI 초기화 중 오류: ${uiError.message}`);
        }
      } else {
        updateState('hub-initialization', `Financial Insight Hub 초기화 실패: ${event.error?.message || '알 수 없는 오류'}`);
        window.appState.error = `초기화 실패: ${event.error?.message || '알 수 없는 오류'}`;
        showErrorUI(`초기화 실패: ${event.error?.message || '알 수 없는 오류'}`);
      }
    });
    
    // 통신 상태 확인
    updateState('connectivity', '통신 상태 확인 중');
    try {
      const online = navigator.onLine;
      updateState('connectivity', `통신 상태: ${online ? '온라인' : '오프라인'}`);
      
      if (!online) {
        window.appState.error = '오프라인 상태입니다. 네트워크 연결을 확인해주세요.';
        showErrorUI('오프라인 상태입니다. 네트워크 연결을 확인해주세요.');
        return;
      }
    } catch (connError) {
      updateState('connectivity', `통신 상태 확인 실패: ${connError.message}`);
    }
    
    // 초기화 시작
    updateState('hub-initialization', 'Financial Insight Hub 초기화 시작');
    try {
      // 초기화 실행
      await hub.initialize();
      // initialize는 비동기 함수이지만, 초기화 완료는 이벤트를 통해 처리
    } catch (error) {
      updateState('hub-initialization', `Financial Insight Hub 초기화 중 예외 발생: ${error.message}`);
      clearTimeout(initTimeout);
      window.appState.error = `초기화 중 오류: ${error.message || '알 수 없는 오류'}`;
      showErrorUI(`초기화 중 오류: ${error.message || '알 수 없는 오류'}`);
      throw error; // 실제 데이터 사용을 위해 오류를 상위로 전파
    }
    
  } catch (error) {
    console.error('애플리케이션 부트스트랩 중 치명적인 오류:', error);
    window.appState = {
      initialized: false,
      loading: false,
      error: error.message || '애플리케이션을 시작할 수 없습니다',
      steps: window.appState?.steps || []
    };
    showErrorUI(`애플리케이션을 시작할 수 없습니다: ${error.message || '알 수 없는 오류'}`);
  }
}

/**
 * 초기 로딩 화면 표시
 */
function showLoadingUI() {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('앱 컨테이너 요소를 찾을 수 없습니다');
    return;
  }
  
  // 로딩 화면 표시
  appContainer.innerHTML = `
    <div class="loading-screen flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center p-8 bg-white rounded-lg shadow-lg">
        <div class="mb-4">
          <svg class="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold mb-2">금융 인사이트 허브 로딩 중...</h2>
        <p class="text-gray-600">금융 데이터를 분석하고 인사이트를 준비하고 있습니다.</p>
      </div>
    </div>
  `;
}

/**
 * 이벤트 리스너 등록
 */
function registerEventListeners() {
  // 새 기사 이벤트
  financialInsightHub.on('newArticle', handleNewArticle);
  
  // 새 인사이트 이벤트
  financialInsightHub.on('newInsight', handleNewInsight);
  
  // 오류 이벤트
  financialInsightHub.on('error', handleError);
}

/**
 * 새 기사 이벤트 핸들러
 * @param {Object} article - 기사 객체
 */
function handleNewArticle(article) {
  console.log(`UI: 새 기사 - ${article.title}`);
  
  // 알림 표시
  showNotification('새로운 기사가 추가되었습니다', 'info');
}

/**
 * 새 인사이트 이벤트 핸들러
 * @param {Object} insight - 인사이트 객체
 */
function handleNewInsight(insight) {
  console.log(`UI: 새 인사이트 - ${insight.title}`);
  
  // 중요 인사이트인 경우 알림 표시
  if (insight.importance >= 7) {
    showNotification(`중요 인사이트: ${insight.title}`, 'success');
  }
}

/**
 * 오류 이벤트 핸들러
 * @param {Error} error - 오류 객체
 */
function handleError(error) {
  console.error('오류 발생:', error);
  
  // 오류 알림 표시
  showNotification(`오류: ${error.message}`, 'error');
}

/**
 * 알림 표시
 * @param {string} message - 알림 메시지
 * @param {string} type - 알림 유형 (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
  console.log(`알림 표시: ${message} (${type})`);
  
  // 알림 컨테이너 확인
  let notificationContainer = document.getElementById('notification-container');
  
  // 컨테이너가 없으면 생성
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(notificationContainer);
  }
  
  // 타입에 따른 스타일 설정
  const typeStyles = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  // 알림 요소 생성
  const notification = document.createElement('div');
  notification.className = `p-3 rounded shadow-md text-white ${typeStyles[type] || typeStyles.info} flex items-center justify-between min-w-[300px] transform transition-all duration-300 ease-in-out translate-x-0`;
  
  // 알림 내용 설정
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <span>${message}</span>
    </div>
    <button class="ml-2 text-white hover:text-gray-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  // 알림 컨테이너에 추가
  notificationContainer.appendChild(notification);
  
  // 닫기 버튼 이벤트 리스너
  const closeButton = notification.querySelector('button');
  closeButton.addEventListener('click', () => {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // 자동 제거 타이머
  setTimeout(() => {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * 초기 데이터 가져오기
 */
async function fetchInitialData() {
  console.log('초기 데이터 가져오기 시작...');
  
  try {
    // 활성화된 뉴스 소스 가져오기
    console.log('뉴스 소스 가져오기 시도 중...');
    
    if (!financialInsightHub.rssProxy || typeof financialInsightHub.rssProxy.getAllSources !== 'function') {
      console.error('RSS 프록시 서비스를 사용할 수 없습니다');
      // 데이터 로딩 실패해도 대시보드 표시
      mainUI.navigateTo('dashboard');
      return false;
    }
    
    const sources = financialInsightHub.rssProxy.getAllSources();
    
    if (sources && sources.length > 0) {
      const sampleSource = sources[0]; // 첫 번째 소스 사용 (데모 목적)
      console.log(`샘플 소스에서 데이터 가져오기: ${sampleSource.name}`);
      
      // 첫 번째 소스에서 데이터 가져오기
      try {
        const articles = await financialInsightHub.rssProxy.fetchFromSource(sampleSource.id);
        
        if (articles && articles.length > 0) {
          console.log(`${articles.length}개의 기사를 가져왔습니다`);
          
          // 가져온 기사 처리
          financialInsightHub.processNewArticles(articles, sampleSource.id);
          
          // 로딩 화면 제거 및 대시보드 표시
          mainUI.navigateTo('dashboard');
        } else {
          console.log('가져온 기사가 없습니다');
          // 로딩 화면 제거 및 대시보드 표시
          mainUI.navigateTo('dashboard');
        }
      } catch (error) {
        console.error(`데이터 가져오기 오류: ${error.message}`);
        // 오류가 발생해도 대시보드 표시
        mainUI.navigateTo('dashboard');
      }
    } else {
      console.log('사용 가능한 뉴스 소스가 없습니다');
      // 소스가 없어도 대시보드 표시
      mainUI.navigateTo('dashboard');
    }
    
    console.log('초기 데이터 가져오기 완료');
    return true;
  } catch (error) {
    console.error('초기 데이터 가져오기 오류:', error);
    // 오류가 발생해도 대시보드 표시
    mainUI.navigateTo('dashboard');
    return false;
  }
}

/**
 * 오류 UI 표시
 * @param {Error} error - 오류 객체
 */
function showErrorUI(error) {
  console.log('오류 UI 표시 중...');
  
  // 메인 컨테이너 요소 가져오기
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('앱 컨테이너 요소를 찾을 수 없습니다');
    return;
  }
  
  // 오류 메시지 표시
  appContainer.innerHTML = `
    <div class="error-screen flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center p-8 bg-white rounded-lg shadow-lg max-w-lg">
        <div class="mb-4 text-red-500">
          <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold mb-2">애플리케이션 실행 중 문제가 발생했습니다</h2>
        <p class="text-gray-600 mb-4">${error.message}</p>
        <div class="mb-4 text-sm text-gray-500 bg-gray-100 p-3 rounded text-left overflow-auto max-h-32">
          <code id="error-details">${window.appState ? JSON.stringify(window.appState, null, 2) : '상태 정보 없음'}</code>
        </div>
        <button id="refresh-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2">
          페이지 새로고침
        </button>
        <button id="debug-btn" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
          디버그 모드
        </button>
      </div>
    </div>
  `;
  
  // 새로고침 버튼 이벤트 핸들러
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  // 디버그 모드 버튼 이벤트 핸들러
  const debugBtn = document.getElementById('debug-btn');
  if (debugBtn) {
    debugBtn.addEventListener('click', () => {
      // 디버그 모드로 전환
      const debugInfo = {
        appState: window.appState,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      // 콘솔에 디버그 정보 출력
      console.info('디버그 정보:', debugInfo);
      
      // 디버그 정보 표시
      const errorDetails = document.getElementById('error-details');
      if (errorDetails) {
        errorDetails.textContent = JSON.stringify(debugInfo, null, 2);
      }
      
      alert('디버그 정보가 콘솔에 출력되었습니다. 개발자 도구를 열어 확인해주세요.');
    });
  }
}

/**
 * UI 초기화 함수
 * @param {FinancialInsightHub} hub - 초기화된 Financial Insight Hub 인스턴스
 */
function initializeUI(hub) {
  try {
    console.log('UI 초기화 시작');
    
    // 로딩 UI 숨기기
    hideLoadingUI();
    
    if (!hub) {
      throw new Error('Financial Insight Hub 인스턴스가 없습니다');
    }
    
    if (!window.MainUI) {
      console.warn('MainUI 클래스가 전역 객체에 없습니다. import 문제가 있을 수 있습니다');
    }
    
    // 메인 UI 컴포넌트 초기화
    console.log('MainUI 클래스:', typeof MainUI);
    const mainApp = new MainUI(hub);
    window.mainApp = mainApp; // 디버깅용 전역 변수
    
    if (!mainApp) {
      throw new Error('MainUI 인스턴스를 생성할 수 없습니다');
    }
    
    console.log('MainUI 인스턴스 생성 완료');
    
    // 대시보드로 이동
    if (typeof mainApp.navigateTo === 'function') {
      mainApp.navigateTo('dashboard');
      console.log('대시보드로 이동 완료');
    } else {
      console.warn('navigateTo 메서드를 찾을 수 없습니다');
      // 대시보드를 직접 초기화 시도
      initializeDashboard(hub);
    }
    
    console.log('UI 초기화 완료');
  } catch (error) {
    console.error('UI 초기화 중 오류:', error);
    showErrorUI(`UI 초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
  }
}

/**
 * 대시보드 직접 초기화 (MainUI가 작동하지 않을 경우 백업 방법)
 * @param {FinancialInsightHub} hub - 초기화된 Financial Insight Hub 인스턴스
 */
function initializeDashboard(hub) {
  try {
    console.log('대시보드 직접 초기화 시도');
    const appContainer = document.getElementById('app');
    
    if (!appContainer) {
      throw new Error('app 컨테이너를 찾을 수 없습니다');
    }
    
    // 컨테이너 생성
    appContainer.innerHTML = `
      <div id="dashboard-container" class="dashboard-container"></div>
    `;
    
    // 대시보드 초기화
    const dashboard = new Dashboard('dashboard-container', hub);
    window.dashboard = dashboard; // 디버깅용
    
    console.log('대시보드 직접 초기화 완료');
  } catch (error) {
    console.error('대시보드 직접 초기화 실패:', error);
    showErrorUI(`대시보드를 초기화할 수 없습니다: ${error.message || '알 수 없는 오류'}`);
  }
}

/**
 * 로딩 UI 숨기기 함수
 */
function hideLoadingUI() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  
  // 컨테이너를 비워서 메인 앱이 렌더링될 수 있게 함
  appContainer.innerHTML = '';
}

// 페이지 종료 시 리소스 정리
window.addEventListener('beforeunload', () => {
  console.log('페이지 종료: 리소스 정리 중...');
  
  if (financialInsightHub && financialInsightHub.isInitialized) {
    financialInsightHub.cleanup();
  }
  
  if (mainUI) {
    mainUI.cleanup();
  }
});

// DOMContentLoaded 이벤트에서 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  bootstrap();
});

// 모듈 내보내기
export default {
  bootstrap,
  mainUI
}; 