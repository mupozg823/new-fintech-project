/**
 * Financial Insight Hub Pro - 메모리 최적화 모듈
 * 
 * 이 모듈은 애플리케이션의 메모리 사용을 최적화하는 기능을 제공합니다.
 * 가비지 컬렉션 최적화, 메모리 사용량 모니터링, 메모리 누수 방지 등을 구현합니다.
 */

/**
 * 메모리 최적화 클래스
 * 애플리케이션 메모리 사용 최적화
 */
class MemoryOptimizer {
  constructor() {
    this.isInitialized = false;
    this.config = {
      enableGarbageCollection: true,
      memoryCacheLimit: 50 * 1024 * 1024, // 50MB
      garbageCollectionInterval: 5 * 60 * 1000, // 5분
      memoryWarningThreshold: 0.8 // 80%
    };
    
    this.memoryData = {
      usageHistory: [],
      peakUsage: 0,
      lastGCTime: 0,
      warningsTriggered: 0
    };
    
    this.intervalId = null;
  }
  
  /**
   * 메모리 최적화 모듈 초기화
   * @param {Object} config - 설정 객체
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('메모리 최적화 모듈이 이미 초기화되었습니다');
      return true;
    }
    
    console.log('메모리 최적화 모듈 초기화 중...');
    
    // 설정 병합
    this.config = { ...this.config, ...config };
    
    try {
      // 초기 메모리 사용량 측정
      const initialMemory = this.getMemoryUsage();
      this.memoryData.usageHistory.push({
        timestamp: Date.now(),
        usage: initialMemory
      });
      this.memoryData.peakUsage = initialMemory;
      
      // 주기적 메모리 모니터링 시작
      if (this.config.enableGarbageCollection) {
        this.startPeriodicMonitoring();
      }
      
      this.isInitialized = true;
      console.log('메모리 최적화 모듈 초기화 완료');
      return true;
    } catch (error) {
      console.error('메모리 최적화 모듈 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 메모리 캐시 한도 설정
   * @param {number} limit - 메모리 캐시 한도(바이트)
   */
  setMemoryCacheLimit(limit) {
    this.config.memoryCacheLimit = limit;
    console.log(`메모리 캐시 한도 설정: ${Math.round(limit / (1024 * 1024))}MB`);
    
    // 현재 메모리 상태 확인
    this.checkMemoryStatus();
  }
  
  /**
   * 주기적 메모리 모니터링 시작
   */
  startPeriodicMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.monitorMemory();
      
