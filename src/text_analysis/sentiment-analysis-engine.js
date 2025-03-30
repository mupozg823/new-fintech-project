/**
 * Financial Insight Hub Pro - 감성 분석 엔진
 * 
 * 이 모듈은 금융 텍스트의 감성(긍정/부정/중립)을 분석하는 기능을 제공합니다.
 * 언어별 감성사전, 문맥 기반 분석, 부정어 처리 기능을 지원합니다.
 */

/**
 * 감성 사전 - 언어별, 산업별 감성 어휘 정의
 */
const SENTIMENT_LEXICON = {
  // 일반 감성 어휘
  general: {
    ko: {
      positive: [
        "상승", "성장", "호조", "개선", "증가", "호황", "낙관", "돌파", "신기록", "최고", 
        "급등", "강세", "기대", "회복", "반등", "선전", "호실적", "확대", "긍정", "안정", 
        "우세", "수혜", "이익", "견조", "매력", "추천", "전망", "기회", "발전", "강화", 
        "성과", "평안", "효율", "활성", "지지", "향상", "쾌속", "혁신", "승인", "돌파구", 
        "우량", "승리", "좋은", "훌륭한", "뛰어난", "특별한", "환상적인", "완벽한", "성공적", 
        "탁월한", "흡족한", "만족스러운", "두드러진", "효과적인", "유망한", "희망적", "유리한"
      ],
      negative: [
        "하락", "감소", "부진", "악화", "침체", "불황", "비관", "하락세", "저조", "약세", 
        "급락", "폭락", "손실", "위험", "우려", "충격", "하향", "위기", "부정", "불안", 
        "경고", "약화", "부담", "비상", "쇼크", "악재", "조정", "리스크", "혼조", "변동성", 
        "타격", "고전", "저하", "부실", "차질", "애로", "불만", "의혹", "불확실성", "압박", 
        "도전", "제한", "차단", "비판", "문제", "하향세", "실망", "축소", "둔화", "냉각", 
        "피해", "난관", "불리한", "부정적인", "최악의", "형편없는", "심각한", "위험한", "취약한"
      ],
      negators: [
        "않", "안", "못", "없", "아니", "불", "미", "非", "反"
      ]
    },
    en: {
      positive: [
        "increase", "growth", "improve", "gain", "positive", "strong", "optimistic", 
        "breakthrough", "record", "high", "surge", "rally", "expect", "recovery", 
        "rebound", "expansion", "stable", "advantage", "profit", "benefit", "success", 
        "effective", "excellent", "favorable", "promising", "boost", "enhance", "upside", 
        "momentum", "advance", "progress", "strength", "uptrend", "opportunity", "robust", 
        "thrive", "prosper", "solid", "sustainable", "efficient", "productive", "valuable", 
        "attractive", "confident", "recommend", "outperform", "beat", "exceed", "lead", 
        "good", "great", "excellent", "outstanding", "fantastic", "perfect", "successful", 
        "impressive", "satisfactory", "remarkable", "effective", "promising", "hopeful", "favorable"
      ],
      negative: [
        "decrease", "decline", "deteriorate", "loss", "negative", "weak", "pessimistic", 
        "downturn", "poor", "sluggish", "plunge", "crash", "risk", "concern", "worried", 
        "shock", "crisis", "unstable", "fear", "anxiety", "warning", "weaken", "burden", 
        "emergency", "shock", "setback", "adjustment", "risk", "volatile", "volatility", 
        "hit", "struggle", "downgrade", "problem", "issue", "uncertainty", "pressure", 
        "challenge", "restrict", "block", "criticism", "trouble", "downward", "disappoint", 
        "reduce", "slow", "cool", "damage", "difficulty", "unfavorable", "negative", "worst", 
        "terrible", "serious", "dangerous", "vulnerable"
      ],
      negators: [
        "not", "no", "never", "neither", "nor", "none", "cannot", "can't", "won't", 
        "without", "unless", "except", "hardly", "scarcely", "barely"
      ]
    },
    ja: {
      positive: [
        "上昇", "成長", "好調", "改善", "増加", "好況", "楽観", "突破", "新記録", "最高", 
        "急騰", "強気", "期待", "回復", "反発", "拡大", "安定", "利益", "好材料", "前進", 
        "成果", "効率", "活性", "支持", "向上", "革新", "承認", "突破口", "優良", "勝利", 
        "良い", "素晴らしい", "優れた", "特別な", "完璧な", "成功的", "卓越した", "満足な",
        "目立つ", "効果的", "有望な", "希望的", "有利な"
      ],
      negative: [
        "下落", "減少", "不振", "悪化", "低迷", "不況", "悲観", "弱気", "不調", "損失", 
        "急落", "暴落", "リスク", "懸念", "不安", "衝撃", "危機", "否定", "不安", 
        "警告", "弱化", "負担", "非常", "ショック", "悪材料", "調整", "リスク", "変動性", 
        "打撃", "苦戦", "低下", "不実", "支障", "難点", "不満", "疑惑", "不確実性", "圧迫", 
        "挑戦", "制限", "遮断", "批判", "問題", "下向き", "失望", "縮小", "鈍化", "冷却", 
        "被害", "困難", "不利な", "否定的な", "最悪の", "酷い", "深刻な", "危険な", "脆弱な"
      ],
      negators: [
        "ない", "ぬ", "ん", "ず", "ねえ", "ません", "なく", "ぬく", "ねく", "ざる", 
        "不", "非", "無", "未", "反"
      ]
    }
  },
  
  // 금융 시장 관련 감성 어휘
  financial: {
    ko: {
      positive: [
        "상승", "강세", "회복", "반등", "돌파", "급등", "매수", "신고가", "최고가", "지지", 
        "상향", "호재", "매력", "기회", "안정", "활황", "성장", "추세", "전환", "모멘텀", 
        "수익성", "수익률", "이익", "배당", "실적", "순이익", "매출", "영업이익", "경상이익", 
        "흑자", "우량", "우호적", "긍정적", "양호한", "효율적", "개선", "확대", "쾌조", "풍부한"
      ],
      negative: [
        "하락", "약세", "하락세", "급락", "폭락", "매도", "신저가", "최저가", "저항", "하향", 
        "악재", "위험", "리스크", "위기", "불안", "침체", "둔화", "감소", "감산", "부진", 
        "미달", "부족", "실패", "손실", "적자", "부채", "부실", "장애", "악화", "충격", 
        "쇼크", "공포", "불확실성", "변동성", "파산", "디폴트", "구조조정", "감원", "유동성위기"
      ]
    },
    en: {
      positive: [
        "bullish", "rally", "rebound", "breakout", "surge", "buy", "record high", "all-time high", 
        "support", "upgrade", "catalyst", "attractive", "opportunity", "stable", "boom", "growth", 
        "trend", "reversal", "momentum", "profitability", "yield", "profit", "dividend", 
        "earnings", "net income", "revenue", "operating profit", "black", "quality", 
        "favorable", "positive", "sound", "efficient", "improve", "expand", "robust", "ample"
      ],
      negative: [
        "bearish", "slump", "downtrend", "plunge", "crash", "sell", "record low", "all-time low", 
        "resistance", "downgrade", "headwind", "risk", "threat", "crisis", "anxiety", "recession", 
        "slowdown", "decrease", "reduction", "underperform", "miss", "shortfall", "failure", 
        "loss", "deficit", "debt", "default", "impairment", "deterioration", "shock", 
        "fear", "uncertainty", "volatility", "bankruptcy", "restructuring", "layoff", "liquidity crisis"
      ]
    },
    ja: {
      positive: [
        "強気", "反発", "リバウンド", "ブレイクアウト", "急騰", "買い", "最高値", "史上最高値", 
        "サポート", "上方修正", "好材料", "魅力", "機会", "安定", "活況", "成長", 
        "トレンド", "転換", "モメンタム", "収益性", "利回り", "利益", "配当", 
        "業績", "純利益", "売上", "営業利益", "黒字", "優良", 
        "好意的", "ポジティブ", "良好", "効率的", "改善", "拡大", "堅調", "豊富"
      ],
      negative: [
        "弱気", "低迷", "下降トレンド", "急落", "暴落", "売り", "最安値", "史上最安値", 
        "抵抗", "下方修正", "悪材料", "リスク", "脅威", "危機", "不安", "景気後退", 
        "減速", "減少", "削減", "不振", "未達", "不足", "失敗", "損失", 
        "赤字", "負債", "デフォルト", "減損", "悪化", "ショック", 
        "恐怖", "不確実性", "ボラティリティ", "破産", "リストラ", "人員削減", "流動性危機"
      ]
    }
  },
  
  // 경제 지표 관련 감성 어휘
  economic: {
    ko: {
      positive: [
        "성장", "확장", "증가", "개선", "호조", "상승", "활성화", "회복", "안정", "균형", 
        "흑자", "확대", "개선세", "효율", "선도", "경쟁력", "생산성", "혁신", "발전", "번영"
      ],
      negative: [
        "침체", "위축", "감소", "악화", "둔화", "하락", "경색", "후퇴", "불안정", "불균형", 
        "적자", "축소", "퇴보", "비효율", "지체", "경쟁력상실", "생산성하락", "정체", "쇠퇴", "빈곤"
      ]
    },
    en: {
      positive: [
        "growth", "expansion", "increase", "improvement", "favorable", "rise", "stimulate", 
        "recovery", "stable", "balanced", "surplus", "expand", "improving", "efficient", 
        "leading", "competitive", "productive", "innovative", "development", "prosperity"
      ],
      negative: [
        "recession", "contraction", "decrease", "deterioration", "slowdown", "decline", 
        "tightening", "retreat", "unstable", "imbalanced", "deficit", "shrink", "regress", 
        "inefficient", "lagging", "uncompetitive", "unproductive", "stagnant", "decline", "poverty"
      ]
    },
    ja: {
      positive: [
        "成長", "拡大", "増加", "改善", "好調", "上昇", "活性化", "回復", "安定", "均衡", 
        "黒字", "拡大", "改善傾向", "効率", "先導", "競争力", "生産性", "革新", "発展", "繁栄"
      ],
      negative: [
        "景気後退", "縮小", "減少", "悪化", "減速", "下落", "引き締め", "後退", "不安定", "不均衡", 
        "赤字", "縮小", "退歩", "非効率", "遅延", "競争力喪失", "生産性低下", "停滞", "衰退", "貧困"
      ]
    }
  },
  
  // 기업 실적 관련 감성 어휘
  corporate: {
    ko: {
      positive: [
        "실적개선", "매출증가", "이익증가", "영업이익", "순이익", "수익성", "매출성장", "흑자전환", 
        "비용절감", "수주", "계약", "신제품", "신사업", "신시장", "경쟁력", "선도", "혁신", 
        "효율", "시너지", "협력", "파트너십", "인수", "합병", "지분확대", "투자확대", "R&D", 
        "연구개발", "신기술", "특허", "리더십", "성장동력", "확장", "글로벌", "해외진출"
      ],
      negative: [
        "실적부진", "매출감소", "이익감소", "영업손실", "순손실", "수익성악화", "매출하락", "적자전환", 
        "비용증가", "수주감소", "계약해지", "제품단종", "사업축소", "시장철수", "경쟁력약화", "후발", 
        "정체", "비효율", "구조조정", "갈등", "소송", "적대적인수", "지분매각", "투자축소", "연구중단", 
        "기술유출", "특허침해", "리더십부재", "성장정체", "축소", "철수", "국내한정", "해외실패"
      ]
    },
    en: {
      positive: [
        "earnings growth", "revenue increase", "profit growth", "operating profit", "net income", 
        "profitability", "sales growth", "turn to black", "cost reduction", "order", "contract", 
        "new product", "new business", "new market", "competitiveness", "leading", "innovation", 
        "efficiency", "synergy", "cooperation", "partnership", "acquisition", "merger", 
        "stake increase", "investment expansion", "R&D", "research", "new technology", 
        "patent", "leadership", "growth engine", "expansion", "global", "overseas expansion"
      ],
      negative: [
        "poor performance", "revenue decrease", "profit decline", "operating loss", "net loss", 
        "profitability deterioration", "sales drop", "turn to red", "cost increase", 
        "order decrease", "contract termination", "product discontinuation", "business downsizing", 
        "market withdrawal", "weakened competitiveness", "follower", "stagnation", "inefficiency", 
        "restructuring", "conflict", "lawsuit", "hostile takeover", "stake sale", 
        "investment reduction", "research suspension", "technology leak", "patent infringement", 
        "leadership vacuum", "growth stagnation", "downsizing", "withdrawal", "domestic only", 
        "overseas failure"
      ]
    },
    ja: {
      positive: [
        "業績改善", "売上増加", "利益増加", "営業利益", "純利益", "収益性", "売上成長", "黒字転換", 
        "コスト削減", "受注", "契約", "新製品", "新事業", "新市場", "競争力", "先導", "革新", 
        "効率", "シナジー", "協力", "パートナーシップ", "買収", "合併", "持分拡大", "投資拡大", "R&D", 
        "研究開発", "新技術", "特許", "リーダーシップ", "成長エンジン", "拡張", "グローバル", "海外進出"
      ],
      negative: [
        "業績不振", "売上減少", "利益減少", "営業損失", "純損失", "収益性悪化", "売上下落", "赤字転換", 
        "コスト増加", "受注減少", "契約解除", "製品終了", "事業縮小", "市場撤退", "競争力低下", "後発", 
        "停滞", "非効率", "リストラ", "紛争", "訴訟", "敵対的買収", "持分売却", "投資縮小", "研究中断", 
        "技術流出", "特許侵害", "リーダーシップ不在", "成長停滞", "縮小", "撤退", "国内限定", "海外失敗"
      ]
    }
  }
};

