/**
 * Financial Insight Hub Pro - 인사이트 목록 컴포넌트
 * 
 * 이 컴포넌트는 분석을 통해 생성된 인사이트를 목록으로 표시합니다.
 */

class InsightsList {
  constructor(containerId, insights = []) {
    this.container = document.getElementById(containerId);
    this.insights = insights;
    this.onInsightClickHandler = null;
    
    if (!this.container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다.`);
      return;
    }
    
    this.render();
  }
  
  /**
   * 인사이트 목록 렌더링
   */
  render() {
    if (this.insights.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-6 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p class="mt-2">생성된 인사이트가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    // 인사이트 아이템 렌더링
    const insightItems = this.insights.map(insight => {
      // 인사이트 카테고리 배지 색상
      const categoryColor = this.getCategoryColor(insight.category);
      
      // 인사이트 중요도 표시
      const importanceClass = this.getImportanceClass(insight.importance);
      
      // 날짜 포맷팅
      const date = insight.createdAt ? new Date(insight.createdAt) : new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      return `
        <div class="insight-item p-4 mb-3 bg-white dark:bg-gray-800 rounded shadow hover:shadow-md transition-shadow cursor-pointer" data-insight-id="${insight.id}">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center">
              <div class="${categoryColor} text-white text-xs px-2 py-1 rounded">
                ${insight.category || '일반'}
              </div>
              <div class="ml-2 ${importanceClass} text-white text-xs px-2 py-1 rounded">
                ${this.getImportanceText(insight.importance)}
              </div>
            </div>
            <div class="text-xs text-gray-500">${formattedDate}</div>
          </div>
          <h3 class="text-md font-semibold mb-2">${insight.title}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">${insight.summary || insight.content}</p>
          <div class="mt-3 flex flex-wrap gap-1">
            ${(insight.tags || []).map(tag => `
              <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                ${tag}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    this.container.innerHTML = insightItems;
    
    // 이벤트 핸들러 등록
    this.setupEventHandlers();
  }
  
  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    // 인사이트 아이템 클릭 이벤트
    const insightItems = this.container.querySelectorAll('.insight-item');
    insightItems.forEach(item => {
      item.addEventListener('click', (event) => {
        const insightId = item.dataset.insightId;
        const insight = this.insights.find(i => i.id === insightId);
        
        if (insight && this.onInsightClickHandler) {
          this.onInsightClickHandler(insight);
        }
      });
    });
  }
  
  /**
   * 카테고리에 따른 색상 클래스 반환
   * @param {string} category - 인사이트 카테고리
   * @returns {string} 색상 클래스
   */
  getCategoryColor(category) {
    switch (category?.toLowerCase()) {
      case 'market':
      case '시장':
        return 'bg-blue-500';
      case 'stock':
      case '주식':
        return 'bg-green-500';
      case 'economy':
      case '경제':
        return 'bg-purple-500';
      case 'industry':
      case '산업':
        return 'bg-yellow-500';
      case 'policy':
      case '정책':
        return 'bg-indigo-500';
      case 'company':
      case '기업':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  }
  
  /**
   * 중요도에 따른 색상 클래스 반환
   * @param {number} importance - 중요도 (0-10)
   * @returns {string} 색상 클래스
   */
  getImportanceClass(importance) {
    if (importance >= 8) {
      return 'bg-red-500';  // 매우 중요
    } else if (importance >= 6) {
      return 'bg-orange-500';  // 중요
    } else if (importance >= 4) {
      return 'bg-yellow-500';  // 보통
    } else {
      return 'bg-gray-400';  // 낮음
    }
  }
  
  /**
   * 중요도에 따른 텍스트 반환
   * @param {number} importance - 중요도 (0-10)
   * @returns {string} 중요도 텍스트
   */
  getImportanceText(importance) {
    if (importance >= 8) {
      return '매우 중요';
    } else if (importance >= 6) {
      return '중요';
    } else if (importance >= 4) {
      return '보통';
    } else {
      return '참고';
    }
  }
  
  /**
   * 인사이트 클릭 이벤트 핸들러 설정
   * @param {Function} handler - 클릭 이벤트 핸들러
   */
  onInsightClick(handler) {
    this.onInsightClickHandler = handler;
  }
  
  /**
   * 인사이트 추가
   * @param {Object} insight - 추가할 인사이트
   */
  addInsight(insight) {
    // 이미 있는 인사이트인지 확인
    if (!this.insights.some(i => i.id === insight.id)) {
      // 맨 앞에 추가 (최신순)
      this.insights.unshift(insight);
      this.render();
    }
  }
  
  /**
   * 인사이트 업데이트
   * @param {Array} insights - 새 인사이트 배열
   */
  updateInsights(insights) {
    this.insights = insights;
    this.render();
  }
  
  /**
   * 인사이트 없음 메시지 표시
   * @param {string} message - 표시할 메시지
   */
  showNoInsightsMessage(message) {
    this.insights = [];
    this.container.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p class="mt-2">${message}</p>
      </div>
    `;
  }
  
  /**
   * 컴포넌트 정리
   */
  cleanup() {
    // 이벤트 리스너 제거
    const insightItems = this.container.querySelectorAll('.insight-item');
    insightItems.forEach(item => {
      item.removeEventListener('click', this.onInsightClickHandler);
    });
  }
}

export default InsightsList; 