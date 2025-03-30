/**
 * Financial Insight Hub Pro - 최적화 엔진
 * 
 * 이 모듈은 애플리케이션의 성능을 최적화하기 위한 다양한 기능을 제공합니다.
 * 웹 워커 관리, 코드 분할, 메모이제이션, 병렬 처리 등의 최적화 기법을 구현합니다.
 */

import memoryOptimizer from './memory-optimizer.js';
import webWorkerManager from './web-worker-manager.js';
import codeLoader from './code-loader.js';
import cachingSystem from './caching-system.js';
import FinancialInsightData from '../infrastructure/data_structure/data-structure.js';

/**
 * 최적화 엔진 클래스
 * 애플리케이션 성능 최적화를 위한 다양한 기법을 구현
 */
class OptimizationEngine {
  constructor() {
    this.dataManager = FinancialInsightData.getManager();
    this.memoryOptimizer = memoryOptimizer;
    this.workerManager = webWorkerManager;
    this.codeLoader = codeLoader;
    this.cachingSystem = cachingSystem;
    
    this.isInitialized = false;
    this.config = {
      enableWebWorkers: true,
      enableCodeSplitting: true,
      enableMemoization: true,
      enableGarbageCollection: true,
      workerPoolSize: 4,
      memoryCacheLimit: 50 * 1024 * 1024, // 50MB
      logLevel: 'info'
    };
    
    // 성능 측정 지표
    this.performanceMetrics = {
      analysisTime: [],
      memoryUsage: [],
      cacheHitRate: 0,
      workerUtilization: 0
    };
  }
  
  /**
   * 최적화 엔진 초기화
   * @param {Object} config - 설정 객체
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('최적화 엔진이 이미 초기화되었습니다');
      return true;
    }
    
    console.log('최적화 엔진 초기화 중...');
    
    // 설정 병합
    this.config = { ...this.config, ...config };
    
    try {
      // 메모리 최적화 모듈 초기화
      await this.memoryOptimizer.initialize({
        enableGarbageCollection: this.config.enableGarbageCollection,
        memoryCacheLimit: this.config.memoryCacheLimit
      });
      
      // 웹 워커 관리자 초기화
      if (this.config.enableWebWorkers) {
        await this.workerManager.initialize({
          poolSize: this.config.workerPoolSize
        });
      }
      
      // 코드 로더 초기화
      if (this.config.enableCodeSplitting) {
        await this.codeLoader.initialize();
      }
      
      // 캐싱 시스템 초기화
      await this.cachingSystem.initialize({
        enableMemoization: this.config.enableMemoization
      });
      
      this.isInitialized = true;
      console.log('최적화 엔진 초기화 완료');
      return true;
    } catch (error) {
      console.error('최적화 엔진 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 워커에서 작업 실행
   * @param {Function|string} taskFunction - 실행할 함수 또는 함수 문자열
   * @param {Array} args - 함수에 전달할 인자
   * @returns {Promise<any>} 작업 결과
   */
  async runInWorker(taskFunction, args = []) {
    if (!this.isInitialized) {
      throw new Error('최적화 엔진이 초기화되지 않았습니다');
    }
    
    if (!this.config.enableWebWorkers) {
      console.log('웹 워커가 비활성화되어 있어 메인 스레드에서 실행합니다');
      return typeof taskFunction === 'function' 
        ? taskFunction(...args) 
        : new Function(`return (${taskFunction})`)()(...args);
    }
    
    return this.workerManager.runTask(taskFunction, args);
  }
  
  /**
   * 병렬로 작업 실행
   * @param {Array<Function|string>} tasks - 실행할 작업 목록
   * @param {Array<Array>} argsArray - 각 작업에 전달할 인자 목록
   * @returns {Promise<Array<any>>} 작업 결과 목록
   */
  async runParallel(tasks, argsArray = []) {
    if (!this.isInitialized) {
      throw new Error('최적화 엔진이 초기화되지 않았습니다');
    }
    
    const results = [];
    
    if (!this.config.enableWebWorkers) {
      // 웹 워커 없이 직렬 실행
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const args = argsArray[i] || [];
        
        const result = typeof task === 'function' 
          ? task(...args) 
          : new Function(`return (${task})`)()(...args);
          
        results.push(result);
      }
      
      return Promise.all(results);
    }
    
    // 웹 워커 사용 병렬 실행
    const taskPromises = tasks.map((task, index) => {
      const args = argsArray[index] || [];
      return this.workerManager.runTask(task, args);
    });
    
