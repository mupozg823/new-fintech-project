/**
 * Financial Insight Hub Pro - 일반 API 서비스
 * 
 * 이 모듈은 외부 API 종속성 없이 독립적으로 동작하는 기능을 제공합니다.
 * 실제 텍스트 분석, 주요 키워드 추출 등의 기능을 지원합니다.
 */

import financialRelevanceAnalyzer from '../../text_analysis/financial-relevance-analyzer.js';
import sentimentAnalysisEngine from '../../text_analysis/sentiment-analysis-engine.js';
import sectorAnalysisService from '../../text_analysis/sector-analysis-service.js';

/**
 * 독립형 API 서비스 클래스
 * 외부 API 의존성 없이 운영 가능
 */
class GeneralApiService {
  constructor() {
    this.isInitialized = false;
    this.eventListeners = {};
    this.relevanceAnalyzer = financialRelevanceAnalyzer;
    this.sentimentAnalyzer = sentimentAnalysisEngine;
    this.sectorAnalyzer = sectorAnalysisService;
    console.log('독립형 API 서비스 생성');
  }
  
  /**
   * API 서비스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    console.log('독립형 API 서비스 초기화 중...');
    
    try {
      // 내부 분석 엔진 초기화
      if (this.relevanceAnalyzer) {
        await this.relevanceAnalyzer.initialize();
      }
      
      if (this.sentimentAnalyzer) {
        await this.sentimentAnalyzer.initialize();
      }
      
      if (this.sectorAnalyzer) {
        await this.sectorAnalyzer.initialize();
      }
      
      this.isInitialized = true;
      console.log('독립형 API 서비스 초기화 완료');
      return true;
    } catch (error) {
      console.error('독립형 API 서비스 초기화 실패:', error);
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
   * @param {any} data - 이벤트 데이터
   */
  emit(event, data) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`이벤트 리스너 오류 (${event}):`, error);
        }
      });
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트 이름
   * @param {Function} listener - 리스너 함수
   */
  off(event, listener) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      if (listener) {
        // 특정 리스너만 제거
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      } else {
        // 모든 리스너 제거
        this.eventListeners[event] = [];
      }
    }
  }
  
  /**
   * 텍스트 분석 수행
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeText(text, options = {}) {
    if (!this.isInitialized) {
      console.warn('API 서비스가 초기화되지 않았습니다. 기본 분석 결과를 반환합니다.');
      return {
        relevance: { score: 0.5, label: '중간' },
        sentiment: { score: 0, label: '중립' },
        sector: { topSector: 'unknown', confidence: 0 },
        keywords: [],
        language: 'ko'
      };
    }
    
    try {
      console.log(`텍스트 분석 시작 (${text.length}자)`);
      
      // 기본 언어 감지 (간단 구현)
      const language = options.language || this.detectLanguage(text);
      
      // 병렬로 다양한 분석 실행
      const [relevance, sentiment, sector] = await Promise.all([
        // 금융 관련성 분석
        this.relevanceAnalyzer ? this.relevanceAnalyzer.analyze(text, language) : { score: 0.5, label: '중간' },
        
        // 감성 분석
        this.sentimentAnalyzer ? this.sentimentAnalyzer.analyze(text, language) : { score: 0, label: '중립' },
        
        // 섹터 분석
        this.sectorAnalyzer ? this.sectorAnalyzer.classifySector(text, language) : { topSector: 'unknown', confidence: 0 }
      ]);
      
      // 키워드 추출 (간단 구현)
      const keywords = this.extractKeywords(text, language);
      
      const result = {
        relevance,
        sentiment,
        sector,
        keywords,
        language
      };
      
      console.log('텍스트 분석 완료');
      
      // 분석 완료 이벤트 발생
      this.emit('analysisComplete', result);
      
      return result;
    } catch (error) {
      console.error('텍스트 분석 오류:', error);
      throw error;
    }
  }
  
  /**
   * 언어 감지 (간단 구현)
   * @param {string} text - 감지할 텍스트
   * @returns {string} 언어 코드
   */
  detectLanguage(text) {
    // 한글 감지
    if (/[가-힣]/.test(text)) {
      return 'ko';
    }
    
    // 일본어 감지
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) {
      return 'ja';
    }
    
    // 기본값은 영어
    return 'en';
  }
  
  /**
   * 키워드 추출 (간단 구현)
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 텍스트 언어
   * @returns {Array} 키워드 배열
   */
  extractKeywords(text, language) {
    // 공백으로 분할
    const words = text.split(/\s+/).filter(word => word.length > 1);
    
    // 불용어 (간단 구현)
    const stopwords = {
      ko: ['있는', '그리고', '그것은', '그것이', '있다', '그런', '그런데', '그럼', '이런', '저런', '그렇게'],
      en: ['the', 'and', 'is', 'in', 'to', 'of', 'that', 'for', 'it', 'as', 'with', 'on', 'at', 'this', 'be', 'by'],
      ja: ['これ', 'それ', 'あれ', 'この', 'その', 'あの', 'ここ', 'そこ', 'あそこ', 'こちら', 'これら', 'それら']
    };
    
    // 불용어 제거
    const filteredWords = words.filter(word => 
      !stopwords[language]?.includes(word.toLowerCase())
    );
    
    // 단어 빈도 계산
    const wordCounts = {};
    filteredWords.forEach(word => {
      const lower = word.toLowerCase();
      wordCounts[lower] = (wordCounts[lower] || 0) + 1;
    });
    
    // 빈도순 정렬 및 상위 키워드 반환
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        text: word,
        count,
        score: count / filteredWords.length
      }));
  }
  
  /**
   * 정리 작업
   */
  cleanup() {
    // 필요한 정리 작업 수행
    this.eventListeners = {};
    this.isInitialized = false;
    console.log('독립형 API 서비스 정리 완료');
  }
}

// 모듈 내보내기
const generalApiService = new GeneralApiService();
export default generalApiService; 