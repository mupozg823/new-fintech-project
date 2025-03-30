/**
 * Financial Insight Hub Pro - 코드 로더
 * 
 * 이 모듈은 코드 분할(Code Splitting)을 통한 지연 로딩을 구현합니다.
 * 필요한 모듈을 필요할 때 동적으로 로드하여 초기 로딩 시간을 단축합니다.
 */

/**
 * 코드 로더 클래스
 * 코드 분할과 동적 로딩 지원
 */
class CodeLoader {
  constructor() {
    this.isInitialized = false;
    this.config = {
      cacheModules: true,
      logLoadTime: true,
      moduleTimeout: 10000 // 10초
    };
    
    // 모듈 캐시
    this.moduleCache = new Map();
    
    // 모듈 로드 통계
    this.stats = {
      modulesLoaded: 0,
      loadErrorCount: 0,
      cacheHitCount: 0,
      totalLoadTime: 0
    };
  }
  
  /**
   * 코드 로더 초기화
   * @param {Object} config - 설정 객체
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('코드 로더가 이미 초기화되었습니다');
      return true;
    }
    
    console.log('코드 로더 초기화 중...');
    
    // 설정 병합
    this.config = { ...this.config, ...config };
    
    try {
      // 모듈 로딩 지원 확인
      this.checkDynamicImportSupport();
      
      this.isInitialized = true;
      console.log('코드 로더 초기화 완료');
      return true;
    } catch (error) {
      console.error('코드 로더 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 동적 임포트 지원 확인
   * @throws {Error} 동적 임포트가 지원되지 않는 경우
   */
  checkDynamicImportSupport() {
    try {
      // 동적 임포트 호환성 테스트
      new Function('return import("./dummy.js")');
      return true;
    } catch (error) {
      throw new Error('이 환경에서는 동적 임포트가 지원되지 않습니다');
    }
  }
  
  /**
   * 모듈 비동기 로드
   * @param {string} modulePath - 모듈 경로
   * @returns {Promise<any>} 로드된 모듈
   */
  async loadModule(modulePath) {
    if (!this.isInitialized) {
      throw new Error('코드 로더가 초기화되지 않았습니다');
    }
    
    // 이미 캐시된 모듈인지 확인
    if (this.config.cacheModules && this.moduleCache.has(modulePath)) {
      this.stats.cacheHitCount++;
      console.log(`모듈 캐시 히트: ${modulePath}`);
      return this.moduleCache.get(modulePath);
    }
    
    console.log(`모듈 로드 중: ${modulePath}`);
    
    const startTime = performance.now();
    
    try {
      // 타임아웃과 함께 모듈 로드
      const modulePromise = import(/* webpackChunkName: "[request]" */ modulePath);
      const moduleWithTimeout = Promise.race([
        modulePromise,
        new Promise((_, reject) => setTimeout(() => {
          reject(new Error(`모듈 로드 시간 초과: ${modulePath} (${this.config.moduleTimeout}ms)`));
        }, this.config.moduleTimeout))
      ]);
      
      // 모듈 로드 대기
      const module = await moduleWithTimeout;
      
      // 로드 시간 측정
      const loadTime = performance.now() - startTime;
      
      // 통계 업데이트
      this.stats.modulesLoaded++;
      this.stats.totalLoadTime += loadTime;
      
      if (this.config.logLoadTime) {
        console.log(`모듈 로드 완료: ${modulePath} (${Math.round(loadTime)}ms)`);
      }
      
      // 모듈 캐시에 저장
      if (this.config.cacheModules) {
        this.moduleCache.set(modulePath, module);
      }
      
      return module;
    } catch (error) {
      // 통계 업데이트
      this.stats.loadErrorCount++;
      
      console.error(`모듈 로드 실패: ${modulePath}`, error);
      throw error;
    }
  }
  
  /**
   * 여러 모듈 병렬 로드
   * @param {Array<string>} modulePaths - 모듈 경로 배열
   * @returns {Promise<Array<any>>} 로드된 모듈 배열
   */
  async loadModules(modulePaths) {
    if (!this.isInitialized) {
      throw new Error('코드 로더가 초기화되지 않았습니다');
    }
    
    console.log(`${modulePaths.length}개 모듈 병렬 로드 중...`);
    
    // 각 모듈을 병렬로 로드
    const modulePromises = modulePaths.map(path => this.loadModule(path));
    
    return Promise.all(modulePromises);
  }
  