/**
 * 산업별 가중치 설정
 * 산업별로 감성 어휘에 다른 가중치 적용
 */
const INDUSTRY_WEIGHTS = {
  finance: {
    financial: 1.5,
    economic: 1.2,
    general: 1.0,
    corporate: 1.1
  },
  tech: {
    corporate: 1.4,
    financial: 1.2,
    general: 1.0,
    economic: 0.9
  },
  energy: {
    economic: 1.4,
    corporate: 1.2,
    financial: 1.1,
    general: 1.0
  },
  healthcare: {
    corporate: 1.3,
    economic: 1.1,
    general: 1.0,
    financial: 0.9
  },
  general: {
    financial: 1.2,
    economic: 1.2,
    corporate: 1.2,
    general: 1.0
  }
};

/**
 * 감성 분석 엔진 클래스
 * 텍스트의 감성을 분석하여 점수와 레이블 제공
 */
class SentimentAnalysisEngine {
  constructor() {
    this.lexicon = SENTIMENT_LEXICON;
    this.industryWeights = INDUSTRY_WEIGHTS;
    
    // 결과 캐싱
    this.cache = new Map();
    this.maxCacheSize = 100;
    
    // 문맥 분석 설정
    this.contextSettings = {
      windowSize: 5, // 단어 주변 문맥 크기
      negationImpact: 0.8 // 부정어 영향력 (0-1)
    };
  }
  
