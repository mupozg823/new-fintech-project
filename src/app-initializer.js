/**
 * Financial Insight Hub Pro - 애플리케이션 초기화 및 통합
 * 
 * 이 모듈은 애플리케이션의 다양한 구성 요소를 초기화하고 통합합니다.
 * 데이터 구조, 프록시 서비스, 범용 API를 연결하여 완전한 애플리케이션을 구성합니다.
 */

// 의존성 가져오기
import FinancialInsightData from './infrastructure/data_structure/data-structure.js';
import RssProxyService from './infrastructure/proxy/proxy-service.js';
// 기존 POE API 서비스 대신 일반 API 서비스 사용
import GeneralApiService from './infrastructure/general/general-api-service.js';
import TextAnalysisEngine from './text_analysis/text-analysis-engine.js';
import { setupOptimizedFunctions, getOptimizedAnalyzer, getOptimizedSentimentAnalyzer } from './optimization/integration.js';
import Dashboard from './ui/pages/Dashboard.js';

/**
 * Financial Insight Hub 애플리케이션의 주요 컴포넌트를 초기화하고 연결하는 클래스
 */
export class FinancialInsightHub {
  constructor() {
    // 초기화 상태 추적
    this.isInitialized = false;
    this.isInitializing = false;
    this.initSuccess = false;
    this.initComplete = false;
    this.initError = null;
    
    // 이전 버전 호환성을 위한 initializationState 객체 추가
    this.initializationState = {
      started: false,
      completed: false,
      success: false,
      error: null,
      componentsInitialized: {
        dataManager: false,
        proxyService: false,
        apiService: false,
        articleAnalyzer: false,
        ui: false
      }
    };
    
    // 컴포넌트 초기화 상태
    this.dataManagerInitialized = false;
    this.proxyServiceInitialized = false;
    this.apiServiceInitialized = false;
    this.articleAnalyzerInitialized = false;
    this.uiInitialized = false;
    
    // 이벤트 리스너
    this.eventListeners = {};
    
    // 구성요소
    this.dataManager = null;
    this.rssProxyService = null;
    this.generalApiService = null;
    this.articleAnalyzer = null;
    this.router = null;
    
    // 초기화 시작 시간 (성능 측정용)
    this.initStartTime = 0;
    
    console.log('Financial Insight Hub 인스턴스 생성');
  }
  
  /**
   * Hub 초기화
   * @returns {Promise} 초기화 완료 시 해결되는 Promise
   */
  async initialize() {
    if (this.isInitializing) {
      console.log('이미 초기화 중입니다.');
      return;
    }
    
    if (this.isInitialized) {
      console.log('이미 초기화되었습니다.');
      return;
    }
    
    console.log('Financial Insight Hub 초기화 시작');
    this.initStartTime = performance.now();
    this.isInitializing = true;
    
    try {
      // 1. 데이터 관리자 초기화
      this.dataManager = FinancialInsightData;
      await this.dataManager.initialize();
      this.dataManagerInitialized = true;
      console.log('✓ 데이터 관리자 초기화 완료');
      
      // 2. RSS 프록시 서비스 초기화
      this.rssProxyService = RssProxyService;
      await this.rssProxyService.initialize();
      this.proxyServiceInitialized = true;
      console.log('✓ RSS 프록시 서비스 초기화 완료');
      
      // 3. 일반 API 서비스 초기화 (POE API 서비스 대신)
      this.generalApiService = new GeneralApiService();
      await this.generalApiService.initialize();
      this.apiServiceInitialized = true;
      console.log('✓ 일반 API 서비스 초기화 완료');
      
      // 4. 최적화 모듈 설정
      await setupOptimizedFunctions(this.generalApiService);
      console.log('✓ 최적화 모듈 설정 완료');
      
      // 5. 기사 분석기 초기화
      this.articleAnalyzer = TextAnalysisEngine;
      // 기존 의존성이 이미 있는지 확인하고 초기화 진행을 생략
      this.articleAnalyzerInitialized = true;
      console.log('✓ 기사 분석기 초기화 완료');
      
      // 6. UI 초기화
      await this.initializeUI();
      
      // 이벤트 핸들러 연결
      this.connectEventHandlers();
      
      const initTime = ((performance.now() - this.initStartTime) / 1000).toFixed(2);
      console.log(`✓ Financial Insight Hub 초기화 완료 (${initTime}초)`);
      
      this.isInitializing = false;
      this.isInitialized = true;
      this.initSuccess = true;
      this.initComplete = true;
      
      // 이전 버전 호환성을 위한 initializationState 업데이트
      this.initializationState.started = true;
      this.initializationState.completed = true;
      this.initializationState.success = true;
      this.initializationState.componentsInitialized.dataManager = this.dataManagerInitialized;
      this.initializationState.componentsInitialized.proxyService = this.proxyServiceInitialized;
      this.initializationState.componentsInitialized.apiService = this.apiServiceInitialized;
      this.initializationState.componentsInitialized.articleAnalyzer = this.articleAnalyzerInitialized;
      this.initializationState.componentsInitialized.ui = this.uiInitialized;
      
      // 초기화 완료 이벤트 발생
      this.emit('initialized', { success: true });
      
      // 초기 데이터 로드 (첫 실행 시)
      await this.loadInitialData();
      
      return this;
    } catch (error) {
      console.error('Financial Insight Hub 초기화 중 오류 발생:', error);
      
      this.isInitializing = false;
      this.initError = error;
      this.initComplete = true;
      this.initSuccess = false;
      
      // 이전 버전 호환성을 위한 initializationState 업데이트
      this.initializationState.started = true;
      this.initializationState.completed = true;
      this.initializationState.success = false;
      this.initializationState.error = error;
      
      // 초기화 오류 이벤트 발생
      this.emit('initError', { error });
      
      throw error;
    }
  }
  
