/**
 * Financial Insight Hub Pro - 섹터 분석 서비스
 * 
 * 이 모듈은 금융 데이터의 섹터(분야) 분석 기능을 제공합니다.
 * 기사 내용을 분석하여 관련 섹터를 식별하고, 섹터별 동향을 추적합니다.
 */

// 순환 참조 문제를 해결하기 위해 직접 import 제거
// import textAnalysisEngine from './text-analysis-engine.js';
import FinancialInsightData from '../infrastructure/data_structure/data-structure.js';

/**
 * 섹터 분석 서비스 클래스
 * 금융 데이터의 섹터 관련 분석 기능 제공
 */
class SectorAnalysisService {
  constructor() {
    this.dataManager = FinancialInsightData.getManager();
    // 분석 엔진은 지연 초기화
    this.analysisEngine = null;
    this.sectorAnalyses = {};
    this.sectorKeywords = {
      // 금융 섹터 키워드
      finance: {
        ko: ["은행", "보험", "증권", "카드", "대출", "저축", "예금", "투자", "주식", "채권", "펀드", "금리"],
        en: ["bank", "insurance", "securities", "card", "loan", "savings", "deposit", "investment", "stock"]
      },
      // 기술 섹터 키워드
      tech: {
        ko: ["IT", "소프트웨어", "하드웨어", "인터넷", "통신", "반도체", "클라우드", "인공지능", "빅데이터"],
        en: ["IT", "software", "hardware", "internet", "telecom", "semiconductor", "cloud", "AI", "big data"]
      },
      // 헬스케어 섹터 키워드
      healthcare: {
        ko: ["의료", "제약", "바이오", "병원", "건강", "치료", "의약품", "진단", "환자"],
        en: ["medical", "pharma", "bio", "hospital", "health", "treatment", "drug", "diagnosis", "patient"]
      },
      // 에너지 섹터 키워드
      energy: {
        ko: ["에너지", "석유", "가스", "전력", "발전", "신재생", "태양광", "풍력", "배터리"],
        en: ["energy", "oil", "gas", "power", "electricity", "renewable", "solar", "wind", "battery"]
      },
      // 산업재 섹터 키워드
      industrial: {
        ko: ["산업", "제조", "기계", "장비", "공장", "건설", "조선", "철강", "화학"],
        en: ["industrial", "manufacturing", "machinery", "equipment", "factory", "construction", "shipbuilding"]
      }
    };
    
    this.isInitialized = false;
  }
  
  /**
   * 서비스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('섹터 분석 서비스가 이미 초기화되었습니다');
      return true;
    }
    
    console.log('섹터 분석 서비스 초기화 중...');
    
    try {
      // 텍스트 분석 엔진을 지연 초기화
      if (!this.analysisEngine) {
        const textAnalysisModule = await import('./text-analysis-engine.js');
        this.analysisEngine = textAnalysisModule.default;
      }
      
      // 기존 섹터 분석 데이터 로드
      await this.loadSectorAnalyses();
      
      this.isInitialized = true;
      console.log('섹터 분석 서비스 초기화 완료');
      return true;
    } catch (error) {
      console.error('섹터 분석 서비스 초기화 실패:', error);
      return false;
    }
  }
  
  /**
   * 기존 섹터 분석 데이터 로드
   * @returns {Promise<boolean>} 로드 성공 여부
   */
  async loadSectorAnalyses() {
    try {
      // DB나 캐시에서 데이터 로드하는 코드 (향후 구현)
      this.sectorAnalyses = {};
      return true;
    } catch (error) {
      console.error('섹터 분석 데이터 로드 실패:', error);
      return false;
    }
  }
  
  /**
   * 텍스트의 섹터 분류
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 언어 코드
   * @returns {Object} 섹터 분류 결과
   */
  classifySector(text, language = 'ko') {
    if (!text) {
      return { topSector: null, scores: {}, percentages: {} };
    }
    
    // 분석 엔진 초기화 확인
    if (!this.analysisEngine) {
      console.log('분석 엔진이 초기화되지 않았습니다. 지연 초기화를 시도합니다.');
      // 동기적으로 모듈 가져오기
      try {
        const textAnalysisModule = require('./text-analysis-engine.js');
        this.analysisEngine = textAnalysisModule.default;
      } catch (error) {
        console.error('분석 엔진 지연 초기화 실패:', error);
        // 기본 구현으로 대체
        return this.fallbackSectorClassification(text, language);
      }
    }
    
    try {
      // 텍스트 분석 엔진을 통해 섹터 분류
      return this.analysisEngine.classifySector(text, language);
    } catch (error) {
      console.error('섹터 분류 중 오류 발생:', error);
      // 오류 발생 시 자체 구현 사용
      return this.fallbackSectorClassification(text, language);
    }
  }
  
