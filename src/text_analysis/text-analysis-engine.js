/**
 * Financial Insight Hub Pro - 텍스트 분석 엔진
 * 
 * 이 모듈은 뉴스 기사 본문의 텍스트를 분석하여 금융 관련성 점수, 감성 분석,
 * 섹터 분류, 태그 추출 등의 기능을 제공합니다.
 */

import financialRelevanceAnalyzer from './financial-relevance-analyzer.js';
import sentimentAnalysisEngine from './sentiment-analysis-engine.js';
import FinancialInsightData from '../infrastructure/data_structure/data-structure.js';
import sectorAnalysisService from './sector-analysis-service.js';

/**
 * 섹터 분류 시스템 클래스
 * 텍스트의 섹터(분야)를 분류하고 점수를 산출
 */
class SectorClassificationSystem {
  constructor() {
    // 섹터별 키워드 사전
    this.sectorKeywords = {
      // 금융 섹터 키워드
      finance: {
        ko: ["은행", "보험", "증권", "카드", "대출", "저축", "예금", "투자", "주식", "채권", "펀드", "금리", 
             "외환", "환율", "금융", "화폐", "결제", "지급", "인수", "합병", "IPO", "공모", "유상증자",
             "회사채", "국채", "자산운용", "PER", "EPS", "배당", "수익률", "MOU", "증시", "코스피", "코스닥"],
        en: ["bank", "insurance", "securities", "card", "loan", "savings", "deposit", "investment", 
             "stock", "bond", "fund", "interest rate", "forex", "exchange rate", "financial", 
             "currency", "payment", "settlement", "acquisition", "merger", "IPO", "offering", 
             "rights issue", "corporate bond", "treasury", "asset management", "PER", "EPS", 
             "dividend", "yield", "MOU", "stock market", "KOSPI", "KOSDAQ"],
        ja: ["銀行", "保険", "証券", "カード", "ローン", "貯蓄", "預金", "投資", "株式", "債券", "ファンド", 
             "金利", "外国為替", "為替レート", "金融", "通貨", "支払い", "決済", "買収", "合併", "IPO", 
             "公募", "ライツイシュー", "社債", "国債", "資産運用", "PER", "EPS", "配当", "利回り", 
             "MOU", "株式市場", "KOSPI", "KOSDAQ"]
      },
      
      // 기술 섹터 키워드
      technology: {
        ko: ["IT", "소프트웨어", "하드웨어", "반도체", "인공지능", "AI", "클라우드", "빅데이터", "사이버보안",
             "인터넷", "모바일", "앱", "어플리케이션", "플랫폼", "서비스", "통신", "네트워크", "5G", "IoT", 
             "스마트", "디바이스", "가상현실", "증강현실", "블록체인", "메타버스", "로봇", "드론", "자율주행",
             "전기차", "배터리", "충전", "게임", "핀테크", "디지털", "전환", "온라인", "웹", "앱"],
        en: ["IT", "software", "hardware", "semiconductor", "artificial intelligence", "AI", 
             "cloud", "big data", "cybersecurity", "internet", "mobile", "app", "application", 
             "platform", "service", "telecommunication", "network", "5G", "IoT", "smart", 
             "device", "virtual reality", "augmented reality", "blockchain", "metaverse", 
             "robot", "drone", "autonomous driving", "electric vehicle", "battery", "charging", 
             "game", "fintech", "digital", "transformation", "online", "web", "app"],
        ja: ["IT", "ソフトウェア", "ハードウェア", "半導体", "人工知能", "AI", "クラウド", "ビッグデータ", 
             "サイバーセキュリティ", "インターネット", "モバイル", "アプリ", "アプリケーション", "プラットフォーム", 
             "サービス", "通信", "ネットワーク", "5G", "IoT", "スマート", "デバイス", "仮想現実", "拡張現実", 
             "ブロックチェーン", "メタバース", "ロボット", "ドローン", "自律走行", "電気自動車", "バッテリー", 
             "充電", "ゲーム", "フィンテック", "デジタル", "変換", "オンライン", "ウェブ", "アプリ"]
      },
      
      // 에너지 섹터 키워드
      energy: {
        ko: ["석유", "가스", "원유", "정유", "전력", "발전", "신재생", "태양광", "풍력", "수소", "바이오",
             "원자력", "화석연료", "화력발전", "수력발전", "지열", "에너지", "발전소", "정제", "배럴", "OPEC",
             "중동", "온실가스", "탄소중립", "ESG", "친환경", "전기", "그린", "청정", "연료", "자원", "광물"],
        en: ["oil", "gas", "crude", "refinery", "electricity", "power", "renewable", "solar", 
             "wind", "hydrogen", "bio", "nuclear", "fossil fuel", "thermal power", "hydropower", 
             "geothermal", "energy", "power plant", "refining", "barrel", "OPEC", "Middle East", 
             "greenhouse gas", "carbon neutral", "ESG", "eco-friendly", "electric", "green", 
             "clean", "fuel", "resource", "mineral"],
        ja: ["石油", "ガス", "原油", "精製", "電力", "発電", "再生可能", "太陽光", "風力", "水素", "バイオ",
             "原子力", "化石燃料", "火力発電", "水力発電", "地熱", "エネルギー", "発電所", "精製", "バレル", 
             "OPEC", "中東", "温室効果ガス", "カーボンニュートラル", "ESG", "環境に優しい", "電気", "グリーン", 
             "クリーン", "燃料", "資源", "鉱物"]
      },
      
      // 헬스케어 섹터 키워드
      healthcare: {
        ko: ["의료", "제약", "바이오", "헬스케어", "병원", "치료제", "백신", "진단", "헬스", "건강",
             "의약품", "약물", "임상", "시험", "신약", "의학", "생명공학", "바이오텍", "진료", "수술",
             "의사", "환자", "질병", "코로나", "감염", "바이러스", "항체", "웰니스", "치료", "요양"],
        en: ["medical", "pharmaceutical", "biotech", "healthcare", "hospital", "treatment", 
             "vaccine", "diagnosis", "health", "wellness", "medicine", "drug", "clinical", 
             "trial", "new drug", "medical science", "biotechnology", "biotech", "examination", 
             "surgery", "doctor", "patient", "disease", "COVID", "infection", "virus", 
             "antibody", "wellness", "therapy", "care"],
        ja: ["医療", "製薬", "バイオ", "ヘルスケア", "病院", "治療薬", "ワクチン", "診断", "ヘルス", "健康",
             "医薬品", "薬物", "臨床", "試験", "新薬", "医学", "生命工学", "バイオテック", "診療", "手術",
             "医師", "患者", "疾病", "コロナ", "感染", "ウイルス", "抗体", "ウェルネス", "治療", "介護"]
      },
      
      // 제조업 섹터 키워드
      manufacturing: {
        ko: ["제조", "공장", "생산", "산업", "자동차", "조선", "철강", "화학", "기계", "장비", "부품",
             "소재", "원자재", "가공", "조립", "제품", "설비", "공정", "시설", "품질", "검사", "자재",
             "재고", "공급망", "물류", "유통", "수출", "수입", "무역", "관세", "물가", "원가", "비용"],
        en: ["manufacturing", "factory", "production", "industry", "automotive", "shipbuilding", 
             "steel", "chemical", "machinery", "equipment", "component", "material", "raw material", 
             "processing", "assembly", "product", "facility", "process", "installation", "quality", 
             "inspection", "material", "inventory", "supply chain", "logistics", "distribution", 
             "export", "import", "trade", "tariff", "price", "cost", "expense"],
        ja: ["製造", "工場", "生産", "産業", "自動車", "造船", "鉄鋼", "化学", "機械", "設備", "部品",
             "素材", "原材料", "加工", "組立", "製品", "設備", "工程", "施設", "品質", "検査", "資材",
             "在庫", "サプライチェーン", "物流", "流通", "輸出", "輸入", "貿易", "関税", "物価", "原価", "費用"]
      },
      
      // 소비재 섹터 키워드
      consumer: {
        ko: ["소비", "소매", "유통", "브랜드", "제품", "고객", "서비스", "마케팅", "광고", "판매", "구매",
             "쇼핑", "매장", "할인", "프로모션", "패션", "의류", "화장품", "식품", "외식", "배달", "숙박",
             "여행", "레저", "엔터테인먼트", "미디어", "콘텐츠", "구독", "트렌드", "소비자", "라이프스타일"],
        en: ["consumption", "retail", "distribution", "brand", "product", "customer", "service", 
             "marketing", "advertisement", "sales", "purchase", "shopping", "store", "discount", 
             "promotion", "fashion", "clothing", "cosmetics", "food", "dining", "delivery", 
             "accommodation", "travel", "leisure", "entertainment", "media", "content", 
             "subscription", "trend", "consumer", "lifestyle"],
        ja: ["消費", "小売", "流通", "ブランド", "製品", "顧客", "サービス", "マーケティング", "広告", "販売", 
             "購買", "ショッピング", "店舗", "割引", "プロモーション", "ファッション", "衣料", "化粧品", "食品", 
             "外食", "配達", "宿泊", "旅行", "レジャー", "エンターテイメント", "メディア", "コンテンツ", 
             "サブスクリプション", "トレンド", "消費者", "ライフスタイル"]
      },
      
      // 부동산 섹터 키워드
      realestate: {
        ko: ["부동산", "건설", "아파트", "주택", "오피스", "상가", "임대", "분양", "청약", "대출", "모기지",
             "재건축", "재개발", "입주", "부지", "토지", "매매", "전세", "월세", "시세", "매물", "공시지가",
             "평당", "건물", "재산세", "보증금", "계약", "중개", "부동산세", "집값", "집", "아파트값"],
        en: ["real estate", "construction", "apartment", "housing", "office", "commercial space", 
             "lease", "sale", "subscription", "loan", "mortgage", "reconstruction", "redevelopment", 
             "move-in", "site", "land", "trading", "jeonse", "monthly rent", "market price", 
             "property", "officially assessed land price", "price per pyeong", "building", 
             "property tax", "deposit", "contract", "brokerage", "real estate tax", "house price", 
             "house", "apartment price"],
        ja: ["不動産", "建設", "アパート", "住宅", "オフィス", "店舗", "賃貸", "分譲", "申込", "ローン", 
             "モーゲージ", "再建築", "再開発", "入居", "用地", "土地", "売買", "全貸", "月貸", "相場", 
             "物件", "公示地価", "坪当たり", "建物", "固定資産税", "保証金", "契約", "仲介", "不動産税", 
             "住宅価格", "家", "アパート価格"]
      }
    };
    
    // 결과 캐싱
    this.cache = new Map();
    this.maxCacheSize = 100;
  }
  
