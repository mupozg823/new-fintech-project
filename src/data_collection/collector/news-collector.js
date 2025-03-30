/**
 * Financial Insight Hub Pro - 뉴스 수집기
 * 
 * 이 모듈은 다양한 뉴스 소스에서 금융 관련 기사를 수집하고
 * 데이터 저장소에 저장하는 기능을 제공합니다.
 */

import rssProxyService from '../../infrastructure/proxy/proxy-service.js';
import FinancialInsightData from '../../infrastructure/data_structure/data-structure.js';
import { processArticleContent } from '../data-processor.js';

/**
 * 뉴스 수집기 클래스
 * 여러 소스에서 기사를 수집하고 관리하는 기능 제공
 */
class NewsCollector {
  constructor() {
    this.dataManager = FinancialInsightData.getManager();
    this.rssProxy = rssProxyService;
    this.collectionTasks = new Map();
    this.lastCollectionTime = new Map();
    this.collectionStats = {
      totalCollected: 0,
      totalProcessed: 0,
      totalSaved: 0,
      totalErrors: 0,
      sourceStats: {}
    };
    
    // 소스별 수집 설정
    this.sourceConfigs = new Map();
    
    // 이벤트 리스너
    this.eventListeners = {};
    
    // 기본 소스 설정 초기화
    this.initializeSourceConfigs();
  }
  
  /**
   * 기본 소스 설정 초기화
   */
  initializeSourceConfigs() {
    // 모든 소스 가져오기
    const allSources = this.rssProxy.getAllSources();
    
    // 각 소스별 기본 설정
    allSources.forEach(source => {
      this.sourceConfigs.set(source.id, {
        enabled: true,                     // 기본적으로 활성화
        updateInterval: 10 * 60 * 1000,    // 10분 (소스별로 다르게 설정 가능)
        maxArticlesPerCollection: 20,      // 한 번에 수집할 최대 기사 수
        minCollectionInterval: 5 * 60 * 1000, // 최소 수집 간격 (5분)
        priority: this.getPriorityForSource(source), // 소스 우선순위
        processingOptions: {
          extractFullContent: true,        // 전문 추출 여부
          translateToKorean: false,        // 한국어 번역 여부
          detectLanguage: true,            // 언어 감지 여부
          removeAds: true,                 // 광고 제거 여부
          maxContentLength: 10000,         // 최대 콘텐츠 길이
          useCache: true                   // 캐싱 사용 여부
        }
      });
    });
  }
  
  /**
   * 소스 우선순위 결정
   * @param {Object} source - 소스 정보
   * @returns {number} 우선순위 (1-10, 높을수록 우선)
   */
  getPriorityForSource(source) {
    // 소스 신뢰도 기반 우선순위 설정
    if (source.reliability >= 90) {
      return 10; // 최고 신뢰도
    } else if (source.reliability >= 80) {
      return 8;
    } else if (source.reliability >= 70) {
      return 6;
    } else if (source.reliability >= 60) {
      return 4;
    } else {
      return 2;
    }
  }
  
  /**
   * 소스 설정 업데이트
   * @param {string} sourceId - 소스 ID
   * @param {Object} config - 설정 객체
   * @returns {boolean} 성공 여부
   */
  updateSourceConfig(sourceId, config) {
    if (!this.sourceConfigs.has(sourceId)) {
      console.error(`Source with ID '${sourceId}' not found in configuration`);
      return false;
    }
    
    const currentConfig = this.sourceConfigs.get(sourceId);
    
    // 설정 병합
    this.sourceConfigs.set(sourceId, {
      ...currentConfig,
      ...config,
      processingOptions: {
        ...currentConfig.processingOptions,
        ...(config.processingOptions || {})
      }
    });
    
    // 활성화 상태가 변경된 경우 수집 작업 업데이트
    if (config.enabled !== undefined && config.enabled !== currentConfig.enabled) {
      if (config.enabled) {
        this.startCollectionForSource(sourceId);
      } else {
        this.stopCollectionForSource(sourceId);
      }
    }
    
    // 업데이트 간격이 변경된 경우 수집 작업 재시작
    if (config.updateInterval !== undefined && 
        config.updateInterval !== currentConfig.updateInterval &&
        this.collectionTasks.has(sourceId)) {
      this.stopCollectionForSource(sourceId);
      this.startCollectionForSource(sourceId);
    }
    
    return true;
  }
  
