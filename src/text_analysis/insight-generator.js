/**
 * Financial Insight Hub Pro - 인사이트 생성기
 * 
 * 이 모듈은 분석된 금융 데이터를 바탕으로 인사이트를 생성합니다.
 * 시장 신호, 섹터 동향, 주요 뉴스 등 다양한 인사이트를 자동 생성합니다.
 */

import textAnalysisEngine from './text-analysis-engine.js';
import sectorAnalysisService from './sector-analysis-service.js';
import FinancialInsightData from '../infrastructure/data_structure/data-structure.js';

/**
 * 인사이트 생성기 클래스
 * 분석 결과를 기반으로 금융 인사이트 생성
 */
class InsightGenerator {
  constructor() {
    this.dataManager = FinancialInsightData.getManager();
    this.analysisEngine = textAnalysisEngine;
    this.sectorService = sectorAnalysisService;
    
    // 인사이트 템플릿
    this.templates = {
      market: {
        positive: [
          "{keyword} 관련 긍정적 시장 신호",
          "{keyword}(으)로 인한 시장 상승세",
          "{keyword} 호재로 시장 반응 긍정적"
        ],
        negative: [
          "{keyword} 관련 부정적 시장 신호",
          "{keyword}(으)로 인한 시장 하락세",
          "{keyword} 악재로 시장 반응 부정적"
        ],
        neutral: [
          "{keyword} 관련 시장 동향",
          "{keyword} 이슈 분석",
          "{keyword} 시장 영향 분석"
        ]
      },
      company: {
        positive: [
          "{company} 실적 호조 전망",
          "{company} 긍정적 신호",
          "{company} 관련 호재"
        ],
        negative: [
          "{company} 실적 부진 우려",
          "{company} 부정적 신호",
          "{company} 관련 악재"
        ],
        neutral: [
          "{company} 관련 주요 동향",
          "{company} 분석 리포트",
          "{company} 이슈 분석"
        ]
      },
      sector: {
        positive: [
          "{sector} 섹터 상승 추세",
          "{sector} 산업 호조 신호",
          "{sector} 섹터 긍정적 전망"
        ],
        negative: [
          "{sector} 섹터 하락 추세",
          "{sector} 산업 부진 신호",
          "{sector} 섹터 부정적 전망"
        ],
        neutral: [
          "{sector} 섹터 주요 동향",
          "{sector} 산업 현황 분석",
          "{sector} 섹터 이슈 분석"
        ]
      }
    };
    
    // 인사이트 카테고리 매핑
    this.categoryMapping = {
      market: '시장',
      company: '기업',
      sector: '섹터',
      economic: '경제',
      policy: '정책'
    };
  }
  
  /**
   * 인사이트 일괄 생성
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Object>} 생성 결과
   */
  async generateInsights(options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      marketInsights: true,
      companyInsights: true,
      sectorInsights: true,
      limit: 10,
      minConfidence: 60
    };
    
    const generateOptions = { ...defaultOptions, ...options };
    
    console.log('Generating insights with options:', generateOptions);
    
    // 결과 객체 초기화
    const results = {
      total: 0,
      generated: {
        market: 0,
        company: 0,
        sector: 0
      },
      insights: []
    };
    
    // 시장 인사이트 생성
    if (generateOptions.marketInsights) {
      const marketInsights = await this.generateMarketInsights(generateOptions);
      results.generated.market = marketInsights.length;
      results.insights.push(...marketInsights);
    }
    
    // 기업 인사이트 생성
    if (generateOptions.companyInsights) {
      const companyInsights = await this.generateCompanyInsights(generateOptions);
      results.generated.company = companyInsights.length;
      results.insights.push(...companyInsights);
    }
    
    // 섹터 인사이트 생성
    if (generateOptions.sectorInsights) {
      const sectorInsights = await this.generateSectorInsights(generateOptions);
      results.generated.sector = sectorInsights.length;
      results.insights.push(...sectorInsights);
    }
    