  /**
   * 텍스트의 섹터 분류 분석
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 언어 코드 (ko, en, ja)
   * @param {Object} options - 분석 옵션
   * @returns {Object} 분석 결과
   */
  classify(text, language = 'ko', options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      useCache: true,
      minScore: 0,
      topSectors: 3,
      includeKeywords: true
    };
    
    const classifyOptions = { ...defaultOptions, ...options };
    
    // 입력 검증
    if (!text || typeof text !== 'string') {
      return {
        topSector: 'unknown',
        scores: {},
        percentages: {}
      };
    }
    
    // 캐시 확인 (성능 최적화)
    const cacheKey = `${text.substring(0, 100)}_${language}`;
    if (classifyOptions.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 언어 감지 또는 확인
    const detectedLanguage = this.detectTextLanguage(text, language);
    
    // 텍스트 정규화
    const normalizedText = this.normalizeText(text);
    
    // 각 섹터별 점수 계산
    const scores = {};
    const keywordMatches = {};
    
    // 모든 섹터에 대해 키워드 검색
    for (const sector in this.sectorKeywords) {
      const keywords = this.sectorKeywords[sector][detectedLanguage] || [];
      
      scores[sector] = 0;
      keywordMatches[sector] = [];
      
      // 각 키워드에 대해 검색
      for (const keyword of keywords) {
        // 정규식 패턴 (단어 경계 고려)
        const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = normalizedText.match(pattern) || [];
        
        if (matches.length > 0) {
          scores[sector] += matches.length;
          keywordMatches[sector].push({
            keyword,
            count: matches.length
          });
        }
      }
    }
    
    // 총점 계산
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    // 각 섹터의 퍼센티지 계산
    const percentages = {};
    
    for (const sector in scores) {
      if (totalScore > 0) {
        percentages[sector] = Math.round((scores[sector] / totalScore) * 100);
      } else {
        // 점수가 없는 경우, 모든 섹터에 동일한 점수 부여
        percentages[sector] = Math.round(100 / Object.keys(scores).length);
      }
    }
    
    // 최상위 섹터 결정
    let topSector = Object.keys(scores)[0];
    let topScore = scores[topSector];
    
    for (const sector in scores) {
      if (scores[sector] > topScore) {
        topSector = sector;
        topScore = scores[sector];
      }
    }
    
    // 상위 N개 섹터 및 키워드 추출
    const topSectors = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, classifyOptions.topSectors)
      .map(([sector, score]) => ({
        sector,
        score,
        percentage: percentages[sector]
      }));
    
