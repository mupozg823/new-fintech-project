/**
 * Financial Insight Hub Pro - 데이터 정제 및 처리 시스템
 * 
 * 이 모듈은 수집된 뉴스 기사 데이터를 정제하고 처리하는 기능을 제공합니다.
 * HTML 태그 제거, 텍스트 정규화, 중복 감지, 언어 감지 등의 작업을 수행합니다.
 */

/**
 * 기사 콘텐츠 처리
 * @param {Object} article - 원본 기사 객체
 * @param {Object} options - 처리 옵션
 * @returns {Promise<Object>} 처리된 기사 객체
 */
export async function processArticleContent(article, options = {}) {
  try {
    // 기본 옵션 설정
    const defaultOptions = {
      extractFullContent: true,     // 전문 추출 여부
      translateToKorean: false,     // 한국어 번역 여부
      detectLanguage: true,         // 언어 감지 여부
      removeAds: true,              // 광고 제거 여부
      maxContentLength: 10000,      // 최대 콘텐츠 길이
      useCache: true                // 캐싱 사용 여부
    };
    
    // 옵션 병합
    const processingOptions = {
      ...defaultOptions,
      ...options
    };
    
    // 처리 시작 시간
    const startTime = Date.now();
    
    // 딥 클론 (원본 데이터 변경 방지)
    const processedArticle = { ...article };
    
    // 콘텐츠 정규화
    let normalizedContent = article.content || article.description || '';
    
    // HTML 태그 제거
    if (normalizedContent.includes('<')) {
      normalizedContent = removeHtmlTags(normalizedContent);
    }
    
    // 광고 콘텐츠 제거
    if (processingOptions.removeAds) {
      normalizedContent = removeAdvertisements(normalizedContent);
    }
    
    // 불필요한 공백 및 특수문자 정규화
    normalizedContent = normalizeWhitespace(normalizedContent);
    
    // 최대 길이 제한
    if (processingOptions.maxContentLength > 0 && normalizedContent.length > processingOptions.maxContentLength) {
      normalizedContent = normalizedContent.substring(0, processingOptions.maxContentLength) + '...';
    }
    
    // 처리된 콘텐츠 저장
    processedArticle.content = normalizedContent;
    
    // 언어 감지
    if (processingOptions.detectLanguage && !processedArticle.language) {
      processedArticle.language = detectLanguage(normalizedContent);
    }
    
    // 제목 정규화
    if (processedArticle.title) {
      processedArticle.title = normalizeTitle(processedArticle.title);
    }
    
    // 번역 처리 (한국어로)
    if (processingOptions.translateToKorean && 
        processedArticle.language && 
        processedArticle.language !== 'ko') {
      try {
        if (processedArticle.title) {
          processedArticle.originalTitle = processedArticle.title;
          processedArticle.title = await translateText(processedArticle.title, processedArticle.language, 'ko');
        }
        
        processedArticle.originalContent = processedArticle.content;
        processedArticle.content = await translateText(processedArticle.content, processedArticle.language, 'ko');
        
        // 번역 후 언어 설정
        processedArticle.translatedTo = 'ko';
      } catch (translateError) {
        console.error('Translation error:', translateError);
        // 번역 실패시 원본 유지
      }
    }
    
    // 날짜 형식 표준화
    if (processedArticle.publishedAt && !(processedArticle.publishedAt instanceof Date)) {
      processedArticle.publishedAt = new Date(processedArticle.publishedAt);
    }
    
    // 수집 시간 추가
    processedArticle.collectedAt = new Date();
    
    // 처리 시간 및 상태 정보 추가
    processedArticle.processingInfo = {
      processingTime: Date.now() - startTime,
      options: { ...processingOptions },
      status: 'processed'
    };
    
    return processedArticle;
  } catch (error) {
    console.error('Error processing article content:', error);
    
    // 오류 시 원본 반환 (최소한의 처리 정보 추가)
    return {
      ...article,
      processingInfo: {
        processingTime: 0,
        status: 'error',
        error: error.message
      }
    };
  }
}

/**
 * HTML 태그 제거
 * @param {string} html - HTML 텍스트
 * @returns {string} 태그가 제거된 텍스트
 */
