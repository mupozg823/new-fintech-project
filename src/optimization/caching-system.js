/**
 * Financial Insight Hub Pro - 캐싱 시스템
 * 
 * 이 모듈은 함수 결과, API 응답 등의 캐싱을 관리하는 기능을 제공합니다.
 * 메모이제이션, 캐시 무효화, 캐시 우선순위 등을 구현합니다.
 */

/**
 * 캐시 항목 클래스
 * 캐시 항목 데이터 구조
 */
class CacheItem {
  constructor(key, value, options = {}) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
    this.hitCount = 0;
    this.size = this.estimateSize(value);
    
    // 캐시 항목 옵션
    this.options = {
      ttl: options.ttl || null, // 만료 시간 (밀리초)
      priority: options.priority || 0, // 우선순위 (높을수록 중요)
      tags: options.tags || [] // 태그 목록 (그룹 관리용)
    };
  }
  
  /**
   * 항목 크기 추정
   * @param {any} value - 크기를 추정할 값
   * @returns {number} 추정 크기 (바이트)
   */
  estimateSize(value) {
    if (value === null || value === undefined) {
      return 0;
    }
    
    if (typeof value === 'boolean') {
      return 4;
    }
    
    if (typeof value === 'number') {
      return 8;
    }
    
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16 문자당 2바이트
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.reduce((size, item) => size + this.estimateSize(item), 0);
      }
      
      return Object.entries(value).reduce((size, [key, val]) => {
        return size + key.length * 2 + this.estimateSize(val);
      }, 0);
    }
    
    return 0;
  }
  
  /**
   * 항목이 만료되었는지 확인
   * @returns {boolean} 만료 여부
   */
  isExpired() {
    if (!this.options.ttl) {
      return false;
    }
    
    const now = Date.now();
    return now - this.createdAt >= this.options.ttl;
  }
  
  /**
   * 항목 접근 기록 갱신
   */
  updateAccess() {
    this.lastAccessed = Date.now();
    this.hitCount++;
  }
}

/**
 * 캐싱 시스템 클래스
 * 캐시 관리 및 메모이제이션
 */
class CachingSystem {
  constructor() {
    this.isInitialized = false;
    this.config = {
      enableMemoization: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5분
      pruneInterval: 60 * 1000, // 1분
      logCacheEvents: true
    };
    
    // 캐시 저장소
    this.cache = new Map();
    
    // 캐시 통계
    this.stats = {
      totalCacheHits: 0,
      totalCacheMisses: 0,
      totalEvictions: 0,
      currentSize: 0,
      itemCount: 0
    };
    
    // 메모이제이션 캐시
    this.memoCache = new Map();
    
    // 자동 정리 타이머
    this.pruneIntervalId = null;
  }
  
  /**
   * 캐싱 시스템 초기화
   * @param {Object} config - 설정 객체
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('캐싱 시스템이 이미 초기화되었습니다');
      return true;
    }
    
    console.log('캐싱 시스템 초기화 중...');
    
    // 설정 병합
    this.config = { ...this.config, ...config };
    
    try {
      // 주기적 캐시 정리 시작
      this.startPeriodicPruning();
      
      this.isInitialized = true;
      console.log('캐싱 시스템 초기화 완료');
      return true;
    } catch (error) {
      console.error('캐싱 시스템 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 주기적 캐시 정리 시작
   */
  startPeriodicPruning() {
    if (this.pruneIntervalId) {
      clearInterval(this.pruneIntervalId);
    }
    
    this.pruneIntervalId = setInterval(() => {
      this.pruneCache();
    }, this.config.pruneInterval);
    
    console.log(`주기적 캐시 정리 시작 (간격: ${this.config.pruneInterval / 1000}초)`);
  }
  
  /**
   * 주기적 캐시 정리 중지
   */
  stopPeriodicPruning() {
    if (this.pruneIntervalId) {
      clearInterval(this.pruneIntervalId);
      this.pruneIntervalId = null;
      console.log('주기적 캐시 정리 중지');
    }
  }
  
  /**
   * 캐시에 항목 설정
   * @param {string} key - 캐시 키
   * @param {any} value - 캐시 값
   * @param {Object} options - 캐시 옵션
   * @returns {boolean} 설정 성공 여부
   */
  set(key, value, options = {}) {
    if (!this.isInitialized) {
      console.warn('캐싱 시스템이 초기화되지 않았습니다');
      return false;
    }
    
    // 기존 항목 제거
    if (this.cache.has(key)) {
      const oldItem = this.cache.get(key);
      this.stats.currentSize -= oldItem.size;
      this.stats.itemCount--;
    }
    
    // 새 캐시 항목 생성
    const cacheItem = new CacheItem(key, value, {
      ttl: options.ttl || this.config.defaultTTL,
      priority: options.priority || 0,
      tags: options.tags || []
    });
    
    // 캐시 크기 검사 및 필요시 정리
    if (this.stats.currentSize + cacheItem.size > this.config.maxCacheSize) {
      this.evictItems(cacheItem.size);
    }
    
    // 캐시에 항목 추가
    this.cache.set(key, cacheItem);
    
    // 통계 업데이트
    this.stats.currentSize += cacheItem.size;
    this.stats.itemCount++;
    
    if (this.config.logCacheEvents) {
      console.log(`캐시 항목 설정: ${key} (${Math.round(cacheItem.size / 1024)}KB)`);
    }
    
    return true;
  }
  
