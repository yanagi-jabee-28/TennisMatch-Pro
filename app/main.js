// メインアプリケーションコード

import { loadConfigData } from './config.js';
import { domCache } from './dom.js';
import { appState, loadMatchResults, loadSettings, loadTeamMembers, loadAbsentTeam, loadTeamParticipation, resetTeams, clearAllTeams } from './state.js';
import { toast } from './components/toast.js';
import { customConfirm } from './components/customConfirm.js';
import { renderTeams, createMatchTable } from './matches.js';
import { calculateStandings, initializeSettingsForm } from './standings.js';
import { exportMatchAnalysis } from './export.js';
import { initializeTeamEditListeners } from './components/teamEditor.js';
import { initializeScoreModalListeners } from './components/scoreModal.js';
import { initializeDebugListeners } from './debug.js';
import { EventListenerManager } from './utils.js';

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
	}	// 保存された設定と試合結果を読み込む
	loadSettings();
	loadMatchResults();
	loadTeamMembers(); // カスタムチームメンバーがあれば読み込む
	loadAbsentTeam(); // 欠席チームがあれば読み込む
	loadTeamParticipation(); // チーム参加状態を読み込む

	// DOM要素キャッシュを初期化
	domCache.init();
		// UI初期化
	renderTeams();
	createMatchTable();
	initializeSettingsForm(toast);
	calculateStandings();

	// メインボタンのイベントリスナー設定
	const mainButtonHandlers = {
		'export-results-btn': exportMatchAnalysis,
		'reset-teams-btn': async () => {
			const confirmed = await customConfirm.show('すべてのチームをオリジナルの構成にリセットしますか？この操作は元に戻せません。', 'リセット確認');
			
			if (confirmed) {
				if (resetTeams()) {
					renderTeams();
					toast.success('すべてのチームをオリジナルの構成にリセットしました');
				}
			}
		},
		'clear-all-teams-btn': async () => {
			const confirmed = await customConfirm.show('すべてのメンバーを未割り当て状態にしますか？欠席メンバーも含めて全員が未割り当てになります。', '全クリア確認');
			
			if (confirmed) {
				if (clearAllTeams()) {
					renderTeams();
					toast.success('すべてのメンバーを未割り当て状態にしました');
				}
			}
		}
	};
	
	Object.entries(mainButtonHandlers).forEach(([id, handler]) => {
		const button = document.getElementById(id);
		if (button) {
			EventListenerManager.safeAddEventListener(button, 'click', handler);
		}
	});
	
	// チームメンバー編集用のモーダルのイベントリスナー設定
	initializeTeamEditListeners(renderTeams);
	// スコアモーダルのイベントリスナー設定
	initializeScoreModalListeners(createMatchTable, calculateStandings);
	
	// デバッグ機能のイベントリスナー設定
	initializeDebugListeners(createMatchTable, calculateStandings);
	
	// カスタム確認ダイアログを初期化
	customConfirm.init();
}

// DOMが読み込まれた後にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initializeApp);

// 外部公開インターフェース
export {
	initializeApp
};