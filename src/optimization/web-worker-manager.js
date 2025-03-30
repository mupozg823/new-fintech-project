/**
 * Financial Insight Hub Pro - 웹 워커 관리자
 * 
 * 이 모듈은 웹 워커를 통한 병렬 처리를 관리하는 기능을 제공합니다.
 * 워커 풀 관리, 작업 분배, 결과 처리 등을 구현합니다.
 */

/**
 * 웹 워커 관리자 클래스
 * 병렬 처리를 위한 웹 워커 관리
 */
class WebWorkerManager {
  constructor() {
    this.isInitialized = false;
    this.config = {
      poolSize: 4,
      maxQueueSize: 100,
      taskTimeout: 30000 // 30초
    };
    
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers = new Set();
    this.taskMap = new Map();
    this.taskIdCounter = 0;
    
    // 워커 상태 통계
    this.stats = {
      tasksProcessed: 0,
      tasksSucceeded: 0,
      tasksFailed: 0,
      tasksTimedOut: 0,
      totalProcessingTime: 0,
      maxProcessingTime: 0
    };
  }
  
  /**
   * 웹 워커 관리자 초기화
   * @param {Object} config - 설정 객체
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      console.log('웹 워커 관리자가 이미 초기화되었습니다');
      return true;
    }
    
    // 브라우저 환경에서만 웹 워커 사용 가능
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      console.warn('이 환경에서는 웹 워커를 사용할 수 없습니다');
      return false;
    }
    
    console.log('웹 워커 관리자 초기화 중...');
    
    // 설정 병합
    this.config = { ...this.config, ...config };
    
    try {
      // 워커 풀 생성
      await this.createWorkerPool(this.config.poolSize);
      
      this.isInitialized = true;
      console.log(`웹 워커 관리자 초기화 완료 (워커 ${this.config.poolSize}개)`);
      return true;
    } catch (error) {
      console.error('웹 워커 관리자 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 워커 풀 생성
   * @param {number} size - 풀 크기
   * @returns {Promise<void>}
   */
  async createWorkerPool(size) {
    // 기존 워커 정리
    this.terminateAllWorkers();
    
    this.workers = [];
    this.busyWorkers.clear();
    
    // 워커 스크립트 생성
    const workerScript = this.generateWorkerScript();
    
    // Blob URL 생성
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    // 워커 생성
    for (let i = 0; i < size; i++) {
      try {
        const worker = new Worker(workerUrl);
        
        worker.id = i;
        worker.isBusy = false;
        
        // 메시지 핸들러 설정
        worker.onmessage = this.handleWorkerMessage.bind(this, worker);
        worker.onerror = this.handleWorkerError.bind(this, worker);
        
        this.workers.push(worker);
        console.log(`워커 #${i} 생성됨`);
      } catch (error) {
        console.error(`워커 #${i} 생성 오류:`, error);
      }
    }
    
    // Blob URL 해제
    URL.revokeObjectURL(workerUrl);
    
    console.log(`워커 풀 생성 완료 (크기: ${this.workers.length})`);
  }
  
  /**
   * 워커 스크립트 생성
   * @returns {string} 워커 스크립트 코드
   */
  generateWorkerScript() {
    return `
      // 금융 인사이트 허브 워커 스크립트
      
      // 메시지 수신 핸들러
      self.onmessage = function(event) {
        const { taskId, type, fn, args } = event.data;
        
        if (type === 'execute') {
          try {
            // 함수 실행
            let result;
            
            if (typeof fn === 'function') {
              // 직접 함수 전달 (웹 워커에서는 불가능하므로 사용 안 됨)
              result = fn(...args);
            } else if (typeof fn === 'string') {
              // 문자열로 전달된 함수 실행
              const taskFn = new Function('return ' + fn)();
              result = taskFn(...args);
            } else {
              throw new Error('잘못된 함수 유형');
            }
            
            // 결과 반환
            self.postMessage({
              taskId,
              type: 'success',
              result
            });
          } catch (error) {
            // 오류 반환
            self.postMessage({
              taskId,
              type: 'error',
              error: {
                message: error.message,
                stack: error.stack
              }
            });
          }
        } else if (type === 'terminate') {
          self.close();
        }
      };
      
      // 워커 준비 완료 알림
      self.postMessage({
        type: 'ready'
      });
    `;
  }
  