  /**
   * 대체 섹터 분류 메서드 (분석 엔진 사용 불가 시)
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 언어 코드
   * @returns {Object} 섹터 분류 결과
   */
  fallbackSectorClassification(text, language = 'ko') {
    // 각 섹터별 점수
    const scores = {};
    
    // 각 섹터별 키워드 검색
    Object.keys(this.sectorKeywords).forEach(sector => {
      let sectorScore = 0;
      
      // 언어별 키워드 목록
      const keywords = this.sectorKeywords[sector][language] || this.sectorKeywords[sector]['en'];
      
      if (keywords) {
        keywords.forEach(keyword => {
          // 대소문자 구분 없이 포함 여부 확인
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = text.match(regex) || [];
          sectorScore += matches.length;
        });
      }
      
      scores[sector] = sectorScore;
    });
    
    // 총점 계산
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    // 비율 계산
    const percentages = {};
    
    if (totalScore > 0) {
      Object.keys(scores).forEach(sector => {
        percentages[sector] = Math.round((scores[sector] / totalScore) * 100);
      });
    } else {
      // 기본 점수 (균등 분배)
      const defaultPercentage = Math.floor(100 / Object.keys(scores).length);
      Object.keys(scores).forEach(sector => {
        percentages[sector] = defaultPercentage;
      });
    }
    
    // 최고 점수 섹터 찾기
    let topSector = Object.keys(scores)[0];
    let topScore = scores[topSector];
    
    Object.keys(scores).forEach(sector => {
      if (scores[sector] > topScore) {
        topSector = sector;
        topScore = scores[sector];
      }
    });
    
    return {
      scores,
      percentages,
      topSector,
      topScore
    };
  }
  
  /**
   * 기사 분석 결과에서 섹터 정보 추출
   * @param {Object} article - 기사 객체
   * @returns {Object} 섹터 분석 결과
   */
  extractSectorInfo(article) {
    if (!article || !article.content) {
      return { mainSector: 'unknown', sectors: [] };
    }
    
    // 기사 내용에서 섹터 분류
    const title = article.title || '';
    const content = article.content || '';
    const language = article.language || 'ko';
    
    // 제목과 내용에서 섹터 분류 (제목에 가중치 부여)
    const titleSectors = this.classifySector(title, language)
      .map(item => ({ ...item, score: item.score * 2 }));
    const contentSectors = this.classifySector(content, language);
    
    // 섹터 점수 통합
    const sectorMap = {};
    
    [...titleSectors, ...contentSectors].forEach(item => {
      if (!sectorMap[item.sector]) {
        sectorMap[item.sector] = 0;
      }
      sectorMap[item.sector] += item.score;
    });
    
    // 통합 결과 생성
    const sectors = Object.entries(sectorMap)
      .map(([sector, score]) => ({ sector, score }))
      .sort((a, b) => b.score - a.score);
    
    // 주요 섹터 결정
    const mainSector = sectors.length > 0 ? sectors[0].sector : 'unknown';
    
    return {
      mainSector,
      sectors
    };
  }
  
  /**
   * 섹터별 기사 데이터 업데이트
   * @param {Object} article - 기사 객체
   * @returns {Object} 업데이트된 섹터 정보
   */
  updateSectorData(article) {
    if (!article || !article.id) {
      return null;
    }
    
    // 기사에서 섹터 정보 추출
    const sectorInfo = this.extractSectorInfo(article);
    
    // 섹터별 데이터 업데이트
    sectorInfo.sectors.forEach(({ sector, score }) => {
      if (!this.sectorAnalyses[sector]) {
        this.sectorAnalyses[sector] = {
          sector,
          articleCount: 0,
          articles: [],
          lastUpdated: null,
          sentimentScore: 0,
          trendDirection: 'neutral'
        };
      }
      
      const sectorData = this.sectorAnalyses[sector];
      
      // 이미 추가된 기사인지 확인
      if (!sectorData.articles.some(a => a.id === article.id)) {
        // 기사 추가
        sectorData.articles.push({
          id: article.id,
          title: article.title,
          date: article.publishedAt || new Date(),
          relevance: score,
          sentiment: article.analysis && article.analysis.sentiment ? article.analysis.sentiment.score : 0
        });
        
        // 최신 50개 기사만 유지
        if (sectorData.articles.length > 50) {
          sectorData.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
          sectorData.articles = sectorData.articles.slice(0, 50);
        }
        
        // 통계 업데이트
        sectorData.articleCount = sectorData.articles.length;
        sectorData.lastUpdated = new Date();
        
        // 감성 점수 업데이트
        sectorData.sentimentScore = this.calculateAverageSentiment(sectorData.articles);
        
        // 추세 방향 업데이트
        sectorData.trendDirection = this.calculateTrendDirection(sectorData.articles);
      }
    });
    
    return {
      mainSector: sectorInfo.mainSector,
      sectors: sectorInfo.sectors
    };
  }
  
