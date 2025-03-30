/**
 * Financial Insight Hub Pro - 감성 게이지 컴포넌트
 * 
 * 이 컴포넌트는 텍스트 분석의 감성 점수를 게이지 차트로 시각화합니다.
 */

class SentimentGauge {
  constructor(containerId, value = 0) {
    this.container = document.getElementById(containerId);
    this.value = value; // 0-10 사이의 값 (0: 매우 부정, 5: 중립, 10: 매우 긍정)
    this.gauge = null;
    
    if (!this.container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다.`);
      return;
    }
    
    this.initGauge();
  }
  
  /**
   * 게이지 초기화
   */
  initGauge() {
    // Canvas 엘리먼트 생성
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.container.appendChild(this.canvas);
    
    // Chart.js가 로드되지 않은 경우
    if (typeof Chart === 'undefined') {
      this.loadChartJS().then(() => {
        this.createGauge();
      }).catch(error => {
        console.error('Chart.js 로드 실패:', error);
        this.showError('차트 라이브러리를 로드할 수 없습니다.');
      });
    } else {
      this.createGauge();
    }
  }
  
  /**
   * Chart.js 동적 로딩
   * @returns {Promise} Chart.js 로딩 Promise
   */
  loadChartJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        // 게이지 차트 플러그인 로드
        const pluginScript = document.createElement('script');
        pluginScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-gauge@0.3.0/dist/chartjs-gauge.min.js';
        pluginScript.onload = resolve;
        pluginScript.onerror = reject;
        document.head.appendChild(pluginScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * 게이지 생성
   */
  createGauge() {
    const ctx = this.canvas.getContext('2d');
    
    // 플러그인이 없는 경우 대체 차트 생성
    if (typeof Chart.controllers.gauge === 'undefined') {
      this.createAlternativeGauge(ctx);
      return;
    }
    
    // 게이지 데이터 및 옵션
    const data = {
      datasets: [{
        value: this.value,
        data: [this.value, 10 - this.value], // 현재 값과 남은 공간
        backgroundColor: this.getGaugeColor(this.value),
        borderWidth: 0
      }]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      circumference: Math.PI,
      rotation: Math.PI,
      cutout: '70%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      }
    };
    
    // 게이지 차트 생성
    this.gauge = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: options
    });
    
    // 게이지 값 표시
    this.displayGaugeValue();
  }
  
  /**
   * 대체 게이지 생성 (플러그인이 없는 경우)
   * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
   */
  createAlternativeGauge(ctx) {
    // 반원형 도넛 차트로 게이지 구현
    const data = {
      datasets: [{
        data: [this.value, 10 - this.value], // 현재 값과 남은 공간
        backgroundColor: [
          this.getGaugeColor(this.value),
          '#e0e0e0'
        ],
        borderWidth: 0
      }]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      circumference: 180, // 반원
      rotation: 270, // 시작 각도
      cutout: '75%', // 도넛 두께
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      }
    };
    
    // 게이지 차트 생성
    this.gauge = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: options
    });
    
    // 게이지 값 표시
    this.displayGaugeValue();
  }
  
  /**
   * 게이지 값 텍스트로 표시
   */
  displayGaugeValue() {
    // 이미 표시된 값이 있는지 확인
    const existingValue = this.container.querySelector('.gauge-value');
    if (existingValue) {
      existingValue.textContent = this.value.toFixed(1);
      existingValue.style.color = this.getTextColor(this.value);
      return;
    }
    
    // 값 표시 요소 생성
    const valueElement = document.createElement('div');
    valueElement.className = 'gauge-value';
    valueElement.style.position = 'absolute';
    valueElement.style.bottom = '60px';
    valueElement.style.left = '50%';
    valueElement.style.transform = 'translateX(-50%)';
    valueElement.style.fontSize = '28px';
    valueElement.style.fontWeight = 'bold';
    valueElement.style.color = this.getTextColor(this.value);
    valueElement.textContent = this.value.toFixed(1);
    
    // 감성 레이블 생성
    const labelElement = document.createElement('div');
    labelElement.className = 'gauge-label';
    labelElement.style.position = 'absolute';
    labelElement.style.bottom = '40px';
    labelElement.style.left = '50%';
    labelElement.style.transform = 'translateX(-50%)';
    labelElement.style.fontSize = '14px';
    labelElement.style.color = '#666';
    labelElement.textContent = this.getSentimentLabel(this.value);
    
    // 컨테이너에 추가
    this.container.style.position = 'relative';
    this.container.appendChild(valueElement);
    this.container.appendChild(labelElement);
    
    // 게이지 범위 표시
    this.displayGaugeRange();
  }
  
  /**
   * 게이지 범위 표시
   */
  displayGaugeRange() {
    // 레이블 컨테이너 생성
    const rangeContainer = document.createElement('div');
    rangeContainer.className = 'gauge-range';
    rangeContainer.style.position = 'absolute';
    rangeContainer.style.bottom = '10px';
    rangeContainer.style.left = '0';
    rangeContainer.style.right = '0';
    rangeContainer.style.display = 'flex';
    rangeContainer.style.justifyContent = 'space-between';
    rangeContainer.style.padding = '0 15%';
    rangeContainer.style.fontSize = '12px';
    rangeContainer.style.color = '#888';
    
    // 부정 레이블
    const negativeLabel = document.createElement('div');
    negativeLabel.textContent = '매우 부정';
    
    // 중립 레이블
    const neutralLabel = document.createElement('div');
    neutralLabel.textContent = '중립';
    
    // 긍정 레이블
    const positiveLabel = document.createElement('div');
    positiveLabel.textContent = '매우 긍정';
    
    // 레이블 추가
    rangeContainer.appendChild(negativeLabel);
    rangeContainer.appendChild(neutralLabel);
    rangeContainer.appendChild(positiveLabel);
    
    this.container.appendChild(rangeContainer);
  }
  
  /**
   * 게이지 값에 따른 색상 반환
   * @param {number} value - 감성 점수 (0-10)
   * @returns {string} 색상 코드
   */
  getGaugeColor(value) {
    if (value < 3) {
      return '#ef5350'; // 부정 (빨간색)
    } else if (value < 4) {
      return '#EF6C00'; // 약간 부정 (주황색)
    } else if (value < 6) {
      return '#FFC107'; // 중립 (노란색)
    } else if (value < 7) {
      return '#8BC34A'; // 약간 긍정 (연두색)
    } else {
      return '#4CAF50'; // 긍정 (녹색)
    }
  }
  
  /**
   * 게이지 값에 따른 텍스트 색상 반환
   * @param {number} value - 감성 점수 (0-10)
   * @returns {string} 텍스트 색상 코드
   */
  getTextColor(value) {
    if (value < 3) {
      return '#d32f2f'; // 부정 (진한 빨간색)
    } else if (value < 4) {
      return '#E65100'; // 약간 부정 (진한 주황색)
    } else if (value < 6) {
      return '#F57F17'; // 중립 (진한 노란색)
    } else if (value < 7) {
      return '#558B2F'; // 약간 긍정 (진한 연두색)
    } else {
      return '#2E7D32'; // 긍정 (진한 녹색)
    }
  }
  
  /**
   * 감성 점수에 따른 레이블 반환
   * @param {number} value - 감성 점수 (0-10)
   * @returns {string} 감성 레이블
   */
  getSentimentLabel(value) {
    if (value < 2) {
      return '매우 부정적';
    } else if (value < 4) {
      return '부정적';
    } else if (value < 6) {
      return '중립적';
    } else if (value < 8) {
      return '긍정적';
    } else {
      return '매우 긍정적';
    }
  }
  
  /**
   * 게이지 값 업데이트
   * @param {number} value - 새 감성 점수 (0-10)
   */
  updateValue(value) {
    this.value = Math.max(0, Math.min(10, value)); // 0-10 사이로 제한
    
    if (!this.gauge) {
      this.initGauge();
      return;
    }
    
    // 게이지 데이터 업데이트
    this.gauge.data.datasets[0].data = [this.value, 10 - this.value];
    this.gauge.data.datasets[0].backgroundColor = this.getGaugeColor(this.value);
    
    // 게이지 업데이트
    this.gauge.update();
    
    // 게이지 값 텍스트 업데이트
    const valueElement = this.container.querySelector('.gauge-value');
    if (valueElement) {
      valueElement.textContent = this.value.toFixed(1);
      valueElement.style.color = this.getTextColor(this.value);
    }
    
    // 감성 레이블 업데이트
    const labelElement = this.container.querySelector('.gauge-label');
    if (labelElement) {
      labelElement.textContent = this.getSentimentLabel(this.value);
    }
  }
  
  /**
   * 에러 메시지 표시
   * @param {string} message - 에러 메시지
   */
  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'gauge-error';
    errorElement.style.color = 'red';
    errorElement.style.padding = '10px';
    errorElement.style.textAlign = 'center';
    errorElement.innerHTML = message;
    
    this.container.innerHTML = '';
    this.container.appendChild(errorElement);
  }
  
  /**
   * 게이지 크기 조정
   */
  resize() {
    if (this.gauge) {
      this.gauge.resize();
    }
  }
  
  /**
   * 게이지 정리
   */
  cleanup() {
    if (this.gauge) {
      this.gauge.destroy();
      this.gauge = null;
    }
  }
}

export default SentimentGauge; 