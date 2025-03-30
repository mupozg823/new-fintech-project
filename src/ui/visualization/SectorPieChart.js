/**
 * Financial Insight Hub Pro - 섹터 파이 차트 컴포넌트
 * 
 * 이 컴포넌트는 섹터별 기사 분포를 파이 차트로 시각화합니다.
 */

class SectorPieChart {
  constructor(containerId, data = []) {
    this.container = document.getElementById(containerId);
    this.data = data;
    this.chart = null;
    this.colors = [
      '#4285F4', '#34A853', '#FBBC05', '#EA4335', 
      '#8F44AD', '#3498DB', '#1ABC9C', '#F39C12', 
      '#D35400', '#C0392B', '#7F8C8D', '#2C3E50'
    ];
    
    if (!this.container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다.`);
      return;
    }
    
    this.initChart();
  }
  
  /**
   * 차트 초기화
   */
  initChart() {
    // Canvas 엘리먼트 생성
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.container.appendChild(this.canvas);
    
    // Chart.js가 로드되지 않은 경우
    if (typeof Chart === 'undefined') {
      this.loadChartJS().then(() => {
        this.createChart();
      }).catch(error => {
        console.error('Chart.js 로드 실패:', error);
        this.showError('차트 라이브러리를 로드할 수 없습니다.');
      });
    } else {
      this.createChart();
    }
  }
  
  /**
   * Chart.js 동적 로딩
   * @returns {Promise} Chart.js 로딩 Promise
   */
  loadChartJS() {
    return new Promise((resolve, reject) => {
      try {
        // 이미 로드된 경우
        if (typeof Chart !== 'undefined') {
          console.log('Chart.js가 이미 로드되어 있습니다.');
          resolve();
          return;
        }
        
        console.log('Chart.js 라이브러리 로딩 시도...');
        
        // 로딩 타임아웃 설정
        const timeout = setTimeout(() => {
          console.warn('Chart.js 라이브러리 로딩 타임아웃');
          // 타임아웃이 발생해도 에러 대신 해결
          resolve();
        }, 5000);
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Chart.js 라이브러리 로드 완료');
          clearTimeout(timeout);
          resolve();
        };
        
        script.onerror = (err) => {
          console.warn('Chart.js 라이브러리 로드 실패:', err);
          clearTimeout(timeout);
          // 실패해도 에러 대신 해결
          resolve();
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.warn('Chart.js 스크립트 로드 중 오류:', error);
        // 오류가 발생해도 해결
        resolve();
      }
    });
  }
  
  /**
   * 차트 생성
   */
  createChart() {
    try {
      // Chart.js가 로드되지 않은 경우
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js가 로드되지 않아 차트를 생성할 수 없습니다.');
        this.showNoData();
        return;
      }
    
      const ctx = this.canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Canvas 2D 컨텍스트를 가져올 수 없습니다.');
        this.showNoData();
        return;
      }
      
      // 데이터 형식 변환
      const chartData = {
        labels: this.data.map(item => item.name || '기타'),
        datasets: [{
          data: this.data.map(item => item.value || 0),
          backgroundColor: this.getColors(this.data.length),
          borderWidth: 1
        }]
      };
      
      // 차트 없는 경우 차트 인스턴스 생성
      if (!this.chart) {
        this.chart = new Chart(ctx, {
          type: 'pie',
          data: chartData,
          options: this.getChartOptions()
        });
      } else {
        // 차트 있는 경우 데이터 업데이트
        this.chart.data = chartData;
        this.chart.update();
      }
    } catch (error) {
      console.error('차트 생성 중 오류 발생:', error);
      this.showNoData();
    }
  }
  
  /**
   * 차트 데이터 업데이트
   * @param {Array} data - 새 차트 데이터
   */
  updateData(data) {
    this.data = data;
    
    if (!this.chart) {
      this.initChart();
      return;
    }
    
    // 차트 데이터 업데이트
    this.chart.data.labels = this.data.map(item => item.name);
    this.chart.data.datasets[0].data = this.data.map(item => item.value);
    this.chart.data.datasets[0].backgroundColor = this.data.map((_, index) => 
      this.colors[index % this.colors.length]
    );
    
    // 차트 업데이트
    this.chart.update();
    
    // 데이터가 없는 경우 메시지 표시
    if (this.data.length === 0) {
      this.showNoData();
    } else {
      this.hideNoData();
    }
  }
  
  /**
   * 데이터 없음 메시지 표시
   */
  showNoData() {
    if (!this.container) return;
    
    // 기존 내용 제거
    this.container.innerHTML = '';
    
    // 메시지 표시
    const message = document.createElement('div');
    message.className = 'h-full flex items-center justify-center';
    message.innerHTML = `
      <div class="text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="mt-2">데이터가 없습니다</p>
      </div>
    `;
    
    this.container.appendChild(message);
  }
  
  /**
   * 데이터 없음 메시지 숨기기
   */
  hideNoData() {
    const message = this.container.querySelector('.no-data-message');
    if (message) {
      this.container.removeChild(message);
    }
  }
  
  /**
   * 오류 메시지 표시
   * @param {string} message - 오류 메시지
   */
  showError(message) {
    if (!this.container) return;
    
    // 기존 내용 제거
    this.container.innerHTML = '';
    
    // 오류 메시지 표시
    const errorElement = document.createElement('div');
    errorElement.className = 'h-full flex items-center justify-center';
    errorElement.innerHTML = `
      <div class="text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="mt-2">${message || '오류가 발생했습니다'}</p>
      </div>
    `;
    
    this.container.appendChild(errorElement);
  }
  
  /**
   * 로딩 표시
   */
  showLoading() {
    if (!this.container) return;
    
    // 로딩 중 표시
    this.container.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    `;
  }
  
  /**
   * 로딩 숨기기
   */
  hideLoading() {
    // 아무 것도 하지 않음 (createChart에서 처리)
  }
  
  /**
   * 차트 크기 조정
   */
  resize() {
    if (this.chart) {
      this.chart.resize();
    }
  }
  
  /**
   * 차트 정리
   */
  cleanup() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
  
  /**
   * 차트 옵션 반환
   * @returns {Object} 차트 옵션
   */
  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value}건 (${percentage}%)`;
            }
          }
        }
      }
    };
  }
  
  /**
   * 색상 배열 반환
   * @param {number} count - 필요한 색상 개수
   * @returns {Array} 색상 배열
   */
  getColors(count) {
    // 기본 색상 목록
    const defaultColors = [
      '#4285F4', '#34A853', '#FBBC05', '#EA4335', 
      '#8F44AD', '#3498DB', '#1ABC9C', '#F39C12', 
      '#D35400', '#C0392B', '#7F8C8D', '#2C3E50'
    ];
    
    if (count <= defaultColors.length) {
      return defaultColors.slice(0, count);
    }
    
    // 필요한 색상이 더 많은 경우 색상 반복
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(defaultColors[i % defaultColors.length]);
    }
    return colors;
  }
}

export default SectorPieChart; 