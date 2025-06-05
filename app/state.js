// アプリケーション状態の管理

import { saveToLocalStorage, loadFromLocalStorage } from './utils.js';

// アプリケーション状態の管理
const appState = {
	teams: [],
	matches: {},
	standings: [],
	settings: {
		matchPoint: 7       // マッチポイント（勝利と最大スコアを決定）
	},
	originalTeams: []      // オリジナルのチーム構成を保存
};

// ローカルストレージから試合結果を読み込む
function loadMatchResults() {
	appState.matches = loadFromLocalStorage('tennisMatchResults', {});
}

// ローカルストレージから設定を読み込む
function loadSettings() {
	const settings = loadFromLocalStorage('tennisGameSettings');
	if (settings) {
		appState.settings = { ...appState.settings, ...settings };
	}
}

// ローカルストレージに試合結果を保存する
function saveMatchResults() {
	saveToLocalStorage('tennisMatchResults', appState.matches);
}

// ローカルストレージに設定を保存する
function saveSettings() {
	saveToLocalStorage('tennisGameSettings', appState.settings);
}

// ローカルストレージにカスタムチームメンバーを保存
function saveTeamMembers(currentEditTeamId, tempTeamMembers) {
	if (currentEditTeamId !== null && tempTeamMembers.length > 0) {
		// 編集モーダルからの保存
		const teamIndex = appState.teams.findIndex(t => t.id === currentEditTeamId);
		if (teamIndex !== -1) {
			appState.teams[teamIndex].members = [...tempTeamMembers];
			saveToLocalStorage('tennisCustomTeams', appState.teams);
			return true;
		} else {
			return false;
		}
	} else if (currentEditTeamId === null) {
		// 通常の保存（全体保存）
		saveToLocalStorage('tennisCustomTeams', appState.teams);
		return true;
	}
	return false;
}

// ローカルストレージからカスタムチームメンバーを読み込む
function loadTeamMembers() {
	const savedTeams = loadFromLocalStorage('tennisCustomTeams');
	if (savedTeams) {
		appState.teams = savedTeams;
	} else {
		appState.teams = JSON.parse(JSON.stringify(appState.originalTeams));
	}
}

// オリジナルのチーム構成にリセットする機能
function resetTeams() {
	// オリジナルのチーム構成をコピー
	appState.teams = JSON.parse(JSON.stringify(appState.originalTeams));

	// ローカルストレージから現在のカスタム設定を削除
	try {
		localStorage.removeItem('tennisCustomTeams');
		console.log('カスタムチーム設定をローカルストレージから削除しました');
		return true;
	} catch (e) {
		console.error('ローカルストレージからの削除に失敗しました:', e);
		return false;
	}
}

export {
	appState,
	loadMatchResults,
	loadSettings,
	saveMatchResults,
	saveSettings,
	saveTeamMembers,
	loadTeamMembers,
	resetTeams
};