    // 결과 객체 구성
    const result = {
      topSector,
      topScore,
      scores,
      percentages,
      topSectors
    };
    
    // 키워드 포함 옵션
    if (classifyOptions.includeKeywords) {
      // 각 섹터별 상위 키워드만 포함
      const keywords = {};
      for (const sector in keywordMatches) {
        keywords[sector] = keywordMatches[sector]
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // 상위 10개 키워드
      }
      
      result.keywords = keywords;
    }
    
    // 결과 캐싱
    if (classifyOptions.useCache) {
      this.addToCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * 텍스트 언어 감지
   * @param {string} text - 감지할 텍스트
   * @param {string} defaultLanguage - 기본 언어
   * @returns {string} 감지된 언어 코드
   */
  detectTextLanguage(text, defaultLanguage) {
    // 언어가 지정되었으면 그대로 사용
    if (['ko', 'en', 'ja'].includes(defaultLanguage)) {
      return defaultLanguage;
    }
    
    // 샘플 텍스트 (최대 200자)
    const sample = text.substring(0, 200);
    
    // 한국어 (한글) 감지
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(sample)) {
      return 'ko';
    }
    
    // 일본어 (히라가나, 가타카나, 한자) 감지
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sample)) {
      return 'ja';
    }
    
    // 기본값은 영어
    return 'en';
  }
  
  /**
   * 텍스트 정규화
   * @param {string} text - 정규화할 텍스트
   * @returns {string} 정규화된 텍스트
   */
  normalizeText(text) {
    if (!text) return '';
    
    // 소문자 변환
    let normalized = text.toLowerCase();
    
    // HTML 태그 제거
    normalized = normalized.replace(/<[^>]*>/g, ' ');
    
    // 특수 문자 처리
    normalized = normalized.replace(/[^\w\s가-힣ぁ-んァ-ン一-龯]+/g, ' ');
    
    // 여러 공백을 하나로 치환
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized.trim();
  }
  
  /**
   * 결과 캐싱
   * @param {string} key - 캐시 키
   * @param {Object} result - 캐싱할 결과
   */
  addToCache(key, result) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      // 가장 오래된 항목 제거 (FIFO)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // 결과 복사본 저장 (참조 문제 방지)
    this.cache.set(key, JSON.parse(JSON.stringify(result)));
  }
  
  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * 사용자 정의 섹터 및 키워드 추가
   * @param {string} sector - 섹터 이름
   * @param {string} language - 언어 코드
   * @param {string[]} keywords - 키워드 목록
   * @returns {boolean} 성공 여부
   */
  addCustomSector(sector, language, keywords) {
    if (!sector || !language || !keywords || !Array.isArray(keywords)) {
      return false;
    }
    
    // 새로운 섹터 추가
    if (!this.sectorKeywords[sector]) {
      this.sectorKeywords[sector] = {};
    }
    
    // 언어별 키워드 설정
    if (!this.sectorKeywords[sector][language]) {
      this.sectorKeywords[sector][language] = [];
    }
    
    // 기존 키워드와 병합하고 중복 제거
    const existingKeywords = new Set(this.sectorKeywords[sector][language]);
    keywords.forEach(keyword => {
      if (keyword && keyword.trim()) {
        existingKeywords.add(keyword.trim().toLowerCase());
      }
    });
    
    this.sectorKeywords[sector][language] = Array.from(existingKeywords);
    
    // 캐시 초기화 (키워드 변경으로 인한 일관성 유지)
    this.clearCache();
    
    return true;
  }
}

