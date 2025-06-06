// アプリケーション状態の管理

import { saveToLocalStorage, loadFromLocalStorage, removeMultipleFromLocalStorage } from './utils.js';

// アプリケーション状態の管理
const appState = {
	teams: [],
	matches: {},
	standings: [],
	settings: {
		matchPoint: 7       // マッチポイント（勝利と最大スコアを決定）
	},
	originalTeams: [],      // オリジナルのチーム構成を保存
	absentTeam: { id: 6, members: [] },  // 欠席チーム（6番目のチーム）
	teamParticipation: {}   // チームの参加状態管理 { teamId: { active: boolean } }
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
	const keysToRemove = ['tennisCustomTeams', 'tennisAbsentTeam'];
	const results = removeMultipleFromLocalStorage(keysToRemove);
	
	// 全て成功したかチェック
	const allSuccess = Object.values(results).every(success => success);
	return allSuccess;
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

// チーム参加状態を読み込む
function loadTeamParticipation() {
	const participation = loadFromLocalStorage('tennisTeamParticipation');
	if (participation) {
		appState.teamParticipation = participation;
	} else {
		// 初期化：すべてのチームを参加状態にする
		appState.teams.forEach(team => {
			appState.teamParticipation[team.id] = { active: true };
		});
		saveTeamParticipation();
	}
}

// チーム参加状態を保存する
function saveTeamParticipation() {
	saveToLocalStorage('tennisTeamParticipation', appState.teamParticipation);
}

// チームの参加状態を切り替える
function toggleTeamParticipation(teamId) {
	if (!appState.teamParticipation[teamId]) {
		appState.teamParticipation[teamId] = { active: true };
	}
	appState.teamParticipation[teamId].active = !appState.teamParticipation[teamId].active;
	saveTeamParticipation();
	return appState.teamParticipation[teamId].active;
}

// 参加中のチームのみを取得する
function getActiveTeams() {
	return appState.teams.filter(team => 
		appState.teamParticipation[team.id]?.active !== false
	);
}

// チームが参加中かどうかを確認する
function isTeamActive(teamId) {
	return appState.teamParticipation[teamId]?.active !== false;
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
	clearAllTeams,
	loadTeamParticipation,
	saveTeamParticipation,
	toggleTeamParticipation,
	getActiveTeams,
	isTeamActive
};
