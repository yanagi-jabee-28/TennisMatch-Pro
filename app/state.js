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
	originalTeams: [],      // オリジナルのチーム構成を保存
	absentTeam: { id: 6, members: [] }  // 欠席チーム（6番目のチーム）
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
	if (currentEditTeamId !== null) {
		// 編集モーダルからの保存（0人のチームも保存可能）
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
	
	// 欠席チームをクリア
	appState.absentTeam.members = [];

	// ローカルストレージから現在のカスタム設定を削除
	try {
		localStorage.removeItem('tennisCustomTeams');
		localStorage.removeItem('tennisAbsentTeam');
		console.log('カスタムチーム設定と欠席チーム設定をローカルストレージから削除しました');
		return true;
	} catch (e) {
		console.error('ローカルストレージからの削除に失敗しました:', e);
		return false;
	}
}

// 欠席チームを保存する関数
function saveAbsentTeam() {
	saveToLocalStorage('tennisAbsentTeam', appState.absentTeam);
}

// 欠席チームを読み込む関数
function loadAbsentTeam() {
	const savedAbsentTeam = loadFromLocalStorage('tennisAbsentTeam');
	if (savedAbsentTeam) {
		appState.absentTeam = savedAbsentTeam;
	} else {
		appState.absentTeam = { id: 6, members: [] };
	}
}

// メンバーを欠席にする関数
function markMemberAsAbsent(memberName) {
	if (!appState.absentTeam.members.includes(memberName)) {
		appState.absentTeam.members.push(memberName);
		
		// 該当メンバーを全てのチームから削除
		appState.teams.forEach(team => {
			const memberIndex = team.members.indexOf(memberName);
			if (memberIndex !== -1) {
				team.members.splice(memberIndex, 1);
			}
		});
		
		saveAbsentTeam();
		saveTeamMembers(null, null); // チーム状態も保存
		return true;
	}
	return false;
}

// メンバーを欠席から復帰させる関数
function returnMemberFromAbsent(memberName) {
	const absentIndex = appState.absentTeam.members.indexOf(memberName);
	if (absentIndex !== -1) {
		appState.absentTeam.members.splice(absentIndex, 1);
		saveAbsentTeam();
		return true;
	}
	return false;
}

// 全メンバーを未割り当てにする関数
function clearAllTeams() {
	// オリジナルの全メンバーリストを取得
	const allOriginalMembers = [];
	appState.originalTeams.forEach(team => {
		allOriginalMembers.push(...team.members);
	});
	
	// 全てのチームから全メンバーを削除
	appState.teams.forEach(team => {
		team.members = [];
	});
	
	// 欠席チームからも全メンバーを削除
	appState.absentTeam.members = [];
	
	saveTeamMembers(null, null);
	saveAbsentTeam();
	return true;
}

export {
	appState,
	loadMatchResults,
	loadSettings,
	saveMatchResults,
	saveSettings,
	saveTeamMembers,
	loadTeamMembers,
	resetTeams,
	saveAbsentTeam,
	loadAbsentTeam,
	markMemberAsAbsent,
	returnMemberFromAbsent,
	clearAllTeams
};
