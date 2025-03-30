/**
 * Financial Insight Hub Pro - 금융 관련성 분석기
 * 
 * 이 모듈은 텍스트의 금융 관련성을 분석하여 점수를 산출합니다.
 * TF-IDF 알고리즘과 확장된 금융 용어 사전을 활용하며,
 * 컨텍스트 기반 분석을 통해 정확도를 향상시킵니다.
 */

/**
 * 금융 키워드 사전
 * 섹터와 언어별로 구분된 금융 용어 목록
 */
const FINANCIAL_TERMS = {
  // 일반 금융 용어
  general: {
    ko: [
      "금융", "경제", "투자", "주식", "증권", "채권", "펀드", "ETF", "금리", "이자율", 
      "인플레이션", "디플레이션", "불황", "호황", "경기", "자산", "부채", "M&A", "합병", 
      "인수", "지수", "PER", "EPS", "배당", "수익률", "수익", "손실", "거래량", "거래", 
      "도지", "대장주", "종목", "호가", "시가", "고가", "저가", "종가", "매수", "매도", 
      "익절", "손절", "차트", "기술적분석", "기본적분석", "재무제표", "매출", "영업이익", 
      "당기순이익", "원가", "대차대조표", "현금흐름표", "ROE", "ROA", "자기자본", "부채비율", 
      "유동성", "레버리지", "마진", "청산", "상장", "공모", "유상증자", "무상증자", "IPO", 
      "공매도", "롱포지션", "숏포지션", "헤지", "스프레드", "스왑", "옵션", "선물", "파생상품", 
      "신용등급", "담보", "포트폴리오", "다각화", "평가", "자산배분", "리밸런싱", "벤치마크", 
      "실적", "업종", "모멘텀", "추세", "리스크", "변동성", "불확실성", "백테스팅", "매매전략", 
      "가치투자", "성장투자", "기관투자", "시장심리", "시총", "목표가", "매수의견", "보유의견", 
      "매도의견", "애널리스트", "리서치", "보고서", "재무", "회계", "세금", "디파짓", "출금", 
      "입금", "지분", "납입자본", "대주주", "유통주식", "물타기", "분산투자", "여의도", "증시"
    ],
    en: [
      "finance", "economy", "investment", "stock", "security", "bond", "fund", "ETF", 
      "interest rate", "inflation", "deflation", "recession", "boom", "business cycle", 
      "asset", "debt", "M&A", "merger", "acquisition", "index", "PER", "EPS", "dividend", 
      "yield", "profit", "loss", "volume", "transaction", "blue chip", "market cap", 
      "ticker", "bid", "ask", "open", "high", "low", "close", "buy", "sell", "take profit", 
      "stop loss", "chart", "technical analysis", "fundamental analysis", "financial statement", 
      "revenue", "operating profit", "net income", "cost", "balance sheet", "cash flow statement", 
      "ROE", "ROA", "equity", "debt ratio", "liquidity", "leverage", "margin", "liquidation", 
      "listing", "public offering", "rights issue", "bonus issue", "IPO", "short selling", 
      "long position", "short position", "hedge", "spread", "swap", "option", "futures", 
      "derivatives", "credit rating", "collateral", "portfolio", "diversification", 
      "valuation", "asset allocation", "rebalancing", "benchmark", "performance", "sector", 
      "momentum", "trend", "risk", "volatility", "uncertainty", "backtesting", "trading strategy", 
      "value investing", "growth investing", "institutional investing", "market sentiment", 
      "market cap", "target price", "buy rating", "hold rating", "sell rating", "analyst", 
      "research", "report", "finance", "accounting", "tax", "deposit", "withdrawal", 
      "stake", "paid-in capital", "major shareholder", "floating stock", "averaging down", 
      "diversified investment", "wall street", "stock market", "bear market", "bull market", 
      "correction", "rally", "crash", "bubble", "capital gains", "dividend yield", "PE ratio"
    ],
    ja: [
      "金融", "経済", "投資", "株式", "証券", "債券", "ファンド", "ETF", "金利", "利子率", 
      "インフレ", "デフレ", "不況", "好況", "景気", "資産", "負債", "M&A", "合併", 
      "買収", "指数", "PER", "EPS", "配当", "利回り", "収益", "損失", "取引量", "取引", 
      "優良株", "銘柄", "気配値", "始値", "高値", "安値", "終値", "買い", "売り", 
      "利確", "損切り", "チャート", "テクニカル分析", "ファンダメンタル分析", "財務諸表", 
      "売上", "営業利益", "純利益", "原価", "貸借対照表", "キャッシュフロー計算書", 
      "ROE", "ROA", "自己資本", "負債比率", "流動性", "レバレッジ", "マージン", "清算", 
      "上場", "公募", "増資", "無償増資", "IPO", "空売り", "ロングポジション", "ショートポジション", 
      "ヘッジ", "スプレッド", "スワップ", "オプション", "先物", "デリバティブ", 
      "信用格付け", "担保", "ポートフォリオ", "分散投資", "評価", "資産配分", "リバランス", 
      "ベンチマーク", "実績", "業種", "モメンタム", "トレンド", "リスク", "ボラティリティ", 
      "不確実性", "バックテスト", "取引戦略", "バリュー投資", "グロース投資", "機関投資", 
      "市場心理", "時価総額", "目標株価", "買い推奨", "保有推奨", "売り推奨", "アナリスト", 
      "リサーチ", "レポート", "財務", "会計", "税金", "デポジット", "出金", 
      "入金", "持分", "払込資本金", "大株主", "流通株式", "ナンピン", "分散投資", 
      "兜町", "株式市場", "弱気相場", "強気相場", "調整", "急騰", "暴落", "バブル"
    ]
  },
  
  // 금융 시장 용어
  markets: {
    ko: [
      "코스피", "코스닥", "나스닥", "다우존스", "S&P500", "니케이", "항셍", "선물", "옵션", 
      "파생상품", "외환", "환율", "달러", "유로", "엔화", "위안화", "원화", "외화", "리스크", 
      "변동성", "차익거래", "스왑", "선도", "스프레드", "베이시스", "선물만기", "옵션만기", 
      "콜옵션", "풋옵션", "행사가", "내가격", "외가격", "등가격", "프리미엄", "델타", "감마", 
      "베가", "세타", "로", "변동성지수", "VIX", "V-KOSPI", "현물", "지수", "기초자산", 
      "조정", "랠리", "피봇", "저항선", "지지선", "이동평균선", "볼린저밴드", "RSI", "MACD", 
      "스토캐스틱", "역추세", "추세추종", "브레이크아웃", "투자심리", "매물대", "눌림목", 
      "갭상승", "갭하락", "윈도드레싱", "배당락", "권리락", "국채", "회사채", "금리", "만기", 
      "수익률곡선", "스프레드", "크레딧", "디폴트", "액면가", "채권수익률", "국채수익률", 
      "적립식", "거치식", "만기일", "중앙은행", "한국은행", "연준", "유럽중앙은행", "일본은행", 
      "연방기금금리", "기준금리", "환매조건부매매", "RP", "통화스왑", "기관간콜", "SOFR", 
      "리보", "프라임레이트", "양적완화", "양적긴축", "테이퍼링", "재정정책", "통화정책", 
      "경기선행지수", "경기동행지수", "경기후행지수", "소비자물가지수", "생산자물가지수", 
      "기대인플레이션", "경상수지", "무역수지", "실업률", "GDP", "GNP", "ISM", "PMI", 
      "비농업부문고용", "내구재주문", "소매판매", "소비자신뢰지수", "FOMC", "연설", "의사록"
    ],
    en: [
      "KOSPI", "KOSDAQ", "NASDAQ", "Dow Jones", "S&P500", "Nikkei", "Hang Seng", "futures", 
      "options", "derivatives", "forex", "exchange rate", "dollar", "euro", "yen", "yuan", 
      "won", "foreign currency", "risk", "volatility", "arbitrage", "swap", "forward", 
      "spread", "basis", "futures expiration", "options expiration", "call option", 
      "put option", "strike price", "in-the-money", "out-of-the-money", "at-the-money", 
      "premium", "delta", "gamma", "vega", "theta", "rho", "volatility index", "VIX", 
      "V-KOSPI", "spot", "index", "underlying asset", "correction", "rally", "pivot", 
      "resistance", "support", "moving average", "Bollinger Bands", "RSI", "MACD", 
      "stochastic", "counter-trend", "trend-following", "breakout", "sentiment", 
      "supply zone", "pullback", "gap up", "gap down", "window dressing", "ex-dividend", 
      "ex-rights", "treasury bond", "corporate bond", "interest rate", "maturity", 
      "yield curve", "spread", "credit", "default", "face value", "bond yield", 
      "treasury yield", "installment", "lump sum", "maturity date", "central bank", 
      "Bank of Korea", "Federal Reserve", "European Central Bank", "Bank of Japan", 
      "federal funds rate", "base rate", "repurchase agreement", "RP", "currency swap", 
      "interbank call", "SOFR", "LIBOR", "prime rate", "quantitative easing", "QE", 
      "quantitative tightening", "QT", "tapering", "fiscal policy", "monetary policy", 
      "leading indicator", "coincident indicator", "lagging indicator", "CPI", "PPI", 
      "inflation expectations", "current account", "trade balance", "unemployment rate", 
      "GDP", "GNP", "ISM", "PMI", "nonfarm payrolls", "durable goods orders", 
      "retail sales", "consumer confidence index", "FOMC", "speech", "minutes"
    ],
    ja: [
      "KOSPI", "KOSDAQ", "NASDAQ", "ダウ平均", "S&P500", "日経平均", "ハンセン指数", "先物", 
      "オプション", "デリバティブ", "外国為替", "為替レート", "ドル", "ユーロ", "円", "元", 
      "ウォン", "外貨", "リスク", "ボラティリティ", "裁定取引", "スワップ", "先渡し", 
      "スプレッド", "ベーシス", "先物満期", "オプション満期", "コールオプション", 
      "プットオプション", "行使価格", "イン・ザ・マネー", "アウト・オブ・ザ・マネー", "アット・ザ・マネー", 
      "プレミアム", "デルタ", "ガンマ", "ベガ", "シータ", "ロー", "ボラティリティ指数", "VIX", 
      "V-KOSPI", "現物", "指数", "原資産", "調整", "ラリー", "ピボット", 
      "レジスタンス", "サポート", "移動平均線", "ボリンジャーバンド", "RSI", "MACD", 
      "ストキャスティクス", "逆トレンド", "トレンドフォロー", "ブレイクアウト", "センチメント", 
      "供給ゾーン", "プルバック", "ギャップアップ", "ギャップダウン", "ウィンドウドレッシング", "配当落ち", 
      "権利落ち", "国債", "社債", "金利", "満期", 
      "イールドカーブ", "スプレッド", "クレジット", "デフォルト", "額面価格", "債券利回り", 
      "国債利回り", "積立", "一括", "満期日", "中央銀行", 
      "韓国銀行", "連邦準備制度", "欧州中央銀行", "日本銀行", 
      "フェデラルファンド金利", "基準金利", "買戻条件付き契約", "RP", "通貨スワップ", 
      "インターバンクコール", "SOFR", "LIBOR", "プライムレート", "量的緩和", "QE", 
      "量的引き締め", "QT", "テーパリング", "財政政策", "金融政策", 
      "先行指標", "一致指標", "遅行指標", "CPI", "PPI", 
      "インフレ期待", "経常収支", "貿易収支", "失業率", 
      "GDP", "GNP", "ISM", "PMI", "非農業部門雇用", "耐久財受注", 
      "小売売上高", "消費者信頼感指数", "FOMC", "講演", "議事録"
    ]
  },
  
  // 기관 및 정책 관련 용어
  institutions: {
    ko: [
      "한국은행", "연준", "Fed", "중앙은행", "금융위", "금감원", "재정", "예산", "국고", 
      "기업공개", "IPO", "공모", "상장", "보험", "증권사", "자산운용사", "투자은행", "IB", 
      "벤처캐피탈", "VC", "연기금", "국민연금", "공적연금", "퇴직연금", "개인연금", "가계부채", 
      "국가부채", "기축통화", "준비통화", "외환보유고", "외환시장", "외환정책", "환율정책", 
      "금리정책", "물가안정목표제", "통화정책", "재할인율", "스왑라인", "통화스왑", "금융안정", 
      "시스템리스크", "규제", "자본적정성", "BIS", "바젤", "지급결제", "결제시스템", "규제샌드박스", 
      "금융혁신", "핀테크", "금융위기", "구제금융", "금융시장안정", "스트레스테스트", "금융감독", 
      "금융규제", "자본규제", "건전성규제", "시장규제", "증권거래위원회", "SEC", "선물거래위원회", 
      "CFTC", "금융소비자보호", "투자자보호", "예금보험", "예금보험공사", "디지털화폐", "CBDC", 
      "스테이블코인", "가상자산", "금융실명제", "금융정보분석원", "자금세탁방지", "금융제재"
    ],
    en: [
      "Bank of Korea", "Federal Reserve", "Fed", "central bank", "Financial Services Commission", 
      "Financial Supervisory Service", "fiscal", "budget", "treasury", "initial public offering", 
      "IPO", "public offering", "listing", "insurance", "securities company", "asset management", 
      "investment bank", "IB", "venture capital", "VC", "pension fund", "National Pension Service", 
      "public pension", "retirement pension", "individual pension", "household debt", 
      "national debt", "key currency", "reserve currency", "foreign exchange reserves", 
      "forex market", "foreign exchange policy", "exchange rate policy", "interest rate policy", 
      "inflation targeting", "monetary policy", "rediscount rate", "swap line", "currency swap", 
      "financial stability", "systemic risk", "regulation", "capital adequacy", "BIS", "Basel", 
      "payment and settlement", "settlement system", "regulatory sandbox", "financial innovation", 
      "fintech", "financial crisis", "bailout", "financial market stability", "stress test", 
      "financial supervision", "financial regulation", "capital regulation", "prudential regulation", 
      "market regulation", "Securities and Exchange Commission", "SEC", "Commodity Futures Trading Commission", 
      "CFTC", "financial consumer protection", "investor protection", "deposit insurance", 
      "FDIC", "digital currency", "CBDC", "stablecoin", "virtual asset", "real-name financial system", 
      "Financial Intelligence Unit", "anti-money laundering", "financial sanctions"
    ],
    ja: [
      "韓国銀行", "連邦準備制度", "Fed", "中央銀行", "金融委員会", "金融監督院", "財政", "予算", "国庫", 
      "企業公開", "IPO", "公募", "上場", "保険", "証券会社", "資産運用会社", "投資銀行", "IB", 
      "ベンチャーキャピタル", "VC", "年金基金", "国民年金", "公的年金", "退職年金", "個人年金", "家計負債", 
      "国家債務", "基軸通貨", "準備通貨", "外貨準備高", "外国為替市場", "為替政策", "為替レート政策", 
      "金利政策", "インフレターゲティング", "金融政策", "再割引率", "スワップライン", "通貨スワップ", "金融安定", 
      "システミックリスク", "規制", "自己資本比率", "BIS", "バーゼル", "決済", "決済システム", "規制サンドボックス", 
      "金融イノベーション", "フィンテック", "金融危機", "救済金融", "金融市場安定", "ストレステスト", "金融監督", 
      "金融規制", "資本規制", "健全性規制", "市場規制", "証券取引委員会", "SEC", "商品先物取引委員会", 
      "CFTC", "金融消費者保護", "投資家保護", "預金保険", "預金保険公社", "デジタル通貨", "CBDC", 
      "ステーブルコイン", "仮想資産", "金融実名制", "金融情報分析院", "マネーロンダリング防止", "金融制裁"
    ]
  },
  
  // 암호화폐 관련 용어
  crypto: {
    ko: [
      "비트코인", "이더리움", "리플", "코인", "암호화폐", "블록체인", "NFT", "디파이", "DeFi", 
      "스테이블코인", "마이닝", "채굴", "지갑", "거래소", "탈중앙화", "토큰", "ICO", "IEO", 
      "스마트계약", "스마트컨트랙트", "이더", "가스", "가스비", "알트코인", "메인넷", "테스트넷", 
      "노드", "검증자", "합의", "작업증명", "지분증명", "PoW", "PoS", "샤딩", "레이어2", "롤업", 
      "사이드체인", "크로스체인", "오라클", "해시", "서명", "개인키", "공개키", "니모닉", "시드", 
      "콜드월렛", "핫월렛", "하드웨어월렛", "메타마스크", "익스플로러", "트랜잭션", "블록", "호들", 
      "HODL", "FUD", "FOMO", "ATH", "덤프", "펌프", "래빗홀", "고래", "럼블", "바이낸스", 
      "코인베이스", "업비트", "빗썸", "코인원", "메타버스", "DAO", "토큰이코노미", "유틸리티토큰", 
      "시큐리티토큰", "에어드랍", "스테이킹", "파밍", "리퀴디티", "유동성풀", "스왑", "AMM", 
      "수수료", "가스비", "트레이딩뷰", "해시레이트", "난이도", "하드포크", "소프트포크", "프라이빗키", 
      "시드프레이즈", "컨펌", "확인", "비잔틴", "이더스캔", "다오", "가상자산", "CBDC"
    ],
    en: [
      "Bitcoin", "Ethereum", "Ripple", "coin", "cryptocurrency", "blockchain", "NFT", "DeFi", 
      "stablecoin", "mining", "wallet", "exchange", "decentralization", "token", "ICO", "IEO", 
      "smart contract", "Ether", "gas", "gas fee", "altcoin", "mainnet", "testnet", 
      "node", "validator", "consensus", "proof of work", "proof of stake", "PoW", "PoS", 
      "sharding", "layer 2", "rollup", "sidechain", "cross-chain", "oracle", "hash", 
      "signature", "private key", "public key", "mnemonic", "seed", "cold wallet", 
      "hot wallet", "hardware wallet", "MetaMask", "explorer", "transaction", "block", 
      "hodl", "HODL", "FUD", "FOMO", "ATH", "dump", "pump", "rabbit hole", "whale", 
      "rumble", "Binance", "Coinbase", "Upbit", "Bithumb", "Coinone", "metaverse", 
      "DAO", "token economics", "utility token", "security token", "airdrop", "staking", 
      "farming", "liquidity", "liquidity pool", "swap", "AMM", "fee", "gas fee", 
      "TradingView", "hash rate", "difficulty", "hard fork", "soft fork", "private key", 
      "seed phrase", "confirmation", "Byzantine", "Etherscan", "virtual asset", "CBDC"
    ],
    ja: [
      "ビットコイン", "イーサリアム", "リップル", "コイン", "暗号資産", "ブロックチェーン", "NFT", "DeFi", 
      "ステーブルコイン", "マイニング", "採掘", "ウォレット", "取引所", "分散化", "トークン", "ICO", "IEO", 
      "スマートコントラクト", "イーサ", "ガス", "ガス代", "アルトコイン", "メインネット", "テストネット", 
      "ノード", "バリデーター", "コンセンサス", "プルーフオブワーク", "プルーフオブステーク", "PoW", "PoS", 
      "シャーディング", "レイヤー2", "ロールアップ", "サイドチェーン", "クロスチェーン", "オラクル", "ハッシュ", 
      "署名", "秘密鍵", "公開鍵", "ニーモニック", "シード", "コールドウォレット", 
      "ホットウォレット", "ハードウェアウォレット", "メタマスク", "エクスプローラー", "トランザクション", "ブロック", 
      "ホドル", "HODL", "FUD", "FOMO", "ATH", "ダンプ", "ポンプ", "ラビットホール", "クジラ", 
      "ランブル", "バイナンス", "コインベース", "アップビット", "ビッサム", "コインワン", "メタバース", 
      "DAO", "トークンエコノミー", "ユーティリティトークン", "セキュリティトークン", "エアドロップ", "ステーキング", 
      "ファーミング", "リクイディティ", "流動性プール", "スワップ", "AMM", 
      "手数料", "ガス代", "トレーディングビュー", "ハッシュレート", "難易度", "ハードフォーク", "ソフトフォーク", "秘密鍵", 
      "シードフレーズ", "コンファメーション", "ビザンチン", "イーサスキャン", "仮想資産", "CBDC"
    ]
  },
  
  // 기업 및 산업 관련 용어
  companies: {
    ko: [
      "삼성전자", "현대차", "SK하이닉스", "LG", "카카오", "네이버", "애플", "구글", "마이크로소프트", 
      "아마존", "테슬라", "엔비디아", "알리바바", "소프트뱅크", "배당금", "실적", "매출", "영업이익", 
      "순이익", "적자", "흑자", "분기", "시총", "경영진", "이사회", "주주", "주주총회", "배당성향", 
      "자사주", "자사주매입", "지배구조", "리밸런싱", "분할", "인적분할", "물적분할", "합병", "인수", 
      "대기업", "중소기업", "스타트업", "유니콘", "중견기업", "기업집단", "오너", "총수", "경영권", 
      "지주회사", "계열사", "자회사", "손자회사", "특수관계인", "임원", "사내이사", "사외이사", "CEO", 
      "CFO", "CTO", "COO", "매출원가", "판관비", "연구개발비", "감가상각", "영업이익률", "순이익률", 
      "영업활동현금흐름", "투자활동현금흐름", "재무활동현금흐름", "잉여현금흐름", "FCF", "기업가치", 
      "EV", "EBITDA", "영업권", "무형자산", "투자자산", "유형자산", "자산", "부채", "자본", "매출액", 
      "당좌비율", "유동비율", "부채비율", "이자보상배율", "총자산이익률", "자기자본이익률", "ROA", "ROE"
    ],
    en: [
      "Samsung Electronics", "Hyundai Motor", "SK Hynix", "LG", "Kakao", "NAVER", "Apple", 
      "Google", "Microsoft", "Amazon", "Tesla", "NVIDIA", "Alibaba", "SoftBank", "dividend", 
      "earnings", "revenue", "operating profit", "net profit", "deficit", "surplus", 
      "quarter", "market cap", "management", "board of directors", "shareholder", 
      "shareholders meeting", "dividend payout ratio", "treasury stock", "share buyback", 
      "governance", "rebalancing", "spin-off", "split-off", "merger", "acquisition", 
      "conglomerate", "SME", "startup", "unicorn", "mid-sized company", "business group", 
      "owner", "chairman", "management rights", "holding company", "affiliate", "subsidiary", 
      "second-tier subsidiary", "related party", "executive", "inside director", "outside director", 
      "CEO", "CFO", "CTO", "COO", "cost of sales", "SG&A", "R&D expense", "depreciation", 
      "operating margin", "net margin", "operating cash flow", "investing cash flow", 
      "financing cash flow", "free cash flow", "FCF", "enterprise value", "EV", "EBITDA", 
      "goodwill", "intangible asset", "investment asset", "tangible asset", "asset", 
      "liability", "equity", "sales", "acid ratio", "current ratio", "debt ratio", 
      "interest coverage ratio", "return on assets", "return on equity", "ROA", "ROE"
    ],
    ja: [
      "サムスン電子", "現代自動車", "SKハイニックス", "LG", "カカオ", "NAVER", "アップル", 
      "グーグル", "マイクロソフト", "アマゾン", "テスラ", "エヌビディア", "アリババ", "ソフトバンク", "配当金", 
      "業績", "売上高", "営業利益", "純利益", "赤字", "黒字", "四半期", "時価総額", "経営陣", 
      "取締役会", "株主", "株主総会", "配当性向", "自社株", "自社株買い", "ガバナンス", 
      "リバランス", "分割", "人的分割", "物的分割", "合併", "買収", 
      "大企業", "中小企業", "スタートアップ", "ユニコーン", "中堅企業", "企業集団", "オーナー", "総帥", "経営権", 
      "持株会社", "系列会社", "子会社", "孫会社", "特殊関係人", "役員", "社内取締役", "社外取締役", 
      "CEO", "CFO", "CTO", "COO", "売上原価", "販管費", "研究開発費", "減価償却", 
      "営業利益率", "純利益率", "営業活動によるキャッシュフロー", "投資活動によるキャッシュフロー", 
      "財務活動によるキャッシュフロー", "フリーキャッシュフロー", "FCF", "企業価値", 
      "EV", "EBITDA", "営業権", "無形資産", "投資資産", "有形資産", "資産", 
      "負債", "資本", "売上高", "当座比率", "流動比率", "負債比率", 
      "インタレストカバレッジレシオ", "総資産利益率", "自己資本利益率", "ROA", "ROE"
    ]
  },
  
  // 경제 지표 관련 용어
  indicators: {
    ko: [
      "GDP", "GNP", "경제성장률", "실질GDP", "명목GDP", "불변가격", "기준년도", "경상가격", 
      "1인당GDP", "소비자물가지수", "CPI", "생산자물가지수", "PPI", "수출물가지수", "수입물가지수", 
      "근원물가", "인플레이션", "디플레이션", "스태그플레이션", "핵심물가", "소비자심리지수", "경기선행지수", 
      "경기동행지수", "경기후행지수", "산업생산지수", "설비투자지수", "실업률", "고용률", "경제활동참가율", 
      "비경제활동인구", "임금상승률", "가계소득", "가계지출", "경상수지", "무역수지", "무역흑자", "무역적자", 
      "수출", "수입", "서비스수지", "본원소득수지", "이전소득수지", "자본수지", "금융계정", "외환보유고", 
      "외화유동성", "국가채무", "GDP대비국가채무", "국채", "회사채", "신용스프레드", "기준금리", "콜금리", 
      "시장금리", "환율", "통화량", "광의통화", "협의통화", "M1", "M2", "Lf", "통화승수", "본원통화", 
      "가처분소득", "소비성향", "저축률", "가계부채", "기업부채", "소매판매", "도소매지수", "주택가격", 
      "전세가격", "월세가격", "주택보급률", "빈집률", "건설경기", "건설수주", "주택공급", "주택준공", 
      "분양률", "청약경쟁률", "소비자동향지수", "기업경기실사지수", "기업심리지수", "BSI", "설비가동률", 
      "제조업PMI", "서비스업PMI", "노동소득분배율", "지니계수", "소득불평등", "10분위분배율", "5분위분배율"
    ],
    en: [
      "GDP", "GNP", "economic growth rate", "real GDP", "nominal GDP", "constant price", 
      "base year", "current price", "GDP per capita", "consumer price index", "CPI", 
      "producer price index", "PPI", "export price index", "import price index", 
      "core inflation", "inflation", "deflation", "stagflation", "core price", 
      "consumer confidence index", "leading economic indicator", "coincident economic indicator", 
      "lagging economic indicator", "industrial production index", "facility investment index", 
      "unemployment rate", "employment rate", "labor force participation rate", 
      "economically inactive population", "wage growth rate", "household income", 
      "household expenditure", "current account", "trade balance", "trade surplus", 
      "trade deficit", "export", "import", "service account", "primary income account", 
      "secondary income account", "capital account", "financial account", "foreign exchange reserves", 
      "foreign currency liquidity", "national debt", "debt-to-GDP ratio", "treasury bond", 
      "corporate bond", "credit spread", "base rate", "call rate", "market interest rate", 
      "exchange rate", "money supply", "broad money", "narrow money", "M1", "M2", "Lf", 
      "money multiplier", "monetary base", "disposable income", "propensity to consume", 
      "savings rate", "household debt", "corporate debt", "retail sales", "wholesale and retail index", 
      "housing price", "jeonse price", "monthly rent price", "housing supply ratio", 
      "vacancy rate", "construction business cycle", "construction orders", "housing supply", 
      "housing completion", "subscription rate", "subscription competition ratio", 
      "consumer trend index", "business survey index", "business sentiment index", "BSI", 
      "facility utilization rate", "manufacturing PMI", "services PMI", "labor income share", 
      "Gini coefficient", "income inequality", "decile distribution ratio", "quintile distribution ratio"
    ],
    ja: [
      "GDP", "GNP", "経済成長率", "実質GDP", "名目GDP", "不変価格", "基準年度", "経常価格", 
      "1人当たりGDP", "消費者物価指数", "CPI", "生産者物価指数", "PPI", "輸出物価指数", "輸入物価指数", 
      "コアインフレ", "インフレーション", "デフレーション", "スタグフレーション", "コア物価", 
      "消費者心理指数", "景気先行指数", "景気一致指数", "景気遅行指数", "鉱工業生産指数", "設備投資指数", 
      "失業率", "雇用率", "労働参加率", "非経済活動人口", "賃金上昇率", "家計所得", 
      "家計支出", "経常収支", "貿易収支", "貿易黒字", "貿易赤字", "輸出", "輸入", "サービス収支", 
      "第一次所得収支", "第二次所得収支", "資本収支", "金融勘定", "外貨準備高", 
      "外貨流動性", "国家債務", "対GDP国家債務", "国債", "社債", "クレジットスプレッド", "基準金利", 
      "コールレート", "市場金利", "為替レート", "マネーサプライ", "広義マネー", "狭義マネー", "M1", "M2", "Lf", 
      "貨幣乗数", "マネタリーベース", "可処分所得", "消費性向", "貯蓄率", "家計負債", "企業負債", 
      "小売売上高", "卸売・小売指数", "住宅価格", "チョンセ価格", "月極家賃", "住宅普及率", 
      "空き家率", "建設景気", "建設受注", "住宅供給", "住宅竣工", 
      "分譲率", "申込競争率", "消費者動向指数", "企業景気実査指数", "企業心理指数", "BSI", 
      "設備稼働率", "製造業PMI", "サービス業PMI", "労働分配率", 
      "ジニ係数", "所得不平等", "10分位分配率", "5分位分配率"
    ]
  }
};

