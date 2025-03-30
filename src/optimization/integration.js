/**
 * Financial Insight Hub Pro - 최적화 통합 모듈
 * 
 * 이 모듈은 최적화 엔진을 텍스트 분석 엔진 및 다른 모듈과 통합합니다.
 * 최적화된 분석 함수, 병렬 처리 함수, 캐싱된 API 호출 등을 제공합니다.
 */

import optimizationEngine from './optimization-engine.js';
import textAnalysisEngine from '../text_analysis/text-analysis-engine.js';
import financialRelevanceAnalyzer from '../text_analysis/financial-relevance-analyzer.js';
import sentimentAnalysisEngine from '../text_analysis/sentiment-analysis-engine.js';
import sectorAnalysisService from '../text_analysis/sector-analysis-service.js';
import insightGenerator from '../text_analysis/insight-generator.js';

/**
 * 최적화 통합 모듈 클래스
 * 최적화 엔진과 다른 모듈 통합
 */
class OptimizationIntegration {
  constructor() {
    this.isInitialized = false;
    this.optimizationEngine = optimizationEngine;
    this.textAnalysisEngine = textAnalysisEngine;
    this.financialRelevanceAnalyzer = financialRelevanceAnalyzer;
    this.sentimentAnalysisEngine = sentimentAnalysisEngine;
    this.sectorAnalysisService = sectorAnalysisService;
    this.insightGenerator = insightGenerator;
    
    // 최적화된 분석 함수
    this.optimizedFunctions = {};
  }
  
  /**
   * 통합 모듈 초기화
   * @param {Object} config - 초기화 설정
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('최적화 통합 모듈이 이미 초기화되었습니다');
      return true;
    }
    
    console.log('최적화 통합 모듈 초기화 중...');
    
    try {
      // 최적화 엔진 초기화
      await this.optimizationEngine.initialize(config.optimization);
      
      // 텍스트 분석 함수 최적화
      this.setupOptimizedFunctions();
      
      this.isInitialized = true;
      console.log('최적화 통합 모듈 초기화 완료');
      return true;
    } catch (error) {
      console.error('최적화 통합 모듈 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 최적화된 텍스트 분석 함수 설정
   */
  setupOptimizedFunctions() {
    // 금융 관련성 분석 함수 메모이제이션
    if (this.financialRelevanceAnalyzer && typeof this.financialRelevanceAnalyzer.analyze === 'function') {
      this.optimizedFunctions.analyzeFinancialRelevance = this.optimizationEngine.memoize(
        this.financialRelevanceAnalyzer.analyze.bind(this.financialRelevanceAnalyzer),
        'financial_relevance'
      );
    } else {
      console.warn('financialRelevanceAnalyzer.analyze 함수가 없습니다.');
      this.optimizedFunctions.analyzeFinancialRelevance = (text, language) => {
        console.warn('금융 관련성 분석 함수가 초기화되지 않았습니다.');
        return { score: 0.5, relevance: 'medium' };
      };
    }
    
    // 감성 분석 함수 메모이제이션
    if (this.sentimentAnalysisEngine && typeof this.sentimentAnalysisEngine.analyzeSentiment === 'function') {
      this.optimizedFunctions.analyzeSentiment = this.optimizationEngine.memoize(
        this.sentimentAnalysisEngine.analyzeSentiment.bind(this.sentimentAnalysisEngine),
        'sentiment'
      );
    } else {
      console.warn('sentimentAnalysisEngine.analyzeSentiment 함수가 없습니다.');
      this.optimizedFunctions.analyzeSentiment = (text, language) => {
        console.warn('감성 분석 함수가 초기화되지 않았습니다.');
        return { score: 0, label: 'neutral' };
      };
    }
    
    // 섹터 분류 함수 메모이제이션
    if (this.sectorAnalysisService && typeof this.sectorAnalysisService.classifySector === 'function') {
      this.optimizedFunctions.classifySector = this.optimizationEngine.memoize(
        this.sectorAnalysisService.classifySector.bind(this.sectorAnalysisService),
        'sector'
      );
    } else {
      console.warn('sectorAnalysisService.classifySector 함수가 없습니다.');
      this.optimizedFunctions.classifySector = (text, language) => {
        console.warn('섹터 분류 함수가 초기화되지 않았습니다.');
        return { topSector: 'unknown', scores: {}, percentages: {} };
      };
    }
    
    // 태그 추출 함수 메모이제이션
    if (this.textAnalysisEngine && typeof this.textAnalysisEngine.extractTags === 'function') {
      this.optimizedFunctions.extractTags = this.optimizationEngine.memoize(
        this.textAnalysisEngine.extractTags.bind(this.textAnalysisEngine),
        'tags'
      );
    } else {
      console.warn('textAnalysisEngine.extractTags 함수가 없습니다.');
      this.optimizedFunctions.extractTags = (text, language) => {
        console.warn('태그 추출 함수가 초기화되지 않았습니다.');
        return { tags: [] };
      };
    }
    
    // 인사이트 생성 함수 메모이제이션
    if (this.insightGenerator && typeof this.insightGenerator.generateInsight === 'function') {
      this.optimizedFunctions.generateInsight = this.optimizationEngine.memoize(
        this.insightGenerator.generateInsight.bind(this.insightGenerator),
        'insight'
      );
    } else {
      console.warn('insightGenerator.generateInsight 함수가 없습니다.');
      this.optimizedFunctions.generateInsight = (analysisResult) => {
        console.warn('인사이트 생성 함수가 초기화되지 않았습니다.');
        return null;
      };
    }
    
    console.log('텍스트 분석 함수 최적화 완료');
  }
  