/**
 * 태그 추출기 클래스
 * 텍스트에서 중요한 키워드와 태그 추출
 */
class TagExtractor {
  constructor() {
    // 불용어 사전
    this.stopwords = {
      ko: ["이", "그", "저", "것", "및", "위해", "할", "하는", "때", "되어", "되는", "하고", "하지", 
           "않은", "않고", "않는", "한", "있는", "있다", "있을", "없는", "없다", "없이", "같은", "같이"],
      en: ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", 
           "about", "that", "this", "these", "those", "from", "as", "of", "is", "are", "was", "were"],
      ja: ["の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ", "さ", "ある", "いる", 
           "する", "から", "など", "まで", "もの", "こと", "それ", "ため", "ば", "より", "また", "また"]
    };
    
    // 개체명 패턴
    this.entityPatterns = {
      // 회사명 패턴
      companies: {
        ko: /([가-힣A-Za-z0-9]+[ ]*(주식회사|㈜|(주)|회사|그룹|컴퍼니|기업|은행|증권|제약|전자|건설|보험|투자|카드|금융|리얼티|벤처스))/g,
        en: /([A-Z][a-z]*[ ]*(Corporation|Corp|Company|Co|Inc|Ltd|Group|Bank|Securities|Pharma|Electronics|Construction|Insurance|Investment|Card|Financial|Partners))/g,
        ja: /([ぁ-んァ-ン一-龯A-Za-z0-9]+[ ]*(株式会社|（株）|会社|グループ|カンパニー|企業|銀行|証券|製薬|電子|建設|保険|投資|カード|金融))/g
      }
    };
    
