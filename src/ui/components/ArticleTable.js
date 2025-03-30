/**
 * Financial Insight Hub Pro - 기사 테이블 컴포넌트
 * 
 * 이 컴포넌트는 분석된 기사 목록을 테이블 형태로 표시합니다.
 */

class ArticleTable {
  constructor(containerId, articles = []) {
    this.container = document.getElementById(containerId);
    this.articles = articles;
    this.pageSize = 10;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.articles.length / this.pageSize);
    this.onArticleClickHandler = null;
    
    if (!this.container) {
      console.error(`컨테이너 ID "${containerId}"를 찾을 수 없습니다.`);
      return;
    }
    
    this.render();
  }
  
  /**
   * 테이블 렌더링
   */
  render() {
    // 테이블 생성
    this.container.innerHTML = `
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-700">
            <th class="p-2 text-left text-sm font-medium">제목</th>
            <th class="p-2 text-left text-sm font-medium hidden md:table-cell">출처</th>
            <th class="p-2 text-left text-sm font-medium hidden md:table-cell">날짜</th>
            <th class="p-2 text-left text-sm font-medium">관련성</th>
            <th class="p-2 text-left text-sm font-medium">감성</th>
          </tr>
        </thead>
        <tbody id="article-table-body">
          ${this.renderTableRows()}
        </tbody>
      </table>
      ${this.renderPagination()}
    `;
    
    // 페이지네이션 이벤트 핸들러 등록
    this.setupPaginationHandlers();
  }
  
  /**
   * 테이블 행 렌더링
   * @returns {string} HTML 문자열
   */
  renderTableRows() {
    if (this.articles.length === 0) {
      return `
        <tr>
          <td colspan="5" class="p-3 text-center text-gray-500">
            기사가 없습니다.
          </td>
        </tr>
      `;
    }
    
    // 현재 페이지의 기사만 표시
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.articles.length);
    const pageArticles = this.articles.slice(startIndex, endIndex);
    
    return pageArticles.map(article => {
      // 관련성 점수 (0-100)
      const relevanceScore = article.analysis && article.analysis.relevance
        ? Math.round(article.analysis.relevance.score * 100)
        : 0;
      
      // 관련성 색상 클래스
      const relevanceClass = this.getRelevanceColorClass(relevanceScore);
      
      // 감성 점수 (-1~1을 0~10으로 변환)
      const sentimentScore = article.analysis && article.analysis.sentiment
        ? ((article.analysis.sentiment.score + 1) / 2) * 10
        : 5;
      
      // 감성 텍스트 및 색상 클래스
      const { text: sentimentText, className: sentimentClass } = this.getSentimentInfo(sentimentScore);
      
      // 날짜 포맷팅
      const date = article.publishedAt ? new Date(article.publishedAt) : new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      return `
        <tr class="border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" data-article-id="${article.id}">
          <td class="p-2">
            <div class="font-medium text-sm line-clamp-2">${article.title || '제목 없음'}</div>
          </td>
          <td class="p-2 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">${article.source || '알 수 없음'}</td>
          <td class="p-2 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">${formattedDate}</td>
          <td class="p-2">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center ${relevanceClass} text-white font-medium text-xs">
                ${relevanceScore}
              </div>
            </div>
          </td>
          <td class="p-2">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center ${sentimentClass} text-white font-medium text-xs">
                ${sentimentScore.toFixed(1)}
              </div>
              <span class="ml-2 text-xs text-gray-600 dark:text-gray-300 hidden sm:inline">${sentimentText}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  /**
   * 페이지네이션 렌더링
   * @returns {string} HTML 문자열
   */
  renderPagination() {
    if (this.totalPages <= 1) {
      return '';
    }
    
    // 페이지 번호 생성
    let pageNumbers = '';
    const maxVisiblePages = 5;
    
    // 표시할 페이지 번호 범위 계산
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 페이지 번호 생성
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      pageNumbers += `
        <button class="page-number px-3 py-1 mx-1 rounded ${
          isActive
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }" data-page="${i}">
          ${i}
        </button>
      `;
    }
    
    return `
      <div class="pagination flex justify-center items-center mt-4">
        <button class="prev-page px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 ${
          this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
        }" ${this.currentPage === 1 ? 'disabled' : ''}>
          이전
        </button>
        ${pageNumbers}
        <button class="next-page px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 ${
          this.currentPage === this.totalPages ? 'opacity-50 cursor-not-allowed' : ''
        }" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
          다음
        </button>
      </div>
    `;
  }
  
  /**
   * 페이지네이션 이벤트 핸들러 등록
   */
  setupPaginationHandlers() {
    // 테이블 이벤트 핸들러 등록
    const tableBody = document.getElementById('article-table-body');
    if (tableBody) {
      tableBody.addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (row && row.dataset.articleId) {
          // 기사 ID 추출
          const articleId = row.dataset.articleId;
          
          // 기사 객체 찾기
          const article = this.articles.find(a => a.id === articleId);
          
          // 클릭 이벤트 호출
          if (article && this.onArticleClickHandler) {
            this.onArticleClickHandler(article);
          }
        }
      });
    }
    
    // 이전 페이지 버튼
    const prevPageBtn = this.container.querySelector('.prev-page');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.goToPage(this.currentPage - 1);
        }
      });
    }
    
    // 다음 페이지 버튼
    const nextPageBtn = this.container.querySelector('.next-page');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          this.goToPage(this.currentPage + 1);
        }
      });
    }
    
    // 페이지 번호 버튼
    const pageButtons = this.container.querySelectorAll('.page-number');
    pageButtons.forEach(button => {
      button.addEventListener('click', () => {
        const page = parseInt(button.dataset.page, 10);
        this.goToPage(page);
      });
    });
  }
  
  /**
   * 특정 페이지로 이동
   * @param {number} page - 페이지 번호
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.render();
  }
  
  /**
   * 관련성 점수에 따른 색상 클래스 반환
   * @param {number} score - 관련성 점수 (0-100)
   * @returns {string} 색상 클래스
   */
  getRelevanceColorClass(score) {
    if (score >= 80) {
      return 'bg-blue-600'; // 매우 관련
    } else if (score >= 60) {
      return 'bg-blue-500'; // 관련
    } else if (score >= 40) {
      return 'bg-blue-400'; // 약간 관련
    } else if (score >= 20) {
      return 'bg-gray-400'; // 거의 관련 없음
    } else {
      return 'bg-gray-300'; // 관련 없음
    }
  }
  
  /**
   * 감성 점수에 따른 정보 반환
   * @param {number} score - 감성 점수 (0-10)
   * @returns {Object} 감성 텍스트 및 색상 클래스
   */
  getSentimentInfo(score) {
    if (score < 3) {
      return { text: '매우 부정', className: 'bg-red-600' };
    } else if (score < 4) {
      return { text: '부정', className: 'bg-red-500' };
    } else if (score < 5) {
      return { text: '약간 부정', className: 'bg-orange-500' };
    } else if (score < 6) {
      return { text: '중립', className: 'bg-yellow-500' };
    } else if (score < 7) {
      return { text: '약간 긍정', className: 'bg-lime-500' };
    } else if (score < 8) {
      return { text: '긍정', className: 'bg-green-500' };
    } else {
      return { text: '매우 긍정', className: 'bg-green-600' };
    }
  }
  
  /**
   * 기사 클릭 이벤트 핸들러 설정
   * @param {Function} handler - 클릭 이벤트 핸들러
   */
  onArticleClick(handler) {
    this.onArticleClickHandler = handler;
  }
  
  /**
   * 기사 데이터 업데이트
   * @param {Array} articles - 새 기사 배열
   */
  updateArticles(articles) {
    this.articles = articles;
    this.totalPages = Math.ceil(this.articles.length / this.pageSize);
    this.currentPage = 1; // 페이지 초기화
    this.render();
  }
  
  /**
   * 컴포넌트 정리
   */
  cleanup() {
    // 이벤트 리스너 제거 등 정리 작업
    const tableBody = document.getElementById('article-table-body');
    if (tableBody) {
      tableBody.removeEventListener('click', this.onArticleClickHandler);
    }
  }
}

export default ArticleTable; 