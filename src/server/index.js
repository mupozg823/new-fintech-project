/**
 * Financial Insight Hub Pro - 서버 진입점
 * 
 * 이 파일은 서버 측 로직의 진입점으로, 데이터 수집, 처리, 분석 등의
 * 백엔드 기능을 초기화하고 관리합니다.
 */

import FinancialInsightData from './infrastructure/data-structure.js';
import RssProxyService from './infrastructure/proxy-service.js';
import GeneralApiService from './infrastructure/general-api-service.js';
import TextAnalysisEngine from './processors/text-analysis-engine.js';
import { setupOptimizedFunctions } from './optimization/integration.js';

class ServerApplication {
  constructor() {
    this.dataManager = null;
    this.proxyService = null;
    this.apiService = null;
    this.textAnalysisEngine = null;
  }
  
  async initialize() {
    console.log('서버 애플리케이션 초기화 시작...');
    
    try {
      // 데이터 관리자 초기화
      this.dataManager = FinancialInsightData;
      await this.dataManager.initialize();
      console.log('✓ 데이터 관리자 초기화 완료');
      
      // RSS 프록시 서비스 초기화
      this.proxyService = RssProxyService;
      await this.proxyService.initialize();
      console.log('✓ RSS 프록시 서비스 초기화 완료');
      
      // API 서비스 초기화
      this.apiService = new GeneralApiService();
      await this.apiService.initialize();
      console.log('✓ API 서비스 초기화 완료');
      
      // 텍스트 분석 엔진 초기화
      this.textAnalysisEngine = TextAnalysisEngine;
      console.log('✓ 텍스트 분석 엔진 초기화 완료');
      
      // 최적화 모듈 설정
      await setupOptimizedFunctions(this.apiService);
      console.log('✓ 최적화 모듈 설정 완료');
      
      console.log('서버 애플리케이션 초기화 완료');
      return true;
    } catch (error) {
      console.error('서버 애플리케이션 초기화 중 오류:', error);
      throw error;
    }
  }
  
  async start() {
    await this.initialize();
    console.log('서버 애플리케이션 실행 중...');
    
    // 주기적 데이터 수집 시작
    this.proxyService.startPeriodicUpdate();
  }
  
  async stop() {
    console.log('서버 애플리케이션 종료 중...');
    
    // 주기적 데이터 수집 중지
    this.proxyService.stopAllPeriodicUpdates();
    
    // 리소스 정리
    if (this.apiService) {
      await this.apiService.cleanup();
    }
    
    console.log('서버 애플리케이션 종료 완료');
  }
}

// 서버 애플리케이션 인스턴스 생성 및 내보내기
const serverApp = new ServerApplication();
export default serverApp; 