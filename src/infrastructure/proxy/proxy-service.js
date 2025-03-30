/**
 * Financial Insight Hub Pro - RSS 프록시 서비스
 * 
 * 이 모듈은 CORS 제한을 우회하여 다양한 뉴스 소스에서 RSS 피드를 수집합니다.
 * 브라우저 환경의 CSP 제한을 고려하여 설계되었습니다.
 */

/**
 * 뉴스 소스 설정
 * @typedef {Object} NewsSourceConfig
 * @property {string} id - 소스 식별자
 * @property {string} name - 소스 이름
 * @property {string} country - 국가 코드
 * @property {string} language - 언어 코드
 * @property {string[]} feeds - RSS 피드 URL 목록
 * @property {number} reliability - 신뢰도 점수 (0-100)
 * @property {string} category - 카테고리 (finance, tech, general 등)
 * @property {Object} options - 추가 옵션
 */

// 지원되는 뉴스 소스 설정
const NEWS_SOURCES = [
  // 한국 뉴스 소스
  {
    id: 'naver-finance',
    name: '네이버 금융',
    country: 'KR',
    language: 'ko',
    feeds: [
      'https://finance.naver.com/news/news_list.nhn?mode=LSS3D&section_id=101&section_id2=258&section_id3=401',
      'https://finance.naver.com/news/news_list.nhn?mode=LSS3D&section_id=101&section_id2=258&section_id3=402'
    ],
    reliability: 85,
    category: 'finance',
    options: {
      parseType: 'html',
      selectors: {
        items: '.realtimeNewsList .articleSubject',
        link: 'a',
        title: 'a',
        date: '.wdate'
      },
      encoding: 'euc-kr'
    }
  },
  {
    id: 'maekyung',
    name: '매일경제',
    country: 'KR',
    language: 'ko',
    feeds: [
      'https://www.mk.co.kr/rss/30000001/',
      'https://www.mk.co.kr/rss/50000001/'
    ],
    reliability: 80,
    category: 'finance',
    options: {
      parseType: 'rss'
    }
  },
  
  // 미국 뉴스 소스
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    country: 'US',
    language: 'en',
    feeds: [
      'https://www.bloomberg.com/feed/technology/markets',
      'https://www.bloomberg.com/feed/markets/economics'
    ],
    reliability: 90,
    category: 'finance',
    options: {
      parseType: 'rss'
    }
  },
  {
    id: 'cnbc',
    name: 'CNBC',
    country: 'US',
    language: 'en',
    feeds: [
      'https://www.cnbc.com/id/20409666/device/rss/rss.html',
      'https://www.cnbc.com/id/10000664/device/rss/rss.html'
    ],
    reliability: 85,
    category: 'finance',
    options: {
      parseType: 'rss'
    }
  },
  
  // 일본 뉴스 소스
  {
    id: 'nikkei',
    name: '日本経済新聞',
    country: 'JP',
    language: 'ja',
    feeds: [
      'https://www.nikkei.com/rss/index.do'
    ],
    reliability: 90,
    category: 'finance',
    options: {
      parseType: 'rss'
    }
  }
];

/**
 * RSS 프록시 서비스 클래스
 * CORS 제한을 우회하고 다양한 뉴스 소스에서 데이터를 수집
 */
class RssProxyService {
  constructor() {
    this.sources = NEWS_SOURCES;
    this.activeRequests = new Map();
    this.requestQueue = [];
    this.maxConcurrentRequests = 3;
    this.activeRequestCount = 0;
    this.rateLimits = new Map();
    this.requestIntervals = new Map();
    
    // 이벤트 리스너
    this.eventListeners = {};
  }
  
  /**
   * RSS 프록시 서비스 초기화
   * @param {Object} config - 초기화 설정
   * @param {string} config.defaultLanguage - 기본 언어 코드
   * @param {Array} config.enabledSources - 활성화할 소스 ID 목록 (빈 배열이면 모든 소스 활성화)
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    try {
      console.log('RSS 프록시 서비스 초기화 중...');
      
      // 기본 언어 설정
      this.defaultLanguage = config.defaultLanguage || 'ko';
      
      // 활성화된 소스 필터링
      if (config.enabledSources && config.enabledSources.length > 0) {
        this.sources = this.sources.filter(source => 
          config.enabledSources.includes(source.id)
        );
      }
      
      console.log(`초기화된 뉴스 소스: ${this.sources.length}개`);
      
      // 이벤트 발생
      this.emit('initialized', { success: true });
      
      return true;
    } catch (error) {
      console.error('RSS 프록시 서비스 초기화 실패:', error);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * 모든 뉴스 소스 정보 반환
   * @returns {Array<NewsSourceConfig>} 뉴스 소스 설정 목록
   */
  getAllSources() {
    return [...this.sources];
  }
  
