/**
 * Financial Insight Hub Pro - 데이터 수집 모듈 통합
 * 
 * 이 모듈은 2단계에서 구현한 데이터 수집 모듈들을 애플리케이션에 통합합니다.
 * 뉴스 수집기, 데이터 처리, 스케줄러를 초기화하고 설정합니다.
 */

import FinancialInsightData from '../infrastructure/data_structure/data-structure.js';
import newsCollector from './news-collector.js';
import dataProcessor from './data-processor.js';
import scheduler from './scheduler.js';
import rssProxyService from '../infrastructure/proxy/proxy-service.js';
import financialInsightHub from '../app-initializer.js';

/**
 * 데이터 수집 모듈 클래스
 * 모든 데이터 수집 관련 모듈을 관리하고 통합
 */
class DataCollectionModule {
  constructor() {
    this.dataManager = FinancialInsightData.getManager();
    this.collector = newsCollector;
    this.processor = dataProcessor;
    this.scheduler = scheduler;
    this.rssProxy = rssProxyService;
    this.appHub = financialInsightHub;
    
    this.isInitialized = false;
    this.config = {
      autoStartCollection: true,
      autoStartScheduler: true,
      setupDefaultSchedule: true,
      enableAllSources: true,
      initialCollectionDelay: 5000, // 초기 수집 지연 시간 (밀리초)
      logLevel: 'info'
    };
    
    // 이벤트 리스너
    this.eventListeners = {};
  }
  
  /**
   * 모듈 초기화
   * @param {Object} config - 초기화 설정
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('Data collection module already initialized');
      return true;
    }
    
    try {
      console.log('Initializing data collection module...');
      
      // 설정 병합
      this.config = {
        ...this.config,
        ...config
      };
      
      // 로그 레벨 설정
      this.setupLogging(this.config.logLevel);
      
      // 이벤트 핸들러 등록
      this.registerEventHandlers();
      
      // 소스 설정
      if (this.config.enableAllSources) {
        this.enableAllSources();
      }
      
      // 스케줄러 설정
      if (this.config.setupDefaultSchedule) {
        this.scheduler.setupDefaultSchedule();
      }
      
      // 스케줄러 자동 시작
      if (this.config.autoStartScheduler) {
        this.scheduler.start();
      }
      
      // 초기 데이터 수집 (지연 시작)
      if (this.config.autoStartCollection) {
        setTimeout(() => {
          this.startInitialCollection();
        }, this.config.initialCollectionDelay);
      }
      
      this.isInitialized = true;
      this.emit('initialized', { success: true });
      
      console.log('Data collection module initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing data collection module:', error);
      this.emit('initialized', { success: false, error: error.message });
      return false;
    }
  }
  
  /**
   * 로깅 설정
   * @param {string} logLevel - 로그 레벨
   */
  setupLogging(logLevel) {
    // 실제 로그 레벨 설정 (프로덕션 환경에서는 더 정교한 로깅 시스템 사용 가능)
    switch (logLevel) {
      case 'debug':
        console.log('Debug logging enabled');
        break;
      case 'info':
        // 기본 로깅
        break;
      case 'warn':
        // 경고 이상만 로깅
        // 실제 환경에서는 console.log를 재정의하여 필터링 가능
        break;
      case 'error':
        // 오류만 로깅
        break;
      default:
        // 기본값
        break;
    }
  }
  
  /**
   * 이벤트 핸들러 등록
   */
  registerEventHandlers() {
    // 수집기 이벤트 핸들러
    this.collector.on('sourceCollectionCompleted', this.handleCollectionCompleted.bind(this));
    this.collector.on('sourceCollectionError', this.handleCollectionError.bind(this));
    
    // 스케줄러 이벤트 핸들러
    this.scheduler.on('taskCompleted', this.handleTaskCompleted.bind(this));
    this.scheduler.on('taskError', this.handleTaskError.bind(this));
    
    // 애플리케이션 허브 이벤트 핸들러
    this.appHub.on('newArticle', this.handleNewArticle.bind(this));
  }
  