      // 필요시 가비지 컬렉션 유도
      if (this.shouldTriggerGC()) {
        this.triggerGarbageCollection();
      }
    }, 60000); // 1분마다 실행
    
    console.log('주기적 메모리 모니터링 시작');
  }
  
  /**
   * 주기적 메모리 모니터링 중지
   */
  stopPeriodicMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('주기적 메모리 모니터링 중지');
    }
  }
  
  /**
   * 메모리 모니터링 수행
   */
  monitorMemory() {
    const currentMemory = this.getMemoryUsage();
    const timestamp = Date.now();
    
    // 메모리 사용 기록 저장
    this.memoryData.usageHistory.push({
      timestamp,
      usage: currentMemory
    });
    
    // 최대 20개의 기록만 유지
    if (this.memoryData.usageHistory.length > 20) {
      this.memoryData.usageHistory.shift();
    }
    
    // 최대 메모리 사용량 업데이트
    if (currentMemory > this.memoryData.peakUsage) {
      this.memoryData.peakUsage = currentMemory;
    }
    
    // 메모리 상태 확인
    this.checkMemoryStatus();
  }
  
  /**
   * 현재 메모리 사용량 가져오기 (바이트)
   * @returns {number} 메모리 사용량
   */
  getMemoryUsage() {
    // 브라우저 환경에서 메모리 사용량 계산
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      return window.performance.memory.usedJSHeapSize;
    }
    
    // Node.js 환경에서 메모리 사용량 계산
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryData = process.memoryUsage();
      return memoryData.heapUsed;
    }
    
    // 환경에 따라 추정값 반환
    return 0;
  }
  
  /**
   * 메모리 상태 확인
   * @returns {Object} 메모리 상태 정보
   */
  checkMemoryStatus() {
    const currentMemory = this.getMemoryUsage();
    const memoryCacheLimit = this.config.memoryCacheLimit;
    const usageRatio = currentMemory / memoryCacheLimit;
    
    const status = {
      currentUsage: currentMemory,
      usageRatio,
      isWarning: usageRatio > this.config.memoryWarningThreshold,
      isCritical: usageRatio > 0.95
    };
    
    // 경고 상태에 도달하면 로그 출력
    if (status.isWarning) {
      console.warn(`메모리 사용량 경고: ${Math.round(usageRatio * 100)}% (${Math.round(currentMemory / (1024 * 1024))}MB/${Math.round(memoryCacheLimit / (1024 * 1024))}MB)`);
      this.memoryData.warningsTriggered++;
      
      // 심각한 수준이면 즉시 가비지 컬렉션 유도
      if (status.isCritical) {
        console.error('메모리 사용량 심각: 가비지 컬렉션 즉시 실행');
        this.triggerGarbageCollection();
      }
    }
    
    return status;
  }
  
  /**
   * 가비지 컬렉션을 실행해야 하는지 결정
   * @returns {boolean} 가비지 컬렉션 필요 여부
   */
  shouldTriggerGC() {
    if (!this.config.enableGarbageCollection) {
      return false;
    }
    
    const currentTime = Date.now();
    const timeSinceLastGC = currentTime - this.memoryData.lastGCTime;
    
    // 마지막 GC 이후 충분한 시간이 지났는지
    if (timeSinceLastGC < this.config.garbageCollectionInterval) {
      return false;
    }
    
    // 메모리 사용량이 임계값을 넘었는지
    const currentMemory = this.getMemoryUsage();
    const usageRatio = currentMemory / this.config.memoryCacheLimit;
    
    return usageRatio > 0.7; // 70% 이상 사용 중이면 GC 실행
  }
  
  /**
   * 가비지 컬렉션 유도
   * 참고: 브라우저/JS 엔진에서 직접 GC를 강제할 수는 없음
   * 대신 GC가 발생하도록 조건을 만들어줌
   */
  triggerGarbageCollection() {
    console.log('가비지 컬렉션 유도 중...');
    
    // 메모리 사용량 기록
    const beforeMemory = this.getMemoryUsage();
    
    // 대규모 객체 참조 제거를 통한 GC 유도
    this.clearReferences();
    
    // 약한 참조 정리 강제(WeakMap, WeakSet)
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
        console.log('명시적 가비지 컬렉션 실행됨');
      } catch (error) {
        console.warn('명시적 가비지 컬렉션 실행 실패:', error);
      }
    }
    
    // 메모리 정리 후 사용량 기록
    setTimeout(() => {
      const afterMemory = this.getMemoryUsage();
      const freedMemory = Math.max(0, beforeMemory - afterMemory);
      
      console.log(`가비지 컬렉션 결과: ${Math.round(freedMemory / (1024 * 1024))}MB 해제됨`);
      
      this.memoryData.lastGCTime = Date.now();
    }, 100);
  }
  
  /**
   * 참조 정리를 통한 메모리 최적화
   */
  clearReferences() {
    // 여기서는 애플리케이션 특화 참조 정리 로직을 구현
    // 예: 캐시 정리, 이벤트 리스너 제거 등
    
    // 오래된 메모리 사용 기록 제거
    if (this.memoryData.usageHistory.length > 10) {
      this.memoryData.usageHistory = this.memoryData.usageHistory.slice(-10);
    }
  }
  
  /**
   * 메모리 누수 의심 지점 분석
   * @returns {Array} 메모리 누수 의심 지점 목록
   */
  analyzeMemoryLeaks() {
    if (this.memoryData.usageHistory.length < 5) {
      return []; // 충분한 데이터 없음
    }
    
    const leakSuspects = [];
    
    // 지속적인 메모리 증가 패턴 확인
    const recentUsage = this.memoryData.usageHistory.slice(-5);
    let isConstantlyIncreasing = true;
    
    for (let i = 1; i < recentUsage.length; i++) {
      if (recentUsage[i].usage <= recentUsage[i-1].usage) {
        isConstantlyIncreasing = false;
        break;
      }
    }
    
    if (isConstantlyIncreasing) {
      leakSuspects.push({
        type: 'pattern',
        severity: 'high',
        description: '지속적인 메모리 증가 패턴 감지됨',
        recommendation: '이벤트 리스너 제거 및 참조 순환 확인 필요'
      });
    }
    
    // 메모리 경고 빈도 확인
    if (this.memoryData.warningsTriggered > 3) {
      leakSuspects.push({
        type: 'warnings',
        severity: 'medium',
        description: `빈번한 메모리 경고 발생 (${this.memoryData.warningsTriggered}회)`,
        recommendation: '대용량 객체 캐싱 정책 검토 필요'
      });
    }
    
    return leakSuspects;
  }
  
  /**
   * 메모리 최적화 추천사항 생성
   * @returns {Array} 최적화 추천사항 목록
   */
  getOptimizationRecommendations() {
    const currentMemory = this.getMemoryUsage();
    const recommendations = [];
    
    // 메모리 사용량 기반 추천
    if (currentMemory > 0.8 * this.config.memoryCacheLimit) {
      recommendations.push({
        type: 'memory_usage',
        priority: 'high',
        description: '메모리 사용량이 한도에 근접함',
        action: '캐시 크기 줄이기 또는 메모리 한도 증가 고려'
      });
    }
    
    // 누수 의심 지점 기반 추천
    const leakSuspects = this.analyzeMemoryLeaks();
    if (leakSuspects.length > 0) {
      recommendations.push({
        type: 'memory_leak',
        priority: 'critical',
        description: '메모리 누수 의심 지점 발견',
        action: '이벤트 리스너, 타이머, 순환 참조 확인 필요'
      });
    }
    
    // 가비지 컬렉션 빈도 기반 추천
    const gcInterval = this.config.garbageCollectionInterval;
    if (this.memoryData.warningsTriggered > 5 && gcInterval > 2 * 60 * 1000) {
      recommendations.push({
        type: 'gc_frequency',
        priority: 'medium',
        description: '가비지 컬렉션 간격이 너무 김',
        action: `가비지 컬렉션 간격을 ${gcInterval / (60 * 1000)}분에서 2분으로 줄이는 것을 고려`
      });
    }
    
    return recommendations;
  }
}

// 메모리 최적화 모듈 인스턴스 생성
const memoryOptimizer = new MemoryOptimizer();

export default memoryOptimizer; 