  /**
   * 국가별 뉴스 소스 필터링
   * @param {string} countryCode - 국가 코드 (KR, US, JP 등)
   * @returns {Array<NewsSourceConfig>} 필터링된 뉴스 소스 목록
   */
  getSourcesByCountry(countryCode) {
    return this.sources.filter(source => source.country === countryCode);
  }
  
  /**
   * 언어별 뉴스 소스 필터링
   * @param {string} languageCode - 언어 코드 (ko, en, ja 등)
   * @returns {Array<NewsSourceConfig>} 필터링된 뉴스 소스 목록
   */
  getSourcesByLanguage(languageCode) {
    return this.sources.filter(source => source.language === languageCode);
  }
  
  /**
   * 특정 뉴스 소스 정보 반환
   * @param {string} sourceId - 소스 ID
   * @returns {NewsSourceConfig|null} 뉴스 소스 설정 또는 null
   */
  getSourceById(sourceId) {
    return this.sources.find(source => source.id === sourceId) || null;
  }
  
  /**
   * 뉴스 소스 추가
   * @param {NewsSourceConfig} sourceConfig - 뉴스 소스 설정
   * @returns {boolean} 성공 여부
   */
  addSource(sourceConfig) {
    if (!sourceConfig.id || !sourceConfig.name || !sourceConfig.feeds) {
      console.error('Invalid source configuration');
      return false;
    }
    
    // 중복 확인
    if (this.sources.some(source => source.id === sourceConfig.id)) {
      console.error(`Source with ID '${sourceConfig.id}' already exists`);
      return false;
    }
    
    this.sources.push(sourceConfig);
    return true;
  }
  
  /**
   * 뉴스 소스 업데이트
   * @param {string} sourceId - 소스 ID
   * @param {Object} updates - 업데이트할 필드
   * @returns {boolean} 성공 여부
   */
  updateSource(sourceId, updates) {
    const sourceIndex = this.sources.findIndex(source => source.id === sourceId);
    if (sourceIndex === -1) {
      console.error(`Source with ID '${sourceId}' not found`);
      return false;
    }
    
    this.sources[sourceIndex] = {
      ...this.sources[sourceIndex],
      ...updates
    };
    
    return true;
  }
  
  /**
   * 뉴스 소스 제거
   * @param {string} sourceId - 소스 ID
   * @returns {boolean} 성공 여부
   */
  removeSource(sourceId) {
    const sourceIndex = this.sources.findIndex(source => source.id === sourceId);
    if (sourceIndex === -1) {
      console.error(`Source with ID '${sourceId}' not found`);
      return false;
    }
    
    this.sources.splice(sourceIndex, 1);
    return true;
  }
  
