/**
 * Financial Insight Hub Pro - 데이터 수집 스케줄러
 * 
 * 이 모듈은 뉴스 수집 및 분석 작업의 스케줄링을 관리합니다.
 * 다양한 작업을 정기적으로 실행하고 작업 상태를 모니터링합니다.
 */

import newsCollector from './news-collector.js';
import FinancialInsightData from '../../infrastructure/data_structure/data-structure.js';

/**
 * 작업 스케줄러 클래스
 * 다양한 작업의 스케줄링 및 관리
 */
class Scheduler {
  constructor() {
    this.dataManager = FinancialInsightData.getManager();
    this.collector = newsCollector;
    
    this.tasks = new Map();
    this.taskHistory = [];
    this.maxHistorySize = 100;
    
    this.isRunning = false;
    this.schedulerInterval = null;
    this.checkInterval = 60000; // 1분마다 작업 확인
    
    // 이벤트 리스너
    this.eventListeners = {};
  }
  
  /**
   * 스케줄러 시작
   * @returns {boolean} 성공 여부
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return false;
    }
    
    console.log('Starting scheduler');
    
    this.isRunning = true;
    
    // 주기적인 작업 확인 설정
    this.schedulerInterval = setInterval(() => {
      this.checkTasks();
    }, this.checkInterval);
    
    // 이벤트 발생
    this.emit('schedulerStarted', { timestamp: new Date() });
    
    return true;
  }
  
  /**
   * 스케줄러 중지
   * @returns {boolean} 성공 여부
   */
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return false;
    }
    
    console.log('Stopping scheduler');
    
    this.isRunning = false;
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    // 이벤트 발생
    this.emit('schedulerStopped', { timestamp: new Date() });
    
    return true;
  }
  
  /**
   * 스케줄러 상태 가져오기
   * @returns {Object} 스케줄러 상태
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      taskCount: this.tasks.size,
      scheduledTasks: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        interval: task.interval,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        enabled: task.enabled,
        status: task.status
      })),
      lastTaskHistory: this.taskHistory.slice(0, 10) // 최근 10개만 반환
    };
  }
  
  /**
   * 스케줄러 설정 업데이트
   * @param {Object} config - 설정 객체
   * @returns {boolean} 성공 여부
   */
  updateConfig(config) {
    try {
      if (config.checkInterval !== undefined && config.checkInterval >= 5000) {
        // 최소 5초 이상의 간격만 허용
        this.checkInterval = config.checkInterval;
        
        // 이미 실행 중인 경우 재시작
        if (this.isRunning) {
          this.stop();
          this.start();
        }
      }
      
      if (config.maxHistorySize !== undefined && config.maxHistorySize > 0) {
        this.maxHistorySize = config.maxHistorySize;
        
        // 히스토리 크기 조정
        if (this.taskHistory.length > this.maxHistorySize) {
          this.taskHistory = this.taskHistory.slice(0, this.maxHistorySize);
        }
      }
      
      // 이벤트 발생
      this.emit('schedulerConfigUpdated', config);
      
      return true;
    } catch (error) {
      console.error('Error updating scheduler config:', error);
      return false;
    }
  }
  
  /**
   * 예약된 작업 추가
   * @param {Object} taskConfig - 작업 설정
   * @returns {string} 작업 ID
   */
  addTask(taskConfig) {
    try {
      if (!taskConfig.type || !taskConfig.interval) {
        throw new Error('Task must have type and interval');
      }
      
      // 작업 ID 생성 또는 사용
      const taskId = taskConfig.id || `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // 다음 실행 시간 계산
      const now = Date.now();
      const nextRun = taskConfig.startAt ? new Date(taskConfig.startAt).getTime() : now + taskConfig.interval;
      
      // 작업 객체 생성
      const task = {
        id: taskId,
        type: taskConfig.type,
        interval: taskConfig.interval,
        lastRun: null,
        nextRun: nextRun,
        enabled: taskConfig.enabled !== false, // 기본값: true
        status: 'scheduled',
        runCount: 0,
        errorCount: 0,
        params: taskConfig.params || {},
        callback: taskConfig.callback,
        createdAt: now
      };
      
      // 작업 저장
      this.tasks.set(taskId, task);
      
      console.log(`Added task: ${taskId} (${task.type}), next run at: ${new Date(task.nextRun).toLocaleString()}`);
      
      // 이벤트 발생
      this.emit('taskAdded', task);
      
      return taskId;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }
  
  /**
   * 작업 활성화/비활성화
   * @param {string} taskId - 작업 ID
   * @param {boolean} enabled - 활성화 여부
   * @returns {boolean} 성공 여부
   */
  setTaskEnabled(taskId, enabled) {
    if (!this.tasks.has(taskId)) {
      console.error(`Task not found: ${taskId}`);
      return false;
    }
    
    const task = this.tasks.get(taskId);
    task.enabled = enabled;
    
    // 비활성화된 경우 상태 업데이트
    if (!enabled && task.status === 'running') {
      task.status = 'disabled';
    } else if (enabled && task.status === 'disabled') {
      task.status = 'scheduled';
    }
    
    // 이벤트 발생
    this.emit('taskUpdated', task);
    
    console.log(`Task ${taskId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }
  
  /**
   * 작업 삭제
   * @param {string} taskId - 작업 ID
   * @returns {boolean} 성공 여부
   */
  removeTask(taskId) {
    if (!this.tasks.has(taskId)) {
      console.error(`Task not found: ${taskId}`);
      return false;
    }
    
    const task = this.tasks.get(taskId);
    this.tasks.delete(taskId);
    
    // 히스토리에 추가
    this.taskHistory.unshift({
      id: task.id,
      type: task.type,
      status: 'removed',
      timestamp: Date.now()
    });
    
    // 히스토리 크기 제한
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory.pop();
    }
    
    // 이벤트 발생
    this.emit('taskRemoved', task);
    
    console.log(`Removed task: ${taskId}`);
    return true;
  }
  
  /**
   * 작업 업데이트
   * @param {string} taskId - 작업 ID
   * @param {Object} updates - 업데이트할 필드
   * @returns {boolean} 성공 여부
   */
  updateTask(taskId, updates) {
    if (!this.tasks.has(taskId)) {
      console.error(`Task not found: ${taskId}`);
      return false;
    }
    
    const task = this.tasks.get(taskId);
    
    // 업데이트 가능한 필드
    const updatableFields = ['interval', 'enabled', 'params'];
    
    // 필드 업데이트
    updatableFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'params' && updates.params) {
          // params 객체 병합
          task.params = { ...task.params, ...updates.params };
        } else {
          task[field] = updates[field];
        }
      }
    });
    
    // 간격이 변경된 경우 다음 실행 시간 재계산
    if (updates.interval !== undefined) {
      task.nextRun = task.lastRun ? task.lastRun + updates.interval : Date.now() + updates.interval;
    }
    
    // 이벤트 발생
    this.emit('taskUpdated', task);
    
    console.log(`Updated task: ${taskId}`);
    return true;
  }
  
  /**
   * 즉시 작업 실행
   * @param {string} taskId - 작업 ID
   * @returns {Promise<Object>} 작업 결과
   */
  async runTaskNow(taskId) {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    const task = this.tasks.get(taskId);
    
    if (!task.enabled) {
      throw new Error(`Task is disabled: ${taskId}`);
    }
    
    console.log(`Manually running task: ${taskId}`);
    
    try {
      task.status = 'running';
      
      // 이벤트 발생
      this.emit('taskStarted', task);
      
      // 작업 실행
      const result = await this.executeTask(task);
      
      // 다음 예약된 실행 시간 유지 (수동 실행이므로)
      return result;
    } catch (error) {
      console.error(`Error manually running task ${taskId}:`, error);
      task.status = 'error';
      task.errorCount++;
      
      // 히스토리에 추가
      this.taskHistory.unshift({
        id: task.id,
        type: task.type,
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      });
      
      // 이벤트 발생
      this.emit('taskError', { task, error: error.message });
      
      throw error;
    } finally {
      // 작업이 에러로 끝났을 때만 상태 변경
      if (task.status === 'running') {
        task.status = 'scheduled';
      }
    }
  }
  
  /**
   * 예약된 작업 확인 및 실행
   */
  async checkTasks() {
    if (!this.isRunning) {
      return;
    }
    
    const now = Date.now();
    
    // 실행할 작업 찾기
    const tasksToRun = [];
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.enabled && task.status !== 'running' && task.nextRun <= now) {
        tasksToRun.push(task);
      }
    }
    
    if (tasksToRun.length === 0) {
      return;
    }
    
    console.log(`Found ${tasksToRun.length} tasks to run`);
    
    // 작업 실행 (병렬)
    await Promise.all(tasksToRun.map(task => {
      return this.runScheduledTask(task).catch(error => {
        console.error(`Error running task ${task.id}:`, error);
      });
    }));
  }
  
  /**
   * 예약된 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async runScheduledTask(task) {
    // 작업 상태 업데이트
    task.status = 'running';
    task.lastRun = Date.now();
    
    // 이벤트 발생
    this.emit('taskStarted', task);
    
    try {
      // 작업 실행
      const result = await this.executeTask(task);
      
      // 작업 성공 처리
      task.runCount++;
      task.status = 'scheduled';
      
      // 다음 실행 시간 설정
      task.nextRun = task.lastRun + task.interval;
      
      // 히스토리에 추가
      this.taskHistory.unshift({
        id: task.id,
        type: task.type,
        status: 'completed',
        result: result.summary || '작업 완료',
        timestamp: task.lastRun
      });
      
      // 히스토리 크기 제한
      if (this.taskHistory.length > this.maxHistorySize) {
        this.taskHistory.pop();
      }
      
      // 이벤트 발생
      this.emit('taskCompleted', { task, result });
      
      console.log(`Task ${task.id} completed, next run at: ${new Date(task.nextRun).toLocaleString()}`);
      
      return result;
    } catch (error) {
      // 작업 실패 처리
      task.errorCount++;
      task.status = 'error';
      
      // 다음 실행 시간 설정 (오류가 있어도 계속 실행)
      task.nextRun = task.lastRun + task.interval;
      
      // 히스토리에 추가
      this.taskHistory.unshift({
        id: task.id,
        type: task.type,
        status: 'error',
        error: error.message,
        timestamp: task.lastRun
      });
      
      // 히스토리 크기 제한
      if (this.taskHistory.length > this.maxHistorySize) {
        this.taskHistory.pop();
      }
      
      // 이벤트 발생
      this.emit('taskError', { task, error: error.message });
      
      console.error(`Task ${task.id} failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 작업 실행 로직
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeTask(task) {
    switch (task.type) {
      case 'collectAllSources':
        return this.executeCollectAllSourcesTask(task);
      
      case 'collectSource':
        return this.executeCollectSourceTask(task);
      
      case 'cleanupArticles':
        return this.executeCleanupArticlesTask(task);
      
      case 'generateInsights':
        return this.executeGenerateInsightsTask(task);
      
      case 'updateSectorAnalysis':
        return this.executeUpdateSectorAnalysisTask(task);
      
      case 'customTask':
        return this.executeCustomTask(task);
      
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
  
  /**
   * 모든 소스 수집 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeCollectAllSourcesTask(task) {
    console.log(`Executing task: collectAllSources (${task.id})`);
    
    // 모든 소스에서 데이터 수집
    const result = await this.collector.collectFromAllSources();
    
    return {
      type: 'collectAllSources',
      summary: `${result.totalSources} sources processed, ${result.savedArticles} articles saved`,
      detail: result
    };
  }
  
  /**
   * 특정 소스 수집 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeCollectSourceTask(task) {
    const sourceId = task.params.sourceId;
    
    if (!sourceId) {
      throw new Error('sourceId parameter is required');
    }
    
    console.log(`Executing task: collectSource - ${sourceId} (${task.id})`);
    
    // 특정 소스에서 데이터 수집
    const result = await this.collector.collectFromSource(sourceId);
    
    return {
      type: 'collectSource',
      sourceId,
      summary: `Source ${sourceId}: ${result.savedArticles || 0} articles saved`,
      detail: result
    };
  }
  
  /**
   * 기사 정리 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeCleanupArticlesTask(task) {
    const maxAge = task.params.maxAge || 30 * 24 * 60 * 60 * 1000; // 기본값: 30일
    const maxArticles = task.params.maxArticles || 10000; // 기본값: 최대 10,000개
    
    console.log(`Executing task: cleanupArticles (${task.id})`);
    
    // 모든 기사 가져오기
    const allArticles = this.dataManager.getArticles();
    
    // 삭제할 기사 식별
    const now = Date.now();
    const articlesToDelete = [];
    
    // 오래된 기사 찾기
    allArticles.forEach(article => {
      const publishedAt = article.publishedAt ? new Date(article.publishedAt).getTime() : 0;
      const age = now - publishedAt;
      
      if (age > maxAge) {
        articlesToDelete.push(article.id);
      }
    });
    
    // 개수 제한 초과 기사 찾기
    if (allArticles.length > maxArticles) {
      const excessCount = allArticles.length - maxArticles;
      
      // 발행일 기준 정렬
      const sortedArticles = [...allArticles].sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
        const bDate = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
        return aDate - bDate; // 오래된 것부터 정렬
      });
      
      // 가장 오래된 기사부터 추가
      for (let i = 0; i < excessCount; i++) {
        if (i < sortedArticles.length && !articlesToDelete.includes(sortedArticles[i].id)) {
          articlesToDelete.push(sortedArticles[i].id);
        }
      }
    }
    
    // 중복 제거
    const uniqueArticlesToDelete = [...new Set(articlesToDelete)];
    
    console.log(`Found ${uniqueArticlesToDelete.length} articles to delete`);
    
    // 기사 및 관련 분석 삭제
    let deletedCount = 0;
    
    for (const articleId of uniqueArticlesToDelete) {
      try {
        this.dataManager.cache.delete('articles', articleId);
        this.dataManager.cache.delete('analysis', articleId);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting article ${articleId}:`, error);
      }
    }
    
    return {
      type: 'cleanupArticles',
      summary: `Deleted ${deletedCount} articles`,
      detail: {
        totalArticles: allArticles.length,
        deletedCount,
        remainingCount: allArticles.length - deletedCount
      }
    };
  }
  
  /**
   * 인사이트 생성 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeGenerateInsightsTask(task) {
    console.log(`Executing task: generateInsights (${task.id})`);
    
    // TODO: 인사이트 생성 로직 구현
    // 실제 구현에서는 기사 분석 결과를 기반으로 인사이트를 생성하는 로직 추가
    
    return {
      type: 'generateInsights',
      summary: `Generated insights`,
      detail: {
        // 세부 결과 정보
      }
    };
  }
  
  /**
   * 섹터 분석 업데이트 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeUpdateSectorAnalysisTask(task) {
    console.log(`Executing task: updateSectorAnalysis (${task.id})`);
    
    // TODO: 섹터 분석 업데이트 로직 구현
    // 실제 구현에서는 최근 기사 데이터를 분석하여 섹터별 분석 결과 생성
    
    return {
      type: 'updateSectorAnalysis',
      summary: `Updated sector analysis`,
      detail: {
        // 세부 결과 정보
      }
    };
  }
  
  /**
   * 사용자 정의 작업 실행
   * @param {Object} task - 작업 객체
   * @returns {Promise<Object>} 작업 결과
   */
  async executeCustomTask(task) {
    console.log(`Executing custom task: ${task.id}`);
    
    if (typeof task.callback !== 'function') {
      throw new Error('Custom task requires a callback function');
    }
    
    // 사용자 정의 콜백 함수 실행
    const result = await task.callback(task.params);
    
    return {
      type: 'customTask',
      summary: result.summary || 'Custom task completed',
      detail: result
    };
  }
  
  /**
   * 기본 스케줄 설정
   * 일반적인 작업들을 기본 간격으로 등록
   */
  setupDefaultSchedule() {
    try {
      console.log('Setting up default schedule');
      
      // 1. 모든 소스 수집 (2시간마다)
      this.addTask({
        type: 'collectAllSources',
        interval: 2 * 60 * 60 * 1000, // 2시간
        enabled: true
      });
      
      // 2. 기사 정리 (하루에 한 번)
      this.addTask({
        type: 'cleanupArticles',
        interval: 24 * 60 * 60 * 1000, // 24시간
        enabled: true,
        params: {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
          maxArticles: 10000
        }
      });
      
      // 3. 인사이트 생성 (6시간마다)
      this.addTask({
        type: 'generateInsights',
        interval: 6 * 60 * 60 * 1000, // 6시간
        enabled: true
      });
      
      // 4. 섹터 분석 업데이트 (12시간마다)
      this.addTask({
        type: 'updateSectorAnalysis',
        interval: 12 * 60 * 60 * 1000, // 12시간
        enabled: true
      });
      
      console.log('Default schedule setup completed');
      
      return true;
    } catch (error) {
      console.error('Error setting up default schedule:', error);
      return false;
    }
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

// 싱글톤 인스턴스 생성 및 내보내기
const scheduler = new Scheduler();
export default scheduler; 