  /**
   * 모듈 미리 로드
   * @param {Array<string>} modulePaths - 미리 로드할 모듈 경로 배열
   * @returns {Promise<void>}
   */
  async preloadModules(modulePaths) {
    if (!this.isInitialized) {
      throw new Error('코드 로더가 초기화되지 않았습니다');
    }
    
    console.log(`${modulePaths.length}개 모듈 미리 로드 중...`);
    
    try {
      // 낮은 우선순위로 모듈 미리 로드
      for (const path of modulePaths) {
        if (!this.moduleCache.has(path)) {
          // 모듈 로드 지연 (다른 중요 작업에 영향을 최소화)
          setTimeout(() => {
            this.loadModule(path).catch(error => {
              console.warn(`모듈 미리 로드 실패: ${path}`, error);
            });
          }, 100);
        }
      }
    } catch (error) {
      console.warn('모듈 미리 로드 오류:', error);
    }
  }
  
  /**
   * 모듈 캐시 정리
   * @param {string|Array<string>} [modulePaths] - 정리할 특정 모듈 경로 (없으면 전체 정리)
   */
  clearModuleCache(modulePaths) {
    if (modulePaths) {
      // 특정 모듈 캐시 정리
      const paths = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
      
      for (const path of paths) {
        this.moduleCache.delete(path);
      }
      
      console.log(`${paths.length}개 모듈 캐시 정리됨`);
    } else {
      // 모든 모듈 캐시 정리
      const cacheSize = this.moduleCache.size;
      this.moduleCache.clear();
      console.log(`모든 모듈 캐시 정리됨 (${cacheSize}개)`);
    }
  }
  
  /**
   * 비동기 컴포넌트 래퍼 생성
   * 범용 비동기 컴포넌트 로더 (프레임워크에 상관없이 동작)
   * @param {string} componentPath - 컴포넌트 모듈 경로
   * @param {Object} options - 옵션 객체 (로딩 UI, 오류 UI 등)
   * @returns {Function} 비동기 컴포넌트 로더 함수
   */
  createAsyncComponent(componentPath, options = {}) {
    const loader = this;
    
    return function AsyncComponentLoader(container, props = {}) {
      // 로딩 UI 표시
      if (options.loadingUI && typeof options.loadingUI === 'function') {
        options.loadingUI(container);
      } else {
        // 기본 로딩 UI
        container.innerHTML = `
          <div class="async-component-loading">
            <div class="loading-spinner"></div>
            <p>컴포넌트 로딩 중...</p>
          </div>
        `;
      }
      
      // 비동기적으로 컴포넌트 로드
      return loader.loadModule(componentPath)
        .then(module => {
          const Component = module.default || module;
          
          if (typeof Component === 'function') {
            try {
              // 컴포넌트 인스턴스 생성 및 마운트
              const instance = new Component(props);
              
              if (typeof instance.render === 'function') {
                const result = instance.render();
                
                if (typeof result === 'string') {
                  container.innerHTML = result;
                } else if (result instanceof HTMLElement) {
                  container.innerHTML = '';
                  container.appendChild(result);
                }
              } else {
                console.warn('컴포넌트에 render 메서드가 없습니다');
              }
              
              return instance;
            } catch (error) {
              console.error('컴포넌트 렌더링 오류:', error);
              
              // 오류 UI 표시
              if (options.errorUI && typeof options.errorUI === 'function') {
                options.errorUI(container, error);
              } else {
                container.innerHTML = `
                  <div class="async-component-error">
                    <p>컴포넌트 로드 중 오류가 발생했습니다:</p>
                    <pre>${error.message}</pre>
                  </div>
                `;
              }
              
              throw error;
            }
          } else {
            console.error('로드된 모듈은 유효한 컴포넌트가 아닙니다');
            container.innerHTML = '<div class="error">유효하지 않은 컴포넌트입니다</div>';
          }
        })
        .catch(error => {
          console.error('컴포넌트 로드 오류:', error);
          
          // 오류 UI 표시
          if (options.errorUI && typeof options.errorUI === 'function') {
            options.errorUI(container, error);
          } else {
            container.innerHTML = `
              <div class="async-component-error">
                <p>컴포넌트 로드 중 오류가 발생했습니다:</p>
                <pre>${error.message}</pre>
              </div>
            `;
          }
          
          throw error;
        });
    };
  }
  
  /**
   * 코드 로더 통계 가져오기
   * @returns {Object} 코드 로딩 통계
   */
  getStats() {
    const averageLoadTime = this.stats.modulesLoaded > 0
      ? this.stats.totalLoadTime / this.stats.modulesLoaded
      : 0;
    
    return {
      ...this.stats,
      cachedModulesCount: this.moduleCache.size,
      averageLoadTime,
      cacheHitRate: this.stats.modulesLoaded > 0
        ? this.stats.cacheHitCount / (this.stats.modulesLoaded + this.stats.cacheHitCount)
        : 0
    };
  }
}

// 코드 로더 인스턴스 생성
const codeLoader = new CodeLoader();

export default codeLoader; 