  /**
   * 특정 소스에서 RSS 피드 가져오기
   * @param {string} sourceId - 소스 ID
   * @returns {Promise<Array>} 뉴스 항목 배열
   */
  async fetchFromSource(sourceId) {
    const source = this.getSourceById(sourceId);
    if (!source) {
      throw new Error(`Source with ID '${sourceId}' not found`);
    }
    
    // 속도 제한 확인
    if (this.isRateLimited(sourceId)) {
      throw new Error(`Rate limit exceeded for source '${sourceId}'`);
    }
    
    // 활성 요청 확인
    if (this.activeRequests.has(sourceId)) {
      return this.activeRequests.get(sourceId);
    }
    
    // 요청 큐 관리
    if (this.activeRequestCount >= this.maxConcurrentRequests) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          sourceId,
          resolve,
          reject
        });
      });
    }
    
    // 새 요청 시작
    this.activeRequestCount++;
    
    // 프라미스 생성
    const requestPromise = new Promise(async (resolve, reject) => {
      try {
        // 다중 피드 병합
        const allItems = [];
        
        for (const feedUrl of source.feeds) {
          try {
            const items = await this.fetchFeed(feedUrl, source.options);
            allItems.push(...items);
          } catch (feedError) {
            console.error(`Error fetching feed '${feedUrl}':`, feedError);
            // 개별 피드 오류는 무시하고 계속 진행
          }
        }
        
        // 중복 제거 및 정렬
        const uniqueItems = this.removeDuplicates(allItems);
        const sortedItems = this.sortByDate(uniqueItems);
        
        // 소스 메타데이터 추가
        const enrichedItems = sortedItems.map(item => ({
          ...item,
          source: {
            id: source.id,
            name: source.name,
            country: source.country,
            language: source.language,
            reliability: source.reliability,
            category: source.category
          }
        }));
        
        resolve(enrichedItems);
      } catch (error) {
        reject(error);
      } finally {
        // 정리
        this.activeRequests.delete(sourceId);
        this.activeRequestCount--;
        this.updateRateLimit(sourceId);
        this.processQueue();
      }
    });
    
    // 활성 요청에 추가
    this.activeRequests.set(sourceId, requestPromise);
    
    return requestPromise;
  }
  
  /**
   * 큐에 있는 다음 요청 처리
   */
  processQueue() {
    if (this.requestQueue.length === 0 || this.activeRequestCount >= this.maxConcurrentRequests) {
      return;
    }
    
    const nextRequest = this.requestQueue.shift();
    
    this.fetchFromSource(nextRequest.sourceId)
      .then(result => nextRequest.resolve(result))
      .catch(error => nextRequest.reject(error));
  }
  
  /**
   * 특정 소스의 속도 제한 확인
   * @param {string} sourceId - 소스 ID
   * @returns {boolean} 속도 제한 여부
   */
  isRateLimited(sourceId) {
    const lastRequest = this.rateLimits.get(sourceId);
    if (!lastRequest) {
      return false;
    }
    
    const source = this.getSourceById(sourceId);
    const minInterval = source.options?.requestInterval || 60000; // 기본 1분
    
    return (Date.now() - lastRequest) < minInterval;
  }
  
  /**
   * 속도 제한 정보 업데이트
   * @param {string} sourceId - 소스 ID
   */
  updateRateLimit(sourceId) {
    this.rateLimits.set(sourceId, Date.now());
  }
  
  /**
   * 주기적인 피드 업데이트 시작
   * @param {string} sourceId - 소스 ID
   * @param {number} interval - 업데이트 간격 (밀리초)
   * @param {Function} callback - 콜백 함수
   */
  startPeriodicUpdate(sourceId, interval, callback) {
    if (this.requestIntervals.has(sourceId)) {
      this.stopPeriodicUpdate(sourceId);
    }
    
    const intervalId = setInterval(async () => {
      try {
        const items = await this.fetchFromSource(sourceId);
        callback(null, items);
      } catch (error) {
        callback(error);
      }
    }, interval);
    
    this.requestIntervals.set(sourceId, intervalId);
  }
  
  /**
   * 주기적인 피드 업데이트 중지
   * @param {string} sourceId - 소스 ID
   */
  stopPeriodicUpdate(sourceId) {
    if (this.requestIntervals.has(sourceId)) {
      clearInterval(this.requestIntervals.get(sourceId));
      this.requestIntervals.delete(sourceId);
    }
  }
  
  /**
   * 모든 주기적 업데이트 중지
   */
  stopAllPeriodicUpdates() {
    for (const [sourceId, intervalId] of this.requestIntervals.entries()) {
      clearInterval(intervalId);
    }
    this.requestIntervals.clear();
  }
  
  /**
   * RSS 피드 가져오기
   * @param {string} feedUrl - RSS 피드 URL
   * @param {Object} options - 요청 옵션
   * @returns {Promise<Array>} 뉴스 항목 배열
   */
  async fetchFeed(feedUrl, options = {}) {
    console.log(`Fetching RSS feed: ${feedUrl}`);

    // 브라우저 환경에서 CORS 우회를 위한 프록시 서버 사용
    const proxyUrl = this.getProxyUrl(feedUrl);
    
    try {
      // 더미 데이터 반환 (실제 네트워크 요청 대신)
      console.log(`실제 네트워크 요청 대신 더미 데이터 반환: ${feedUrl}`);
      
      // 더미 데이터 생성
      const dummyArticles = this.generateDummyArticles(5, feedUrl);
      
      return dummyArticles;
    } catch (error) {
      console.error(`Error fetching feed from ${feedUrl}:`, error);
      throw error;
    }
  }
  
  /**
   * 더미 기사 데이터 생성
   * @param {number} count - 생성할 기사 수
   * @param {string} source - 소스 URL
   * @returns {Array} 더미 기사 배열
   */
  generateDummyArticles(count, source) {
    const articles = [];
    const categories = ['경제', '금융', '주식', '부동산', '산업', '국제', '정책'];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const pubDate = new Date(now);
      pubDate.setHours(pubDate.getHours() - i);
      
      articles.push({
        id: `dummy-${Date.now()}-${i}`,
        title: `더미 기사 ${i+1}: ${categories[i % categories.length]} 시장 동향 분석`,
        link: `${source}#article-${i}`,
        pubDate: pubDate.toISOString(),
        content: `이것은 ${categories[i % categories.length]} 관련 더미 기사 내용입니다. 실제 네트워크 요청 없이 테스트용으로 생성된 콘텐츠입니다.`,
        source: source,
        author: '더미 작성자',
        category: categories[i % categories.length]
      });
    }
    
    return articles;
  }
  
  /**
   * 프록시 URL 생성
   * @param {string} originalUrl - 원본 URL
   * @returns {string} 프록시 URL
   */
  getProxyUrl(originalUrl) {
    // 브라우저 환경에서 허용된 프록시만 사용
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
  }
  
  /**
   * 피드 응답 파싱
   * @param {string|Object} data - 응답 데이터
   * @param {Object} options - 파싱 옵션
   * @returns {Array} 뉴스 항목 배열
   */
  parseFeedResponse(data, options = {}) {
    const parseType = options.parseType || 'rss';
    
    switch (parseType) {
      case 'rss':
        return this.parseRss(data);
      case 'json':
        return this.parseJson(data);
      case 'html':
        return this.parseHtml(data, options.selectors);
      default:
        throw new Error(`Unsupported parse type: ${parseType}`);
    }
  }
  
  /**
   * RSS XML 데이터 파싱
   * @param {string} xmlData - XML 데이터
   * @returns {Array} 파싱된 아이템
   */
  parseRss(xmlData) {
    // 브라우저 환경에서는 DOMParser 사용
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    
    // 항목 목록 가져오기
    const items = xmlDoc.querySelectorAll('item');
    const entries = xmlDoc.querySelectorAll('entry'); // Atom 형식 지원
    
    const result = [];
    
    // RSS 형식 파싱
    if (items.length > 0) {
      for (const item of items) {
        try {
          const title = this.getElementText(item, 'title');
          const link = this.getElementText(item, 'link');
          const description = this.getElementText(item, 'description');
          const pubDate = this.getElementText(item, 'pubDate');
          const guid = this.getElementText(item, 'guid') || link;
          
          const categories = [];
          const categoryElements = item.querySelectorAll('category');
          for (const cat of categoryElements) {
            categories.push(cat.textContent.trim());
          }
          
          result.push({
            id: guid,
            title,
            link,
            description,
            publishedAt: this.parseDate(pubDate),
            categories
          });
        } catch (error) {
          console.error('Error parsing RSS item:', error);
        }
      }
    }
    
    // Atom 형식 파싱
    if (entries.length > 0) {
      for (const entry of entries) {
        try {
          const title = this.getElementText(entry, 'title');
          const linkElement = entry.querySelector('link');
          const link = linkElement ? linkElement.getAttribute('href') : '';
          const description = this.getElementText(entry, 'summary') || this.getElementText(entry, 'content');
          const pubDate = this.getElementText(entry, 'published') || this.getElementText(entry, 'updated');
          const id = this.getElementText(entry, 'id') || link;
          
          const categories = [];
          const categoryElements = entry.querySelectorAll('category');
          for (const cat of categoryElements) {
            categories.push(cat.getAttribute('term') || cat.textContent.trim());
          }
          
          result.push({
            id,
            title,
            link,
            description,
            publishedAt: this.parseDate(pubDate),
            categories
          });
        } catch (error) {
          console.error('Error parsing Atom entry:', error);
        }
      }
    }
    
    return result;
  }
  
  /**
   * JSON 응답 파싱
   * @param {Object|string} jsonData - JSON 데이터
   * @returns {Array} 뉴스 항목 배열
   */
  parseJson(jsonData) {
    // JSON 문자열인 경우 객체로 변환
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    // 다양한 JSON 피드 형식 지원
    let items = [];
    
    if (data.items) {
      items = data.items;
    } else if (data.entries) {
      items = data.entries;
    } else if (data.channel && data.channel.items) {
      items = data.channel.items;
    } else if (Array.isArray(data)) {
      items = data;
    }
    
    // 항목 형식 변환
    return items.map(item => {
      const publishedAt = item.pubDate || item.published || item.date || item.publishedAt;
      
      return {
        id: item.id || item.guid || item.link,
        title: item.title || '',
        link: item.link || item.url || '',
        description: item.description || item.summary || item.content || '',
        publishedAt: this.parseDate(publishedAt),
        categories: item.categories || []
      };
    });
  }
  
  /**
   * HTML 데이터 파싱
   * @param {string} htmlData - HTML 데이터
   * @param {Object} selectors - 선택자 객체
   * @returns {Array} 파싱된 아이템
   */
  parseHtml(htmlData, selectors = {}) {
    if (!selectors) {
      throw new Error('HTML selectors configuration is required');
    }
    
    // 브라우저 환경에서 DOM 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, 'text/html');
    
    const itemSelector = selectors.items || 'article, .article';
    const linkSelector = selectors.link || 'a';
    const titleSelector = selectors.title || 'h1, h2, h3, .title';
    const descriptionSelector = selectors.description || '.description, .summary, p';
    const dateSelector = selectors.date || '.date, .time, time';
    
    const items = doc.querySelectorAll(itemSelector);
    const result = [];
    
    for (const item of items) {
      try {
        // 링크 추출
        const linkElement = item.querySelector(linkSelector);
        const link = linkElement ? linkElement.getAttribute('href') : '';
        const fullLink = this.resolveUrl(link, selectors.baseUrl);
        
        // 제목 추출
        let title = '';
        const titleElement = item.querySelector(titleSelector);
        if (titleElement) {
          title = titleElement.textContent.trim();
        } else if (linkElement) {
          title = linkElement.textContent.trim();
        }
        
        // 설명 추출
        let description = '';
        const descElement = item.querySelector(descriptionSelector);
        if (descElement) {
          description = descElement.textContent.trim();
        }
        
        // 날짜 추출
        let publishedAt = null;
        const dateElement = item.querySelector(dateSelector);
        if (dateElement) {
          const dateStr = dateElement.getAttribute('datetime') || dateElement.textContent.trim();
          publishedAt = this.parseDate(dateStr);
        }
        
        result.push({
          id: fullLink,
          title,
          link: fullLink,
          description,
          publishedAt,
          categories: []
        });
      } catch (error) {
        console.error('Error parsing HTML item:', error);
      }
    }
    
    return result;
  }
  
  /**
   * XML 요소의 텍스트 내용 가져오기
   * @param {Element} parentElement - 부모 요소
   * @param {string} tagName - 태그 이름
   * @returns {string} 요소 텍스트
   */
  getElementText(parentElement, tagName) {
    const element = parentElement.querySelector(tagName);
    return element ? element.textContent.trim() : '';
  }
  
  /**
   * 상대 URL을 절대 URL로 변환
   * @param {string} url - 변환할 URL
   * @param {string} base - 기본 URL
   * @returns {string} 절대 URL
   */
  resolveUrl(url, base) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (!base) return url;
    
    try {
      return new URL(url, base).href;
    } catch (error) {
      return url;
    }
  }
  
  /**
   * 날짜 문자열 파싱
   * @param {string} dateStr - 날짜 문자열
   * @returns {Date|null} Date 객체 또는 null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // RFC 822, RFC 2822 형식 처리
      const rfcDate = new Date(dateStr);
      if (!isNaN(rfcDate.getTime())) {
        return rfcDate;
      }
      
      // ISO 8601 형식 처리
      const isoDate = new Date(dateStr.replace(/-/g, '/').replace('T', ' '));
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
      
      // 다양한 날짜 형식 처리 로직 추가 가능
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 중복 항목 제거
   * @param {Array} items - 뉴스 항목 목록
   * @returns {Array} 중복 제거된 목록
   */
  removeDuplicates(items) {
    const uniqueIds = new Set();
    return items.filter(item => {
      const id = item.id || item.link;
      if (uniqueIds.has(id)) {
        return false;
      }
      uniqueIds.add(id);
      return true;
    });
  }
  
  /**
   * 날짜순 정렬
   * @param {Array} items - 뉴스 항목 목록
   * @returns {Array} 정렬된 목록
   */
  sortByDate(items) {
    return items.sort((a, b) => {
      // 날짜가 없는 항목은 뒤로
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      // 최신순 정렬
      return b.publishedAt - a.publishedAt;
    });
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
const rssProxyService = new RssProxyService();
export default rssProxyService; 