    return Promise.all(taskPromises);
  }
  
  /**
   * 함수 결과 메모이제이션 (캐싱)
   * @param {Function} fn - 메모이제이션할 함수
   * @param {string} cacheKey - 캐시 키
   * @returns {Function} 메모이제이션된 함수
   */
  memoize(fn, cacheKey) {
    if (!this.config.enableMemoization) {
      return fn;
    }
    
    return this.cachingSystem.memoize(fn, cacheKey);
  }
  
  /**
   * 코드 비동기 로드
   * @param {string} modulePath - 모듈 경로
   * @returns {Promise<any>} 로드된 모듈
   */
  async loadCode(modulePath) {
    if (!this.config.enableCodeSplitting) {
      throw new Error('코드 분할이 비활성화되어 있습니다');
    }
    
    return this.codeLoader.loadModule(modulePath);
  }
  
  /**
   * 성능 측정 시작
   * @param {string} label - 측정 레이블
   * @returns {Object} 측정 컨텍스트
   */
  startMeasure(label) {
    const startTime = performance.now();
    const startMemory = this.memoryOptimizer.getMemoryUsage();
    
    return {
      label,
      startTime,
      startMemory
    };
  }
  
  /**
   * 성능 측정 종료
   * @param {Object} context - 측정 컨텍스트
   * @returns {Object} 측정 결과
   */
  endMeasure(context) {
    const endTime = performance.now();
    const endMemory = this.memoryOptimizer.getMemoryUsage();
    
    const executionTime = endTime - context.startTime;
    const memoryDelta = endMemory - context.startMemory;
    
    // 측정 지표 기록
    this.performanceMetrics.analysisTime.push(executionTime);
    this.performanceMetrics.memoryUsage.push(endMemory);
    
    // 최근 10개의 측정값만 유지
    if (this.performanceMetrics.analysisTime.length > 10) {
      this.performanceMetrics.analysisTime.shift();
      this.performanceMetrics.memoryUsage.shift();
    }
    
    return {
      label: context.label,
      executionTime,
      memoryUsage: endMemory,
      memoryDelta
    };
  }
  
  /**
   * 성능 최적화 자동 조정
   * 현재 성능 측정 결과를 기반으로 설정 자동 조정
   */
  autoTunePerformance() {
    if (!this.isInitialized || this.performanceMetrics.analysisTime.length < 5) {
      return; // 충분한 데이터가 없음
    }
    
    // 성능 지표 평균 계산
    const avgExecutionTime = this.performanceMetrics.analysisTime.reduce((a, b) => a + b, 0) / this.performanceMetrics.analysisTime.length;
    const avgMemoryUsage = this.performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) / this.performanceMetrics.memoryUsage.length;
    
    // 워커 풀 크기 조정
    if (avgExecutionTime > 500 && this.config.workerPoolSize < 8) {
      this.config.workerPoolSize++;
      this.workerManager.resizePool(this.config.workerPoolSize);
      console.log(`성능 자동 조정: 워커 풀 크기 증가 (${this.config.workerPoolSize})`);
    } else if (avgExecutionTime < 100 && this.config.workerPoolSize > 2) {
      this.config.workerPoolSize--;
      this.workerManager.resizePool(this.config.workerPoolSize);
      console.log(`성능 자동 조정: 워커 풀 크기 감소 (${this.config.workerPoolSize})`);
    }
    
    // 메모리 캐시 한도 조정
    if (avgMemoryUsage > 0.8 * this.config.memoryCacheLimit) {
      // 메모리 사용량이 높으면 캐시 크기 줄이기
      this.config.memoryCacheLimit = Math.max(20 * 1024 * 1024, this.config.memoryCacheLimit * 0.8);
      this.memoryOptimizer.setMemoryCacheLimit(this.config.memoryCacheLimit);
      console.log(`성능 자동 조정: 메모리 캐시 한도 감소 (${Math.round(this.config.memoryCacheLimit / (1024 * 1024))}MB)`);
    } else if (avgMemoryUsage < 0.3 * this.config.memoryCacheLimit) {
      // 메모리 사용량이 낮으면 캐시 크기 늘리기
      this.config.memoryCacheLimit = Math.min(200 * 1024 * 1024, this.config.memoryCacheLimit * 1.2);
      this.memoryOptimizer.setMemoryCacheLimit(this.config.memoryCacheLimit);
      console.log(`성능 자동 조정: 메모리 캐시 한도 증가 (${Math.round(this.config.memoryCacheLimit / (1024 * 1024))}MB)`);
    }
  }
}

// 최적화 엔진 인스턴스 생성
const optimizationEngine = new OptimizationEngine();

export default optimizationEngine; 