    // 결과 캐싱
    this.cache = new Map();
    this.maxCacheSize = 100;
  }
  
  /**
   * 텍스트에서 태그 추출
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 텍스트 언어
   * @param {Object} options - 추출 옵션
   * @returns {Object} 추출된 태그 결과
   */
  extractTags(text, language = 'ko', options = {}) {
    console.log(`텍스트에서 태그 추출 시작 (${text.length} 글자)`);
    
    if (!text || text.length < 5) {
      console.warn('텍스트가 너무 짧아 태그를 추출할 수 없습니다');
      return { tags: [] };
    }
    
    try {
      // 언어 감지 및 정규화
      const detectedLanguage = language || this.detectLanguage(text);
      const normalizedText = this.normalizeText(text, detectedLanguage);
      
      // 엔티티 추출
      const entities = this.extractEntities(normalizedText, detectedLanguage);
      
      // 키워드 추출
      const keywordOptions = {
        maxKeywords: options.maxKeywords || 20,
        minScore: options.minScore || 0.3,
        includeTfidf: options.includeTfidf !== false
      };
      
      const keywords = this.extractKeywords(normalizedText, detectedLanguage, keywordOptions);
      
      // 태그 병합 및 중복 제거
      const allTags = [...entities, ...keywords];
      const uniqueTags = this.deduplicateTags(allTags);
      
      // 태그 클러스터링 및 순위 매기기
      const clusters = this.clusterTags(uniqueTags, options.clusterThreshold || 0.7);
      const rankedTags = this.rankTags(clusters, options.maxTags || 10);
      
      console.log(`태그 추출 완료: ${rankedTags.length}개 태그 발견`);
      
      return {
        tags: rankedTags,
        language: detectedLanguage,
        entityCount: entities.length,
        keywordCount: keywords.length
      };
    } catch (error) {
      console.error('태그 추출 중 오류 발생:', error);
      return { tags: [], error: error.message };
    }
  }
  
  /**
   * 텍스트에서 키워드 추출
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 텍스트 언어
   * @param {Object} options - 추출 옵션
   * @returns {Array} 추출된 키워드 배열
   */
  extractKeywords(text, language, options = {}) {
    // 언어별 불용어(stopwords) 목록
    const stopwords = this.getStopwords(language);
    
    // 텍스트 토큰화
    const tokens = this.tokenize(text, language);
    const filteredTokens = tokens.filter(token => 
      token.length > 1 && !stopwords.includes(token.toLowerCase())
    );
    
    // 키워드 빈도 계산
    const frequencies = {};
    filteredTokens.forEach(token => {
      const normalized = token.toLowerCase();
      frequencies[normalized] = (frequencies[normalized] || 0) + 1;
    });
    
    // 금융 관련 용어 가중치 적용
    const financialTerms = this.getFinancialTerms(language);
    
    // 키워드 점수 계산 및 정렬
    const keywords = Object.keys(frequencies).map(term => {
      const frequency = frequencies[term];
      const isFinancialTerm = financialTerms.includes(term);
      // 금융 용어는 가중치 부여
      const score = (frequency / filteredTokens.length) * (isFinancialTerm ? 1.5 : 1);
      
      return {
        text: term,
        type: 'keyword',
        score: score,
        frequency: frequency,
        isFinancialTerm: isFinancialTerm
      };
    });
    
    // 점수별 정렬
    const sortedKeywords = keywords
      .filter(kw => kw.score >= (options.minScore || 0.1))
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxKeywords || 20);
    
    return sortedKeywords;
  }
  
  /**
   * 태그 중복 제거
   * @param {Array} tags - 태그 배열
   * @returns {Array} 중복 제거된 태그 배열
   */
  deduplicateTags(tags) {
    const uniqueTags = {};
    
    tags.forEach(tag => {
      const text = tag.text.toLowerCase();
      if (!uniqueTags[text] || uniqueTags[text].score < tag.score) {
        uniqueTags[text] = tag;
      }
    });
    
    return Object.values(uniqueTags);
  }
  
  /**
   * 태그 순위 매기기
   * @param {Array} clusters - 태그 클러스터 배열
   * @param {number} maxTags - 최대 태그 수
   * @returns {Array} 순위가 매겨진 태그 배열
   */
  rankTags(clusters, maxTags) {
    // 클러스터 대표 태그 선정
    const representativeTags = clusters.map(cluster => {
      // 클러스터에서 가장 높은 점수의 태그 선택
      return cluster.sort((a, b) => b.score - a.score)[0];
    });
    
    // 최종 순위 결정
    return representativeTags
      .sort((a, b) => b.score - a.score)
      .slice(0, maxTags);
  }
  
  /**
   * 텍스트 언어 감지
   * @param {string} text - 감지할 텍스트
   * @param {string} defaultLanguage - 기본 언어
   * @returns {string} 감지된 언어 코드
   */
  detectLanguage(text, defaultLanguage) {
    // 언어가 지정되었으면 그대로 사용
    if (['ko', 'en', 'ja'].includes(defaultLanguage)) {
      return defaultLanguage;
    }
    
    // 샘플 텍스트 (최대 200자)
    const sample = text.substring(0, 200);
    
    // 한국어 (한글) 감지
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(sample)) {
      return 'ko';
    }
    
    // 일본어 (히라가나, 가타카나, 한자) 감지
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sample)) {
      return 'ja';
    }
    
    // 기본값은 영어
    return 'en';
  }
  
  /**
   * 텍스트 정규화
   * @param {string} text - 정규화할 텍스트
   * @param {string} language - 언어 코드
   * @returns {string} 정규화된 텍스트
   */
  normalizeText(text, language) {
    if (!text) return '';
    
    // 소문자 변환 (영어일 경우)
    let normalized = text.toString();
    
    // 한국어/일본어는 대소문자 구분이 없으므로 영어만 소문자화
    if (/[a-zA-Z]/.test(normalized)) {
      normalized = normalized.toLowerCase();
    }
    
    // HTML 태그 제거
    normalized = normalized.replace(/<[^>]*>/g, ' ');
    
    // 특수 문자 처리
    normalized = normalized.replace(/[^\w\s가-힣ぁ-んァ-ン一-龯]+/g, ' ');
    
    // 여러 공백을 하나로 치환
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized.trim();
  }
  
  /**
   * 개체명 추출
   * @param {string} text - 추출할 텍스트
   * @param {string} language - 언어 코드
   * @returns {Array} 추출된 개체명 목록
   */
  extractEntities(text, language) {
    const entities = [];
    
    // 회사명 추출
    const companyPattern = this.entityPatterns.companies[language];
    if (companyPattern) {
      const companyMatches = text.match(companyPattern) || [];
      
      // 중복 제거
      const uniqueCompanies = [...new Set(companyMatches)];
      
      for (const company of uniqueCompanies) {
        if (company.length >= 2) {
          entities.push({
            text: company.trim(),
            type: 'ORGANIZATION',
            subtype: 'COMPANY'
          });
        }
      }
    }
    
    return entities;
  }
  
  /**
   * 태그 클러스터링
   * @param {Array} tags - 태그 목록
   * @param {number} threshold - 클러스터링 임계값
   * @returns {Array} 클러스터링된 태그 목록
   */
  clusterTags(tags, threshold) {
    const clusters = {};
    
    tags.forEach(tag => {
      const text = tag.text.toLowerCase();
      if (!clusters[text]) {
        clusters[text] = [];
      }
      clusters[text].push(tag);
    });
    
    const result = [];
    for (const cluster in clusters) {
      if (clusters[cluster].length > 1) {
        const clusterTags = clusters[cluster];
        const clusterScore = clusterTags.reduce((sum, tag) => sum + tag.score, 0) / clusterTags.length;
        
        if (clusterScore >= threshold) {
          result.push(...clusterTags);
        }
      }
    }
    
    return result;
  }
  
  /**
   * 결과 캐싱
   * @param {string} key - 캐시 키
   * @param {Object} result - 캐싱할 결과
   */
  addToCache(key, result) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      // 가장 오래된 항목 제거 (FIFO)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // 결과 복사본 저장 (참조 문제 방지)
    this.cache.set(key, JSON.parse(JSON.stringify(result)));
  }
  
  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * 텍스트 분석 엔진 클래스
 * 모든 텍스트 분석 기능을 통합 제공
 */