  /**
   * 워커에서 작업 실행
   * @param {Function|string} taskFunction - 실행할 함수 또는 함수 문자열
   * @param {Array} args - 함수에 전달할 인자
   * @returns {Promise<any>} 작업 결과
   */
  async runTask(taskFunction, args = []) {
    if (!this.isInitialized) {
      throw new Error('웹 워커 관리자가 초기화되지 않았습니다');
    }
    
    if (this.workers.length === 0) {
      throw new Error('사용 가능한 워커가 없습니다');
    }
    
    // 함수를 문자열로 변환 (웹 워커로 전달하기 위함)
    const fnString = typeof taskFunction === 'function' 
      ? taskFunction.toString()
      : taskFunction;
    
    // 작업 ID 생성
    const taskId = this.generateTaskId();
    
    // 작업 생성
    const task = {
      id: taskId,
      fn: fnString,
      args,
      createdAt: Date.now()
    };
    
    // 유휴 워커 찾기
    const availableWorker = this.findAvailableWorker();
    
    if (availableWorker) {
      // 유휴 워커가 있으면 즉시 실행
      return this.executeTask(task, availableWorker);
    } else {
      // 모든 워커가 바쁘면 큐에 추가
      if (this.taskQueue.length >= this.config.maxQueueSize) {
        throw new Error('작업 큐가 가득 찼습니다');
      }
      
      // 작업을 큐에 추가
      return new Promise((resolve, reject) => {
        this.taskMap.set(taskId, { resolve, reject, task });
        this.taskQueue.push(task);
        
        // 큐에 작업이 추가됨을 로그
        console.log(`작업 #${taskId}가 큐에 추가됨 (큐 크기: ${this.taskQueue.length})`);
      });
    }
  }
  
  /**
   * 유휴 워커 찾기
   * @returns {Worker|null} 유휴 워커 또는 null
   */
  findAvailableWorker() {
    return this.workers.find(worker => !this.busyWorkers.has(worker));
  }
  
  /**
   * 작업 ID 생성
   * @returns {number} 작업 ID
   */
  generateTaskId() {
    return ++this.taskIdCounter;
  }
  
