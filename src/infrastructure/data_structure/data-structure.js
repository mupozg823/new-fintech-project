/**
 * Financial Insight Hub Pro - 데이터 구조 정의
 * 
 * 이 파일은 애플리케이션에서 사용될 핵심 데이터 구조와 캐싱 전략을 정의합니다.
 * Poe Canvas 환경의 제한사항(웹 스토리지 API 사용 불가)을 고려하여 설계되었습니다.
 */

// ========================================================================
// 1. 뉴스 데이터 스키마 정의
// 
// ========================================================================

/**
 * @typedef {Object} NewsArticle - 뉴스 기사의 기본 스키마
 * @property {string} id - 기사의 고유 식별자 (UUID)
 * @property {string} title - 기사 제목
 * @property {string} content - 기사 전문
 * @property {string} summary - 기사 요약 (있을 경우)
 * @property {string} url - 원본 기사 URL
 * @property {string} source - 뉴스 소스 (예: 네이버 금융, Bloomberg)
 * @property {string} sourceCountry - 뉴스 소스 국가 (KR, US, JP 등)
 * @property {string} language - 기사 언어 (ko, en, ja 등)
 * @property {Date} publishedAt - 발행 일시
 * @property {Date} collectedAt - 수집 일시
 * @property {string[]} categories - 기사 카테고리 (예: 경제, 금융, 주식)
 * @property {string[]} tags - 기사 태그
 * @property {Object} metadata - 추가 메타데이터
 */

/**
 * 뉴스 기사 객체 생성 함수
 * @param {Object} data - 기사 데이터
 * @returns {NewsArticle} 구조화된 뉴스 기사 객체
 */
function createNewsArticle(data) {
  return {
    id: data.id || generateUUID(),
    title: data.title || '',
    content: data.content || '',
    summary: data.summary || '',
    url: data.url || '',
    source: data.source || '',
    sourceCountry: data.sourceCountry || '',
    language: data.language || detectLanguage(data.content),
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
    collectedAt: new Date(),
    categories: data.categories || [],
    tags: data.tags || [],
    metadata: data.metadata || {}
  };
}

/**
 * 뉴스 소스 정보 스키마
 * @typedef {Object} NewsSource
 * @property {string} id - 소스 고유 식별자
 * @property {string} name - 소스 이름 (예: Bloomberg, 네이버 금융)
 * @property {string} url - 소스 기본 URL
 * @property {string} country - 소스 국가 코드 (KR, US, JP 등)
 * @property {string} language - 소스 주 언어 (ko, en, ja)
 * @property {string} type - 소스 유형 (news, blog, rss)
 * @property {number} reliability - 신뢰도 점수 (0~100)
 * @property {Object} feedUrls - RSS 피드 URL (카테고리별)
 */

// ========================================================================
// 2. 분석 결과 저장 형식 표준화
// ========================================================================

/**
 * @typedef {Object} ArticleAnalysis - 개별 기사 분석 결과
 * @property {string} articleId - 분석된 기사의 ID
 * @property {number} financialRelevance - 금융 관련성 점수 (0~1)
 * @property {Object} sentiment - 감성 분석 결과
 * @property {number} sentiment.score - 감성 점수 (-1~1, -1:부정, 0:중립, 1:긍정)
 * @property {string} sentiment.label - 감성 라벨 (부정, 중립, 긍정)
 * @property {Object} sectorClassification - 섹터 분류 결과
 * @property {number} importance - 중요도 점수 (0~10)
 * @property {Object} keywords - 추출된 키워드 및 빈도
 * @property {Object} entities - 추출된 개체명
 * @property {Date} analyzedAt - 분석 일시
 */

/**
 * 기사 분석 결과 객체 생성 함수
 * @param {string} articleId - 기사 ID
 * @param {Object} analysisData - 분석 데이터
 * @returns {ArticleAnalysis} 구조화된 분석 결과
 */
function createArticleAnalysis(articleId, analysisData) {
  return {
    articleId: articleId,
    financialRelevance: analysisData.financialRelevance || 0,
    sentiment: {
      score: analysisData.sentiment?.score || 0,
      label: analysisData.sentiment?.label || '중립'
    },
    sectorClassification: analysisData.sectorClassification || {},
    importance: analysisData.importance || 0,
    keywords: analysisData.keywords || {},
    entities: analysisData.entities || [],
    analyzedAt: new Date()
  };
}