  /**
   * 소스 설정 가져오기
   * @param {string} sourceId - 소스 ID
   * @returns {Object|null} 소스 설정 또는 null
   */
  getSourceConfig(sourceId) {
    return this.sourceConfigs.get(sourceId) || null;
  }
  
  /**
   * 모든 소스 설정 가져오기
   * @returns {Array} 소스 설정 배열 [{ id, config }]
   */
  getAllSourceConfigs() {
    const configs = [];
    for (const [sourceId, config] of this.sourceConfigs.entries()) {
      configs.push({
        id: sourceId,
        config: { ...config }
      });
    }
    return configs;
  }
  
  /**
   * 활성화된 모든 소스에서 수집 시작
   * @returns {Promise<Object>} 수집 결과 통계
   */
  async startCollectionForAllSources() {
    console.log('Starting collection for all enabled sources...');
    
    const results = {
      sourcesStarted: 0,
      sourcesSkipped: 0,
      errors: []
    };
    
    // 우선순위별로 소스 정렬
    const prioritizedSources = [...this.sourceConfigs.entries()]
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => b[1].priority - a[1].priority);
    
    // 각 소스별 수집 시작
    for (const [sourceId, _] of prioritizedSources) {
      try {
        const started = this.startCollectionForSource(sourceId);
        if (started) {
          results.sourcesStarted++;
        } else {
          results.sourcesSkipped++;
        }
      } catch (error) {
        results.errors.push({
          sourceId,
          error: error.message
        });
      }
    }
    