  /**
   * 작업 실행
   * @param {Object} task - 작업 객체
   * @param {Worker} worker - 워커 객체
   * @returns {Promise<any>} 작업 결과
   */
  executeTask(task, worker) {
    return new Promise((resolve, reject) => {
      // 작업 정보 등록
      this.taskMap.set(task.id, {
        resolve,
        reject,
        task,
        worker,
        startTime: Date.now()
      });
      
      // 워커를 바쁨 상태로 표시
      this.busyWorkers.add(worker);
      
      // 작업 메시지 전송
      worker.postMessage({
        taskId: task.id,
        type: 'execute',
        fn: task.fn,
        args: task.args
      });
      
      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        this.handleTaskTimeout(task.id);
      }, this.config.taskTimeout);
      
      // 타임아웃 ID 저장
      this.taskMap.get(task.id).timeoutId = timeoutId;
      
      console.log(`작업 #${task.id} 시작 (워커 #${worker.id})`);
    });
  }
  
  /**
   * 다음 작업 처리
   */
  processNextTask() {
    // 큐가 비어 있으면 아무것도 하지 않음
    if (this.taskQueue.length === 0) {
      return;
    }
    
    // 유휴 워커 찾기
    const availableWorker = this.findAvailableWorker();
    
    if (!availableWorker) {
      return; // 유휴 워커 없음
    }
    
    // 큐에서 다음 작업 가져오기
    const nextTask = this.taskQueue.shift();
    
    // 작업 실행
    const promise = this.executeTask(nextTask, availableWorker);
    
    // 작업 정보 업데이트
    const taskInfo = this.taskMap.get(nextTask.id);
    
    // 원래 Promise 해결/거부 함수 연결
    promise
      .then(result => {
        taskInfo.resolve(result);
      })
      .catch(error => {
        taskInfo.reject(error);
      });
    
    console.log(`큐에서 작업 #${nextTask.id} 처리 시작 (큐 크기: ${this.taskQueue.length})`);
  }
  
  /**
   * 워커 메시지 핸들러
   * @param {Worker} worker - 메시지를 보낸 워커
   * @param {MessageEvent} event - 메시지 이벤트
   */
  handleWorkerMessage(worker, event) {
    const { taskId, type, result, error } = event.data;
    
    // 준비 메시지인 경우
    if (type === 'ready') {
      console.log(`워커 #${worker.id}가 준비됨`);
      return;
    }
    
    // 작업 정보 가져오기
    const taskInfo = this.taskMap.get(taskId);
    
    if (!taskInfo) {
      console.warn(`알 수 없는 작업 #${taskId}의 결과 수신`);
      return;
    }
    
    // 타임아웃 취소
    if (taskInfo.timeoutId) {
      clearTimeout(taskInfo.timeoutId);
    }
    
    // 작업 완료 시간 계산
    const endTime = Date.now();
    const processingTime = endTime - taskInfo.startTime;
    
    // 통계 업데이트
    this.stats.tasksProcessed++;
    this.stats.totalProcessingTime += processingTime;
    this.stats.maxProcessingTime = Math.max(this.stats.maxProcessingTime, processingTime);
    
    if (type === 'success') {
      // 성공 처리
      this.stats.tasksSucceeded++;
      console.log(`작업 #${taskId} 성공 (${processingTime}ms)`);
      taskInfo.resolve(result);
    } else if (type === 'error') {
      // 오류 처리
      this.stats.tasksFailed++;
      console.error(`작업 #${taskId} 실패:`, error.message);
      const workerError = new Error(error.message);
      workerError.stack = error.stack;
      taskInfo.reject(workerError);
    }
    
    // 워커 상태 업데이트
    this.busyWorkers.delete(worker);
    
    // 작업 정보 정리
    this.taskMap.delete(taskId);
    
    // 다음 작업 처리
    this.processNextTask();
  }
  
  /**
   * 워커 오류 핸들러
   * @param {Worker} worker - 오류가 발생한 워커
   * @param {ErrorEvent} event - 오류 이벤트
   */
  handleWorkerError(worker, event) {
    console.error(`워커 #${worker.id} 오류:`, event);
    
    // 워커를 사용 가능 상태로 복원
    this.busyWorkers.delete(worker);
    
    // 워커 재생성
    this.recreateWorker(worker);
  }
  
  /**
   * 워커 재생성
   * @param {Worker} worker - 재생성할 워커
   */
  recreateWorker(worker) {
    const workerId = worker.id;
    
    // 이전 워커 종료
    worker.terminate();
    
    // 워커 배열에서 제거
    const index = this.workers.findIndex(w => w.id === workerId);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
    
    // 새 워커 스크립트 생성
    const workerScript = this.generateWorkerScript();
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    try {
      // 새 워커 생성
      const newWorker = new Worker(workerUrl);
      
      newWorker.id = workerId;
      newWorker.isBusy = false;
      
      // 메시지 핸들러 설정
      newWorker.onmessage = this.handleWorkerMessage.bind(this, newWorker);
      newWorker.onerror = this.handleWorkerError.bind(this, newWorker);
      
      // 워커 배열에 추가
      this.workers.push(newWorker);
      
      console.log(`워커 #${workerId} 재생성됨`);
    } catch (error) {
      console.error(`워커 #${workerId} 재생성 오류:`, error);
    }
    
    // Blob URL 해제
    URL.revokeObjectURL(workerUrl);
  }
  
  /**
   * 작업 타임아웃 처리
   * @param {number} taskId - 작업 ID
   */
  handleTaskTimeout(taskId) {
    const taskInfo = this.taskMap.get(taskId);
    
    if (!taskInfo) {
      return;
    }
    
    // 통계 업데이트
    this.stats.tasksTimedOut++;
    
    console.warn(`작업 #${taskId} 시간 초과 (${this.config.taskTimeout}ms)`);
    
    // 워커 재시작
    if (taskInfo.worker) {
      this.recreateWorker(taskInfo.worker);
    }
    
    // 작업 거부
    const timeoutError = new Error(`작업 시간 초과 (${this.config.taskTimeout}ms)`);
    taskInfo.reject(timeoutError);
    
    // 작업 정보 정리
    this.taskMap.delete(taskId);
  }
  
  /**
   * 워커 풀 크기 조정
   * @param {number} newSize - 새 풀 크기
   */
  async resizePool(newSize) {
    if (!this.isInitialized) {
      throw new Error('웹 워커 관리자가 초기화되지 않았습니다');
    }
    
    if (newSize < 1) {
      throw new Error('워커 풀 크기는 최소 1이어야 합니다');
    }
    
    const currentSize = this.workers.length;
    
    if (newSize === currentSize) {
      return;
    }
    
    console.log(`워커 풀 크기 조정: ${currentSize} → ${newSize}`);
    
    if (newSize > currentSize) {
      // 워커 추가
      const workerScript = this.generateWorkerScript();
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      for (let i = currentSize; i < newSize; i++) {
        try {
          const worker = new Worker(workerUrl);
          
          worker.id = i;
          worker.isBusy = false;
          
          // 메시지 핸들러 설정
          worker.onmessage = this.handleWorkerMessage.bind(this, worker);
          worker.onerror = this.handleWorkerError.bind(this, worker);
          
          this.workers.push(worker);
          console.log(`워커 #${i} 생성됨`);
        } catch (error) {
          console.error(`워커 #${i} 생성 오류:`, error);
        }
      }
      
      URL.revokeObjectURL(workerUrl);
    } else {
      // 워커 제거
      for (let i = currentSize - 1; i >= newSize; i--) {
        const worker = this.workers[i];
        
        // 바쁜 워커라면 건너뛰기
        if (this.busyWorkers.has(worker)) {
          continue;
        }
        
        // 워커 종료
        worker.terminate();
        
        // 워커 배열에서 제거
        this.workers.splice(i, 1);
        
        console.log(`워커 #${worker.id} 종료됨`);
      }
    }
    
    console.log(`워커 풀 크기 조정 완료: ${this.workers.length}`);
    
    // 업데이트된 풀 크기 저장
    this.config.poolSize = this.workers.length;
  }
  
  /**
   * 모든 워커 종료
   */
  terminateAllWorkers() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    
    this.workers = [];
    this.busyWorkers.clear();
    console.log('모든 워커 종료됨');
  }
  
  /**
   * 워커 관리자 성능 통계 가져오기
   * @returns {Object} 성능 통계
   */
  getPerformanceStats() {
    const averageProcessingTime = this.stats.tasksProcessed > 0
      ? this.stats.totalProcessingTime / this.stats.tasksProcessed
      : 0;
    
    return {
      ...this.stats,
      workerCount: this.workers.length,
      busyWorkerCount: this.busyWorkers.size,
      queuedTaskCount: this.taskQueue.length,
      averageProcessingTime
    };
  }
}

// 웹 워커 관리자 인스턴스 생성
const webWorkerManager = new WebWorkerManager();

export default webWorkerManager; 