function removeHtmlTags(html) {
  if (!html) return '';
  
  try {
    // 간단한 태그 제거 (정규식 사용)
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]*>/g, ' ');
    
    // HTML 엔티티 디코딩
    text = decodeHtmlEntities(text);
    
    return text;
  } catch (error) {
    console.error('Error removing HTML tags:', error);
    return html;
  }
}

/**
 * HTML 엔티티 디코딩
 * @param {string} text - 디코딩할 텍스트
 * @returns {string} 디코딩된 텍스트
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  
  // HTML 엔티티 맵
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  // 숫자 엔티티 디코딩
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    return String.fromCharCode(dec);
  });
  
  // 이름 있는 엔티티 디코딩
  text = text.replace(/&([^;]+);/g, (entity, name) => {
    return entityMap[entity] || entity;
  });
  
  return text;
}

/**
 * 광고 콘텐츠 제거
 * @param {string} content - 기사 콘텐츠
 * @returns {string} 광고가 제거된 콘텐츠
 */
function removeAdvertisements(content) {
  if (!content) return '';
  
  // 일반적인 광고 패턴 리스트
  const adPatterns = [
    /(?:\[|\()?광고(?:\]|\))?.*?(?:\n|$)/g,
    /(?:\[|\()?sponsored(?:\]|\))?.*?(?:\n|$)/gi,
    /(?:\[|\()?AD(?:\]|\))?.*?(?:\n|$)/gi,
    /(?:\[|\()?Advertisement(?:\]|\))?.*?(?:\n|$)/gi,
    /(?:\[|\()?PR(?:\]|\))?.*?(?:\n|$)/gi,
    /.*?기사 제공:.*?(?:\n|$)/g,
    /.*?Provided by:.*?(?:\n|$)/gi,
    /.*?\d+년\s*\d+월\s*\d+일.*?(?:\n|$)/g, // 날짜 형식 제거 (일부 광고에 포함)
    /.*?http[s]?:\/\/\S+.*?(?:\n|$)/g, // URL 포함 라인 제거 (일부 광고에 포함)
    /.*?클릭.*?(?:\n|$)/g, // '클릭' 포함 라인 제거
    /.*?Click here.*?(?:\n|$)/gi,
    /.*?More information.*?(?:\n|$)/gi,
    /.*?자세한 내용은.*?(?:\n|$)/g
  ];
  
  // 각 패턴 적용
  let cleanedContent = content;
  
  adPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });
  
  return cleanedContent;
}

/**
 * 공백 및 특수문자 정규화
 * @param {string} text - 정규화할 텍스트
 * @returns {string} 정규화된 텍스트
 */
function normalizeWhitespace(text) {
  if (!text) return '';
  
  // 연속된 공백 제거
  let normalized = text.replace(/\s+/g, ' ');
  
  // 불필요한 공백 제거
  normalized = normalized.replace(/^\s+|\s+$/g, '');
  
  // 특수 유니코드 공백 문자 처리
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // 줄바꿈 정규화 (2개 이상 → 2개로)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  
  return normalized;
}

/**
 * 제목 정규화
 * @param {string} title - 정규화할 제목
 * @returns {string} 정규화된 제목
 */