/**
 * @typedef {Object} SectorAnalysis - 섹터별 분석 결과
 * @property {string} sector - 섹터명 (기술, 금융, 에너지 등)
 * @property {number} articleCount - 해당 섹터 기사 수
 * @property {number} averageSentiment - 평균 감성 점수
 * @property {string[]} topKeywords - 상위 키워드
 * @property {boolean} trending - 트렌드 여부 (상승/하락/유지)
 * @property {Date} analyzedAt - 분석 일시
 */

/**
 * @typedef {Object} InsightData - 인사이트 데이터
 * @property {string} id - 인사이트 고유 ID
 * @property {string} title - 인사이트 제목
 * @property {string} description - 인사이트 설명
 * @property {string} category - 인사이트 카테고리 (Market, Sector, Economic)
 * @property {string} type - 인사이트 유형 (Trend, News, Alert)
 * @property {number} confidence - 신뢰도 (0~100)
 * @property {string[]} relatedArticleIds - 관련 기사 ID 목록
 * @property {Date} createdAt - 생성 일시
 * @property {Date} expiresAt - 만료 일시 (null이면 만료되지 않음)
 */

/**
 * @typedef {Object} TermTrend - 용어 트렌드 분석
 * @property {string} term - 용어 (예: 금리, 인플레이션, AI)
 * @property {Object} counts - 기간별 언급 횟수
 * @property {number} percentageChange - 이전 기간 대비 변화율
 * @property {boolean} trending - 트렌드 여부
 * @property {Date} analyzedAt - 분석 일시
 */

// ========================================================================
// 3. 메모리 기반 캐싱 전략 수립
// ========================================================================

/**
 * 인메모리 캐시 관리자
 * 웹 스토리지 API(localStorage, sessionStorage) 사용이 불가능한 환경에서
 * 런타임 메모리에 데이터를 캐싱하기 위한 클래스
 */
class MemoryCacheManager {
  constructor(options = {}) {
    this.caches = {};
    this.options = {
      defaultExpiration: 30 * 60 * 1000, // 기본 만료 시간 (30분)
      maxCacheSize: 100, // 최대 캐시 항목 수
      ...options
    };
  }

  /**
   * 새 캐시 저장소 생성
   * @param {string} cacheName - 캐시 저장소 이름
   * @param {Object} options - 캐시 옵션
   */
  createCache(cacheName, options = {}) {
    if (!this.caches[cacheName]) {
      this.caches[cacheName] = {
        data: new Map(),
        options: {
          ...this.options,
          ...options
        },
        metadata: {
          created: new Date(),
          lastAccessed: new Date(),
          hits: 0,
          misses: 0
        }
      };
    }
    return this.caches[cacheName];
  }

  /**
   * 캐시에 항목 저장
   * @param {string} cacheName - 캐시 저장소 이름
   * @param {string} key - 캐시 키
   * @param {*} value - 저장할 값
   * @param {number} expiration - 만료 시간 (밀리초)
   */
  set(cacheName, key, value, expiration) {
    const cache = this.getOrCreateCache(cacheName);
    const expiresAt = expiration 
      ? new Date(Date.now() + expiration) 
      : new Date(Date.now() + cache.options.defaultExpiration);

    // 캐시 크기 제한 체크
    if (cache.data.size >= cache.options.maxCacheSize) {
      this.evictOldest(cacheName);
    }

    cache.data.set(key, {
      value,
      expiresAt,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0
    });
    
    return true;
  }

  /**
   * 캐시에서 항목 가져오기
   * @param {string} cacheName - 캐시 저장소 이름
   * @param {string} key - 캐시 키
   * @returns {*} 캐시된 값 또는 undefined
   */
  get(cacheName, key) {
    const cache = this.getCache(cacheName);
    if (!cache) return undefined;

    cache.metadata.lastAccessed = new Date();
    
    if (cache.data.has(key)) {
      const item = cache.data.get(key);
      
      // 만료 확인
      if (item.expiresAt < new Date()) {
        cache.data.delete(key);
        cache.metadata.misses++;
        return undefined;
      }
      
      // 액세스 정보 업데이트
      item.lastAccessed = new Date();
      item.accessCount++;
      cache.metadata.hits++;
      
      return item.value;
    }
    
    cache.metadata.misses++;
    return undefined;
  }

