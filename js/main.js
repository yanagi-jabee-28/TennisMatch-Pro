/**
 * メインアプリケーションファイル
 * 
 * このファイルは、テニス対戦表アプリケーションのメインエントリーポイントです。
 * アプリケーションの初期化と全体的な管理を行います。
 */

// アプリケーションクラス
class TennisMatchApp {
	constructor() {
		this.selectedTeam = null;
		this.matchResults = [];
		
		// チーム割り当てを初期化（デフォルト割り当てを使用）
		if (CONFIG.DEFAULT_TEAM_ASSIGNMENTS) {
			// デフォルトのチーム割り当てを使用
			this.teamAssignments = JSON.parse(JSON.stringify(CONFIG.DEFAULT_TEAM_ASSIGNMENTS));
		} else {
			// 旧バージョン互換：空のチーム割り当てで初期化
			this.teamAssignments = {};
			CONFIG.TEAM_NAMES.forEach(team => {
				this.teamAssignments[team] = [];
			});
		}

		this.init();
	}

	// 初期化
	init() {
		this.loadSettingsFromCookie();
		this.setupEventListeners();
		this.setupMobileFeatures();
		this.initializeMatchPoint();
		this.renderTeamSelection();
		this.renderRounds();
		this.renderMatchHistory();
		this.updateStats();
		this.setupAutosave();
		this.setupPageUnloadHandler();
		
		// 設定パネルの追加
		this.renderSettingsPanel();
	}
	
	// Cookie から設定を読み込む
	loadSettingsFromCookie() {
		if (!checkCookieConsent()) {
			return; // Cookie使用に同意していない場合は何もしない
		}
		
		// ダークモード設定の復元
		const darkModeSetting = getCookie('darkMode');
		if (darkModeSetting === 'true') {
			document.body.classList.add('dark-mode');
			// ダークモードトグルボタンのテキストを更新
			const darkModeToggle = document.getElementById('darkModeToggle');
			if (darkModeToggle) {
				darkModeToggle.textContent = '☀️';
			}
		}
		
		// 保存された試合結果の復元
		const savedResults = getCookie('matchResults');
		if (savedResults) {
			try {
				this.matchResults = JSON.parse(savedResults);
				console.log('保存された試合結果を復元しました');
			} catch (e) {
				console.error('保存された試合結果の解析に失敗しました', e);
			}
		}
		
		// 保存されたチーム割り当ての復元
		const savedAssignments = getCookie('teamAssignments');
		if (savedAssignments) {
			try {
				this.teamAssignments = JSON.parse(savedAssignments);
				console.log('保存されたチーム割り当てを復元しました');
			} catch (e) {
				console.error('保存されたチーム割り当ての解析に失敗しました', e);
			}
		}
	}

	// イベントリスナーのセットアップ
	setupEventListeners() {
		// ダークモードトグル
		const darkModeToggle = document.getElementById('darkModeToggle');
		if (darkModeToggle) {
			darkModeToggle.addEventListener('click', () => {
				document.body.classList.toggle('dark-mode');
				const isDarkMode = document.body.classList.contains('dark-mode');
				
				// ボタンのテキストを更新
				darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
				
				if (checkCookieConsent()) {
					setCookie('darkMode', isDarkMode, 30); // 30日間の有効期限
				}
			});
		}
		
		// データ保存ボタン
		const saveDataBtn = document.getElementById('saveDataBtn');
		if (saveDataBtn) {
			saveDataBtn.addEventListener('click', () => {
				this.saveDataToFile();
			});
		}
		
		// データ読み込みボタン
		const loadDataBtn = document.getElementById('loadDataBtn');
		const loadDataInput = document.getElementById('loadDataInput');
		if (loadDataBtn && loadDataInput) {
			loadDataBtn.addEventListener('click', () => {
				loadDataInput.click();
			});
			
			loadDataInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file) {
					this.loadDataFromFile(file);
				}
			});
		}
		
		// エクスポートボタン
		const exportBtn = document.getElementById('exportBtn');
		if (exportBtn) {
			exportBtn.addEventListener('click', () => {
				this.exportResultsAsCSV();
			});
		}
		
		// ヘルプボタン
		const helpBtn = document.getElementById('helpBtn');
		if (helpBtn) {
			helpBtn.addEventListener('click', () => {
				this.showHelpModal();
			});
		}
		
		// タブ切り替え
		document.querySelectorAll('.tab-btn').forEach(button => {
			button.addEventListener('click', () => {
				const targetId = button.getAttribute('data-tab');
				
				// タブボタンのアクティブ状態を切り替え
				document.querySelectorAll('.tab-btn').forEach(btn => {
					btn.classList.remove('active');
				});
				button.classList.add('active');
				
				// タブコンテンツの表示を切り替え
				document.querySelectorAll('.tab-content').forEach(content => {
					content.classList.remove('active');
				});
				document.getElementById(targetId).classList.add('active');
			});
		});
		
		// 履歴検索
		const searchInput = document.getElementById('historySearch');
		if (searchInput) {
			searchInput.addEventListener('input', () => {
				this.filterMatchHistory(searchInput.value);
			});
		}
	}

	// モバイル向け機能のセットアップ
	setupMobileFeatures() {
		// タッチフィードバックを追加
		document.querySelectorAll('button, .team-card, .tab-btn').forEach(element => {
			element.classList.add('touch-feedback');
		});
		
		// スクロールヒントの表示（小画面の場合のみ）
		this.updateScrollHints();
		window.addEventListener('resize', () => {
			this.updateScrollHints();
		});
	}

	// スクロールヒントの更新
	updateScrollHints() {
		const scrollHints = document.querySelectorAll('.scroll-hint');
		const isMobile = window.innerWidth <= 768;
		
		scrollHints.forEach(hint => {
			hint.style.display = isMobile ? 'block' : 'none';
		});
	}

	// 自動保存の設定
	setupAutosave() {
		// 5分ごとに自動保存
		setInterval(() => {
			if (checkCookieConsent()) {
				setCookie('matchResults', JSON.stringify(this.matchResults), 30);
				setCookie('teamAssignments', JSON.stringify(this.teamAssignments), 30);
				console.log('データを自動保存しました');
				this.showNotification('データを自動保存しました', 'info', 2000);
			}
		}, 5 * 60 * 1000); // 5分 = 5 * 60 * 1000ミリ秒
	}

	// ページアンロード時の処理
	setupPageUnloadHandler() {
		window.addEventListener('beforeunload', (e) => {
			// Cookie に現在の状態を保存
			if (checkCookieConsent()) {
				setCookie('matchResults', JSON.stringify(this.matchResults), 30);
				setCookie('teamAssignments', JSON.stringify(this.teamAssignments), 30);
			}
		});
	}

	// マッチポイントの初期化
	initializeMatchPoint() {
		// マッチポイントセレクトの取得
		const matchPointSelect = document.getElementById('matchPointSetting');
		
		// イベントリスナーの設定
		matchPointSelect.addEventListener('change', () => {
			this.renderRounds(); // マッチポイント変更時にラウンド表示を更新
		});
	}

	// マッチポイントの取得
	getMatchPoint() {
		const matchPointSelect = document.getElementById('matchPointSetting');
		return parseInt(matchPointSelect.value);
	}

	// 設定パネルのレンダリング
	renderSettingsPanel() {
		// 必要に応じて実装
	}
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
	window.app = new TennisMatchApp();
});