/**
 * TF-IDF 가중치 매트릭스
 * 용어별 중요도를 설정하여 정확한 관련성 점수 계산
 */
const TERM_WEIGHTS = {
  // 일반 금융 용어 (가중치: 1.0)
  general: 1.0,
  
  // 금융 시장 용어 (가중치: 1.2)
  markets: 1.2,
  
  // 기관 및 정책 관련 용어 (가중치: 1.3)
  institutions: 1.3,
  
  // 암호화폐 관련 용어 (가중치: 1.1)
  crypto: 1.1,
  
  // 기업 및 산업 관련 용어 (가중치: 0.9)
  companies: 0.9,
  
  // 경제 지표 관련 용어 (가중치: 1.4)
  indicators: 1.4
};

/**
 * 금융 관련성 분석기 클래스
 * 텍스트의 금융 관련성을 분석하고 점수를 산출
 */
class FinancialRelevanceAnalyzer {
  constructor() {
    this.financialTerms = FINANCIAL_TERMS;
    this.termWeights = TERM_WEIGHTS;
    
    // 결과 캐싱
    this.cache = new Map();
    this.maxCacheSize = 100;
    
    // 컨텍스트 기반 분석 설정
    this.contextSettings = {
      windowSize: 5, // 단어 주변 문맥 크기
      boostFactor: 1.5 // 문맥 관련성 가중치
    };
  }
  