  /**
   * 캐시에서 항목 삭제
   * @param {string} cacheName - 캐시 저장소 이름
   * @param {string} key - 캐시 키
   * @returns {boolean} 삭제 성공 여부
   */
  delete(cacheName, key) {
    const cache = this.getCache(cacheName);
    if (!cache) return false;
    
    return cache.data.delete(key);
  }

  /**
   * 캐시 저장소 초기화
   * @param {string} cacheName - 캐시 저장소 이름
   * @returns {boolean} 초기화 성공 여부
   */
  clear(cacheName) {
    const cache = this.getCache(cacheName);
    if (!cache) return false;
    
    cache.data.clear();
    return true;
  }

  /**
   * 만료된 캐시 항목 정리
   * @param {string} cacheName - 캐시 저장소 이름
   */
  cleanup(cacheName) {
    const cache = this.getCache(cacheName);
    if (!cache) return;
    
    const now = new Date();
    for (const [key, item] of cache.data.entries()) {
      if (item.expiresAt < now) {
        cache.data.delete(key);
      }
    }
  }

  /**
   * 가장 오래된 캐시 항목 제거
   * @param {string} cacheName - 캐시 저장소 이름
   */
  evictOldest(cacheName) {
    const cache = this.getCache(cacheName);
    if (!cache || cache.data.size === 0) return;
    
    let oldestKey = null;
    let oldestAccess = new Date();
    
    for (const [key, item] of cache.data.entries()) {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.data.delete(oldestKey);
    }
  }

  /**
   * 캐시 저장소 가져오기 (없으면 생성)
   * @param {string} cacheName - 캐시 저장소 이름
   * @returns {Object} 캐시 저장소 객체
   */
  getOrCreateCache(cacheName) {
    if (!this.caches[cacheName]) {
      return this.createCache(cacheName);
    }
    return this.caches[cacheName];
  }

  /**
   * 캐시 저장소 가져오기
   * @param {string} cacheName - 캐시 저장소 이름
   * @returns {Object} 캐시 저장소 객체 또는 undefined
   */
  getCache(cacheName) {
    return this.caches[cacheName];
  }

  /**
   * 캐시 상태 정보 가져오기
   * @param {string} cacheName - 캐시 저장소 이름
   * @returns {Object} 캐시 상태 정보
   */
  getStats(cacheName) {
    const cache = this.getCache(cacheName);
    if (!cache) return null;
    
    return {
      size: cache.data.size,
      maxSize: cache.options.maxCacheSize,
      created: cache.metadata.created,
      lastAccessed: cache.metadata.lastAccessed,
      hits: cache.metadata.hits,
      misses: cache.metadata.misses,
      hitRatio: cache.metadata.hits / (cache.metadata.hits + cache.metadata.misses || 1)
    };
  }
}

// ========================================================================
// 4. 데이터 관리자 (Data Manager) 구현
// ========================================================================

/**
 * 금융 인사이트 허브 데이터 관리자
 * 애플리케이션의 모든 데이터 흐름을 관리하는 중앙 클래스
 */
class FinancialInsightDataManager {
  constructor() {
    // 메모리 캐시 매니저 인스턴스 생성
    this.cache = new MemoryCacheManager({
      // 각 캐시의 기본 설정
      defaultExpiration: 30 * 60 * 1000, // 30분
      maxCacheSize: 1000
    });
    
    // 캐시 저장소 초기화
    this.initializeCaches();
    
    // 이벤트 리스너
    this.eventListeners = {};
  }
  
  /**
   * 캐시 저장소 초기화
   */
  initializeCaches() {
    // 뉴스 기사 캐시
    this.cache.createCache('articles', {
      defaultExpiration: 60 * 60 * 1000, // 1시간
      maxCacheSize: 500
    });
    
    // 분석 결과 캐시
    this.cache.createCache('analysis', {
      defaultExpiration: 2 * 60 * 60 * 1000, // 2시간
      maxCacheSize: 300
    });
    
    // 섹터 분석 캐시
    this.cache.createCache('sectors', {
      defaultExpiration: 3 * 60 * 60 * 1000, // 3시간
      maxCacheSize: 50
    });
    
    // 인사이트 캐시
    this.cache.createCache('insights', {
      defaultExpiration: 6 * 60 * 60 * 1000, // 6시간
      maxCacheSize: 100
    });
    
    // 용어 트렌드 캐시
    this.cache.createCache('trends', {
      defaultExpiration: 12 * 60 * 60 * 1000, // 12시간
      maxCacheSize: 50
    });
  }
  
