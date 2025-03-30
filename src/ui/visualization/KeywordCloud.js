/**
 * Financial Insight Hub Pro - 키워드 클라우드 컴포넌트
 * 
 * 이 컴포넌트는 분석된 텍스트에서 추출된 키워드를 클라우드 형태로 시각화합니다.
 */

class KeywordCloud {
  constructor(containerId, keywords = []) {
    this.container = document.getElementById(containerId);
    this.keywords = keywords; // {text: string, weight: number} 형태의 배열
    this.cloud = null;
    
    if (!this.container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다.`);
      return;
    }
    
    this.initCloud();
  }
  
  /**
   * 클라우드 초기화
   */
  initCloud() {
    // 로딩 중 표시
    this.showLoading();
    
    // d3-cloud 라이브러리 로드
    this.loadD3Cloud()
      .then(() => {
        this.createCloud();
        this.hideLoading();
      })
      .catch(error => {
        console.error('D3 Cloud 로드 실패:', error);
        this.showError('워드 클라우드 라이브러리를 로드할 수 없습니다.');
        this.hideLoading();
      });
  }
  
  /**
   * D3 Cloud 라이브러리 동적 로딩
   * @returns {Promise} 라이브러리 로딩 Promise
   */
  loadD3Cloud() {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우 바로 해결
      if (typeof d3 !== 'undefined' && typeof d3.layout !== 'undefined' && typeof d3.layout.cloud !== 'undefined') {
        console.log('D3 및 Cloud 라이브러리가 이미 로드되어 있습니다.');
        resolve();
        return;
      }
      
      console.log('D3 라이브러리 로딩 시도...');
      
      // 로딩 타임아웃 설정
      const timeout = setTimeout(() => {
        console.warn('D3 라이브러리 로딩 타임아웃');
        // 타임아웃이 발생해도 에러 대신 빈 클라우드를 표시
        resolve();
      }, 5000);
      
      // D3.js 먼저 로드
      if (typeof d3 === 'undefined') {
        try {
          const d3Script = document.createElement('script');
          d3Script.src = 'https://d3js.org/d3.v7.min.js';
          d3Script.async = true;
          
          d3Script.onload = () => {
            console.log('D3 기본 라이브러리 로드 완료');
            
            // 이후 d3-cloud 로드
            if (typeof d3.layout === 'undefined' || typeof d3.layout.cloud === 'undefined') {
              try {
                const cloudScript = document.createElement('script');
                cloudScript.src = 'https://cdn.jsdelivr.net/gh/jasondavies/d3-cloud@1.2.5/build/d3.layout.cloud.min.js';
                cloudScript.async = true;
                
                cloudScript.onload = () => {
                  console.log('D3 Cloud 라이브러리 로드 완료');
                  clearTimeout(timeout);
                  resolve();
                };
                
                cloudScript.onerror = (err) => {
                  console.warn('D3 Cloud 라이브러리 로드 실패:', err);
                  clearTimeout(timeout);
                  // 에러 대신 빈 클라우드를 보여주기 위해 해결
                  resolve();
                };
                
                document.head.appendChild(cloudScript);
              } catch (error) {
                console.warn('D3 Cloud 스크립트 생성 중 오류:', error);
                clearTimeout(timeout);
                resolve();
              }
            } else {
              console.log('D3 Cloud 라이브러리가 이미 로드되어 있습니다.');
              clearTimeout(timeout);
              resolve();
            }
          };
          
          d3Script.onerror = (err) => {
            console.warn('D3 기본 라이브러리 로드 실패:', err);
            clearTimeout(timeout);
            // 에러 대신 빈 클라우드를 보여주기 위해 해결
            resolve();
          };
          
          document.head.appendChild(d3Script);
        } catch (error) {
          console.warn('D3 스크립트 생성 중 오류:', error);
          clearTimeout(timeout);
          resolve();
        }
      } else {
        // D3.js가 이미 로드된 경우, d3-cloud만 로드
        if (typeof d3.layout === 'undefined' || typeof d3.layout.cloud === 'undefined') {
          try {
            const cloudScript = document.createElement('script');
            cloudScript.src = 'https://cdn.jsdelivr.net/gh/jasondavies/d3-cloud@1.2.5/build/d3.layout.cloud.min.js';
            cloudScript.async = true;
            
            cloudScript.onload = () => {
              console.log('D3 Cloud 라이브러리 로드 완료');
              clearTimeout(timeout);
              resolve();
            };
            
            cloudScript.onerror = (err) => {
              console.warn('D3 Cloud 라이브러리 로드 실패:', err);
              clearTimeout(timeout);
              // 에러 대신 빈 클라우드를 보여주기 위해 해결
              resolve();
            };
            
            document.head.appendChild(cloudScript);
          } catch (error) {
            console.warn('D3 Cloud 스크립트 생성 중 오류:', error);
            clearTimeout(timeout);
            resolve();
          }
        } else {
          console.log('D3 Cloud 라이브러리가 이미 로드되어 있습니다.');
          clearTimeout(timeout);
          resolve();
        }
      }
    });
  }
  
  /**
   * 키워드 클라우드 생성
   */
  createCloud() {
    // 기존 SVG 제거
    const existingSvg = this.container.querySelector('svg');
    if (existingSvg) {
      this.container.removeChild(existingSvg);
    }
    
    if (this.keywords.length === 0) {
      this.showNoData();
      return;
    }
    
    // 컨테이너 크기
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // 색상 스케일
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // 폰트 크기 스케일 (최소 10px, 최대 50px)
    const minWeight = Math.min(...this.keywords.map(kw => kw.weight));
    const maxWeight = Math.max(...this.keywords.map(kw => kw.weight));
    const fontSize = d3.scaleLinear()
      .domain([minWeight, maxWeight])
      .range([12, 36]);
    
    // D3 Cloud 레이아웃 설정
    const layout = d3.layout.cloud()
      .size([width, height])
      .words(this.keywords.map(kw => ({
        text: kw.text,
        size: fontSize(kw.weight),
        weight: kw.weight
      })))
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 0 : 90 * (Math.random() > 0.5 ? 1 : -1)))
      .font('맑은 고딕')
      .fontSize(d => d.size)
      .on('end', words => {
        // SVG 생성
        const svg = d3.select(this.container)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('class', 'word-cloud')
          .append('g')
          .attr('transform', `translate(${width / 2},${height / 2})`);
        
        // 단어 그리기
        svg.selectAll('text')
          .data(words)
          .enter()
          .append('text')
          .style('font-size', d => `${d.size}px`)
          .style('font-family', '맑은 고딕, "Malgun Gothic", sans-serif')
          .style('fill', (d, i) => color(i % 10))
          .attr('text-anchor', 'middle')
          .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
          .text(d => d.text)
          .on('mouseover', function(event, d) {
            // 마우스 오버 시 확대 효과
            d3.select(this)
              .transition()
              .duration(200)
              .style('font-size', `${d.size * 1.2}px`)
              .style('font-weight', 'bold')
              .style('cursor', 'pointer');
          })
          .on('mouseout', function(event, d) {
            // 마우스 아웃 시 원래 크기로
            d3.select(this)
              .transition()
              .duration(200)
              .style('font-size', `${d.size}px`)
              .style('font-weight', 'normal');
          })
          .on('click', (event, d) => {
            // 단어 클릭 시 이벤트
            console.log(`키워드 클릭: ${d.text} (가중치: ${d.weight})`);
            if (this.onKeywordClick) {
              this.onKeywordClick(d.text);
            }
          });
      });
    
    // 레이아웃 시작
    layout.start();
  }
  
  /**
   * 키워드 업데이트
   * @param {Array} keywords - 새 키워드 배열
   */
  updateKeywords(keywords) {
    this.keywords = keywords;
    
    // 로딩 중 표시
    this.showLoading();
    
    // D3 Cloud 라이브러리가 로드되었는지 확인
    if (typeof d3 === 'undefined' || typeof d3.layout === 'undefined' || typeof d3.layout.cloud === 'undefined') {
      this.initCloud();
      return;
    }
    
    // 클라우드 재생성
    this.createCloud();
    
    // 로딩 숨기기
    this.hideLoading();
  }
  
  /**
   * 로딩 표시
   */
  showLoading() {
    // 이미 로딩 표시가 있는지 확인
    if (this.container.querySelector('.loading-indicator')) {
      return;
    }
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.innerHTML = `
      <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      <div style="margin-top: 10px; color: #666;">로딩 중...</div>
    `;
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    this.container.style.position = 'relative';
    this.container.appendChild(loadingIndicator);
  }
  
  /**
   * 로딩 숨기기
   */
  hideLoading() {
    const loadingIndicator = this.container.querySelector('.loading-indicator');
    if (loadingIndicator) {
      this.container.removeChild(loadingIndicator);
    }
  }
  
  /**
   * 데이터 없음 메시지 표시
   */
  showNoData() {
    // 이미 메시지가 있는지 확인
    if (this.container.querySelector('.no-data-message')) {
      return;
    }
    
    const message = document.createElement('div');
    message.className = 'no-data-message';
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.textAlign = 'center';
    message.style.color = '#888';
    message.style.fontSize = '14px';
    message.innerHTML = '키워드 데이터가 없습니다';
    
    this.container.style.position = 'relative';
    this.container.appendChild(message);
  }
  
  /**
   * 에러 메시지 표시
   * @param {string} message - 에러 메시지
   */
  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'cloud-error';
    errorElement.style.color = 'red';
    errorElement.style.padding = '10px';
    errorElement.style.textAlign = 'center';
    errorElement.innerHTML = message;
    
    this.container.innerHTML = '';
    this.container.appendChild(errorElement);
  }
  
  /**
   * 단어 클릭 이벤트 핸들러 설정
   * @param {Function} callback - 콜백 함수
   */
  setOnKeywordClick(callback) {
    this.onKeywordClick = callback;
  }
  
  /**
   * 키워드 클라우드 정리
   */
  cleanup() {
    // SVG 제거
    const svg = this.container.querySelector('svg');
    if (svg) {
      this.container.removeChild(svg);
    }
    
    // 로딩 표시 제거
    this.hideLoading();
  }
}

export default KeywordCloud; 