  /**
   * 캐시에서 항목 가져오기
   * @param {string} key - 캐시 키
   * @returns {any} 캐시 값 또는 undefined
   */
  get(key) {
    if (!this.isInitialized || !this.cache.has(key)) {
      this.stats.totalCacheMisses++;
      return undefined;
    }
    
    const cacheItem = this.cache.get(key);
    
    // 만료 확인
    if (cacheItem.isExpired()) {
      this.cache.delete(key);
      this.stats.currentSize -= cacheItem.size;
      this.stats.itemCount--;
      this.stats.totalCacheMisses++;
      
      if (this.config.logCacheEvents) {
        console.log(`캐시 항목 만료: ${key}`);
      }
      
      return undefined;
    }
    
    // 접근 기록 갱신
    cacheItem.updateAccess();
    
    // 통계 업데이트
    this.stats.totalCacheHits++;
    
    if (this.config.logCacheEvents) {
      console.log(`캐시 히트: ${key} (히트 수: ${cacheItem.hitCount})`);
    }
    
    return cacheItem.value;
  }
  
  /**
   * 캐시에서 항목 삭제
   * @param {string} key - 캐시 키
   * @returns {boolean} 삭제 성공 여부
   */
  delete(key) {
    if (!this.isInitialized || !this.cache.has(key)) {
      return false;
    }
    
    const cacheItem = this.cache.get(key);
    
    // 캐시에서 항목 제거
    this.cache.delete(key);
    
    // 통계 업데이트
    this.stats.currentSize -= cacheItem.size;
    this.stats.itemCount--;
    
    if (this.config.logCacheEvents) {
      console.log(`캐시 항목 삭제: ${key}`);
    }
    
    return true;
  }
  
  /**
   * 특정 태그가 있는 모든 캐시 항목 삭제
   * @param {string} tag - 태그
   * @returns {number} 삭제된 항목 수
   */
  deleteByTag(tag) {
    if (!this.isInitialized) {
      return 0;
    }
    
    let deletedCount = 0;
    
    // 태그가 있는 모든 항목 찾기
    for (const [key, item] of this.cache.entries()) {
      if (item.options.tags.includes(tag)) {
        // 캐시에서 항목 제거
        this.cache.delete(key);
        
        // 통계 업데이트
        this.stats.currentSize -= item.size;
        this.stats.itemCount--;
        
        deletedCount++;
      }
    }
    
    if (this.config.logCacheEvents && deletedCount > 0) {
      console.log(`태그 기반 캐시 삭제: ${tag} (${deletedCount}개 항목)`);
    }
    
    return deletedCount;
  }
  
  /**
   * 캐시 정리 (만료된 항목 및 공간 확보)
   * @param {number} [neededSpace] - 확보할 공간 (바이트)
   * @returns {number} 정리된 항목 수
   */
  pruneCache(neededSpace = 0) {
    if (!this.isInitialized) {
      return 0;
    }
    
    let prunedCount = 0;
    let freedSpace = 0;
    
    // 만료된 항목 제거
    for (const [key, item] of this.cache.entries()) {
      if (item.isExpired()) {
        this.cache.delete(key);
        
        // 통계 업데이트
        this.stats.currentSize -= item.size;
        this.stats.itemCount--;
        
        freedSpace += item.size;
        prunedCount++;
      }
    }
    
    // 추가 공간이 필요한 경우 항목 축출
    if (neededSpace > 0 && freedSpace < neededSpace) {
      const additionalEvictions = this.evictItems(neededSpace - freedSpace);
      prunedCount += additionalEvictions;
    }
    
    if (this.config.logCacheEvents && prunedCount > 0) {
      console.log(`캐시 정리: ${prunedCount}개 항목 제거 (${Math.round(freedSpace / 1024)}KB 확보)`);
    }
    
    return prunedCount;
  }
  