  /**
   * 초기화 완료 처리
   * @param {boolean} success - 초기화 성공 여부
   * @param {Error} error - 초기화 실패 시 에러 객체
   */
  onInitializeComplete(success, error = null) {
    // 초기화 상태 업데이트
    if (!this.initializationState) {
      this.initializationState = {
        started: true,
        completed: true,
        success: success,
        error: error,
        componentsInitialized: {
          dataManager: this.dataManagerInitialized || false,
          proxyService: this.proxyServiceInitialized || false,
          apiService: this.apiServiceInitialized || false,
          articleAnalyzer: this.articleAnalyzerInitialized || false,
          ui: this.uiInitialized || false
        }
      };
    } else {
      this.initializationState.completed = true;
      this.initializationState.success = success;
      this.initializationState.error = error;
    }
    
    // 초기화 완료 이벤트 발생
    const eventData = {
      success,
      error,
      timestamp: new Date(),
      componentsInitialized: this.initializationState.componentsInitialized || {}
    };
    
    try {
      // 초기화 완료 이벤트 리스너 호출
      this.eventListeners.initializationComplete.forEach(listener => {
        try {
          listener(eventData);
        } catch (listenerError) {
          console.error('초기화 완료 이벤트 리스너 실행 중 오류:', listenerError);
        }
      });
    } catch (emitError) {
      console.error('초기화 완료 이벤트 발생 중 오류:', emitError);
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  on(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    this.eventListeners[eventName].push(callback);
    console.log(`'${eventName}' 이벤트 리스너 등록됨`);
    
    // 이미 초기화가 완료된 경우 바로 이벤트 호출
    if (eventName === 'initializationComplete' && this.initializationState && this.initializationState.completed) {
      const eventData = {
        success: this.initializationState.success || false,
        error: this.initializationState.error || null,
        componentsInitialized: { ...(this.initializationState.componentsInitialized || {}) }
      };
      
      try {
        callback(eventData);
      } catch (error) {
        console.error('초기화 완료 이벤트 리스너 오류:', error);
      }
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param {string} eventName - 이벤트 이름
   * @param {Function} [callback] - 제거할 특정 콜백 함수 (없으면 모든 리스너 제거)
   */
  off(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      return;
    }
    
    if (callback) {
      // 특정 콜백 함수만 제거
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(
        listener => listener !== callback
      );
      console.log(`'${eventName}' 이벤트에서 특정 리스너 제거됨`);
    } else {
      // 모든 리스너 제거
      this.eventListeners[eventName] = [];
      console.log(`'${eventName}' 이벤트의 모든 리스너 제거됨`);
    }
  }
  
  /**
   * 자동 업데이트 시작
   * @param {number} interval - 업데이트 간격 (밀리초)
   */
  startAutoUpdate(interval = null) {
    // 기본 업데이트 간격 (30분)
    const updateInterval = interval || 1800000;
    
    // 이미 실행 중인 경우 중지
    this.stopAutoUpdate();
    
    console.log(`자동 업데이트 시작: ${updateInterval}ms 간격`);
    
    // RSS 프록시가 초기화되었는지 확인
    if (!this.rssProxyService) {
      console.error('RSS 프록시 서비스가 초기화되지 않았습니다');
      return;
    }
    
    try {
      // 활성화된 각 소스에 대해 주기적 업데이트 시작
      if (this.rssProxyService.startPeriodicUpdate) {
        // 업데이트 간격 설정
        this.autoUpdateInterval = setInterval(() => {
          console.log('자동 업데이트 실행 중...');
          
          // 활성화된 소스 가져오기
          const sources = this.rssProxyService.getActiveSources();
          
          if (!sources || sources.length === 0) {
            console.log('활성화된 소스가 없습니다');
            return;
          }
          
          // 각 소스에서 데이터 가져오기
          sources.forEach(async (source) => {
            try {
              const articles = await this.rssProxyService.fetchFromSource(source.id);
              
              if (articles && articles.length > 0) {
                console.log(`${source.name}에서 ${articles.length}개의 기사를 가져왔습니다`);
                this.processNewArticles(articles, source.id);
              } else {
                console.log(`${source.name}에서 새 기사가 없습니다`);
              }
            } catch (error) {
              console.error(`${source.name} 업데이트 중 오류:`, error);
            }
          });
        }, updateInterval);
        
        console.log('자동 업데이트가 활성화되었습니다');
      } else {
        console.warn('RSS 프록시에 startPeriodicUpdate 메서드가 없습니다');
      }
    } catch (error) {
      console.error('자동 업데이트 시작 중 오류:', error);
    }
  }
  
  /**
   * 자동 업데이트 중지
   */
  stopAutoUpdate() {
    // 인터벌 정리
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
      console.log('자동 업데이트 중지됨');
    }
    
    // RSS 프록시 정리
    if (this.rssProxyService && typeof this.rssProxyService.stopAllPeriodicUpdates === 'function') {
      try {
        this.rssProxyService.stopAllPeriodicUpdates();
      } catch (error) {
        console.error('RSS 프록시 업데이트 중지 중 오류:', error);
      }
    }
    
    // 이벤트 발생
    try {
      this.emit('autoUpdateStopped', {});
    } catch (error) {
      console.error('자동 업데이트 중지 이벤트 발생 중 오류:', error);
    }
  }
  
  /**
   * 새 기사 목록 처리
   * @param {Array} articles - 기사 목록
   * @param {string} sourceId - 소스 ID
   */
  processNewArticles(articles, sourceId) {
    if (!articles || articles.length === 0) {
      console.log('처리할 기사가 없습니다');
      return;
    }
    
    if (!this.dataManager) {
      console.error('데이터 매니저가 초기화되지 않았습니다');
      return;
    }
    
    console.log(`${sourceId}에서 ${articles.length}개의 새 기사 처리 중`);
    
    let processedCount = 0;
    
    // 각 기사 처리
    articles.forEach(article => {
      if (!article || !article.id) {
        console.warn('유효하지 않은 기사 스킵:', article);
        return;
      }
      
      try {
        // 중복 방지를 위해 기존 기사 확인
        const existingArticle = this.dataManager.getArticle(article.id);
        if (existingArticle) {
          // 이미 존재하는 기사는 건너뜀
          return;
        }
        
        // 소스 메타데이터 추가
        let enrichedArticle = { ...article };
        
        if (this.rssProxyService && typeof this.rssProxyService.getSourceById === 'function') {
          const source = this.rssProxyService.getSourceById(sourceId);
          if (source) {
            enrichedArticle = {
              ...enrichedArticle,
              sourceCountry: source.country,
              language: source.language || this.config.defaultLanguage,
              categories: article.categories || [source.category]
            };
          }
        }
        
        // 기사 저장
        const articleId = this.dataManager.saveArticle(enrichedArticle);
        processedCount++;
        
        // 새 기사 이벤트 발생
        this.emit('newArticle', enrichedArticle);
        
        // 기사 분석 요청 (옵션)
        if (this.config.autoAnalyze !== false) {
          this.analyzeArticle(articleId).catch(error => {
            console.error(`기사 분석 중 오류 (ID: ${articleId}):`, error);
          });
        }
      } catch (error) {
        console.error(`기사 처리 중 오류:`, error, article);
      }
    });
    
    console.log(`${processedCount}개의 새 기사가 성공적으로 처리됨`);
    
    // 기사 수 제한 유지
    try {
      this.maintainArticleLimit();
    } catch (error) {
      console.error('기사 수 제한 유지 중 오류:', error);
    }
  }
  
  /**
   * 기사 수 제한 유지
   */
  maintainArticleLimit() {
    if (!this.dataManager) {
      console.error('데이터 매니저가 초기화되지 않았습니다');
      return;
    }
    
    // 최대 기사 수가 설정되지 않은 경우 기본값 사용
    const maxArticles = this.config.maxArticlesToKeep || 1000;
    console.log(`기사 수 제한 유지 중 (최대 ${maxArticles}개)`);
    
    const allArticles = this.dataManager.getArticles();
    
    if (!allArticles || !Array.isArray(allArticles)) {
      console.warn('유효한 기사 목록을 가져올 수 없습니다');
      return;
    }
    
    if (allArticles.length > maxArticles) {
      // 초과 기사 수
      const excessCount = allArticles.length - maxArticles;
      
      // 가장 오래된 기사부터 정렬
      const oldestFirst = [...allArticles].sort((a, b) => {
        const dateA = a.publishedAt || a.pubDate || a.timestamp || 0;
        const dateB = b.publishedAt || b.pubDate || b.timestamp || 0;
        return (new Date(dateA)).getTime() - (new Date(dateB)).getTime();
      });
      
      console.log(`${excessCount}개의 오래된 기사 삭제 중...`);
      
      // 가장 오래된 기사 삭제
      let removedCount = 0;
      
      for (let i = 0; i < excessCount && i < oldestFirst.length; i++) {
        const oldArticle = oldestFirst[i];
        if (oldArticle && oldArticle.id) {
          try {
            // 관련 분석 결과도 함께 정리
            this.dataManager.deleteArticle(oldArticle.id);
            removedCount++;
          } catch (error) {
            console.error(`기사 삭제 중 오류 (ID: ${oldArticle.id}):`, error);
          }
        }
      }
      
      console.log(`${removedCount}개의 오래된 기사가 삭제되었습니다 (제한: ${maxArticles}개)`);
    }
  }
  
  /**
   * 기사 분석
   * @param {string} articleId - 기사 ID
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeArticle(articleId) {
    if (!this.isInitialized) {
      throw new Error('Financial Insight Hub is not initialized');
    }
    
    try {
      // 기사 가져오기
      const article = this.dataManager.getArticle(articleId);
      
      if (!article) {
        throw new Error(`Article with ID ${articleId} not found`);
      }
      
      console.log(`Analyzing article: ${article.title}`);
      
      // 기사가 이미 분석되었는지 확인
      const existingAnalysis = this.dataManager.getAnalysis(articleId);
      if (existingAnalysis) {
        console.log('Article already analyzed, returning existing analysis');
        return existingAnalysis;
      }
      
      const content = article.content;
      const language = article.language || this.config.defaultLanguage;
      
      // 최적화 엔진을 사용한 병렬 분석
      if (this.optimization && this.optimization.isInitialized) {
        console.log('Using optimization engine for article analysis');
        
        // 병렬 분석 실행
        const analysisResult = await this.optimization.analyzeTextParallel(content, {
          relevance: { language },
          sentiment: { language },
          sector: { language },
          tags: { language },
          generateInsight: true
        });
        
        // 분석 결과 업데이트
        const analysis = {
          financialRelevance: analysisResult.relevance,
          sentiment: analysisResult.sentiment,
          sectorClassification: analysisResult.sector,
          keywords: analysisResult.tags,
          entities: analysisResult.tags.entities || [],
          importance: this.calculateImportance(analysisResult.relevance, article),
          timestamp: Date.now(),
          insight: analysisResult.insight
        };
        
        // 데이터 저장
        this.dataManager.saveAnalysis(articleId, analysis);
        
        // 섹터 분석 업데이트
        this.updateSectorAnalysis(analysis.sectorClassification, analysis.sentiment);
        
        // 이벤트 발생
        this.emit('newAnalysis', { articleId, ...analysis });
        
        if (analysis.insight) {
          this.emit('newInsight', analysis.insight);
        }
        
        console.log(`Analysis completed for article: ${article.title}`);
        return analysis;
      } else {
        // 기존 직렬 분석 코드 (최적화 엔진이 사용 불가능한 경우)
        console.log('Using standard analysis (optimization engine not available)');
        
        // 금융 관련성 분석
        const financialRelevance = this.analyzeFinancialRelevance(content, language);
        
        // 감성 분석
        const sentiment = this.analyzeSentiment(content, language);
        
        // 섹터 분류
        const sectorClassification = this.classifySector(content, language);
        
        // 키워드 추출
        const keywords = this.extractKeywords(content, language);
        
        // 개체명 인식
        const entities = this.extractEntities(content, language);
        
        // 중요도 계산
        const importance = this.calculateImportance(financialRelevance, article);
        
        // 분석 결과 생성
        const analysis = {
          financialRelevance,
          sentiment,
          sectorClassification,
          keywords,
          entities,
          importance,
          timestamp: Date.now()
        };
        
        // 데이터 저장
        this.dataManager.saveAnalysis(articleId, analysis);
        
        // 인사이트 생성 여부 확인
        if (importance >= 7) {
          analysis.insight = this.generateInsight(article, analysis);
          
          if (analysis.insight) {
            this.emit('newInsight', analysis.insight);
          }
        }
        
        // 섹터 분석 업데이트
        this.updateSectorAnalysis(sectorClassification, sentiment);
        
        // 이벤트 발생
        this.emit('newAnalysis', { articleId, ...analysis });
        
        console.log(`Analysis completed for article: ${article.title}`);
        return analysis;
      }
    } catch (error) {
      console.error(`Failed to analyze article ${articleId}:`, error);
      throw error;
    }
  }
  
  /**
   * 금융 관련성 분석
   * @param {string} content - 기사 내용
   * @param {string} language - 언어 코드
   * @returns {number} 관련성 점수 (0~1)
   */
  analyzeFinancialRelevance(content, language = 'ko') {
    // 금융 관련 키워드 목록 (언어별)
    const financialKeywords = {
      ko: [
        "금융", "경제", "투자", "주식", "증권", "채권", "펀드", "ETF", "금리", "이자율", 
        "인플레이션", "디플레이션", "불황", "호황", "경기", "자산", "부채", "M&A", "합병", 
        "인수", "지수", "PER", "EPS", "배당", "수익률", "수익", "손실", "거래량", "거래", 
        "코스피", "코스닥", "나스닥", "다우존스", "S&P500", "환율", "달러", "원화", "외화",
        "한국은행", "연준", "Fed", "중앙은행", "금융위", "금감원", "재정", "예산", "국고",
        "비트코인", "이더리움", "암호화폐", "블록체인"
      ],
      en: [
        "finance", "economy", "investment", "stock", "securities", "bond", "fund", "ETF", 
        "interest rate", "inflation", "deflation", "recession", "boom", "economic", "asset", 
        "debt", "M&A", "merger", "acquisition", "index", "PER", "EPS", "dividend", "yield", 
        "revenue", "loss", "volume", "trade", "KOSPI", "KOSDAQ", "NASDAQ", "Dow Jones", 
        "S&P500", "exchange rate", "dollar", "currency", "Bank of Korea", "Fed", "Federal Reserve",
        "budget", "treasury", "bitcoin", "ethereum", "cryptocurrency", "blockchain"
      ],
      ja: [
        "金融", "経済", "投資", "株式", "証券", "債券", "ファンド", "ETF", "金利", "利率",
        "インフレ", "デフレ", "不況", "好況", "景気", "資産", "負債", "M&A", "合併", "買収",
        "指数", "PER", "EPS", "配当", "利回り", "収益", "損失", "取引量", "取引", "日経平均",
        "為替", "ドル", "円", "日銀", "連邦準備制度", "財政", "予算", "国庫", "ビットコイン",
        "イーサリアム", "暗号通貨", "ブロックチェーン"
      ]
    };
    
    // 기본 언어가 지원되지 않는 경우 영어 사용
    const keywordList = financialKeywords[language] || financialKeywords['en'];
    
    // 단어 카운트
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    
    // 금융 키워드 카운트
    let financialTermCount = 0;
    
    keywordList.forEach(keyword => {
      // 정규식으로 키워드 검색 (단어 경계 고려)
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex) || [];
      financialTermCount += matches.length;
    });
    
    // 최소 단어 수 확인 (너무 짧은 콘텐츠 처리)
    if (wordCount < 20) {
      return 0.5; // 기본값
    }
    
    // 관련성 점수 계산 (키워드 밀도 기반)
    const density = financialTermCount / wordCount;
    
    // 점수 조정 (0~1 범위 내로)
    return Math.min(1, Math.max(0, density * 10));
  }
  
  /**
   * 감성 분석
   * @param {string} content - 기사 내용
   * @param {string} language - 언어 코드
   * @returns {Object} 감성 분석 결과
   */
  analyzeSentiment(content, language = 'ko') {
    // 긍정/부정 단어 목록 (언어별)
    const sentimentLexicon = {
      ko: {
        positive: [
          "상승", "성장", "호조", "개선", "증가", "호황", "낙관", "돌파", "신기록", "최고", 
          "급등", "강세", "기대", "회복", "반등", "선전", "호실적", "확대", "긍정", "안정"
        ],
        negative: [
          "하락", "감소", "부진", "악화", "침체", "불황", "비관", "하락세", "저조", "약세", 
          "급락", "폭락", "손실", "위험", "우려", "충격", "하향", "위기", "부정", "불안"
        ]
      },
      en: {
        positive: [
          "increase", "growth", "improve", "gain", "positive", "strong", "optimistic", 
          "breakthrough", "record", "high", "surge", "rally", "expect", "recovery", 
          "rebound", "expand", "stable", "advantage", "profit", "benefit"
        ],
        negative: [
          "decrease", "decline", "deteriorate", "loss", "negative", "weak", "pessimistic", 
          "downturn", "poor", "sluggish", "plunge", "crash", "risk", "concern", "worried", 
          "shock", "crisis", "unstable", "fear", "anxiety"
        ]
      },
      ja: {
        positive: [
          "上昇", "成長", "好調", "改善", "増加", "好況", "楽観", "突破", "新記録", "最高",
          "急騰", "強気", "期待", "回復", "反発", "拡大", "安定", "利益", "好材料", "前進"
        ],
        negative: [
          "下落", "減少", "不振", "悪化", "低迷", "不況", "悲観", "弱気", "不調", "損失",
          "急落", "暴落", "リスク", "懸念", "不安", "衝撃", "危機", "問題", "破綻", "停滞"
        ]
      }
    };
    
    // 기본 언어가 지원되지 않는 경우 영어 사용
    const lexicon = sentimentLexicon[language] || sentimentLexicon['en'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    // 단어 단위로 분리
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    // 긍정/부정 단어 카운트
    words.forEach(word => {
      if (lexicon.positive.includes(word)) {
        positiveCount++;
      } else if (lexicon.negative.includes(word)) {
        negativeCount++;
      }
    });
    
    // 감성 점수 계산 (-1 ~ 1)
    const totalCount = positiveCount + negativeCount;
    let score = 0;
    
    if (totalCount > 0) {
      score = (positiveCount - negativeCount) / totalCount;
    }
    
    // 감성 라벨 결정
    let label;
    if (score >= 0.3) {
      label = '긍정';
    } else if (score <= -0.3) {
      label = '부정';
    } else {
      label = '중립';
    }
    
    return {
      score,
      label,
      positive: positiveCount,
      negative: negativeCount,
      total: totalCount
    };
  }
  
  /**
   * 섹터 분류
   * @param {string} content - 기사 내용
   * @param {string} language - 언어 코드
   * @returns {Object} 섹터 분류 결과
   */
  classifySector(content, language = 'ko') {
    // 섹터별 키워드 (언어별)
    const sectorKeywords = {
      ko: {
        finance: ["은행", "보험", "증권", "카드", "대출", "저축", "예금", "투자", "주식", "채권", "펀드", "금리"],
        technology: ["IT", "소프트웨어", "하드웨어", "반도체", "인공지능", "AI", "클라우드", "빅데이터", "사이버보안"],
        energy: ["석유", "가스", "원유", "정유", "전력", "발전", "신재생", "태양광", "풍력", "수소", "바이오"],
        healthcare: ["의료", "제약", "바이오", "헬스케어", "병원", "치료제", "백신", "진단", "헬스", "건강"],
        manufacturing: ["제조", "공장", "생산", "산업", "자동차", "조선", "철강", "화학", "기계", "장비", "부품"]
      },
      en: {
        finance: ["bank", "insurance", "securities", "card", "loan", "savings", "deposit", "investment", "stock", "bond", "fund", "interest rate"],
        technology: ["IT", "software", "hardware", "semiconductor", "artificial intelligence", "AI", "cloud", "big data", "cybersecurity"],
        energy: ["oil", "gas", "crude", "refinery", "electricity", "power", "renewable", "solar", "wind", "hydrogen", "bio"],
        healthcare: ["medical", "pharmaceutical", "biotech", "healthcare", "hospital", "treatment", "vaccine", "diagnosis", "health"],
        manufacturing: ["manufacturing", "factory", "production", "industry", "automotive", "shipbuilding", "steel", "chemical", "machinery", "equipment", "components"]
      },
      ja: {
        finance: ["銀行", "保険", "証券", "カード", "ローン", "貯蓄", "預金", "投資", "株式", "債券", "ファンド", "金利"],
        technology: ["IT", "ソフトウェア", "ハードウェア", "半導体", "人工知能", "AI", "クラウド", "ビッグデータ", "サイバーセキュリティ"],
        energy: ["石油", "ガス", "原油", "精製", "電力", "発電", "再生可能", "太陽光", "風力", "水素", "バイオ"],
        healthcare: ["医療", "製薬", "バイオ", "ヘルスケア", "病院", "治療薬", "ワクチン", "診断", "健康"],
        manufacturing: ["製造", "工場", "生産", "産業", "自動車", "造船", "鉄鋼", "化学", "機械", "設備", "部品"]
      }
    };
    
    // 기본 언어가 지원되지 않는 경우 영어 사용
    const keywords = sectorKeywords[language] || sectorKeywords['en'];
    
    // 섹터별 점수
    const scores = {};
    
    // 각 섹터별 키워드 검색
    Object.keys(keywords).forEach(sector => {
      let sectorScore = 0;
      
      keywords[sector].forEach(keyword => {
        // 정규식으로 키워드 검색 (대소문자 구분 없이)
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex) || [];
        sectorScore += matches.length;
      });
      
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
   * 키워드 추출
   * @param {string} content - 기사 내용
   * @param {string} language - 언어 코드
   * @returns {Object} 추출된 키워드 및 빈도
   */
  extractKeywords(content, language = 'ko') {
    // 불용어 목록 (언어별)
    const stopwords = {
      ko: ["이", "그", "저", "것", "및", "위해", "할", "하는", "때", "되어", "되는", "하고", "하지", "않은", "않고", "않는", "한", "있는", "있다", "있을", "없는", "없다", "없이"],
      en: ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about", "that", "this", "these", "those", "from", "as", "of"],
      ja: ["の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ", "さ", "ある", "いる", "する", "から", "など", "まで", "もの", "こと", "それ"]
    };
    
    // 기본 언어가 지원되지 않는 경우 영어 사용
    const stopwordList = stopwords[language] || stopwords['en'];
    
    // 단어 단위로 분리
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    // 단어 빈도 계산
    const wordFrequency = {};
    
    words.forEach(word => {
      // 불용어 및 짧은 단어 필터링
      if (word.length <= 1 || stopwordList.includes(word) || !isNaN(word)) {
        return;
      }
      
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // 빈도 기준 정렬
    const sortedWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // 상위 20개 키워드
    
    // 결과 포맷 변환
    const keywords = {};
    sortedWords.forEach(([word, frequency]) => {
      keywords[word] = frequency;
    });
    
    return keywords;
  }
  
  /**
   * 개체명 인식
   * @param {string} content - 기사 내용
   * @param {string} language - 언어 코드
   * @returns {Array} 추출된 개체명
   */
  extractEntities(content, language = 'ko') {
    // 기본적인 개체명 인식
    const entities = [];
    
    // 회사명 패턴 (언어별)
    const companyPatterns = {
      ko: /([가-힣A-Za-z0-9]+[ ]*(주식회사|㈜|(주)|회사|그룹|컴퍼니|기업|은행|증권|제약|전자|건설|보험|투자|카드|금융|리얼티|벤처스))/g,
      en: /([A-Z][a-z]+ (Corporation|Corp|Company|Co|Inc|Ltd|Group|Bank|Securities|Pharma|Electronics|Construction|Insurance|Investment|Card|Financial|Partners))/g,
      ja: /([ぁ-んァ-ン一-龯A-Za-z0-9]+[ ]*(株式会社|（株）|会社|グループ|カンパニー|企業|銀行|証券|製薬|電子|建設|保険|投資|カード|金融))/g
    };
    
    // 기본 언어가 지원되지 않는 경우 영어 사용
    const pattern = companyPatterns[language] || companyPatterns['en'];
    
    // 회사명 추출
    const companyMatches = content.match(pattern) || [];
    
    companyMatches.forEach(match => {
      if (match.length > 2) { // 너무 짧은 매치 제외
        entities.push({
          text: match.trim(),
          type: 'ORGANIZATION',
          subtype: 'COMPANY'
        });
      }
    });
    
    // 중복 제거
    const uniqueEntities = [];
    const seen = new Set();
    
    entities.forEach(entity => {
      if (!seen.has(entity.text)) {
        seen.add(entity.text);
        uniqueEntities.push(entity);
      }
    });
    
    return uniqueEntities;
  }
  
  /**
   * 중요도 점수 계산
   * @param {number} financialRelevance - 금융 관련성 점수
   * @param {Object} article - 기사 객체
   * @returns {number} 중요도 점수 (0-10)
   */
  calculateImportance(financialRelevance, article) {
    let score = financialRelevance * 5; // 기본 점수 (0-5)
    
    // 소스 신뢰도 반영
    const source = this.rssProxyService.getSourceById(article.source?.id);
    if (source) {
      // 신뢰도 점수 (0-100) -> 0-2 점수로 변환
      score += (source.reliability / 100) * 2;
    }
    
    // 기사 길이 반영
    const contentLength = article.content.length;
    if (contentLength > 1000) {
      score += 1; // 긴 기사에 가산점
    }
    
    // 최종 점수 제한 (0-10)
    return Math.round(Math.min(10, Math.max(0, score)));
  }
  
  /**
   * 인사이트 생성
   * @param {Object} article - 기사 객체
   * @param {Object} analysis - 분석 결과
   */
  generateInsight(article, analysis) {
    if (!article || !analysis) {
      return null;
    }
    
    // 인사이트 카테고리 결정
    let category = 'Market';
    
    if (analysis.sectorClassification.topSector) {
      category = 'Sector';
    }
    
    if (analysis.financialRelevance > 0.7) {
      category = 'Economic';
    }
    
    // 인사이트 제목 생성
    const title = article.title;
    
    // 인사이트 설명 생성
    const sentimentLabel = analysis.sentiment.label === '긍정' ? '긍정적' : 
                          analysis.sentiment.label === '부정' ? '부정적' : '중립적';
    
    let description = `[${sentimentLabel} 시장 시그널] ${article.title}`;
    
    // 상위 섹터가 있는 경우 추가
    if (analysis.sectorClassification.topSector) {
      const sectorMap = {
        finance: '금융',
        technology: '기술',
        energy: '에너지',
        healthcare: '헬스케어',
        manufacturing: '제조업'
      };
      
      const sectorName = sectorMap[analysis.sectorClassification.topSector] || analysis.sectorClassification.topSector;
      description += ` (${sectorName} 섹터 관련)`;
    }
    
    // 인사이트 유형 결정
    let type = 'News';
    if (analysis.importance >= 8) {
      type = 'Alert';
    } else if (analysis.sentiment.score > 0.5 || analysis.sentiment.score < -0.5) {
      type = 'Trend';
    }
    
    // 인사이트 신뢰도 계산
    const confidence = Math.round(analysis.importance * 10);
    
    // 인사이트 만료 시간 설정 (24시간)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // 인사이트 객체 생성
    const insight = {
      title,
      description,
      category,
      type,
      confidence,
      relatedArticleIds: [article.id],
      expiresAt
    };
    
    // 인사이트 저장
    this.dataManager.saveInsight(insight);
    
    // 이벤트 발생
    this.emit('newInsight', insight);
    
    console.log(`New insight generated: ${title}`);
    return insight;
  }
  
  /**
   * 섹터 분석 업데이트
   * @param {Object} sectorClassification - 섹터 분류 결과
   * @param {Object} sentiment - 감성 분석 결과
   */
  updateSectorAnalysis(sectorClassification, sentiment) {
    if (!sectorClassification || !sectorClassification.topSector) {
      return;
    }
    
    const topSector = sectorClassification.topSector;
    
    // 기존 섹터 분석 가져오기
    const existingAnalysis = this.dataManager.getSectorAnalysis(topSector);
    
    if (existingAnalysis) {
      // 기존 분석 업데이트
      const updatedAnalysis = {
        sector: topSector,
        articleCount: existingAnalysis.articleCount + 1,
        averageSentiment: (existingAnalysis.averageSentiment * existingAnalysis.articleCount + sentiment.score) / (existingAnalysis.articleCount + 1),
        trending: existingAnalysis.averageSentiment < sentiment.score ? 'up' : 
                 existingAnalysis.averageSentiment > sentiment.score ? 'down' : 'stable',
        analyzedAt: new Date()
      };
      
      this.dataManager.saveSectorAnalysis(updatedAnalysis);
    } else {
      // 새 섹터 분석 생성
      const newAnalysis = {
        sector: topSector,
        articleCount: 1,
        averageSentiment: sentiment.score,
        trending: 'stable',
        analyzedAt: new Date()
      };
      
      this.dataManager.saveSectorAnalysis(newAnalysis);
    }
  }
  
  /**
   * 새 기사 처리 핸들러
   * @param {Object} article - 기사 객체
   */
  handleNewArticle(article) {
    console.log(`New article saved: ${article.title}`);
    // 추가 처리 로직 (필요한 경우)
  }
  
  /**
   * 새 분석 결과 처리 핸들러
   * @param {Object} analysis - 분석 결과
   */
  handleNewAnalysis(analysis) {
    console.log(`New analysis saved for article: ${analysis.articleId}`);
    // 추가 처리 로직 (필요한 경우)
  }
  
  /**
   * 새 인사이트 처리 핸들러
   * @param {Object} insight - 인사이트 객체
   */
  handleNewInsight(insight) {
    console.log(`New insight saved: ${insight.title}`);
    // 추가 처리 로직 (필요한 경우)
  }
  
  /**
   * API 봇 응답 처리 핸들러
   * @param {Object} response - 봇 응답 객체
   */
  handleBotResponse(response) {
    console.log(`Received bot response: ${response.id.substring(0, 8)}...`);
    // 추가 처리 로직 (필요한 경우)
  }
  
  /**
   * API 오류 처리 핸들러
   * @param {Error} error - 오류 객체
   */
  handleApiError(error) {
    console.error('API error:', error);
    // 오류 처리 로직 (필요한 경우)
  }
  
  /**
   * 자원 정리
   */
  cleanup() {
    console.log('Financial Insight Hub 리소스 정리 중...');
    
    // 인터벌 정리
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
    }
    
    // RSS 프록시 정리
    this.rssProxyService.stopAllPeriodicUpdates();
    
    // API 서비스 정리
    if (this.generalApiService) {
      this.generalApiService.cleanup();
    }
    
    // 최적화 엔진 정리
    if (this.optimization && this.optimization.isInitialized) {
      this.optimization.cleanup();
      console.log('Optimization engine cleaned up');
    }
    
    console.log('Financial Insight Hub resources cleaned up');
  }
  
  /**
   * 이벤트 발생
   * @param {string} eventName - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   */
  emit(eventName, data) {
    if (!this.eventListeners[eventName]) {
      return;
    }
    
    console.log(`이벤트 발생: ${eventName}`);
    
    this.eventListeners[eventName].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`이벤트 리스너 실행 오류 (${eventName}):`, error);
      }
    });
  }
  
  /**
   * UI 초기화
   */
  async initializeUI() {
    if (this.uiInitialized) {
      console.log('UI가 이미 초기화되었습니다');
      return;
    }
    
    console.log('UI 초기화 중...');
    
    try {
      // 대시보드 초기화
      const dashboardContainer = document.getElementById('dashboard-container');
      if (dashboardContainer) {
        this.dashboard = new Dashboard('dashboard-container', this);
        console.log('대시보드 초기화 완료');
      } else {
        console.warn('대시보드 컨테이너를 찾을 수 없습니다');
      }
      
      // 라우터 초기화 (UI 페이지가 존재하지 않아 주석 처리)
      /*
      this.router = new Router();
      
      // 페이지 등록
      this.router.registerPage('dashboard', new Dashboard('main-container', this));
      this.router.registerPage('articles', new ArticlesPage('main-container', this));
      this.router.registerPage('settings', new SettingsPage('main-container', this));
      this.router.registerPage('about', new AboutPage('main-container', this));
      
      // 라우팅 시작
      this.router.start();
      console.log('라우터 초기화 완료');
      */
      
      this.uiInitialized = true;
      console.log('UI 초기화 완료');
    } catch (error) {
      console.error('UI 초기화 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 이벤트 핸들러 연결
   */
  connectEventHandlers() {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }
    
    console.log('이벤트 핸들러 연결 중...');
    
    // 새 기사 이벤트
    this.on('newArticle', this.handleNewArticle.bind(this));
    
    // 새 분석 결과 이벤트
    this.on('newAnalysis', this.handleNewAnalysis.bind(this));
    
    // 새 인사이트 이벤트
    this.on('newInsight', this.handleNewInsight.bind(this));
    
    // API 오류 이벤트
    this.on('apiError', this.handleApiError.bind(this));
    
    console.log('이벤트 핸들러 연결 완료');
  }
  
  /**
   * 초기 데이터 로드
   */
  async loadInitialData() {
    console.log('초기 데이터 로드 중...');
    
    try {
      // 샘플 데이터 로드 (필요한 경우)
      if (this.dataManager && this.dataManager.getArticles().length === 0) {
        // 샘플 데이터 로드 로직
        console.log('샘플 데이터 로드...');
      }
      
      console.log('초기 데이터 로드 완료');
    } catch (error) {
      console.error('초기 데이터 로드 중 오류 발생:', error);
    }
  }
}

// 애플리케이션 인스턴스 생성 및 내보내기
const financialInsightHub = new FinancialInsightHub();

// 기본 내보내기
export default financialInsightHub;

// 모든 구성 요소 내보내기 (필요한 경우 개별적으로 접근 가능)
export {
  FinancialInsightData,
  RssProxyService,
  GeneralApiService,
  financialInsightHub
}; 