  /**
   * 뉴스 기사 저장
   * @param {NewsArticle} article - 저장할 뉴스 기사
   * @returns {string} 저장된 기사 ID
   */
  saveArticle(article) {
    const validArticle = createNewsArticle(article);
    this.cache.set('articles', validArticle.id, validArticle);
    this.emit('articleSaved', validArticle);
    return validArticle.id;
  }
  
  /**
   * 뉴스 기사 가져오기
   * @param {string} articleId - 기사 ID
   * @returns {NewsArticle|null} 뉴스 기사 또는 null
   */
  getArticle(articleId) {
    return this.cache.get('articles', articleId) || null;
  }
  
  /**
   * 뉴스 기사 목록 가져오기
   * @param {Object} options - 필터링 옵션
   * @returns {NewsArticle[]} 뉴스 기사 목록
   */
  getArticles(options = {}) {
    const articleCache = this.cache.getCache('articles');
    if (!articleCache) return [];
    
    const articles = Array.from(articleCache.data.values()).map(item => item.value);
    
    return this.filterArticles(articles, options);
  }
  
  /**
   * 기사 필터링
   * @param {NewsArticle[]} articles - 필터링할 기사 목록
   * @param {Object} options - 필터링 옵션
   * @returns {NewsArticle[]} 필터링된 기사 목록
   */
  filterArticles(articles, options = {}) {
    let filtered = [...articles];
    
    // 소스별 필터링
    if (options.source) {
      filtered = filtered.filter(article => article.source === options.source);
    }
    
    // 카테고리별 필터링
    if (options.category) {
      filtered = filtered.filter(article => article.categories.includes(options.category));
    }
    
    // 언어별 필터링
    if (options.language) {
      filtered = filtered.filter(article => article.language === options.language);
    }
    
    // 날짜 범위 필터링
    if (options.fromDate) {
      const fromDate = new Date(options.fromDate);
      filtered = filtered.filter(article => article.publishedAt >= fromDate);
    }
    
    if (options.toDate) {
      const toDate = new Date(options.toDate);
      filtered = filtered.filter(article => article.publishedAt <= toDate);
    }
    
    // 정렬
    if (options.sortBy) {
      filtered.sort((a, b) => {
        if (options.sortBy === 'date') {
          return options.sortOrder === 'asc' 
            ? a.publishedAt - b.publishedAt 
            : b.publishedAt - a.publishedAt;
        }
        return 0;
      });
    } else {
      // 기본 정렬: 날짜 내림차순 (최신순)
      filtered.sort((a, b) => b.publishedAt - a.publishedAt);
    }
    
    // 페이지네이션
    if (options.limit) {
      const start = options.offset || 0;
      const end = start + options.limit;
      filtered = filtered.slice(start, end);
    }
    
    return filtered;
  }
  
  /**
   * 분석 결과 저장
   * @param {string} articleId - 기사 ID
   * @param {Object} analysisData - 분석 데이터
   * @returns {ArticleAnalysis} 저장된 분석 결과
   */
  saveAnalysis(articleId, analysisData) {
    const analysis = createArticleAnalysis(articleId, analysisData);
    this.cache.set('analysis', articleId, analysis);
    this.emit('analysisSaved', analysis);
    return analysis;
  }
  
  /**
   * 분석 결과 가져오기
   * @param {string} articleId - 기사 ID
   * @returns {ArticleAnalysis|null} 분석 결과 또는 null
   */
  getAnalysis(articleId) {
    return this.cache.get('analysis', articleId) || null;
  }
  
  /**
   * 인사이트 저장
   * @param {InsightData} insight - 인사이트 데이터
   * @returns {string} 저장된 인사이트 ID
   */
  saveInsight(insight) {
    const insightData = {
      ...insight,
      id: insight.id || generateUUID(),
      createdAt: insight.createdAt || new Date(),
      expiresAt: insight.expiresAt || null
    };
    
    this.cache.set('insights', insightData.id, insightData);
    this.emit('insightSaved', insightData);
    return insightData.id;
  }
  
  /**
   * 인사이트 가져오기
   * @param {string} insightId - 인사이트 ID
   * @returns {InsightData|null} 인사이트 또는 null
   */
  getInsight(insightId) {
    return this.cache.get('insights', insightId) || null;
  }
  