  /**
   * 텍스트의 금융 관련성 분석
   * @param {string} text - 분석할 텍스트
   * @param {string} language - 언어 코드 (ko, en, ja)
   * @param {Object} options - 분석 옵션
   * @returns {Object} 분석 결과
   */
  analyze(text, language = 'ko', options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
      useCache: true,
      minScore: 0,
      maxScore: 1,
      includeKeywords: true,
      includeDetails: false,
      contextAnalysis: true
    };
    
    const analyzeOptions = { ...defaultOptions, ...options };
    
    // 입력 검증
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        relevance: 'none',
        keywords: []
      };
    }
    
    // 캐시 확인 (성능 최적화)
    const cacheKey = `${text.substring(0, 100)}_${language}`;
    if (analyzeOptions.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 언어 감지 또는 확인
    const detectedLanguage = this.detectTextLanguage(text, language);
    
    // 텍스트 정규화
    const normalizedText = this.normalizeText(text);
    
    // 단어 분할
    const words = this.tokenizeText(normalizedText, detectedLanguage);
    const wordCount = words.length;
    
    // 너무 짧은 텍스트는 분석하지 않음
    if (wordCount < 5) {
      const result = {
        score: 0,
        relevance: 'none',
        keywords: []
      };
      
      if (analyzeOptions.useCache) {
        this.addToCache(cacheKey, result);
      }
      
      return result;
    }
    
    // 키워드 빈도 분석
    const keywordAnalysis = this.analyzeKeywordFrequency(
      words, 
      detectedLanguage, 
      analyzeOptions.contextAnalysis
    );
    
    // 관련성 점수 계산
    const relevanceScore = this.calculateRelevanceScore(keywordAnalysis, wordCount);
    
    // 점수 정규화 (옵션 범위 내로)
    const finalScore = this.normalizeScore(
      relevanceScore, 
      analyzeOptions.minScore, 
      analyzeOptions.maxScore
    );
    
    // 관련성 레이블 결정
    const relevanceLabel = this.getRelevanceLabel(finalScore);
    
    // 결과 구성
    const result = {
      score: finalScore,
      relevance: relevanceLabel,
      language: detectedLanguage
    };
    
    // 키워드 포함 옵션
    if (analyzeOptions.includeKeywords) {
      result.keywords = keywordAnalysis.topKeywords;
    }
    
    // 상세 분석 포함 옵션
    if (analyzeOptions.includeDetails) {
      result.details = {
        wordCount,
        categoryScores: keywordAnalysis.categoryScores,
        keywordDensity: keywordAnalysis.keywordCount / wordCount,
        contextRelevance: keywordAnalysis.contextRelevance,
        rawScore: relevanceScore
      };
    }
    
    // 결과 캐싱
    if (analyzeOptions.useCache) {
      this.addToCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * 텍스트 언어 감지
   * @param {string} text - 감지할 텍스트
   * @param {string} defaultLanguage - 기본 언어
   * @returns {string} 감지된 언어 코드
   */
  detectTextLanguage(text, defaultLanguage) {
    // 언어가 지정되었으면 그대로 사용
    if (['ko', 'en', 'ja'].includes(defaultLanguage)) {
      return defaultLanguage;
    }
    
    // 샘플 텍스트 (최대 200자)
    const sample = text.substring(0, 200);
    
    // 한국어 (한글) 감지 - 수정된 정규식
    if (/[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/.test(sample)) {
      return 'ko';
    }
    
    // 일본어 (히라가나, 가타카나, 한자) 감지 - 수정된 정규식
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sample)) {
      return 'ja';
    }
    
    // 기본값은 영어
    return 'en';
  }
  
  /**
   * 텍스트 정규화
   * @param {string} text - 정규화할 텍스트
   * @returns {string} 정규화된 텍스트
   */
  normalizeText(text) {
    if (!text) return '';
    
    // 소문자 변환
    let normalized = text.toLowerCase();
    
    // HTML 태그 제거
    normalized = normalized.replace(/<[^>]*>/g, ' ');
    
    // 특수 문자 및 숫자 처리
    normalized = normalized.replace(/[^ w s가-힣ぁ-んァ-ン一-龯]+/g, ' ');
    
    // 여러 공백을 하나로 치환
    normalized = normalized.replace(/ s+/g, ' ');
    
    return normalized.trim();
  }
  
  /**
   * 텍스트 토큰화 (단어 분할)
   * @param {string} text - 토큰화할 텍스트
   * @param {string} language - 언어 코드
   * @returns {string[]} 단어 배열
   */
  tokenizeText(text, language) {
    if (!text) return [];
    
    // 영어: 공백 기준 분할
    if (language === 'en') {
      return text.split(/ s+/).filter(word => word.length > 1);
    }
    
    // 한국어: 2-3글자 이상 단어 추출 (단순 구현)
    if (language === 'ko') {
      // 공백으로 분할하되, 한글 2글자 이상만 유지
      const words = text.split(/ s+/).filter(word => word.length >= 2);
      
      // 키워드 추출을 위한 n-gram 추가 (2-3글자 조합)
      const ngrams = [];
      for (let i = 0; i < text.length - 1; i++) {
        // 2-gram
        if (i < text.length - 1) {
          ngrams.push(text.substring(i, i + 2));
        }
        
        // 3-gram
        if (i < text.length - 2) {
          ngrams.push(text.substring(i, i + 3));
        }
      }
      
      return [...words, ...ngrams];
    }
    
    // 일본어: 공백과 조사 기준 분할 (단순 구현)
    if (language === 'ja') {
      // 공백으로 분할
      const words = text.split(/ s+/).filter(word => word.length >= 2);
      
      // n-gram 추가 (일본어는 단어 경계가 명확하지 않음)
      const ngrams = [];
      for (let i = 0; i < text.length - 1; i++) {
        // 2-gram
        if (i < text.length - 1) {
          ngrams.push(text.substring(i, i + 2));
        }
        
        // 3-gram
        if (i < text.length - 2) {
          ngrams.push(text.substring(i, i + 3));
        }
      }
      
      return [...words, ...ngrams];
    }
    
    // 기본 분할 (공백 기준)
    return text.split(/ s+/).filter(word => word.length > 1);
  }
  
  /**
   * 키워드 빈도 분석
   * @param {string[]} words - 단어 배열
   * @param {string} language - 언어 코드
   * @param {boolean} useContext - 컨텍스트 분석 사용 여부
   * @returns {Object} 키워드 분석 결과
   */
  analyzeKeywordFrequency(words, language, useContext) {
    // 각 카테고리별 키워드 일치 횟수
    const categoryCounts = {};
    const keywordCounts = {};
    let totalKeywordCount = 0;
    
    // 컨텍스트 관련성 점수
    let contextRelevance = 0;
    
    // 각 카테고리별 금융 용어 확인
    for (const category in this.financialTerms) {
      // 언어별 용어 목록
      const terms = this.financialTerms[category][language] || [];
      
      // 카테고리 점수 초기화
      categoryCounts[category] = 0;
      
      // 각 용어별 확인
      for (let i = 0; i < terms.length; i++) {
        const term = terms[i];
        let termCount = 0;
        
        // 단어 목록에서 용어 확인
        for (let j = 0; j < words.length; j++) {
          // 완전 일치
          const exactMatch = words[j] === term;
          
          // 부분 일치 (2글자 이상 용어만)
          const partialMatch = term.length >= 2 && 
            (words[j].includes(term) || term.includes(words[j]));
          
          if (exactMatch || partialMatch) {
            termCount++;
            
            // 컨텍스트 분석 (용어 주변 단어 확인)
            if (useContext) {
              const contextScore = this.analyzeTermContext(words, j, this.contextSettings.windowSize);
              contextRelevance += contextScore;
            }
          }
        }
        
        // 용어 빈도 저장
        if (termCount > 0) {
          keywordCounts[term] = termCount;
          categoryCounts[category] += termCount;
          totalKeywordCount += termCount;
        }
      }
    }
    
    // 상위 키워드 추출 (최대 20개)
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));
    
    // 카테고리별 점수 계산 (가중치 적용)
    const categoryScores = {};
    for (const category in categoryCounts) {
      const weight = this.termWeights[category] || 1.0;
      categoryScores[category] = categoryCounts[category] * weight;
    }
    
    return {
      keywordCount: totalKeywordCount,
      topKeywords,
      categoryCounts,
      categoryScores,
      contextRelevance
    };
  }
  
  /**
   * 용어 컨텍스트 분석
   * @param {string[]} words - 단어 배열
   * @param {number} position - 용어 위치
   * @param {number} windowSize - 컨텍스트 윈도우 크기
   * @returns {number} 컨텍스트 관련성 점수
   */
  analyzeTermContext(words, position, windowSize) {
    let contextScore = 0;
    const startIdx = Math.max(0, position - windowSize);
    const endIdx = Math.min(words.length - 1, position + windowSize);
    
    // 컨텍스트 내 다른 금융 용어 확인
    for (let i = startIdx; i <= endIdx; i++) {
      if (i !== position) { // 현재 용어 제외
        const word = words[i];
        
        // 컨텍스트 단어가 금융 용어인지 확인
        for (const category in this.financialTerms) {
          for (const lang in this.financialTerms[category]) {
            if (this.financialTerms[category][lang].includes(word)) {
              // 가까울수록 높은 점수
              const distance = Math.abs(i - position);
              const proximityScore = 1 - (distance / (windowSize + 1));
              contextScore += proximityScore;
              break;
            }
          }
        }
      }
    }
    
    return contextScore;
  }
  
  /**
   * 관련성 점수 계산
   * @param {Object} keywordAnalysis - 키워드 분석 결과
   * @param {number} wordCount - 총 단어 수
   * @returns {number} 관련성 점수 (0-1)
   */
  calculateRelevanceScore(keywordAnalysis, wordCount) {
    if (wordCount === 0) return 0;
    
    // 기본 점수 계산 (키워드 밀도)
    const densityScore = keywordAnalysis.keywordCount / wordCount;
    
    // 카테고리 가중치 반영
    let weightedCategoryScore = 0;
    let totalCategoryWeight = 0;
    
    for (const category in keywordAnalysis.categoryScores) {
      const categoryScore = keywordAnalysis.categoryScores[category];
      const weight = this.termWeights[category] || 1.0;
      
      weightedCategoryScore += categoryScore * weight;
      totalCategoryWeight += weight;
    }
    
    // 가중 평균 카테고리 점수
    const avgCategoryScore = totalCategoryWeight > 0 
      ? weightedCategoryScore / totalCategoryWeight 
      : 0;
    
    // 컨텍스트 분석 반영
    const contextScore = keywordAnalysis.contextRelevance > 0 
      ? Math.min(1, keywordAnalysis.contextRelevance * this.contextSettings.boostFactor / wordCount) 
      : 0;
    
    // 최종 점수 계산
    // - 밀도 점수: 50%
    // - 카테고리 점수: 30%
    // - 컨텍스트 점수: 20%
    const finalScore = (densityScore * 0.5) + 
                      (avgCategoryScore * 0.3 / wordCount) + 
                      (contextScore * 0.2);
    
    // 최종 점수 보정 (0-1 범위)
    return Math.min(1, Math.max(0, finalScore * 10));
  }
  
  /**
   * 점수 정규화
   * @param {number} score - 원본 점수
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @returns {number} 정규화된 점수
   */
  normalizeScore(score, min, max) {
    if (min === 0 && max === 1) {
      return score;
    }
    
    return min + (score * (max - min));
  }
  
  /**
   * 관련성 레이블 결정
   * @param {number} score - 관련성 점수
   * @returns {string} 관련성 레이블
   */
  getRelevanceLabel(score) {
    if (score >= 0.8) {
      return 'very_high';
    } else if (score >= 0.6) {
      return 'high';
    } else if (score >= 0.4) {
      return 'medium';
    } else if (score >= 0.2) {
      return 'low';
    } else {
      return 'very_low';
    }
  }
  
  /**
   * 결과 캐싱
   * @param {string} key - 캐시 키
   * @param {Object} result - 캐싱할 결과
   */
  addToCache(key, result) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      // 가장 오래된 항목 제거 (FIFO)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // 결과 복사본 저장 (참조 문제 방지)
    this.cache.set(key, JSON.parse(JSON.stringify(result)));
  }
  
  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * 사용자 정의 용어 추가
   * @param {string} category - 카테고리
   * @param {string} language - 언어 코드
   * @param {string[]} terms - 추가할 용어 목록
   * @returns {boolean} 성공 여부
   */
  addCustomTerms(category, language, terms) {
    if (!this.financialTerms[category]) {
      this.financialTerms[category] = {};
    }
    
    if (!this.financialTerms[category][language]) {
      this.financialTerms[category][language] = [];
    }
    
    // 중복 제거하며 용어 추가
    const existingTerms = new Set(this.financialTerms[category][language]);
    
    terms.forEach(term => {
      if (term && term.length > 0) {
        existingTerms.add(term.toLowerCase());
      }
    });
    
    this.financialTerms[category][language] = Array.from(existingTerms);
    
    // 캐시 초기화 (용어 변경으로 인한 일관성 유지)
    this.clearCache();
    
    return true;
  }
  
  /**
   * 카테고리 가중치 설정
   * @param {string} category - 카테고리
   * @param {number} weight - 가중치
   * @returns {boolean} 성공 여부
   */
  setCategoryWeight(category, weight) {
    if (!this.financialTerms[category]) {
      return false;
    }
    
    // 유효한 가중치 범위 (0.1-5.0)
    if (typeof weight === 'number' && weight >= 0.1 && weight <= 5.0) {
      this.termWeights[category] = weight;
      
      // 캐시 초기화 (가중치 변경으로 인한 일관성 유지)
      this.clearCache();
      
      return true;
    }
    
    return false;
  }
}

// 모듈 내보내기
const financialRelevanceAnalyzer = new FinancialRelevanceAnalyzer();
export default financialRelevanceAnalyzer; 