  /**
   * 감성 분석 수행
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 언어 코드 (ko, en, ja)
   * @param {Object} options - 분석 옵션
   * @returns {Object} 분석 결과
   */
  analyze(text, language = 'ko', options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      useCache: true,
      industry: 'general', // finance, tech, energy, healthcare, general
      includeDetails: false,
      contextAnalysis: true, // 문맥 분석 사용 여부
      negationHandling: true // 부정어 처리 사용 여부
    };
    
    const analyzeOptions = { ...defaultOptions, ...options };
    
    // 입력 검증
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        label: 'neutral',
        positive: [],
        negative: []
      };
    }
    
    // 캐시 확인 (성능 최적화)
    const cacheKey = `${text.substring(0, 100)}_${language}_${analyzeOptions.industry}`;
    if (analyzeOptions.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 언어 감지 또는 확인
    const detectedLanguage = this.detectTextLanguage(text, language);
    
    // 텍스트 정규화
    const normalizedText = this.normalizeText(text);
    
    // 단어 분할 및 문장 분할
    const words = this.tokenizeText(normalizedText, detectedLanguage);
    const sentences = this.splitSentences(normalizedText, detectedLanguage);
    
    // 산업별 가중치 설정
    const weights = this.industryWeights[analyzeOptions.industry] || this.industryWeights.general;
    
    // 감성 분석 수행
    const sentimentResult = analyzeOptions.contextAnalysis 
      ? this.analyzeSentimentWithContext(words, sentences, detectedLanguage, weights, analyzeOptions.negationHandling)
      : this.analyzeSentimentBasic(words, detectedLanguage, weights, analyzeOptions.negationHandling);
    
    // 감성 레이블 결정
    const label = this.getSentimentLabel(sentimentResult.score);
    
    // 결과 구성
    const result = {
      score: sentimentResult.score,
      label: label,
      positive: sentimentResult.positiveTerms.slice(0, 10), // 상위 10개만
      negative: sentimentResult.negativeTerms.slice(0, 10)  // 상위 10개만
    };
    
    // 상세 분석 포함 옵션
    if (analyzeOptions.includeDetails) {
      result.details = {
        language: detectedLanguage,
        industry: analyzeOptions.industry,
        positiveCount: sentimentResult.positiveCount,
        negativeCount: sentimentResult.negativeCount,
        positiveScore: sentimentResult.positiveScore,
        negativeScore: sentimentResult.negativeScore,
        neutralCount: words.length - (sentimentResult.positiveCount + sentimentResult.negativeCount),
        sentenceAnalysis: sentimentResult.sentenceAnalysis
      };
    }
    
    // 결과 캐싱
    if (analyzeOptions.useCache) {
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
    
    // 한국어 (한글) 감지 - 수정된 정규식
    if (/[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/.test(sample)) {
      return 'ko';
    }
    
    // 일본어 (히라가나, 가타카나, 한자) 감지 - 수정된 정규식
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
    
    // 소문자 변환 (영어일 경우)
    let normalized = text.toString();
    
    // 한국어/일본어는 대소문자 구분이 없으므로 영어만 소문자화
    if (/[a-zA-Z]/.test(normalized)) {
      normalized = normalized.toLowerCase();
    }
    
    // HTML 태그 제거
    normalized = normalized.replace(/<[^>]*>/g, ' ');
    
    // 특수 문자 처리 (구두점은 부정어 및 문장 분석에 필요하므로 남겨둠)
    normalized = normalized.replace(/[^\w\s\.\,\!\?\;\:\—\-\(\)가-힣ぁ-んァ-ン一-龯]/g, ' ');
    
    // 여러 공백을 하나로 치환
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized.trim();
  }
  
  /**
   * 텍스트 토큰화 (단어 분할)
   * @param {string} text - 토큰화할 텍스트
   * @param {string} language - 언어 코드
   * @returns {string[]} 단어 배열
   */
  tokenizeText(text, language) {
    if (!text) return [];
    
    // 영어: 공백 및 구두점 기준 분할
    if (language === 'en') {
      return text.split(/[\s\.\,\!\?\;\:\—\-\(\)]+/).filter(word => word.length > 0);
    }
    
    // 한국어: 공백 기준 분할 (간단 구현)
    if (language === 'ko') {
      return text.split(/[\s\.\,\!\?\;\:\—\-\(\)]+/).filter(word => word.length > 0);
    }
    
    // 일본어: 공백 기준 분할 (간단 구현)
    if (language === 'ja') {
      return text.split(/[\s\.\,\!\?\;\:\—\-\(\)]+/).filter(word => word.length > 0);
    }
    
    // 기본 분할 (공백 기준)
    return text.split(/\s+/).filter(word => word.length > 0);
  }
  
  /**
   * 문장 분할
   * @param {string} text - 분할할 텍스트
   * @param {string} language - 언어 코드
   * @returns {string[]} 문장 배열
   */
  splitSentences(text, language) {
    if (!text) return [];
    
    // 공통 문장 분할 패턴 (마침표, 느낌표, 물음표 등으로 구분)
    const sentences = [];
    
    // 영어 문장 분할
    if (language === 'en') {
      // 약어, 숫자 등을 고려한 문장 분할
      return text.match(/[^.!?]+[.!?]+/g) || [text];
    }
    
    // 한국어/일본어 문장 분할
    if (language === 'ko' || language === 'ja') {
      // 특수 문자를 고려한 문장 분할
      return text.match(/[^.!?。！？]+[.!?。！？]+/g) || [text];
    }
    
    // 기본 문장 분할
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }
  
  /**
   * 기본 감성 분석 (단어 기반)
   * @param {string[]} words - 단어 배열
   * @param {string} language - 언어 코드
   * @param {Object} weights - 산업별 가중치
   * @param {boolean} handleNegation - 부정어 처리 여부
   * @returns {Object} 감성 분석 결과
   */
  analyzeSentimentBasic(words, language, weights, handleNegation) {
    // 각 카테고리별 감성 어휘 가져오기
    const categories = Object.keys(this.lexicon);
    const lexicons = {};
    
    for (const category of categories) {
      lexicons[category] = this.lexicon[category][language] || {};
    }
    
    let positiveScore = 0;
    let negativeScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    
    const positiveTerms = [];
    const negativeTerms = [];
    
    // 부정어 처리를 위한 변수
    let negationActive = false;
    const negators = [];
    
    // 부정어 목록 준비
    if (handleNegation) {
      for (const category in lexicons) {
        if (lexicons[category].negators) {
          negators.push(...lexicons[category].negators);
        }
      }
    }
    
    // 각 단어에 대한 감성 분석
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // 부정어 확인
      if (handleNegation && negators.some(negator => word.includes(negator))) {
        negationActive = true;
        continue;
      }
      
      // 감성 점수 계산 변수
      let wordPositive = false;
      let wordNegative = false;
      
      // 카테고리별 감성 확인
      for (const category in lexicons) {
        const weight = weights[category] || 1.0;
        
        // 긍정 감성 확인
        if (lexicons[category].positive && lexicons[category].positive.includes(word)) {
          // 부정어 처리
          if (negationActive) {
            negativeScore += weight;
            negativeCount++;
            negativeTerms.push(word);
            wordNegative = true;
          } else {
            positiveScore += weight;
            positiveCount++;
            positiveTerms.push(word);
            wordPositive = true;
          }
        }
        
        // 부정 감성 확인
        if (lexicons[category].negative && lexicons[category].negative.includes(word)) {
          // 부정어 처리
          if (negationActive) {
            positiveScore += weight;
            positiveCount++;
            positiveTerms.push(word);
            wordPositive = true;
          } else {
            negativeScore += weight;
            negativeCount++;
            negativeTerms.push(word);
            wordNegative = true;
          }
        }
      }
      
      // 부정어 효과 초기화 (단어가 감성을 가진 경우)
      if (wordPositive || wordNegative) {
        negationActive = false;
      }
      
      // 부정어 효과는 최대 3단어까지 지속
      if (negationActive && i > 0 && (i % 3 === 0)) {
        negationActive = false;
      }
    }
    
    // 중복 제거
    const uniquePositiveTerms = [...new Set(positiveTerms)];
    const uniqueNegativeTerms = [...new Set(negativeTerms)];
    
    // 최종 감성 점수 계산 (-1.0 ~ 1.0)
    const totalScore = positiveScore + negativeScore;
    let sentimentScore = 0;
    
    if (totalScore > 0) {
      sentimentScore = (positiveScore - negativeScore) / totalScore;
    }
    
    return {
      score: sentimentScore,
      positiveScore,
      negativeScore,
      positiveCount,
      negativeCount,
      positiveTerms: uniquePositiveTerms,
      negativeTerms: uniqueNegativeTerms,
      sentenceAnalysis: []
    };
  }
  
  /**
   * 문맥 기반 감성 분석
   * @param {string[]} words - 단어 배열
   * @param {string[]} sentences - 문장 배열
   * @param {string} language - 언어 코드
   * @param {Object} weights - 산업별 가중치
   * @param {boolean} handleNegation - 부정어 처리 여부
   * @returns {Object} 감성 분석 결과
   */
  analyzeSentimentWithContext(words, sentences, language, weights, handleNegation) {
    // 각 카테고리별 감성 어휘 가져오기
    const categories = Object.keys(this.lexicon);
    const lexicons = {};
    
    for (const category of categories) {
      lexicons[category] = this.lexicon[category][language] || {};
    }
    
    let positiveScore = 0;
    let negativeScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    
    const positiveTerms = [];
    const negativeTerms = [];
    const sentenceAnalysis = [];
    
    // 부정어 목록 준비
    const negators = [];
    if (handleNegation) {
      for (const category in lexicons) {
        if (lexicons[category].negators) {
          negators.push(...lexicons[category].negators);
        }
      }
    }
    
    // 각 문장별 분석
    for (const sentence of sentences) {
      // 문장을 단어로 분할
      const sentenceWords = this.tokenizeText(sentence, language);
      
      let sentencePositiveScore = 0;
      let sentenceNegativeScore = 0;
      let sentencePositiveCount = 0;
      let sentenceNegativeCount = 0;
      
      // 부정어 처리를 위한 변수
      let negationActive = false;
      let negationPosition = -1;
      
      // 각 단어에 대한 감성 분석
      for (let i = 0; i < sentenceWords.length; i++) {
        const word = sentenceWords[i];
        
        // 부정어 확인
        if (handleNegation && negators.some(negator => word.includes(negator))) {
          negationActive = true;
          negationPosition = i;
          continue;
        }
        
        // 감성 점수 계산 변수
        let wordPositive = false;
        let wordNegative = false;
        
        // 카테고리별 감성 확인
        for (const category in lexicons) {
          const weight = weights[category] || 1.0;
          
          // 긍정 감성 확인
          if (lexicons[category].positive && lexicons[category].positive.includes(word)) {
            // 부정어 처리 (거리에 따른 영향력 감소)
            if (negationActive) {
              const distance = i - negationPosition;
              const negationFactor = Math.max(0, this.contextSettings.negationImpact - (distance * 0.1));
              
              // 부정어가 긍정어를 부정어로 변환
              negativeScore += weight * negationFactor;
              negativeCount++;
              negativeTerms.push(word);
              wordNegative = true;
              
              sentenceNegativeScore += weight * negationFactor;
              sentenceNegativeCount++;
            } else {
              positiveScore += weight;
              positiveCount++;
              positiveTerms.push(word);
              wordPositive = true;
              
              sentencePositiveScore += weight;
              sentencePositiveCount++;
            }
          }
          
          // 부정 감성 확인
          if (lexicons[category].negative && lexicons[category].negative.includes(word)) {
            // 부정어 처리 (거리에 따른 영향력 감소)
            if (negationActive) {
              const distance = i - negationPosition;
              const negationFactor = Math.max(0, this.contextSettings.negationImpact - (distance * 0.1));
              
              // 부정어가 부정어를 긍정어로 변환
              positiveScore += weight * negationFactor;
              positiveCount++;
              positiveTerms.push(word);
              wordPositive = true;
              
              sentencePositiveScore += weight * negationFactor;
              sentencePositiveCount++;
            } else {
              negativeScore += weight;
              negativeCount++;
              negativeTerms.push(word);
              wordNegative = true;
              
              sentenceNegativeScore += weight;
              sentenceNegativeCount++;
            }
          }
        }
        
        // 부정어 효과 초기화 (단어가 감성을 가진 경우)
        if (wordPositive || wordNegative) {
          negationActive = false;
        }
        
        // 부정어 효과는 최대 3단어까지 지속
        if (negationActive && (i - negationPosition) >= 3) {
          negationActive = false;
        }
      }
      
      // 문장 감성 점수 계산
      const sentenceTotalScore = sentencePositiveScore + sentenceNegativeScore;
      let sentenceSentimentScore = 0;
      
      if (sentenceTotalScore > 0) {
        sentenceSentimentScore = (sentencePositiveScore - sentenceNegativeScore) / sentenceTotalScore;
      }
      
      // 문장 감성 레이블
      const sentenceSentimentLabel = this.getSentimentLabel(sentenceSentimentScore);
      
      // 문장 분석 결과 저장
      sentenceAnalysis.push({
        text: sentence,
        score: sentenceSentimentScore,
        label: sentenceSentimentLabel,
        positiveCount: sentencePositiveCount,
        negativeCount: sentenceNegativeCount
      });
    }
    
    // 중복 제거
    const uniquePositiveTerms = [...new Set(positiveTerms)];
    const uniqueNegativeTerms = [...new Set(negativeTerms)];
    
    // 최종 감성 점수 계산 (-1.0 ~ 1.0)
    const totalScore = positiveScore + negativeScore;
    let sentimentScore = 0;
    
    if (totalScore > 0) {
      sentimentScore = (positiveScore - negativeScore) / totalScore;
    }
    
    return {
      score: sentimentScore,
      positiveScore,
      negativeScore,
      positiveCount,
      negativeCount,
      positiveTerms: uniquePositiveTerms,
      negativeTerms: uniqueNegativeTerms,
      sentenceAnalysis
    };
  }
  
  /**
   * 감성 레이블 결정
   * @param {number} score - 감성 점수
   * @returns {string} 감성 레이블
   */
  getSentimentLabel(score) {
    if (score >= 0.6) {
      return 'very_positive';
    } else if (score >= 0.2) {
      return 'positive';
    } else if (score > -0.2) {
      return 'neutral';
    } else if (score > -0.6) {
      return 'negative';
    } else {
      return 'very_negative';
    }
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
   * 사용자 정의 감성 어휘 추가
   * @param {string} category - 카테고리 (general, financial, economic, corporate)
   * @param {string} language - 언어 코드 (ko, en, ja)
   * @param {Object} terms - 추가할 감성 어휘 객체 {positive: [], negative: [], negators: []}
   * @returns {boolean} 성공 여부
   */
  addCustomTerms(category, language, terms) {
    // 카테고리 확인
    if (!this.lexicon[category]) {
      this.lexicon[category] = {};
    }
    
    // 언어 확인
    if (!this.lexicon[category][language]) {
      this.lexicon[category][language] = {
        positive: [],
        negative: [],
        negators: []
      };
    }
    
    // 어휘 추가
    if (terms.positive && Array.isArray(terms.positive)) {
      const existingPositive = new Set(this.lexicon[category][language].positive || []);
      terms.positive.forEach(term => existingPositive.add(term));
      this.lexicon[category][language].positive = Array.from(existingPositive);
    }
    
    if (terms.negative && Array.isArray(terms.negative)) {
      const existingNegative = new Set(this.lexicon[category][language].negative || []);
      terms.negative.forEach(term => existingNegative.add(term));
      this.lexicon[category][language].negative = Array.from(existingNegative);
    }
    
    if (terms.negators && Array.isArray(terms.negators)) {
      const existingNegators = new Set(this.lexicon[category][language].negators || []);
      terms.negators.forEach(term => existingNegators.add(term));
      this.lexicon[category][language].negators = Array.from(existingNegators);
    }
    
    // 캐시 초기화 (어휘 변경으로 인한 일관성 유지)
    this.clearCache();
    
    return true;
  }
  
  /**
   * 산업별 가중치 설정
   * @param {string} industry - 산업 (finance, tech, energy, healthcare, general)
   * @param {Object} weights - 가중치 설정 객체 {general: 1.0, financial: 1.2, ...}
   * @returns {boolean} 성공 여부
   */
  setIndustryWeights(industry, weights) {
    if (!this.industryWeights[industry]) {
      this.industryWeights[industry] = {};
    }
    
    // 가중치 업데이트
    for (const category in weights) {
      const weight = weights[category];
      
      // 유효한 가중치 범위 (0.1-3.0)
      if (typeof weight === 'number' && weight >= 0.1 && weight <= 3.0) {
        this.industryWeights[industry][category] = weight;
      }
    }
    
    // 캐시 초기화 (가중치 변경으로 인한 일관성 유지)
    this.clearCache();
    
    return true;
  }
}

// 모듈 내보내기
const sentimentAnalysisEngine = new SentimentAnalysisEngine();
export default sentimentAnalysisEngine; 