class TextAnalysisEngine {
  constructor() {
    // 구성 요소 초기화
    this.relevanceAnalyzer = financialRelevanceAnalyzer;
    this.sentimentAnalyzer = sentimentAnalysisEngine;
    this.sectorClassifier = new SectorClassificationSystem();
    this.tagExtractor = new TagExtractor();
    
    this.dataManager = FinancialInsightData.getManager();
    
    // 결과 캐싱
    this.cache = new Map();
    this.maxCacheSize = 100;
  }
  
  /**
   * 텍스트 전체 분석
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 언어 코드 (ko, en, ja)
   * @param {Object} options - 분석 옵션
   * @returns {Object} 통합 분석 결과
   */
  analyze(text, language = 'ko', options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      useCache: true,
      analyzers: ['relevance', 'sentiment', 'sector', 'tags'],
      industry: 'finance'
    };
    
    const analyzeOptions = { ...defaultOptions, ...options };
    
    // 입력 검증
    if (!text || typeof text !== 'string') {
      return {
        language: language,
        relevance: { score: 0, relevance: 'none' },
        sentiment: { score: 0, label: 'neutral' },
        sector: { topSector: 'unknown' },
        tags: { tags: [] }
      };
    }
    
    // 캐시 확인 (성능 최적화)
    const cacheKey = `${text.substring(0, 100)}_${language}_${analyzeOptions.analyzers.join('_')}`;
    if (analyzeOptions.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 언어 감지 또는 확인
    const detectedLanguage = this.detectTextLanguage(text, language);
    
    // 결과 구성
    const result = {
      language: detectedLanguage
    };
    
    // 금융 관련성 분석
    if (analyzeOptions.analyzers.includes('relevance')) {
      result.relevance = this.relevanceAnalyzer.analyze(text, detectedLanguage);
    }
    
    // 감성 분석
    if (analyzeOptions.analyzers.includes('sentiment')) {
      result.sentiment = this.sentimentAnalyzer.analyze(text, detectedLanguage, {
        industry: analyzeOptions.industry,
        includeDetails: false
      });
    }
    
    // 섹터 분류
    if (analyzeOptions.analyzers.includes('sector')) {
      result.sector = this.sectorClassifier.classify(text, detectedLanguage);
    }
    
    // 태그 추출
    if (analyzeOptions.analyzers.includes('tags')) {
      result.tags = this.tagExtractor.extractTags(text, detectedLanguage, options);
    }
    
    // 결과 캐싱
    if (analyzeOptions.useCache) {
      this.addToCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * 기사 분석 및 저장
   * @param {string} articleId - 기사 ID
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeArticle(articleId) {
    try {
      // 기사 데이터 가져오기
      const article = this.dataManager.getArticle(articleId);
      if (!article) {
        throw new Error(`Article with ID ${articleId} not found`);
      }
      
      console.log(`Analyzing article: ${article.title}`);
      
      // 분석 언어 설정
      const language = article.language || 'ko';
      
      // 전체 텍스트 분석
      const analysisResult = this.analyze(article.content, language, {
        useCache: true,
        analyzers: ['relevance', 'sentiment', 'sector', 'tags'],
        industry: 'finance'
      });
      
      // 분석 결과 변환
      const relevance = analysisResult.relevance?.score || 0;
      const sentiment = {
        score: analysisResult.sentiment?.score || 0,
        label: analysisResult.sentiment?.label || 'neutral'
      };
      const sectorClassification = {
        topSector: analysisResult.sector?.topSector || 'unknown',
        scores: analysisResult.sector?.scores || {},
        percentages: analysisResult.sector?.percentages || {}
      };
      
      // 키워드 추출
      const keywords = {};
      if (analysisResult.tags && analysisResult.tags.tags) {
        analysisResult.tags.tags.forEach(tag => {
          keywords[tag.tag] = tag.count;
        });
      }
      
      // 개체명 추출
      const entities = analysisResult.tags?.entities || [];
      
      // 중요도 점수 계산 (금융 관련성 + 감성 강도 + 섹터 명확성)
      const importanceBase = relevance * 6; // 60% 비중
      const sentimentStrength = Math.abs(sentiment.score) * 2; // 20% 비중
      const sectorClarity = Math.max(...Object.values(sectorClassification.percentages)) / 100 * 2; // 20% 비중
      
      const importance = Math.round(Math.min(10, Math.max(0, importanceBase + sentimentStrength + sectorClarity)));
      
      // 분석 결과 객체 생성
      const analysis = {
        financialRelevance: relevance,
        sentiment,
        sectorClassification,
        keywords,
        entities,
        importance,
        language
      };
      
      // 분석 결과 저장
      this.dataManager.saveAnalysis(articleId, analysis);
      
      console.log(`Analysis completed for article: ${article.title}`);
      return analysis;
    } catch (error) {
      console.error(`Error analyzing article ${articleId}:`, error);
      return null;
    }
  }
  
  /**
   * 여러 기사 일괄 분석
   * @param {string[]} articleIds - 기사 ID 목록
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeArticleBatch(articleIds, options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      parallel: true,
      maxConcurrent: 5,
      continueOnError: true
    };
    
    const batchOptions = { ...defaultOptions, ...options };
    
    // 결과 객체 초기화
    const results = {
      total: articleIds.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      analysisResults: {}
    };
    
    // 병렬 처리
    if (batchOptions.parallel) {
      // 동시 실행 제한 (Promise.all 대신 순차적으로 일정 수만 병렬 처리)
      const chunks = [];
      for (let i = 0; i < articleIds.length; i += batchOptions.maxConcurrent) {
        chunks.push(articleIds.slice(i, i + batchOptions.maxConcurrent));
      }
      
      for (const chunk of chunks) {
        // 각 청크를 병렬로 처리
        const chunkPromises = chunk.map(articleId => {
          return this.analyzeArticle(articleId)
            .then(result => {
              if (result) {
                results.successful++;
                results.analysisResults[articleId] = result;
              } else {
                results.failed++;
                results.analysisResults[articleId] = null;
              }
            })
            .catch(error => {
              results.failed++;
              console.error(`Error analyzing article ${articleId} in batch:`, error);
              if (!batchOptions.continueOnError) {
                throw error;
              }
            });
        });
        
        await Promise.all(chunkPromises);
      }
    }
    // 순차 처리
    else {
      for (const articleId of articleIds) {
        try {
          const result = await this.analyzeArticle(articleId);
          if (result) {
            results.successful++;
            results.analysisResults[articleId] = result;
          } else {
            results.failed++;
            results.analysisResults[articleId] = null;
          }
        } catch (error) {
          results.failed++;
          console.error(`Error analyzing article ${articleId} in batch:`, error);
          if (!batchOptions.continueOnError) {
            throw error;
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * 텍스트 언어 감지
   * @param {string} text - 감지할 텍스트
   * @param {string} defaultLanguage - 기본 언어
   * @returns {string} 감지된 언어 코드
   */
  detectTextLanguage(text, defaultLanguage) {
    // 언어가 지정되었으면 그대로 사용
    if (['ko', 'en', 'ja'].includes(defaultLanguage)) {
      return defaultLanguage;
    }
    
    // 샘플 텍스트 (최대 200자)
    const sample = text.substring(0, 200);
    
    // 한국어 (한글) 감지
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(sample)) {
      return 'ko';
    }
    
    // 일본어 (히라가나, 가타카나, 한자) 감지
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sample)) {
      return 'ja';
    }
    
    // 기본값은 영어
    return 'en';
  }
  
  /**
   * 결과 캐싱
   * @param {string} key - 캐시 키
   * @param {Object} result - 캐싱할 결과
   */
  addToCache(key, result) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      // 가장 오래된 항목 제거 (FIFO)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // 결과 복사본 저장 (참조 문제 방지)
    this.cache.set(key, JSON.parse(JSON.stringify(result)));
  }
  
  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    this.relevanceAnalyzer.clearCache();
    this.sentimentAnalyzer.clearCache();
    this.sectorClassifier.clearCache();
    this.tagExtractor.clearCache();
  }
}

// 텍스트 분석 엔진 인스턴스 생성
const textAnalysisEngine = new TextAnalysisEngine();

// 모듈 내보내기
export default textAnalysisEngine;

// 개별 분석기 내보내기 (필요시 직접 접근 가능)
export {
  financialRelevanceAnalyzer,
  sentimentAnalysisEngine,
  SectorClassificationSystem,
  TagExtractor
};