  /**
   * 모든 뉴스 소스 활성화
   */
  enableAllSources() {
    const sources = this.rssProxy.getAllSources();
    console.log(`Enabling ${sources.length} news sources`);
    
    sources.forEach(source => {
      // 소스별 설정 조정 (예: 우선순위에 따른 업데이트 간격)
      const updateInterval = this.getUpdateIntervalForSource(source);
      
      this.collector.updateSourceConfig(source.id, {
        enabled: true,
        updateInterval
      });
    });
  }
  
  /**
   * 소스별 업데이트 간격 결정
   * @param {Object} source - 소스 정보
   * @returns {number} 업데이트 간격 (밀리초)
   */
  getUpdateIntervalForSource(source) {
    // 신뢰도 기반 업데이트 간격 조정
    if (source.reliability >= 90) {
      return 10 * 60 * 1000; // 10분 (최고 신뢰도)
    } else if (source.reliability >= 80) {
      return 15 * 60 * 1000; // 15분
    } else if (source.reliability >= 70) {
      return 20 * 60 * 1000; // 20분
    } else if (source.reliability >= 60) {
      return 30 * 60 * 1000; // 30분
    } else {
      return 60 * 60 * 1000; // 60분 (낮은 신뢰도)
    }
  }
  
  /**
   * 초기 데이터 수집 시작
   * @returns {Promise<Object>} 수집 결과
   */
  async startInitialCollection() {
    try {
      console.log('Starting initial data collection...');
      
      // 우선순위가 높은 소스 찾기
      const highPrioritySources = this.getHighPrioritySources();
      
      console.log(`Collecting from ${highPrioritySources.length} high priority sources`);
      
      // 각 소스에서 순차적으로 수집
      for (const sourceId of highPrioritySources) {
        try {
          console.log(`Collecting from high priority source: ${sourceId}`);
          await this.collector.collectFromSource(sourceId);
        } catch (error) {
          console.error(`Error collecting from source ${sourceId}:`, error);
          // 계속 진행 (한 소스의 오류가 전체를 중단하지 않음)
        }
      }
      
      // 상위 소스 수집 완료 후 이벤트 발생
      this.emit('initialCollectionCompleted', {
        sourcesCount: highPrioritySources.length
      });
      
      console.log('Initial data collection completed');
      
      // 컬렉션 자동 시작 (모든 소스)
      if (this.config.autoStartCollection) {
        this.collector.startCollectionForAllSources();
      }
      
      return {
        success: true,
        sourcesCount: highPrioritySources.length
      };
    } catch (error) {
      console.error('Error in initial data collection:', error);
      
      this.emit('initialCollectionError', {
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 우선순위가 높은 소스 가져오기
   * @returns {Array<string>} 소스 ID 목록
   */
  getHighPrioritySources() {
    const sourceConfigs = this.collector.getAllSourceConfigs();
    
    // 우선순위가 높은 소스 필터링 (8 이상)
    const highPriority = sourceConfigs
      .filter(item => item.config.enabled && item.config.priority >= 8)
      .map(item => item.id);
    
    // 없으면 활성화된 모든 소스의 일부 반환
    if (highPriority.length === 0) {
      return sourceConfigs
        .filter(item => item.config.enabled)
        .slice(0, 3) // 최대 3개
        .map(item => item.id);
    }
    
    return highPriority;
  }
  
  /**
   * 수집 완료 핸들러
   * @param {Object} result - 수집 결과
   */
  handleCollectionCompleted(result) {
    console.log(`Collection completed for source ${result.sourceId}: ${result.savedArticles} articles saved`);
    
    // 새 기사가 있으면 분석 요청
    if (result.savedArticles > 0) {
      // 실제 구현에서는 분석 요청 로직 추가
    }
  }
  
  /**
   * 수집 오류 핸들러
   * @param {Object} errorInfo - 오류 정보
   */
  handleCollectionError(errorInfo) {
    console.error(`Collection error for source ${errorInfo.sourceId}: ${errorInfo.error}`);
    
    // 연속 오류 대응
    if (errorInfo.consecutiveErrors >= 3) {
      console.warn(`Multiple errors for source ${errorInfo.sourceId}, considering service issues`);
      
      // 소스 일시 중지 고려
      // this.collector.pauseCollectionForSource(errorInfo.sourceId, 30 * 60 * 1000);
    }
  }
  
  /**
   * 작업 완료 핸들러
   * @param {Object} taskInfo - 작업 정보
   */
  handleTaskCompleted(taskInfo) {
    const { task, result } = taskInfo;
    
    console.log(`Scheduled task completed: ${task.id} (${task.type})`);
    
    // 작업 유형별 후속 처리
    switch (task.type) {
      case 'collectAllSources':
        // 전체 수집 후 분석 등 추가 작업
        break;
        
      case 'generateInsights':
        // 인사이트 생성 후 알림 등
        break;
        
      // 기타 작업 유형별 처리
    }
  }
  
  /**
   * 작업 오류 핸들러
   * @param {Object} errorInfo - 오류 정보
   */
  handleTaskError(errorInfo) {
    const { task, error } = errorInfo;
    
    console.error(`Task error: ${task.id} (${task.type}) - ${error}`);
    
    // 작업 유형별 오류 대응
    switch (task.type) {
      case 'collectAllSources':
        // 수집 실패 시 후속 조치
        break;
        
      // 기타 작업 유형별 오류 대응
    }
  }
  
  /**
   * 새 기사 핸들러
   * @param {Object} article - 기사 정보
   */
  handleNewArticle(article) {
    // 새 기사 수신 시 처리 (예: 요약 생성, 분석 요청 등)
    console.log(`New article received: ${article.title}`);
  }
  
  /**
   * 모듈 상태 가져오기
   * @returns {Object} 모듈 상태
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      collector: {
        activeSources: this.collector.collectionTasks.size,
        stats: this.collector.getCollectionStats()
      },
      scheduler: {
        isRunning: this.scheduler.isRunning,
        taskCount: this.scheduler.tasks.size,
        recentTasks: this.scheduler.taskHistory.slice(0, 5)
      },
      dataManager: {
        cacheStats: this.dataManager.getCacheStats()
      },
      config: this.config
    };
  }
  
  /**
   * 데이터 수집 시작
   * @returns {Promise<Object>} 수집 결과
   */
  async startCollection() {
    return this.collector.startCollectionForAllSources();
  }
  
  /**
   * 데이터 수집 중지
   */
  stopCollection() {
    return this.collector.stopAllCollections();
  }
  
  /**
   * 스케줄러 시작
   * @returns {boolean} 성공 여부
   */
  startScheduler() {
    return this.scheduler.start();
  }
  
  /**
   * 스케줄러 중지
   * @returns {boolean} 성공 여부
   */
  stopScheduler() {
    return this.scheduler.stop();
  }
  
  /**
   * 모듈 설정 업데이트
   * @param {Object} config - 업데이트할 설정
   * @returns {boolean} 성공 여부
   */
  updateConfig(config) {
    try {
      // 설정 병합
      this.config = {
        ...this.config,
        ...config
      };
      
      // 로그 레벨 업데이트
      if (config.logLevel) {
        this.setupLogging(config.logLevel);
      }
      
      this.emit('configUpdated', this.config);
      
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} listener - 리스너 함수
   */
  on(event, listener) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }
  
  /**
   * 이벤트 발생
   * @param {string} event - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const dataCollectionModule = new DataCollectionModule();

// 모듈 내보내기
export default dataCollectionModule;

// 개별 모듈도 내보내기 (필요시 직접 접근 가능)
export {
  newsCollector,
  dataProcessor,
  scheduler,
  rssProxyService
}; 