  /**
   * 인사이트 목록 가져오기
   * @param {Object} options - 필터링 옵션
   * @returns {InsightData[]} 인사이트 목록
   */
  getInsights(options = {}) {
    const insightCache = this.cache.getCache('insights');
    if (!insightCache) return [];
    
    const insights = Array.from(insightCache.data.values())
      .map(item => item.value)
      .filter(insight => !insight.expiresAt || insight.expiresAt > new Date());
    
    // 필터링 및 정렬 로직
    let filtered = [...insights];
    
    // 카테고리별 필터링
    if (options.category) {
      filtered = filtered.filter(insight => insight.category === options.category);
    }
    
    // 유형별 필터링
    if (options.type) {
      filtered = filtered.filter(insight => insight.type === options.type);
    }
    
    // 신뢰도 필터링
    if (options.minConfidence) {
      filtered = filtered.filter(insight => insight.confidence >= options.minConfidence);
    }
    
    // 정렬
    filtered.sort((a, b) => {
      // 기본 정렬: 생성일 내림차순 (최신순)
      return b.createdAt - a.createdAt;
    });
    
    // 페이지네이션
    if (options.limit) {
      const start = options.offset || 0;
      const end = start + options.limit;
      filtered = filtered.slice(start, end);
    }
    
    return filtered;
  }
  
  /**
   * 섹터 분석 저장
   * @param {SectorAnalysis} sectorAnalysis - 섹터 분석 데이터
   */
  saveSectorAnalysis(sectorAnalysis) {
    const sectorData = {
      ...sectorAnalysis,
      analyzedAt: sectorAnalysis.analyzedAt || new Date()
    };
    
    this.cache.set('sectors', sectorData.sector, sectorData);
    this.emit('sectorAnalysisSaved', sectorData);
    return sectorData;
  }
  
  /**
   * 섹터 분석 가져오기
   * @param {string} sector - 섹터명
   * @returns {SectorAnalysis|null} 섹터 분석 또는 null
   */
  getSectorAnalysis(sector) {
    return this.cache.get('sectors', sector) || null;
  }
  
  /**
   * 모든 섹터 분석 가져오기
   * @returns {SectorAnalysis[]} 섹터 분석 목록
   */
  getAllSectorAnalyses() {
    const sectorCache = this.cache.getCache('sectors');
    if (!sectorCache) return [];
    
    return Array.from(sectorCache.data.values()).map(item => item.value);
  }
  
  /**
   * 용어 트렌드 저장
   * @param {TermTrend} termTrend - 용어 트렌드 데이터
   */
  saveTermTrend(termTrend) {
    const trendData = {
      ...termTrend,
      analyzedAt: termTrend.analyzedAt || new Date()
    };
    
    this.cache.set('trends', trendData.term, trendData);
    this.emit('termTrendSaved', trendData);
    return trendData;
  }
  
  /**
   * 용어 트렌드 가져오기
   * @param {string} term - 용어
   * @returns {TermTrend|null} 용어 트렌드 또는 null
   */
  getTermTrend(term) {
    return this.cache.get('trends', term) || null;
  }
  
  /**
   * 모든 용어 트렌드 가져오기
   * @returns {TermTrend[]} 용어 트렌드 목록
   */
  getAllTermTrends() {
    const trendCache = this.cache.getCache('trends');
    if (!trendCache) return [];
    
    return Array.from(trendCache.data.values()).map(item => item.value);
  }
  