  /**
   * 캐시 항목 축출
   * @param {number} neededSpace - 필요한 공간 (바이트)
   * @returns {number} 축출된 항목 수
   */
  evictItems(neededSpace) {
    if (!this.isInitialized || this.cache.size === 0) {
      return 0;
    }
    
    let evictedCount = 0;
    let freedSpace = 0;
    
    // 캐시 항목을 배열로 변환
    const cacheItems = Array.from(this.cache.values());
    
    // 캐시 항목 정렬 (우선순위, 마지막 접근 시간, 히트 수 기준)
    const sortedItems = cacheItems.sort((a, b) => {
      // 우선순위가 다르면 우선순위가 낮은 것 먼저 제거
      if (a.options.priority !== b.options.priority) {
        return a.options.priority - b.options.priority;
      }
      
      // 우선순위가 같으면 마지막 접근 시간이 오래된 것 먼저 제거
      if (a.lastAccessed !== b.lastAccessed) {
        return a.lastAccessed - b.lastAccessed;
      }
      
      // 마지막 접근 시간이 같으면 히트 수가 적은 것 먼저 제거
      return a.hitCount - b.hitCount;
    });
    
    // 필요한 공간을 확보할 때까지 항목 제거
    for (const item of sortedItems) {
      if (freedSpace >= neededSpace) {
        break;
      }
      
      // 캐시에서 항목 제거
      this.cache.delete(item.key);
      
      // 통계 업데이트
      this.stats.currentSize -= item.size;
      this.stats.itemCount--;
      this.stats.totalEvictions++;
      
      freedSpace += item.size;
      evictedCount++;
      
      if (this.config.logCacheEvents) {
        console.log(`캐시 항목 축출: ${item.key} (우선순위: ${item.options.priority}, 히트: ${item.hitCount})`);
      }
    }
    
    return evictedCount;
  }
  
  /**
   * 모든 캐시 항목 지우기
   * @returns {number} 지워진 항목 수
   */
  clear() {
    if (!this.isInitialized) {
      return 0;
    }
    
    const itemCount = this.cache.size;
    
    // 캐시 초기화
    this.cache.clear();
    
    // 통계 업데이트
    this.stats.currentSize = 0;
    this.stats.itemCount = 0;
    
    if (this.config.logCacheEvents) {
      console.log(`캐시 전체 삭제: ${itemCount}개 항목`);
    }
    
    return itemCount;
  }
  
  /**
   * 함수 메모이제이션
   * @param {Function} fn - 메모이제이션할 함수
   * @param {string} cacheKey - 캐시 키 접두사
   * @returns {Function} 메모이제이션된 함수
   */
  memoize(fn, cacheKey) {
    if (!this.isInitialized || !this.config.enableMemoization) {
      return fn;
    }
    
    const cachingSystem = this;
    
    // 이미 메모이제이션된 함수인지 확인
    if (this.memoCache.has(fn)) {
      return this.memoCache.get(fn);
    }
    
    // 메모이제이션된 함수 생성
    function memoizedFn(...args) {
      // 인자를 기반으로 고유 캐시 키 생성
      const argString = JSON.stringify(args);
      const key = `${cacheKey}:${argString}`;
      
      // 캐시에서 결과 확인
      const cachedResult = cachingSystem.get(key);
      
      if (cachedResult !== undefined) {
        return cachedResult;
      }
      
      // 결과 계산
      const result = fn.apply(this, args);
      
      // 결과가 Promise인 경우
      if (result instanceof Promise) {
        return result.then(asyncResult => {
          // 성공한 결과만 캐시
          cachingSystem.set(key, asyncResult);
          return asyncResult;
        });
      }
      
      // 결과 캐싱
      cachingSystem.set(key, result);
      
      return result;
    }
    
    // 메모이제이션된 함수 저장
    this.memoCache.set(fn, memoizedFn);
    this.memoCache.set(memoizedFn, memoizedFn); // 중복 메모이제이션 방지
    
    return memoizedFn;
  }
  
  /**
   * 메모이제이션된 함수의 캐시 지우기
   * @param {Function} fn - 원본 함수 또는 메모이제이션된 함수
   * @param {string} cacheKey - 캐시 키 접두사
   */
  clearMemoCache(fn, cacheKey) {
    if (!this.isInitialized || !this.config.enableMemoization) {
      return;
    }
    
    // 모든 캐시 항목 확인
    for (const key of this.cache.keys()) {
      // 해당 캐시 키로 시작하는 항목 삭제
      if (key.startsWith(`${cacheKey}:`)) {
        this.delete(key);
      }
    }
    
    if (this.config.logCacheEvents) {
      console.log(`메모 캐시 삭제: ${cacheKey}`);
    }
  }
  
  /**
   * 캐싱 시스템 통계 가져오기
   * @returns {Object} 캐싱 통계
   */
  getStats() {
    const hitRate = (this.stats.totalCacheHits + this.stats.totalCacheMisses) > 0
      ? this.stats.totalCacheHits / (this.stats.totalCacheHits + this.stats.totalCacheMisses)
      : 0;
    
    return {
      ...this.stats,
      hitRate,
      memoryUsagePercent: this.config.maxCacheSize > 0
        ? (this.stats.currentSize / this.config.maxCacheSize) * 100
        : 0,
      memoryUsageMB: this.stats.currentSize / (1024 * 1024)
    };
  }
}

// 캐싱 시스템 인스턴스 생성
const cachingSystem = new CachingSystem();

export default cachingSystem; 