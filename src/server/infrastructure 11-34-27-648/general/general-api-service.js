/**
 * 일반 API 서비스
 * 외부 API에 의존하지 않고 금융 인사이트 허브 애플리케이션에 필요한 텍스트 분석 기능을 제공합니다.
 */

import FinancialRelevanceAnalyzer from '../../text_analysis/financial-relevance-analyzer.js';
import SentimentAnalysisEngine from '../../text_analysis/sentiment-analysis-engine.js';
import SectorAnalysisService from '../../text_analysis/sector-analysis-service.js';
import TextAnalysisEngine from '../../text_analysis/text-analysis-engine.js';
import InsightGenerator from '../../text_analysis/insight-generator.js';

/**
 * Financial Insight Hub 애플리케이션을 위한 범용 API 서비스
 * 외부 의존성 없이 애플리케이션에 필요한 분석 기능을 제공합니다.
 */
export default class GeneralApiService {
  constructor() {
    // 필요한 분석 엔진들 초기화
    this.financialRelevanceAnalyzer = null;
    this.sentimentAnalysisEngine = null;
    this.sectorClassifier = null;
    this.textAnalysisEngine = null;
    this.insightGenerator = null;
    
    // 상태 관리
    this.isInitialized = false;
    this.initialized = false;
    this.eventListeners = {};
    
    console.log('일반 API 서비스 인스턴스 생성됨');
  }
  
  /**
   * API 서비스 초기화
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('일반 API 서비스가 이미 초기화되었습니다');
      return;
    }
    
    console.log('일반 API 서비스 초기화 중...');
    
    try {
      // 분석 엔진 초기화 - 이미 초기화된 객체를 사용
      this.financialRelevanceAnalyzer = FinancialRelevanceAnalyzer;
      this.sentimentAnalysisEngine = SentimentAnalysisEngine;
      this.sectorClassifier = SectorAnalysisService;
      this.textAnalysisEngine = TextAnalysisEngine;
      this.insightGenerator = InsightGenerator;
      
      this.isInitialized = true;
      this.initialized = true;
      
      this.emit('initialized', { success: true });
      console.log('일반 API 서비스 초기화 완료');
      
      return this;
    } catch (error) {
      console.error('일반 API 서비스 초기화 실패:', error);
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(callback);
  }
  
  /**
   * 이벤트 발생
   * @param {string} event - 이벤트 이름
   * @param {any} data - 이벤트 데이터
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 핸들러 실행 중 오류 (${event}):`, error);
        }
      });
    }
  }
  
  /**
   * 텍스트 분석
   * 전달된 텍스트에 대한 종합적인 분석을 수행하고 결과를 반환합니다.
   * 
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeText(text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('일반 API 서비스가 초기화되지 않았습니다');
    }
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('분석할 텍스트가 없습니다');
    }
    
    console.log(`텍스트 분석 시작: 길이=${text.length}`);
    
    try {
      // 동시에 여러 분석 작업 수행
      const [
        relevanceAnalysis,
        sentimentAnalysis,
        sectorAnalysis,
        keywordExtraction
      ] = await Promise.all([
        // 금융 관련성 분석
        this.financialRelevanceAnalyzer.analyze(text, options),
        
        // 감성 분석
        this.sentimentAnalysisEngine.analyze(text, options),
        
        // 섹터 분류
        this.sectorClassifier.classifySector(text, options),
        
        // 키워드 추출
        this.textAnalysisEngine.extractTags(text, options)
      ]);
      
      // 모든 분석 결과 결합
      const analysisResult = {
        text: text.substring(0, 500) + (text.length > 500 ? '...' : ''), // 요약 텍스트
        relevance: relevanceAnalysis,
        sentiment: sentimentAnalysis,
        sectors: sectorAnalysis,
        keywords: keywordExtraction,
        timestamp: new Date().toISOString(),
        language: this.detectLanguage(text)
      };
      
      // 인사이트 생성
      if (options.generateInsights !== false) {
        analysisResult.insights = await this.insightGenerator.generateInsight(
          analysisResult.text,
          {
            relevance: analysisResult.relevance,
            sentiment: analysisResult.sentiment,
            sectors: analysisResult.sectors,
            keywords: analysisResult.keywords
          }
        );
      }
      
      console.log('텍스트 분석 완료');
      return analysisResult;
    } catch (error) {
      console.error('텍스트 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 언어 감지
   * 텍스트의 언어를 감지합니다. 간단한 휴리스틱 방법을 사용합니다.
   * 
   * @param {string} text - 언어를 감지할 텍스트
   * @returns {string} 감지된 언어 코드 (ko, en, ja, zh, 등)
   */
  detectLanguage(text) {
    if (!text || typeof text !== 'string') {
      return 'unknown';
    }
    
    const sample = text.substring(0, 200).toLowerCase();
    
    // 한글 문자 비율 확인
    const koreanChars = (sample.match(/[\uAC00-\uD7AF]/g) || []).length;
    
    // 일본어 문자 비율 확인
    const japaneseChars = (sample.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
    
    // 중국어 문자 비율 확인
    const chineseChars = (sample.match(/[\u4E00-\u9FFF]/g) || []).length;
    
    // 영어 문자 비율 확인
    const englishChars = (sample.match(/[a-zA-Z]/g) || []).length;
    
    // 가장 높은 비율의 언어 반환
    const counts = {
      ko: koreanChars,
      ja: japaneseChars,
      zh: chineseChars,
      en: englishChars
    };
    
    const detectedLanguage = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    
    // 언어 감지가 확실하지 않으면 (모든 문자 카운트가 너무 적으면) 기본값 반환
    const totalChars = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalChars < 10) {
      return 'en'; // 기본값은 영어
    }
    
    return detectedLanguage;
  }
  
  /**
   * 키워드 추출
   * 텍스트에서 중요 키워드를 추출합니다.
   * 
   * @param {string} text - 키워드를 추출할 텍스트
   * @param {Object} options - 추출 옵션
   * @returns {Promise<Array<string>>} 추출된 키워드 배열
   */
  async extractKeywords(text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('일반 API 서비스가 초기화되지 않았습니다');
    }
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return [];
    }
    
    try {
      const tags = await this.textAnalysisEngine.extractTags(text, options);
      return tags.map(tag => tag.text || tag);
    } catch (error) {
      console.error('키워드 추출 중 오류 발생:', error);
      return [];
    }
  }
  
  /**
   * 정리
   * 사용된 리소스를 정리합니다.
   */
  cleanup() {
    console.log('일반 API 서비스 정리');
    
    // 이벤트 리스너 정리
    this.eventListeners = {};
    
    // 분석 엔진 정리
    [
      this.financialRelevanceAnalyzer,
      this.sentimentAnalysisEngine,
      this.sectorClassifier,
      this.textAnalysisEngine,
      this.insightGenerator
    ].forEach(engine => {
      if (engine && typeof engine.cleanup === 'function') {
        try {
          engine.cleanup();
        } catch (error) {
          console.error(`엔진 정리 중 오류: ${error}`);
        }
      }
    });
    
    console.log('일반 API 서비스 정리 완료');
  }
} 