  /**
   * 캐시 상태 정보 가져오기
   * @returns {Object} 캐시 상태 정보
   */
  getCacheStats() {
    return {
      articles: this.cache.getStats('articles'),
      analysis: this.cache.getStats('analysis'),
      sectors: this.cache.getStats('sectors'),
      insights: this.cache.getStats('insights'),
      trends: this.cache.getStats('trends')
    };
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
  
  /**
   * 주기적 캐시 정리 시작
   * @param {number} interval - 정리 간격 (밀리초)
   */
  startCacheCleanup(interval = 5 * 60 * 1000) {  // 기본 5분
    this.cleanupInterval = setInterval(() => {
      this.cache.cleanup('articles');
      this.cache.cleanup('analysis');
      this.cache.cleanup('sectors');
      this.cache.cleanup('insights');
      this.cache.cleanup('trends');
    }, interval);
  }
  
  /**
   * 주기적 캐시 정리 중지
   */
  stopCacheCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// ========================================================================
// 유틸리티 함수
// ========================================================================

/**
 * UUID 생성 함수
 * @returns {string} 생성된 UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 텍스트의 언어 감지
 * @param {string} text - 언어를 감지할 텍스트
 * @returns {string} 언어 코드 (ko, en, ja 등)
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }
  
  // 텍스트 샘플 (최대 1000자)
  const sample = text.slice(0, 1000);
  
  // 한글 및 한자 (유니코드 범위)
  // 수정된 정규 표현식: 범위를 올바른 순서로 정렬
  const koreanPattern = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/;
  
  // 일본어 (유니코드 범위)
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F]/;
  
  // 중국어 간체 및 번체 (유니코드 범위)
  const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
  
  // 아랍어 (유니코드 범위)
  const arabicPattern = /[\u0600-\u06FF]/;
  
  // 키릴 문자 (유니코드 범위 - 러시아어, 우크라이나어 등)
  const cyrillicPattern = /[\u0400-\u04FF]/;
  
  // 문자 개수 세기
  const koreanCount = (sample.match(koreanPattern) || []).length;
  const japaneseCount = (sample.match(japanesePattern) || []).length;
  const chineseCount = (sample.match(chinesePattern) || []).length;
  const arabicCount = (sample.match(arabicPattern) || []).length;
  const cyrillicCount = (sample.match(cyrillicPattern) || []).length;
  
  // 영어 문자 수를 세기 위한 영어 패턴 (ASCII 범위의 알파벳)
  const englishPattern = /[a-zA-Z]/g;
  const englishCount = (sample.match(englishPattern) || []).length;
  
  // 가장 많은 문자의 언어를 감지
  const counts = {
    ko: koreanCount,
    ja: japaneseCount,
    zh: chineseCount,
    ar: arabicCount,
    ru: cyrillicCount,
    en: englishCount
  };
  
  // 가장 많은 문자 유형 찾기
  let maxLang = 'en'; // 기본값은 영어
  let maxCount = 0;
  
  for (const [lang, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxLang = lang;
      maxCount = count;
    }
  }
  
  return maxLang;
}

// 데이터 관리자 인스턴스 생성 및 내보내기
const dataManager = new FinancialInsightDataManager();

// 데이터 관리자 API
const FinancialInsightData = {
  /**
   * 데이터 관리자 인스턴스 가져오기
   * @returns {FinancialInsightDataManager}
   */
  getManager() {
    return dataManager;
  },
  
  /**
   * 뉴스 기사 저장
   * @param {NewsArticle} article - 저장할 뉴스 기사
   * @returns {string} 저장된 기사 ID
   */
  saveArticle(article) {
    return dataManager.saveArticle(article);
  },
  
  /**
   * 뉴스 기사 가져오기
   * @param {string} articleId - 기사 ID
   * @returns {NewsArticle|null} 뉴스 기사 또는 null
   */
  getArticle(articleId) {
    return dataManager.getArticle(articleId);
  },
  
  /**
   * 뉴스 기사 목록 가져오기
   * @param {Object} options - 필터링 옵션
   * @returns {NewsArticle[]} 뉴스 기사 목록
   */
  getArticles(options) {
    return dataManager.getArticles(options);
  },
  
  /**
   * 분석 결과 저장
   * @param {string} articleId - 기사 ID
   * @param {Object} analysisData - 분석 데이터
   * @returns {ArticleAnalysis} 저장된 분석 결과
   */
  saveAnalysis(articleId, analysisData) {
    return dataManager.saveAnalysis(articleId, analysisData);
  },
  
  /**
   * 분석 결과 가져오기
   * @param {string} articleId - 기사 ID
   * @returns {ArticleAnalysis|null} 분석 결과 또는 null
   */
  getAnalysis(articleId) {
    return dataManager.getAnalysis(articleId);
  },
  
  /**
   * 인사이트 저장
   * @param {InsightData} insight - 인사이트 데이터
   * @returns {string} 저장된 인사이트 ID
   */
  saveInsight(insight) {
    return dataManager.saveInsight(insight);
  },
  
  /**
   * 인사이트 목록 가져오기
   * @param {Object} options - 필터링 옵션
   * @returns {InsightData[]} 인사이트 목록
   */
  getInsights(options) {
    return dataManager.getInsights(options);
  },
  
  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} listener - 리스너 함수
   */
  on(event, listener) {
    dataManager.on(event, listener);
  },
  
  /**
   * 데이터 관리자 초기화
   */
  initialize() {
    dataManager.initializeCaches();
    dataManager.startCacheCleanup();
  }
};

// 모듈 내보내기
export default FinancialInsightData;