    this.emit('collectionStarted', results);
    return results;
  }
  
  /**
   * 특정 소스에서 수집 시작
   * @param {string} sourceId - 소스 ID
   * @returns {boolean} 성공 여부
   */
  startCollectionForSource(sourceId) {
    // 이미 수집 중인 경우
    if (this.collectionTasks.has(sourceId)) {
      console.log(`Collection already running for source: ${sourceId}`);
      return false;
    }
    
    // 소스 설정 확인
    const sourceConfig = this.sourceConfigs.get(sourceId);
    if (!sourceConfig || !sourceConfig.enabled) {
      console.log(`Source ${sourceId} is disabled or not configured`);
      return false;
    }
    
    console.log(`Starting collection for source: ${sourceId}`);
    
    // 즉시 첫 수집 실행
    this.collectFromSource(sourceId).catch(error => {
      console.error(`Error in initial collection from ${sourceId}:`, error);
    });
    
    // 주기적 수집 설정
    const intervalId = setInterval(() => {
      this.collectFromSource(sourceId).catch(error => {
        console.error(`Error in scheduled collection from ${sourceId}:`, error);
        
        // 연속 오류 발생 시 임시 중단 고려
        const sourceStats = this.collectionStats.sourceStats[sourceId] || {};
        if (sourceStats.consecutiveErrors && sourceStats.consecutiveErrors >= 3) {
          console.warn(`Too many consecutive errors for source ${sourceId}, temporarily pausing collection`);
          this.pauseCollectionForSource(sourceId, 30 * 60 * 1000); // 30분 일시 중지
        }
      });
    }, sourceConfig.updateInterval);
    
    // 수집 작업 등록
    this.collectionTasks.set(sourceId, intervalId);
    
    // 이벤트 발생
    this.emit('sourceCollectionStarted', { sourceId, interval: sourceConfig.updateInterval });
    
    return true;
  }
  
  /**
   * 특정 소스에서 수집 중지
   * @param {string} sourceId - 소스 ID
   * @returns {boolean} 성공 여부
   */
  stopCollectionForSource(sourceId) {
    if (!this.collectionTasks.has(sourceId)) {
      return false;
    }
    
    clearInterval(this.collectionTasks.get(sourceId));
    this.collectionTasks.delete(sourceId);
    
    this.emit('sourceCollectionStopped', { sourceId });
    console.log(`Stopped collection for source: ${sourceId}`);
    
    return true;
  }
  
  /**
   * 모든 소스에서 수집 중지
   */
  stopAllCollections() {
    for (const [sourceId, intervalId] of this.collectionTasks.entries()) {
      clearInterval(intervalId);
    }
    
    this.collectionTasks.clear();
    console.log('Stopped all collection tasks');
    
    this.emit('allCollectionsStopped');
  }
  
  /**
   * 특정 소스에서 수집 일시 중지
   * @param {string} sourceId - 소스 ID
   * @param {number} duration - 중지 기간 (밀리초)
   */
  pauseCollectionForSource(sourceId, duration) {
    this.stopCollectionForSource(sourceId);
    
    console.log(`Pausing collection for source ${sourceId} for ${duration / 1000} seconds`);
    
    // 지정된 시간 후 재시작
    setTimeout(() => {
      console.log(`Resuming collection for source ${sourceId} after pause`);
      this.startCollectionForSource(sourceId);
    }, duration);
    
    this.emit('sourceCollectionPaused', { sourceId, duration });
  }
  
  /**
   * 특정 소스에서 기사 수집
   * @param {string} sourceId - 소스 ID
   * @returns {Promise<Object>} 수집 결과
   */
  async collectFromSource(sourceId) {
    const sourceConfig = this.sourceConfigs.get(sourceId);
    if (!sourceConfig || !sourceConfig.enabled) {
      throw new Error(`Source ${sourceId} is disabled or not configured`);
    }
    
    // 최소 수집 간격 확인
    const lastCollection = this.lastCollectionTime.get(sourceId) || 0;
    const timeSinceLastCollection = Date.now() - lastCollection;
    
    if (timeSinceLastCollection < sourceConfig.minCollectionInterval) {
      console.log(`Skipping collection for ${sourceId}, minimum interval not reached (${timeSinceLastCollection / 1000}s < ${sourceConfig.minCollectionInterval / 1000}s)`);
      return {
        sourceId,
        status: 'skipped',
        reason: 'minimum_interval_not_reached'
      };
    }
    
    // 수집 시작 시간 기록
    this.lastCollectionTime.set(sourceId, Date.now());
    
    // 소스 통계 초기화
    if (!this.collectionStats.sourceStats[sourceId]) {
      this.collectionStats.sourceStats[sourceId] = {
        totalCollected: 0,
        totalProcessed: 0,
        totalSaved: 0,
        totalErrors: 0,
        lastCollectionTime: null,
        lastSuccessTime: null,
        consecutiveErrors: 0
      };
    }
    
    console.log(`Collecting articles from source: ${sourceId}`);
    
    try {
      // RSS 프록시 서비스를 통해 기사 가져오기
      const articles = await this.rssProxy.fetchFromSource(sourceId);
      
      const result = {
        sourceId,
        status: 'success',
        totalArticles: articles.length,
        processedArticles: 0,
        savedArticles: 0,
        skippedArticles: 0,
        errors: 0
      };
      
      // 최대 기사 수 제한
      const articlesToProcess = articles.slice(0, sourceConfig.maxArticlesPerCollection);
      
      console.log(`Fetched ${articles.length} articles from ${sourceId}, processing ${articlesToProcess.length}`);
      
      // 수집 통계 업데이트
      this.collectionStats.totalCollected += articlesToProcess.length;
      this.collectionStats.sourceStats[sourceId].totalCollected += articlesToProcess.length;
      this.collectionStats.sourceStats[sourceId].lastCollectionTime = new Date();
      
      // 각 기사 처리
      for (const article of articlesToProcess) {
        try {
          // 중복 확인
          const existingArticle = this.dataManager.getArticle(article.id);
          if (existingArticle) {
            result.skippedArticles++;
            continue;
          }
          
          // 콘텐츠 처리
          const processedArticle = await processArticleContent(article, sourceConfig.processingOptions);
          
          result.processedArticles++;
          this.collectionStats.totalProcessed++;
          this.collectionStats.sourceStats[sourceId].totalProcessed++;
          
          // 데이터 저장소에 저장
          const savedId = this.dataManager.saveArticle(processedArticle);
          
          if (savedId) {
            result.savedArticles++;
            this.collectionStats.totalSaved++;
            this.collectionStats.sourceStats[sourceId].totalSaved++;
          }
        } catch (articleError) {
          console.error(`Error processing article from ${sourceId}:`, articleError);
          result.errors++;
          this.collectionStats.totalErrors++;
          this.collectionStats.sourceStats[sourceId].totalErrors++;
        }
      }
      
      // 성공 통계 업데이트
      this.collectionStats.sourceStats[sourceId].lastSuccessTime = new Date();
      this.collectionStats.sourceStats[sourceId].consecutiveErrors = 0;
      
      // 이벤트 발생
      this.emit('sourceCollectionCompleted', result);
      
      console.log(`Collection completed for ${sourceId}: ${result.savedArticles} saved, ${result.skippedArticles} skipped, ${result.errors} errors`);
      
      return result;
    } catch (error) {
      // 오류 통계 업데이트
      this.collectionStats.totalErrors++;
      this.collectionStats.sourceStats[sourceId].totalErrors++;
      this.collectionStats.sourceStats[sourceId].consecutiveErrors = 
        (this.collectionStats.sourceStats[sourceId].consecutiveErrors || 0) + 1;
      
      // 오류 결과 구성
      const errorResult = {
        sourceId,
        status: 'error',
        error: error.message,
        consecutiveErrors: this.collectionStats.sourceStats[sourceId].consecutiveErrors
      };
      
      // 이벤트 발생
      this.emit('sourceCollectionError', errorResult);
      
      console.error(`Error collecting from ${sourceId}:`, error);
      throw error;
    }
  }
  
  /**
   * 수집 통계 가져오기
   * @returns {Object} 수집 통계
   */
  getCollectionStats() {
    return {
      ...this.collectionStats,
      activeSources: [...this.collectionTasks.keys()],
      sourceConfigs: [...this.sourceConfigs.entries()].map(([id, config]) => ({
        id,
        enabled: config.enabled,
        priority: config.priority,
        updateInterval: config.updateInterval
      }))
    };
  }
  
  /**
   * 특정 소스의 수집 통계 가져오기
   * @param {string} sourceId - 소스 ID
   * @returns {Object|null} 소스 통계 또는 null
   */
  getSourceStats(sourceId) {
    return this.collectionStats.sourceStats[sourceId] || null;
  }
  
  /**
   * 모든 소스에서 즉시 수집 실행
   * @returns {Promise<Object>} 수집 결과
   */
  async collectFromAllSources() {
    const results = {
      totalSources: 0,
      successfulSources: 0,
      failedSources: 0,
      skippedSources: 0,
      totalArticles: 0,
      savedArticles: 0,
      sourceResults: {}
    };
    
    // 활성화된 소스 필터링
    const enabledSources = [...this.sourceConfigs.entries()]
      .filter(([_, config]) => config.enabled)
      .map(([id]) => id);
    
    results.totalSources = enabledSources.length;
    
    console.log(`Starting immediate collection from ${enabledSources.length} sources`);
    
    // 각 소스별 수집 실행
    for (const sourceId of enabledSources) {
      try {
        const result = await this.collectFromSource(sourceId);
        
        if (result.status === 'success') {
          results.successfulSources++;
          results.totalArticles += result.totalArticles;
          results.savedArticles += result.savedArticles;
        } else if (result.status === 'skipped') {
          results.skippedSources++;
        }
        
        results.sourceResults[sourceId] = result;
      } catch (error) {
        results.failedSources++;
        results.sourceResults[sourceId] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    this.emit('allSourcesCollectionCompleted', results);
    
    console.log(`Immediate collection completed: ${results.successfulSources} successful, ${results.failedSources} failed, ${results.skippedSources} skipped`);
    console.log(`Total articles: ${results.totalArticles}, saved: ${results.savedArticles}`);
    
    return results;
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

// 모듈 내보내기
const newsCollector = new NewsCollector();
export default newsCollector; 