function normalizeTitle(title) {
  if (!title) return '';
  
  // HTML 태그 제거
  let normalized = removeHtmlTags(title);
  
  // 공백 정규화
  normalized = normalizeWhitespace(normalized);
  
  // 따옴표 정규화
  normalized = normalized.replace(/["\"]/g, '"').replace(/[\'\']/g, "'");
  
  // 제목에서 접두사 패턴 제거
  const prefixPatterns = [
    /^\[.*?\]\s*/,    // [접두사]
    /^【.*?】\s*/,     // 【접두사】
    /^<.*?>\s*/,      // <접두사>
    /^'.*?'\s*/,      // '접두사'
    /^".*?"\s*/       // "접두사"
  ];
  
  prefixPatterns.forEach(pattern => {
    normalized = normalized.replace(pattern, '');
  });
  
  return normalized;
}

/**
 * 언어 감지 (기본 구현)
 * @param {string} text - 감지할 텍스트
 * @returns {string} 언어 코드 (ko, en, ja 등)
 */
function detectLanguage(text) {
  if (!text) return 'unknown';
  
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
  
  // 중국어 (한자) 감지
  if (/[\u4E00-\u9FFF]/.test(sample) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) {
    return 'zh';
  }
  
  // 기본값은 영어
  return 'en';
}

/**
 * 텍스트 번역 (더미 구현)
 * 참고: 실제 번역 API 연동이 필요합니다
 * @param {string} text - 번역할 텍스트
 * @param {string} sourceLang - 소스 언어
 * @param {string} targetLang - 대상 언어
 * @returns {Promise<string>} 번역된 텍스트
 */
async function translateText(text, sourceLang, targetLang) {
  // 실제 구현에서는 번역 API 연동
  console.log(`Translation request: ${sourceLang} -> ${targetLang}, length: ${text.length}`);
  
  // 캔버스 환경에서는 외부 번역 API 사용이 어려울 수 있음
  // 이 예제에서는 단순히 원본 텍스트를 반환 (번역 안 함)
  return text;
}

/**
 * 기사 중복 확인 
 * @param {Object} article - 확인할 기사
 * @param {Array} existingArticles - 기존 기사 목록
 * @returns {boolean} 중복 여부
 */
export function isDuplicateArticle(article, existingArticles) {
  if (!article || !existingArticles || existingArticles.length === 0) {
    return false;
  }
  
  // 1. ID 기반 중복 확인
  if (article.id) {
    const idMatch = existingArticles.some(existing => existing.id === article.id);
    if (idMatch) {
      return true;
    }
  }
  
  // 2. URL 기반 중복 확인
  if (article.url || article.link) {
    const articleUrl = article.url || article.link;
    const urlMatch = existingArticles.some(existing => 
      (existing.url && existing.url === articleUrl) || 
      (existing.link && existing.link === articleUrl)
    );
    if (urlMatch) {
      return true;
    }
  }
  
  // 3. 제목 기반 중복 확인 (정확히 일치)
  if (article.title) {
    const titleMatch = existingArticles.some(existing => 
      existing.title && existing.title === article.title
    );
    if (titleMatch) {
      return true;
    }
  }
  
  // 4. 제목 유사도 기반 중복 확인 (80% 이상 유사)
  if (article.title) {
    const similarTitle = existingArticles.some(existing => {
      if (!existing.title) return false;
      
      const similarity = calculateStringSimilarity(
        article.title.toLowerCase(),
        existing.title.toLowerCase()
      );
      return similarity >= 0.8; // 80% 이상 유사도
    });
    
    if (similarTitle) {
      return true;
    }
  }
  
  return false;
}

/**
 * 문자열 유사도 계산 (Dice 계수 방식)
 * @param {string} str1 - 문자열 1
 * @param {string} str2 - 문자열 2
 * @returns {number} 유사도 (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  // 2-gram 생성
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };
  
  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);
  
  // 교집합 계산
  const intersection = new Set(
    [...bigrams1].filter(x => bigrams2.has(x))
  );
  
  // Dice 계수 = 2 * |교집합| / (|집합1| + |집합2|)
  return (2.0 * intersection.size) / (bigrams1.size + bigrams2.size);
}

/**
 * 기사 메타데이터 추출
 * @param {Object} article - 기사 객체
 * @returns {Object} 추출된 메타데이터
 */
export function extractArticleMetadata(article) {
  if (!article) return {};
  
  const metadata = {
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    language: article.language || detectLanguage(article.content),
    extractedDate: null,
    categories: [],
    keywords: []
  };
  
  // 단어 수 및 글자 수 계산
  if (article.content) {
    // 단어 분리 (공백 기준)
    const words = article.content.split(/\s+/);
    metadata.wordCount = words.length;
    
    // 글자 수 (공백 제외)
    metadata.characterCount = article.content.replace(/\s/g, '').length;
    
    // 읽기 시간 추정 (평균 읽기 속도: 분당 250단어)
    metadata.readingTime = Math.ceil(metadata.wordCount / 250);
  }
  
  // 날짜 추출
  if (article.publishedAt) {
    metadata.extractedDate = new Date(article.publishedAt);
  } else {
    // 콘텐츠에서 날짜 형식 추출 시도
    const dateMatch = article.content && article.content.match(
      /(\d{4}[/-]\d{1,2}[/-]\d{1,2})|(\d{1,2}[/-]\d{1,2}[/-]\d{4})/
    );
    
    if (dateMatch) {
      metadata.extractedDate = new Date(dateMatch[0]);
    }
  }
  
  // 카테고리 정보
  if (article.categories && Array.isArray(article.categories)) {
    metadata.categories = [...article.categories];
  }
  
  // 키워드 추출 (간단한 구현)
  if (article.content) {
    // 실제 구현에서는 더 정교한 키워드 추출 알고리즘 사용 필요
    metadata.keywords = extractSimpleKeywords(article.content, 10);
  }
  
  return metadata;
}

/**
 * 간단한 키워드 추출
 * @param {string} text - 추출할 텍스트
 * @param {number} count - 추출할 키워드 수
 * @returns {Array} 추출된 키워드 배열
 */
function extractSimpleKeywords(text, count = 5) {
  if (!text) return [];
  
  // 불용어 (한국어 + 영어)
  const stopwords = new Set([
    // 한국어 불용어
    "이", "그", "저", "것", "및", "에", "에서", "의", "을", "를", "이", "가", "은", "는", "로", "으로",
    "하다", "있다", "되다", "않다", "그리고", "또는", "그러나", "때문에", "이런", "저런", "그런",
    
    // 영어 불용어
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with", "by", "about",
    "as", "into", "like", "through", "after", "over", "between", "out", "against", "during", "without",
    "before", "under", "around", "among"
  ]);
  
  // 텍스트 정제
  const cleanText = text.toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거
    .replace(/\s+/g, ' ');        // 공백 정규화
  
  // 단어 분리
  const words = cleanText.split(' ');
  
  // 단어 빈도 계산
  const wordFrequency = {};
  
  words.forEach(word => {
    // 불용어 및 짧은 단어 건너뛰기
    if (word.length <= 1 || stopwords.has(word) || /^\d+$/.test(word)) {
      return;
    }
    
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // 빈도순 정렬 및 상위 N개 반환
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

/**
 * 기사 요약 생성
 * @param {Object} article - 기사 객체
 * @param {number} maxLength - 최대 요약 길이
 * @returns {string} 생성된 요약
 */
export function generateArticleSummary(article, maxLength = 200) {
  if (!article || !article.content) {
    return '';
  }
  
  try {
    // 첫 번째 방법: 기존 요약 사용
    if (article.summary && article.summary.length <= maxLength) {
      return article.summary;
    }
    
    // 두 번째 방법: 첫 몇 문장 추출
    const sentences = article.content.match(/[^.!?]+[.!?]+/g) || [];
    
    if (sentences.length === 0) {
      // 문장이 없는 경우 내용 일부 사용
      return article.content.substring(0, maxLength) + (article.content.length > maxLength ? '...' : '');
    }
    
    let summary = '';
    let i = 0;
    
    while (i < sentences.length && (summary.length + sentences[i].length) <= maxLength) {
      summary += sentences[i];
      i++;
    }
    
    // 너무 짧은 경우 추가 처리
    if (summary.length < maxLength / 3 && article.content.length > maxLength) {
      return article.content.substring(0, maxLength) + '...';
    }
    
    // 끝에 '...' 추가 (요약이 본문보다 짧은 경우)
    if (summary.length < article.content.length) {
      summary += '...';
    }
    
    return summary;
  } catch (error) {
    console.error('Error generating article summary:', error);
    
    // 오류 시 간단한 대체 요약
    return article.content.substring(0, maxLength) + (article.content.length > maxLength ? '...' : '');
  }
}

// 추가 데이터 처리 함수 내보내기
export default {
  processArticleContent,
  isDuplicateArticle,
  extractArticleMetadata,
  generateArticleSummary,
  removeHtmlTags,
  normalizeTitle,
  detectLanguage
}; 