    // 전체 인사이트 수 계산
    results.total = results.insights.length;
    
    // 인사이트 제한 (최신순)
    if (generateOptions.limit > 0 && results.insights.length > generateOptions.limit) {
      results.insights = results.insights
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, generateOptions.limit);
    }
    
    console.log(`Generated ${results.total} insights:`, results.generated);
    return results;
  }
  
  /**
   * 시장 관련 인사이트 생성
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Array>} 생성된 인사이트 목록
   */
  async generateMarketInsights(options) {
    console.log('Generating market insights...');
    
    const insights = [];
    
    // 최근 분석된 기사 가져오기 (중요도 높은 순)
    const articles = this.getRecentAnalyzedArticles({
      minImportance: 7,
      days: 2,
      limit: 20
    });
    
    if (articles.length === 0) {
      console.log('No recent important articles for market insights');
      return insights;
    }
    
    console.log(`Found ${articles.length} recent important articles for market insights`);
    
    // 각 기사별 인사이트 생성 검토
    for (const article of articles) {
      // 분석 결과 가져오기
      const analysis = this.dataManager.getAnalysis(article.id);
      
      if (!analysis || analysis.importance < 7) {
        continue;
      }
      
      // 주요 키워드 추출
      const keywords = analysis.keywords ? Object.keys(analysis.keywords) : [];
      if (keywords.length === 0) {
        continue;
      }
      
      // 감성 라벨 결정
      let sentimentLabel;
      if (analysis.sentiment.score >= 0.3) {
        sentimentLabel = 'positive';
      } else if (analysis.sentiment.score <= -0.3) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      // 주요 키워드 선택
      const mainKeyword = keywords[0];
      
      // 인사이트 제목 템플릿 선택
      const templates = this.templates.market[sentimentLabel];
      const templateIndex = Math.floor(Math.random() * templates.length);
      const titleTemplate = templates[templateIndex];
      
      // 제목 생성
      const title = titleTemplate.replace('{keyword}', mainKeyword);
      
      // 설명 생성
      const description = `${article.title} ${sentimentLabel === 'positive' ? '긍정적' : sentimentLabel === 'negative' ? '부정적' : '중립적'} 영향 분석`;
      
      // 인사이트 유형 결정 (감성에 따라)
      let type = 'News';
      if (sentimentLabel === 'positive' && analysis.importance >= 8) {
        type = 'Trend';
      } else if (sentimentLabel === 'negative' && analysis.importance >= 8) {
        type = 'Alert';
      }
      
      // 인사이트 만료 시간 (24시간)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // 인사이트 신뢰도 계산
      const confidence = Math.min(100, analysis.importance * 10);
      
      // 최소 신뢰도 확인
      if (confidence < options.minConfidence) {
        continue;
      }
      
      // 인사이트 객체 생성
      const insight = {
        title,
        description,
        category: 'Market',
        type,
        confidence,
        relatedArticleIds: [article.id],
        expiresAt,
        metadata: {
          keyword: mainKeyword,
          sentiment: analysis.sentiment.score,
          sentimentLabel,
          importance: analysis.importance
        }
      };
      
      // 인사이트 저장
      const insightId = this.dataManager.saveInsight(insight);
      
      if (insightId) {
        console.log(`Generated market insight: ${title}`);
        insights.push({
          ...insight,
          id: insightId
        });
      }
    }
    
    return insights;
  }
  
  /**
   * 기업 관련 인사이트 생성
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Array>} 생성된 인사이트 목록
   */
  async generateCompanyInsights(options) {
    console.log('Generating company insights...');
    
    const insights = [];
    
    // 최근 기업 관련 기사 가져오기
    const articles = this.getRecentAnalyzedArticles({
      minImportance: 6,
      days: 3,
      limit: 30
    });
    
    if (articles.length === 0) {
      console.log('No recent articles for company insights');
      return insights;
    }
    
    // 기업명 추출 및 그룹화
    const companyArticles = {};
    
    for (const article of articles) {
      // 분석 결과 가져오기
      const analysis = this.dataManager.getAnalysis(article.id);
      
      if (!analysis || !analysis.entities) {
        continue;
      }
      
      // 기업 개체명 찾기
      const companyEntities = analysis.entities.filter(entity => 
        entity.type === 'ORGANIZATION' && entity.subtype === 'COMPANY'
      );
      
      for (const entity of companyEntities) {
        const companyName = entity.text;
        
        if (!companyArticles[companyName]) {
          companyArticles[companyName] = [];
        }
        
        companyArticles[companyName].push({
          article,
          analysis
        });
      }
    }
    
    console.log(`Found articles related to ${Object.keys(companyArticles).length} companies`);
    
    // 기업별 인사이트 생성
    for (const [company, articleData] of Object.entries(companyArticles)) {
      // 최소 2개 이상의 기사가 있는 기업만 처리
      if (articleData.length < 2) {
        continue;
      }
      
      // 기업 관련 기사의 평균 감성 점수 계산
      let totalSentiment = 0;
      let totalImportance = 0;
      const relatedArticleIds = [];
      
      for (const { article, analysis } of articleData) {
        totalSentiment += analysis.sentiment.score;
        totalImportance += analysis.importance;
        relatedArticleIds.push(article.id);
      }
      
      const averageSentiment = totalSentiment / articleData.length;
      const averageImportance = totalImportance / articleData.length;
      
      // 감성 라벨 결정
      let sentimentLabel;
      if (averageSentiment >= 0.3) {
        sentimentLabel = 'positive';
      } else if (averageSentiment <= -0.3) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      // 인사이트 제목 템플릿 선택
      const templates = this.templates.company[sentimentLabel];
      const templateIndex = Math.floor(Math.random() * templates.length);
      const titleTemplate = templates[templateIndex];
      
      // 제목 생성
      const title = titleTemplate.replace('{company}', company);
      
      // 설명 생성
      const mainArticle = articleData[0].article;
      const description = `${company} 관련 ${articleData.length}개 기사 분석: ${mainArticle.title}`;
      
      // 인사이트 유형 결정 (감성에 따라)
      let type = 'News';
      if (sentimentLabel === 'positive' && averageImportance >= 7) {
        type = 'Trend';
      } else if (sentimentLabel === 'negative' && averageImportance >= 7) {
        type = 'Alert';
      }
      
      // 인사이트 만료 시간 (36시간)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 36);
      
      // 인사이트 신뢰도 계산
      const confidence = Math.min(100, 60 + articleData.length * 5);
      
      // 최소 신뢰도 확인
      if (confidence < options.minConfidence) {
        continue;
      }
      
      // 인사이트 객체 생성
      const insight = {
        title,
        description,
        category: 'Company',
        type,
        confidence,
        relatedArticleIds,
        expiresAt,
        metadata: {
          company,
          articleCount: articleData.length,
          sentiment: averageSentiment,
          sentimentLabel,
          importance: averageImportance
        }
      };
      
      // 인사이트 저장
      const insightId = this.dataManager.saveInsight(insight);
      
      if (insightId) {
        console.log(`Generated company insight for ${company}: ${title}`);
        insights.push({
          ...insight,
          id: insightId
        });
      }
    }
    
    return insights;
  }
  
  /**
   * 섹터 관련 인사이트 생성
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Array>} 생성된 인사이트 목록
   */
  async generateSectorInsights(options) {
    console.log('Generating sector insights...');
    
    const insights = [];
    
    // 모든 섹터 분석 결과 가져오기
    const sectorAnalyses = this.sectorService.getAllSectorAnalyses();
    
    if (!sectorAnalyses || sectorAnalyses.length === 0) {
      console.log('No sector analyses available, updating sectors first');
      
      // 섹터 분석 업데이트
      await this.sectorService.updateAllSectorAnalyses();
      
      // 다시 가져오기
      const updatedSectorAnalyses = this.sectorService.getAllSectorAnalyses();
      
      if (!updatedSectorAnalyses || updatedSectorAnalyses.length === 0) {
        console.log('Still no sector analyses available after update');
        return insights;
      }
    }
    
    // 각 섹터별 인사이트 생성
    for (const sectorAnalysis of sectorAnalyses) {
      // 최소 기사 수 확인
      if (sectorAnalysis.articleCount < 3) {
        continue;
      }
      
      // 섹터 인사이트 생성
      const sectorInsight = this.sectorService.generateSectorInsight(sectorAnalysis.sector);
      
      if (sectorInsight) {
        // 최소 신뢰도 확인
        if (sectorInsight.confidence < options.minConfidence) {
          continue;
        }
        
        insights.push(sectorInsight);
      }
    }
    
    return insights;
  }
  
  /**
   * 최근 분석된 기사 가져오기
   * @param {Object} options - 필터링 옵션
   * @returns {Array} 기사 목록
   */
  getRecentAnalyzedArticles(options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      days: 3,
      minImportance: 0,
      limit: 50
    };
    
    const filterOptions = { ...defaultOptions, ...options };
    
    // 모든 기사 로드
    const allArticles = this.dataManager.getArticles();
    
    // 최근 N일 내 기사 필터링
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterOptions.days);
    
    // 최근 기사 필터링
    const recentArticles = allArticles.filter(article => {
      const publishedAt = new Date(article.publishedAt);
      return publishedAt >= cutoffDate;
    });
    
    // 분석 결과가 있는 기사 필터링
    const analyzedArticles = [];
    
    for (const article of recentArticles) {
      const analysis = this.dataManager.getAnalysis(article.id);
      
      // 분석 결과 및 중요도 확인
      if (analysis && analysis.importance >= filterOptions.minImportance) {
        analyzedArticles.push(article);
      }
    }
    
    // 중요도 순 정렬
    analyzedArticles.sort((a, b) => {
      const analysisA = this.dataManager.getAnalysis(a.id);
      const analysisB = this.dataManager.getAnalysis(b.id);
      
      return analysisB.importance - analysisA.importance;
    });
    
    // 개수 제한
    if (filterOptions.limit > 0 && analyzedArticles.length > filterOptions.limit) {
      return analyzedArticles.slice(0, filterOptions.limit);
    }
    
    return analyzedArticles;
  }
  
  /**
   * 인사이트 가져오기
   * @param {Object} options - 필터링 옵션
   * @returns {Array} 인사이트 목록
   */
  getInsights(options = {}) {
    return this.dataManager.getInsights(options);
  }
  
  /**
   * 인사이트 만료 확인 및 정리
   * @returns {number} 만료된 인사이트 수
   */
  cleanupExpiredInsights() {
    const allInsights = this.dataManager.getInsights();
    let expiredCount = 0;
    
    const now = new Date();
    
    for (const insight of allInsights) {
      // 만료일 확인
      if (insight.expiresAt && new Date(insight.expiresAt) < now) {
        // 만료된 인사이트 삭제
        this.dataManager.cache.delete('insights', insight.id);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired insights`);
    }
    
    return expiredCount;
  }

  /**
   * 단일 분석 결과에서 인사이트 생성
   * @param {Object} analysisResult - 분석 결과
   * @param {Object} options - 생성 옵션
   * @returns {Object} 생성된 인사이트
   */
  generateInsight(analysisResult, options = {}) {
    console.log('단일 분석 결과에서 인사이트 생성 시작');
    
    if (!analysisResult) {
      console.warn('분석 결과가 없어 인사이트를 생성할 수 없습니다');
      return null;
    }
    
    try {
      // 기본 옵션 설정
      const insightOptions = {
        minConfidence: options.minConfidence || 65,
        insightType: options.insightType || 'all',
        ...options
      };
      
      // 필수 분석 결과 확인
      const hasRequiredAnalysis = analysisResult.relevance && 
                                 analysisResult.sentiment && 
                                 analysisResult.sector;
                                 
      if (!hasRequiredAnalysis) {
        console.warn('필수 분석 결과(relevance, sentiment, sector)가 없어 인사이트를 생성할 수 없습니다');
        return null;
      }
      
      // 신뢰도 점수 계산
      const confidenceScore = this.calculateConfidenceScore(analysisResult);
      
      // 최소 신뢰도 미달 시 인사이트 생성 중단
      if (confidenceScore < insightOptions.minConfidence) {
        console.log(`인사이트 신뢰도 점수(${confidenceScore})가 최소 요구 점수(${insightOptions.minConfidence})보다 낮습니다`);
        return null;
      }
      
      // 인사이트 타입에 따른 생성 함수 호출
      let insight;
      const text = analysisResult.text || '';
      const preview = text.length > 100 ? `${text.substring(0, 100)}...` : text;
      
      // 인사이트 타입 결정
      let insightType = insightOptions.insightType;
      if (insightType === 'all') {
        // 주요 섹터에 따라 인사이트 타입 결정
        const topSector = analysisResult.sector.topSector;
        if (topSector === 'finance' || topSector === 'market') {
          insightType = 'market';
        } else if (topSector === 'company' || topSector === 'stock') {
          insightType = 'company';
        } else {
          insightType = 'sector';
        }
      }
      
      // 인사이트 생성
      switch (insightType) {
        case 'market':
          insight = this.createMarketInsight(analysisResult, preview);
          break;
        case 'company':
          insight = this.createCompanyInsight(analysisResult, preview);
          break;
        case 'sector':
          insight = this.createSectorInsight(analysisResult, preview);
          break;
        default:
          insight = this.createGeneralInsight(analysisResult, preview);
      }
      
      // 메타데이터 추가
      insight.confidenceScore = confidenceScore;
      insight.generatedAt = new Date().toISOString();
      insight.source = {
        text: preview,
        analysisId: analysisResult.id || null
      };
      
      console.log(`인사이트 생성 완료: 타입=${insightType}, 신뢰도=${confidenceScore}%`);
      
      return insight;
    } catch (error) {
      console.error('인사이트 생성 중 오류 발생:', error);
      return null;
    }
  }

  /**
   * 분석 결과의 신뢰도 점수 계산
   * @param {Object} analysisResult - 분석 결과
   * @returns {number} 신뢰도 점수 (0-100)
   */
  calculateConfidenceScore(analysisResult) {
    let score = 0;
    
    // 금융 관련성 점수 반영 (0-40점)
    if (analysisResult.relevance && typeof analysisResult.relevance.score === 'number') {
      score += analysisResult.relevance.score * 40;
    }
    
    // 감성 분석 신뢰도 반영 (0-30점)
    if (analysisResult.sentiment && typeof analysisResult.sentiment.confidence === 'number') {
      score += analysisResult.sentiment.confidence * 30;
    } else if (analysisResult.sentiment) {
      // 기본 신뢰도 할당
      score += 15;
    }
    
    // 섹터 분석 확실성 반영 (0-30점)
    if (analysisResult.sector && analysisResult.sector.scores) {
      const topScore = Object.values(analysisResult.sector.scores).sort((a, b) => b - a)[0] || 0;
      score += topScore * 30;
    } else if (analysisResult.sector) {
      // 기본 신뢰도 할당
      score += 15;
    }
    
    return Math.round(score);
  }

  /**
   * 시장 인사이트 생성
   * @param {Object} analysisResult - 분석 결과
   * @param {string} textPreview - 텍스트 미리보기
   * @returns {Object} 시장 인사이트
   */
  createMarketInsight(analysisResult, textPreview) {
    const sentiment = analysisResult.sentiment || {};
    const sentimentLabel = sentiment.label || '중립';
    const sentimentScore = sentiment.score || 0;
    
    // 인사이트 메시지 생성
    let message = '';
    if (sentimentScore > 0.5) {
      message = `시장 긍정적 전망: ${textPreview}`;
    } else if (sentimentScore < -0.3) {
      message = `시장 부정적 신호: ${textPreview}`;
    } else {
      message = `시장 중립적 동향: ${textPreview}`;
    }
    
    return {
      type: 'market',
      message,
      sentiment: sentimentLabel,
      tags: analysisResult.tags ? analysisResult.tags.tags.slice(0, 5) : []
    };
  }

  /**
   * 기업 인사이트 생성
   * @param {Object} analysisResult - 분석 결과
   * @param {string} textPreview - 텍스트 미리보기
   * @returns {Object} 기업 인사이트
   */
  createCompanyInsight(analysisResult, textPreview) {
    const sentiment = analysisResult.sentiment || {};
    const sentimentLabel = sentiment.label || '중립';
    
    // 인사이트 메시지 생성
    let message = `기업 분석: ${sentimentLabel} 동향`;
    if (textPreview) {
      message += ` - ${textPreview}`;
    }
    
    return {
      type: 'company',
      message,
      sentiment: sentimentLabel,
      tags: analysisResult.tags ? analysisResult.tags.tags.slice(0, 5) : []
    };
  }

  /**
   * 섹터 인사이트 생성
   * @param {Object} analysisResult - 분석 결과
   * @param {string} textPreview - 텍스트 미리보기
   * @returns {Object} 섹터 인사이트
   */
  createSectorInsight(analysisResult, textPreview) {
    const sector = analysisResult.sector || {};
    const topSector = sector.topSector || '미분류';
    const sentiment = analysisResult.sentiment || {};
    const sentimentLabel = sentiment.label || '중립';
    
    // 인사이트 메시지 생성
    let message = `${this.getSectorName(topSector)} 섹터: ${sentimentLabel} 신호`;
    if (textPreview) {
      message += ` - ${textPreview}`;
    }
    
    return {
      type: 'sector',
      message,
      sector: topSector,
      sentiment: sentimentLabel,
      tags: analysisResult.tags ? analysisResult.tags.tags.slice(0, 5) : []
    };
  }

  /**
   * 일반 인사이트 생성
   * @param {Object} analysisResult - 분석 결과
   * @param {string} textPreview - 텍스트 미리보기
   * @returns {Object} 일반 인사이트
   */
  createGeneralInsight(analysisResult, textPreview) {
    const sentiment = analysisResult.sentiment || {};
    const sentimentLabel = sentiment.label || '중립';
    
    // 인사이트 메시지 생성
    let message = `금융 인사이트: ${sentimentLabel}`;
    if (textPreview) {
      message += ` - ${textPreview}`;
    }
    
    return {
      type: 'general',
      message,
      sentiment: sentimentLabel,
      tags: analysisResult.tags ? analysisResult.tags.tags.slice(0, 5) : []
    };
  }
  
  /**
   * 섹터 코드에 해당하는 한글 이름 반환
   * @param {string} sectorCode - 섹터 코드
   * @returns {string} 섹터 한글 이름
   */
  getSectorName(sectorCode) {
    const sectorNames = {
      'finance': '금융',
      'market': '시장',
      'stock': '주식',
      'banking': '은행',
      'insurance': '보험',
      'realestate': '부동산',
      'tech': '기술',
      'energy': '에너지',
      'consumer': '소비재',
      'health': '헬스케어',
      'industry': '산업',
      'telecom': '통신',
      'materials': '소재',
      'utilities': '유틸리티'
    };
    
    return sectorNames[sectorCode] || sectorCode;
  }
}

// 모듈 내보내기
const insightGenerator = new InsightGenerator();
export default insightGenerator;