  /**
   * 기사 목록의 평균 감성 점수 계산
   * @param {Array} articles - 기사 목록
   * @returns {number} 평균 감성 점수
   */
  calculateAverageSentiment(articles) {
    if (!articles || articles.length === 0) {
      return 0;
    }
    
    const validArticles = articles.filter(a => typeof a.sentiment === 'number');
    
    if (validArticles.length === 0) {
      return 0;
    }
    
    const sum = validArticles.reduce((total, article) => total + article.sentiment, 0);
    return sum / validArticles.length;
  }
  
  /**
   * 기사 목록의 추세 방향 계산
   * @param {Array} articles - 기사 목록
   * @returns {string} 추세 방향 ('positive', 'negative', 'neutral')
   */
  calculateTrendDirection(articles) {
    if (!articles || articles.length < 5) {
      return 'neutral';
    }
    
    // 최신 기사 기준으로 정렬
    const sortedArticles = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 최신 5개 기사와 이전 5개 기사 감성 점수 비교
    const recent = sortedArticles.slice(0, 5);
    const previous = sortedArticles.slice(5, 10);
    
    if (previous.length === 0) {
      return 'neutral';
    }
    
    const recentAvg = this.calculateAverageSentiment(recent);
    const previousAvg = this.calculateAverageSentiment(previous);
    
    const diff = recentAvg - previousAvg;
    
    if (diff > 0.2) {
      return 'positive';
    } else if (diff < -0.2) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * 모든 섹터 분석 데이터 업데이트
   * @returns {Promise<boolean>} 업데이트 성공 여부
   */
  async updateAllSectorAnalyses() {
    try {
      // 모든 기사 가져오기
      const articles = this.dataManager.getAllArticles();
      
      // 섹터 데이터 초기화
      this.sectorAnalyses = {};
      
      // 모든 기사에 대해 섹터 데이터 업데이트
      articles.forEach(article => {
        this.updateSectorData(article);
      });
      
      return true;
    } catch (error) {
      console.error('섹터 분석 데이터 업데이트 실패:', error);
      return false;
    }
  }
  
  /**
   * 모든 섹터 분석 데이터 가져오기
   * @returns {Object} 모든 섹터 분석 데이터
   */
  getAllSectorAnalyses() {
    return this.sectorAnalyses;
  }
  
  /**
   * 특정 섹터의 분석 데이터 가져오기
   * @param {string} sector - 섹터 이름
   * @returns {Object} 섹터 분석 데이터
   */
  getSectorAnalysis(sector) {
    return this.sectorAnalyses[sector] || null;
  }
  
  /**
   * 섹터 데이터로부터 인사이트 생성
   * @param {string} sector - 섹터 이름
   * @returns {Object} 생성된 인사이트
   */
  generateSectorInsight(sector) {
    const sectorData = this.getSectorAnalysis(sector);
    
    if (!sectorData) {
      return null;
    }
    
    // 인사이트 생성 로직
    const now = new Date();
    const insight = {
      id: `sector-${sector}-${now.getTime()}`,
      type: 'sector',
      category: 'sector',
      title: `${this.getSectorKoreanName(sector)} 섹터 분석`,
      summary: this.generateSectorSummary(sectorData),
      content: this.generateSectorContent(sectorData),
      importance: this.calculateSectorImportance(sectorData),
      createdAt: now,
      tags: [sector, '섹터분석', sectorData.trendDirection],
      relatedArticles: sectorData.articles.slice(0, 5).map(a => a.id)
    };
    
    return insight;
  }
  
  /**
   * 섹터 영문명을 한글명으로 변환
   * @param {string} sector - 섹터 영문명
   * @returns {string} 섹터 한글명
   */
  getSectorKoreanName(sector) {
    const sectorMap = {
      finance: '금융',
      tech: '기술',
      healthcare: '헬스케어',
      energy: '에너지',
      industrial: '산업재',
      consumer: '소비재',
      materials: '소재',
      communication: '통신',
      utilities: '유틸리티',
      realestate: '부동산'
    };
    
    return sectorMap[sector] || sector;
  }
  
  /**
   * 섹터 데이터로부터 요약 생성
   * @param {Object} sectorData - 섹터 분석 데이터
   * @returns {string} 생성된 요약 텍스트
   */
  generateSectorSummary(sectorData) {
    const sentimentText = this.getSentimentText(sectorData.sentimentScore);
    const trendText = this.getTrendText(sectorData.trendDirection);
    
    return `${this.getSectorKoreanName(sectorData.sector)} 섹터는 현재 ${sentimentText} 상태이며, ${trendText}. 최근 ${sectorData.articleCount}개의 관련 기사가 발행되었습니다.`;
  }
  
  /**
   * 섹터 데이터로부터 본문 생성
   * @param {Object} sectorData - 섹터 분석 데이터
   * @returns {string} 생성된 본문 텍스트
   */
  generateSectorContent(sectorData) {
    // 최신 기사 3개 제목 추출
    const recentArticles = sectorData.articles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
    
    const articlesList = recentArticles
      .map(a => `- ${a.title}`)
      .join('\n');
    
    const sectorName = this.getSectorKoreanName(sectorData.sector);
    const sentimentText = this.getSentimentText(sectorData.sentimentScore);
    const trendText = this.getTrendText(sectorData.trendDirection);
    
    return `# ${sectorName} 섹터 분석

## 현재 상태
${sectorName} 섹터는 현재 ${sentimentText} 상태입니다. 지난 분석 대비 ${trendText}.

## 주요 지표
- 관련 기사 수: ${sectorData.articleCount}개
- 평균 감성 점수: ${(sectorData.sentimentScore * 5 + 5).toFixed(1)}/10
- 최근 업데이트: ${this.formatDate(sectorData.lastUpdated)}

## 최근 주요 기사
${articlesList}

이 분석은 최근 수집된 뉴스 기사를 기반으로 합니다. 실제 투자 결정에 참고하기 전 추가 검토가 필요합니다.`;
  }
  
  /**
   * 감성 점수에 따른 텍스트 반환
   * @param {number} score - 감성 점수 (-1 ~ 1)
   * @returns {string} 감성 텍스트
   */
  getSentimentText(score) {
    if (score > 0.6) {
      return '매우 긍정적인';
    } else if (score > 0.2) {
      return '긍정적인';
    } else if (score > -0.2) {
      return '중립적인';
    } else if (score > -0.6) {
      return '부정적인';
    } else {
      return '매우 부정적인';
    }
  }
  
  /**
   * 추세 방향에 따른 텍스트 반환
   * @param {string} trend - 추세 방향
   * @returns {string} 추세 텍스트
   */
  getTrendText(trend) {
    switch (trend) {
      case 'positive':
        return '상승 추세를 보이고 있습니다';
      case 'negative':
        return '하락 추세를 보이고 있습니다';
      default:
        return '안정적인 추세를 유지하고 있습니다';
    }
  }
  
  /**
   * 날짜 포맷팅
   * @param {Date} date - 날짜 객체
   * @returns {string} 포맷팅된 날짜 문자열
   */
  formatDate(date) {
    if (!date) return '알 수 없음';
    
    try {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch (error) {
      return '알 수 없음';
    }
  }
  
  /**
   * 섹터 중요도 계산
   * @param {Object} sectorData - 섹터 분석 데이터
   * @returns {number} 중요도 점수 (0-10)
   */
  calculateSectorImportance(sectorData) {
    if (!sectorData) {
      return 5;
    }
    
    let importance = 5; // 기본값
    
    // 기사 수에 따른 중요도 조정
    if (sectorData.articleCount > 30) {
      importance += 2;
    } else if (sectorData.articleCount > 15) {
      importance += 1;
    }
    
    // 감성 점수의 절대값에 따른 중요도 조정
    const sentimentAbs = Math.abs(sectorData.sentimentScore);
    if (sentimentAbs > 0.6) {
      importance += 2;
    } else if (sentimentAbs > 0.3) {
      importance += 1;
    }
    
    // 추세 방향에 따른 중요도 조정
    if (sectorData.trendDirection !== 'neutral') {
      importance += 1;
    }
    
    // 0-10 범위로 제한
    return Math.max(0, Math.min(10, importance));
  }
  
  /**
   * 리소스 정리
   */
  cleanup() {
    console.log('섹터 분석 서비스 정리 중...');
    this.sectorAnalyses = {};
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스 생성
const sectorAnalysisService = new SectorAnalysisService();

export default sectorAnalysisService; 