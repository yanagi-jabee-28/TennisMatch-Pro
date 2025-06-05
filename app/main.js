// メインアプリケーションコード

import { loadConfigData } from './config.js';
import { domCache } from './dom.js';
import { appState, loadMatchResults, loadSettings, loadTeamMembers, resetTeams } from './state.js';
import { toast } from './components/toast.js';
import { customConfirm } from './components/customConfirm.js';
import { renderTeams, createMatchTable } from './matches.js';
import { calculateStandings, initializeSettingsForm } from './standings.js';
import { exportMatchAnalysis } from './export.js';
import { initializeTeamEditListeners } from './components/teamEditor.js';
import { initializeScoreModalListeners } from './components/scoreModal.js';
import { initializeDebugListeners } from './debug.js';
import { 
	initMobileEnhancements, 
	addSwipeGestures, 
	handleOrientationChange, 
	optimizePerformance 
} from './components/mobileEnhancements.js';
import { 
	addHapticFeedback, 
	addPWAFeatures, 
	handlePowerSavingMode, 
	monitorNetworkStatus, 
	enhanceSmartphoneExperience 
} from './components/advancedMobile.js';
import { DarkModeManager } from './components/themeManager.js';

// 設定ファイルを読み込んでアプリケーションを初期化
async function initializeApp() {
	const config = await loadConfigData();
	if (!config) {
		toast.error('設定ファイルの読み込みに失敗しました。Chrome、Firefox、Edge、Safariなどの最新ブラウザをご使用ください。また、ページの再読み込みをお試しください。');
		return;
	}

	// オリジナルのチーム構成を保存（リセット用）
	appState.originalTeams = JSON.parse(JSON.stringify(config.teams));

	// 初期データとして設定
	appState.teams = JSON.parse(JSON.stringify(config.teams));

	// 設定ファイルから初期設定を読み込み
	if (config.matchSettings) {
		appState.settings.matchPoint = config.matchSettings.matchPoint || 7;
	}
	
	// 保存された設定と試合結果を読み込む
	loadSettings();
	loadMatchResults();
	loadTeamMembers(); // カスタムチームメンバーがあれば読み込む

	// DOM要素キャッシュを初期化
	domCache.init();
	
	// UI初期化
	renderTeams();
	createMatchTable();
	initializeSettingsForm(toast);
	calculateStandings();

	// エクスポートボタンのイベントリスナーを追加
	document.getElementById('export-results-btn').addEventListener('click', exportMatchAnalysis);
	
	// チームメンバー編集用のモーダルのイベントリスナー設定
	initializeTeamEditListeners(renderTeams);
		// スコアモーダルのイベントリスナー設定
	initializeScoreModalListeners(createMatchTable, calculateStandings);
	
	// デバッグ機能のイベントリスナー設定
	initializeDebugListeners(createMatchTable, calculateStandings);
	
	// カスタム確認ダイアログを初期化
	customConfirm.init();

	// リセットボタンのイベントリスナーを追加
	const resetButton = document.getElementById('reset-teams-btn');
	if (resetButton) {
		resetButton.addEventListener('click', async () => {
			const confirmed = await customConfirm.show('すべてのチームをオリジナルの構成にリセットしますか？この操作は元に戻せません。', 'リセット確認');
			
			if (confirmed) {
				if (resetTeams()) {
					// UI更新
					renderTeams();
					toast.success('すべてのチームをオリジナルの構成にリセットしました');
				}
			}
		});
	}

	// モバイル機能拡張の初期化
	initMobileEnhancements();
	addSwipeGestures();
	handleOrientationChange();
	optimizePerformance();

	// 高度なモバイル機能の初期化
	addHapticFeedback();
	addPWAFeatures();
	handlePowerSavingMode();
	monitorNetworkStatus();
	enhanceSmartphoneExperience();

	// ビューポート高さの動的計算（iOS Safari対応）
	const setVhProperty = () => {
		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	};
	
	setVhProperty();
	window.addEventListener('resize', setVhProperty);
	window.addEventListener('orientationchange', () => {
		setTimeout(setVhProperty, 100);
	});
}

// DOMが読み込まれた後にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initializeApp);

// 外部公開インターフェース
export {
	initializeApp
};