  /**
   * 텍스트 병렬 분석 실행
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeTextParallel(text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('최적화 통합 모듈이 초기화되지 않았습니다');
    }
    
    console.log('텍스트 병렬 분석 시작');
    
    // 분석 시작 시간 측정
    const measureContext = this.optimizationEngine.startMeasure('text_analysis');
    
    // 병렬로 실행할 작업 정의
    const tasks = [
      // 금융 관련성 분석
      this.optimizedFunctions.analyzeFinancialRelevance.toString(),
      // 감성 분석
      this.optimizedFunctions.analyzeSentiment.toString(),
      // 섹터 분류
      this.optimizedFunctions.classifySector.toString(),
      // 태그 추출
      this.optimizedFunctions.extractTags.toString()
    ];
    
    // 각 작업의 인자 정의
    const argsArray = [
      [text, options.relevance || {}],
      [text, options.sentiment || {}],
      [text, options.sector || {}],
      [text, options.tags || {}]
    ];
    
    try {
      // 병렬로 작업 실행
      const [relevance, sentiment, sector, tags] = await this.optimizationEngine.runParallel(tasks, argsArray);
      
      // 분석 결과 통합
      const result = {
        relevance,
        sentiment,
        sector,
        tags,
        text: text.slice(0, 100) + (text.length > 100 ? '...' : '') // 텍스트 미리보기
      };
      
      // 인사이트 생성
      if (options.generateInsight !== false) {
        result.insight = await this.optimizedFunctions.generateInsight(result);
      }
      
      // 분석 완료 시간 측정
      const measureResult = this.optimizationEngine.endMeasure(measureContext);
      
      console.log(`텍스트 병렬 분석 완료 (${Math.round(measureResult.executionTime)}ms)`);
      
      // 성능 자동 조정
      this.optimizationEngine.autoTunePerformance();
      
      return result;
    } catch (error) {
      console.error('텍스트 병렬 분석 오류:', error);
      throw error;
    }
  }
  
  /**
   * 여러 기사 배치 분석
   * @param {Array<Object>} articles - 분석할 기사 배열
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Array<Object>>} 분석 결과 배열
   */
  async analyzeArticlesBatch(articles, options = {}) {
    if (!this.isInitialized) {
      throw new Error('최적화 통합 모듈이 초기화되지 않았습니다');
    }
    
    console.log(`${articles.length}개 기사 배치 분석 시작`);
    
    // 분석 시작 시간 측정
    const measureContext = this.optimizationEngine.startMeasure('batch_analysis');
    
    try {
      // 최대 병렬 처리 수 계산
      const batchSize = options.batchSize || 5;
      const results = [];
      
      // 기사를 배치로 나누어 처리
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        
        // 배치 내 기사를 병렬로 분석
        const batchPromises = batch.map(article => 
          this.analyzeTextParallel(article.content, options)
        );
        
        // 배치 결과 대기
        const batchResults = await Promise.all(batchPromises);
        
        // 결과 병합
        for (let j = 0; j < batch.length; j++) {
          results.push({
            ...batch[j],
            analysis: batchResults[j]
          });
        }
        
        console.log(`배치 ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(articles.length / batchSize)} 완료`);
      }
      
      // 분석 완료 시간 측정
      const measureResult = this.optimizationEngine.endMeasure(measureContext);
      
      console.log(`기사 배치 분석 완료: ${articles.length}개 (${Math.round(measureResult.executionTime)}ms)`);
      
      // 성능 자동 조정
      this.optimizationEngine.autoTunePerformance();
      
      return results;
    } catch (error) {
      console.error('기사 배치 분석 오류:', error);
      throw error;
    }
  }
  
  /**
   * 최적화 성능 지표 가져오기
   * @returns {Object} 성능 지표
   */
  getPerformanceMetrics() {
    if (!this.isInitialized) {
      throw new Error('최적화 통합 모듈이 초기화되지 않았습니다');
    }
    
    // 메모리 사용 통계 가져오기
    const memoryStats = this.optimizationEngine.memoryOptimizer.checkMemoryStatus();
    
    // 워커 성능 통계 가져오기
    const workerStats = this.optimizationEngine.workerManager.getPerformanceStats();
    
    // 캐싱 통계 가져오기
    const cacheStats = this.optimizationEngine.cachingSystem.getStats();
    
    // 코드 로딩 통계 가져오기
    const loaderStats = this.optimizationEngine.codeLoader.getStats();
    
    return {
      memory: memoryStats,
      workers: workerStats,
      cache: cacheStats,
      codeLoader: loaderStats,
      engine: this.optimizationEngine.performanceMetrics
    };
  }
  
  /**
   * 최적화 엔진 정리
   */
  cleanup() {
    if (!this.isInitialized) {
      return;
    }
    
    // 워커 종료
    this.optimizationEngine.workerManager.terminateAllWorkers();
    
    // 주기적 작업 중지
    this.optimizationEngine.memoryOptimizer.stopPeriodicMonitoring();
    this.optimizationEngine.cachingSystem.stopPeriodicPruning();
    
    console.log('최적화 엔진 정리 완료');
  }
  
  /**
   * 최적화된 분석기 반환
   * @returns {Object} 최적화된 분석기
   */
  getOptimizedAnalyzer() {
    console.log('최적화된 분석기 가져오기');
    
    if (!this.isInitialized) {
      console.warn('최적화 통합 모듈이 초기화되지 않았습니다. 일부 기능이 제한될 수 있습니다.');
    }
    
    // analyzeRelevance 함수 준비
    let analyzeRelevanceFunc;
    if (this.optimizedFunctions.analyzeFinancialRelevance) {
      analyzeRelevanceFunc = this.optimizedFunctions.analyzeFinancialRelevance;
    } else if (this.financialRelevanceAnalyzer && typeof this.financialRelevanceAnalyzer.analyze === 'function') {
      analyzeRelevanceFunc = this.financialRelevanceAnalyzer.analyze.bind(this.financialRelevanceAnalyzer);
    } else {
      console.warn('금융 관련성 분석 함수가 없습니다. 기본 함수를 제공합니다.');
      analyzeRelevanceFunc = (text, language) => ({ score: 0.5, relevance: 'medium' });
    }
    
    // classifySector 함수 준비
    let classifySectorFunc;
    if (this.optimizedFunctions.classifySector) {
      classifySectorFunc = this.optimizedFunctions.classifySector;
    } else if (this.sectorAnalysisService && typeof this.sectorAnalysisService.classifySector === 'function') {
      classifySectorFunc = this.sectorAnalysisService.classifySector.bind(this.sectorAnalysisService);
    } else {
      console.warn('섹터 분류 함수가 없습니다. 기본 함수를 제공합니다.');
      classifySectorFunc = (text, language) => ({ topSector: 'unknown', scores: {}, percentages: {} });
    }
    
    // extractTags 함수 준비
    let extractTagsFunc;
    if (this.optimizedFunctions.extractTags) {
      extractTagsFunc = this.optimizedFunctions.extractTags;
    } else if (this.textAnalysisEngine && typeof this.textAnalysisEngine.extractTags === 'function') {
      extractTagsFunc = this.textAnalysisEngine.extractTags.bind(this.textAnalysisEngine);
    } else {
      console.warn('태그 추출 함수가 없습니다. 기본 함수를 제공합니다.');
      extractTagsFunc = (text, language) => ({ tags: [] });
    }
    
    // analyze 함수 준비
    let analyzeFunc;
    if (this.textAnalysisEngine && typeof this.textAnalysisEngine.analyze === 'function') {
      analyzeFunc = this.textAnalysisEngine.analyze.bind(this.textAnalysisEngine);
    } else {
      console.warn('텍스트 분석 함수가 없습니다. 기본 함수를 제공합니다.');
      analyzeFunc = (text, language, options) => ({
        language: language || 'ko',
        relevance: { score: 0.5, relevance: 'medium' },
        sentiment: { score: 0, label: 'neutral' },
        sector: { topSector: 'unknown' },
        tags: { tags: [] }
      });
    }
    
    // 최적화된 분석기 반환
    return {
      analyzeRelevance: analyzeRelevanceFunc,
      classifySector: classifySectorFunc,
      extractTags: extractTagsFunc,
      analyze: analyzeFunc
    };
  }
  
  /**
   * 최적화된 감성 분석기 반환
   * @returns {Object} 최적화된 감성 분석기
   */
  getOptimizedSentimentAnalyzer() {
    console.log('최적화된 감성 분석기 가져오기');
    
    if (!this.isInitialized) {
      console.warn('최적화 통합 모듈이 초기화되지 않았습니다. 일부 기능이 제한될 수 있습니다.');
    }
    
    // analyze 함수 준비
    let analyzeFunc;
    if (this.optimizedFunctions.analyzeSentiment) {
      analyzeFunc = this.optimizedFunctions.analyzeSentiment;
    } else if (this.sentimentAnalysisEngine && typeof this.sentimentAnalysisEngine.analyzeSentiment === 'function') {
      analyzeFunc = this.sentimentAnalysisEngine.analyzeSentiment.bind(this.sentimentAnalysisEngine);
    } else {
      console.warn('감성 분석 함수가 없습니다. 기본 함수를 제공합니다.');
      analyzeFunc = (text, language) => ({ score: 0, label: 'neutral' });
    }
    
    // getSentimentLabel 함수 준비
    let getLabelFunc;
    if (this.sentimentAnalysisEngine && typeof this.sentimentAnalysisEngine.getSentimentLabel === 'function') {
      getLabelFunc = this.sentimentAnalysisEngine.getSentimentLabel.bind(this.sentimentAnalysisEngine);
    } else {
      console.warn('감성 라벨 함수가 없습니다. 기본 함수를 제공합니다.');
      getLabelFunc = (score) => {
        if (score >= 0.3) return '긍정';
        if (score <= -0.3) return '부정';
        return '중립';
      };
    }
    
    // 최적화된 감성 분석기 반환
    return {
      analyze: analyzeFunc,
      getSentimentLabel: getLabelFunc
    };
  }
  
  /**
   * 최적화된 키워드 추출기 반환
   * @returns {Object} 최적화된 키워드 추출기
   */
  getOptimizedKeywordExtractor() {
    console.log('최적화된 키워드 추출기 가져오기');
    
    if (!this.isInitialized) {
      console.warn('최적화 통합 모듈이 초기화되지 않았습니다. 일부 기능이 제한될 수 있습니다.');
    }
    
    // 최적화된 키워드 추출기 반환
    return {
      extract: this.optimizedFunctions.extractTags || 
              this.textAnalysisEngine.extractTags.bind(this.textAnalysisEngine)
    };
  }
  
  /**
   * 최적화된 추천 엔진 반환
   * @returns {Object} 최적화된 추천 엔진
   */
  getOptimizedRecommendationEngine() {
    console.log('최적화된 추천 엔진 가져오기');
    
    if (!this.isInitialized) {
      console.warn('최적화 통합 모듈이 초기화되지 않았습니다. 일부 기능이 제한될 수 있습니다.');
    }
    
    // 최적화된 추천 엔진 반환
    return {
      generateInsight: this.optimizedFunctions.generateInsight || 
                      this.insightGenerator.generateInsight.bind(this.insightGenerator)
    };
  }
}

// 최적화 통합 모듈 인스턴스 생성
const optimizationIntegration = new OptimizationIntegration();

// 중요 함수 내보내기
export const setupOptimizedFunctions = async (apiService) => {
  await optimizationIntegration.initialize();
  return true;
};

export const getOptimizedAnalyzer = () => {
  return optimizationIntegration.getOptimizedAnalyzer();
};

export const getOptimizedSentimentAnalyzer = () => {
  return optimizationIntegration.getOptimizedSentimentAnalyzer();
};

export const getOptimizedKeywordExtractor = () => {
  return optimizationIntegration.getOptimizedKeywordExtractor();
};

export const getOptimizedRecommendationEngine = () => {
  return optimizationIntegration.getOptimizedRecommendationEngine();
};

// 기본 내보내기
export default optimizationIntegration; 