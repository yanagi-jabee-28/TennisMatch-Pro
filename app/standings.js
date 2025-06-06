// 順位表に関する機能

import { domCache } from './dom.js';
import { appState, saveSettings, getActiveTeams } from './state.js';
import { calculateTeamStats, EventListenerManager, addNumberInputRestriction } from './utils.js';

// 直接対戦結果を計算する関数
function getDirectMatchResult(teamA, teamB, matches) {
	const directMatches = Object.values(matches).filter(match => 
		(match.team1 === teamA && match.team2 === teamB) ||
		(match.team1 === teamB && match.team2 === teamA)
	);

	let teamAWins = 0;
	let teamBWins = 0;
	let draws = 0;
	directMatches.forEach(match => {
		if (match.scoreTeam1 !== null && match.scoreTeam2 !== null) {
			if (match.team1 === teamA) {
				if (match.scoreTeam1 > match.scoreTeam2) teamAWins++;
				else if (match.scoreTeam1 < match.scoreTeam2) teamBWins++;
				else draws++;
			} else {
				if (match.scoreTeam2 > match.scoreTeam1) teamAWins++;
				else if (match.scoreTeam2 < match.scoreTeam1) teamBWins++;
				else draws++;
			}
		}
	});

	// 直接対戦での勝率を計算
	const totalGames = teamAWins + teamBWins + draws;
	if (totalGames === 0) return 0; // 対戦実績なし

	// 引き分けは0.5勝として計算
	const teamAPoints = teamAWins + (draws * 0.5);
	const teamBPoints = teamBWins + (draws * 0.5);
	
	if (teamAPoints > teamBPoints) return 1;  // teamAの勝利
	if (teamAPoints < teamBPoints) return -1; // teamBの勝利
	return 0; // 同点
}

// 順位表を計算して表示する関数
function calculateStandings() {
	// 参加中のチームのみを取得
	const activeTeams = getActiveTeams();
	
	// 共有関数を使用して統計を計算（参加中のチームのみ）
	const teamStats = calculateTeamStats(activeTeams, appState.matches);
		// standings.js用の形式に変換（フィールド名の調整）
	const convertedStats = Object.entries(teamStats).map(([teamId, stats]) => ({
		teamId: parseInt(teamId),
		wins: stats.wins,
		losses: stats.losses,
		draws: stats.draws,
		totalScore: stats.pointsFor,
		totalConceded: stats.pointsAgainst,
		scoreDifference: stats.pointDiff,
		winRate: stats.winRate
	}));
	// 順位付け（勝率 → 得失点差 → 直接対戦 → 勝利数 → 得点合計の順）
	appState.standings = convertedStats.sort((a, b) => {
		if (b.winRate !== a.winRate) return b.winRate - a.winRate; // 勝率で比較（第1優先）
		if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference; // 得失点差で比較（第2優先）
		
		// 勝率と得失点差が同じ場合は直接対戦結果で比較（第3優先）
		const directResult = getDirectMatchResult(a.teamId, b.teamId, appState.matches);
		if (directResult !== 0) return directResult; // 直接対戦で決着がつく場合
		
		if (b.wins !== a.wins) return b.wins - a.wins; // 勝利数で比較（第4優先）
		return b.totalScore - a.totalScore; // 得点合計で比較（第5優先）
	});

	// 順位表の表示
	renderStandings();
}

// 順位表を表示する関数
function renderStandings() {
	const standingsBody = domCache.standingsBody;
	if (!standingsBody) return;
	
	standingsBody.innerHTML = '';
	
	const documentFragment = document.createDocumentFragment();

	appState.standings.forEach((team, index) => {
		const row = document.createElement('tr');

		// 得失点差を表示する列を追加
		const scoreDifferenceClass = team.scoreDifference > 0 ? 'positive-diff' :
			team.scoreDifference < 0 ? 'negative-diff' : '';
		const scoreDifferenceDisplay = team.scoreDifference > 0 ? `+${team.scoreDifference}` : team.scoreDifference;

		row.innerHTML = `
            <td>${index + 1}</td>
            <td>${team.teamId}</td>
            <td>${team.wins}</td>
            <td>${team.losses}</td>
            <td>${team.draws > 0 ? team.draws : '-'}</td>
            <td>${team.totalScore}</td>
            <td class="${scoreDifferenceClass}">${scoreDifferenceDisplay}</td>
            <td>${(team.winRate * 100).toFixed(1)}%</td>
        `;

		documentFragment.appendChild(row);
	});
	
	standingsBody.appendChild(documentFragment);
}

// 試合設定フォームの初期化と処理
function initializeSettingsForm(toast) {
	const settingsForm = document.getElementById('header-settings-form');
	const matchPointInput = document.getElementById('header-match-point');

	// 現在の設定を表示
	matchPointInput.value = appState.settings.matchPoint;

	// 数値入力制限を適用
	addNumberInputRestriction(matchPointInput);

	// 設定変更時の処理
	EventListenerManager.safeAddEventListener(settingsForm, 'submit', (e) => {
		e.preventDefault();

		const newMatchPoint = parseInt(matchPointInput.value);
		// 入力値の検証
		if (isNaN(newMatchPoint) || newMatchPoint < 1 || newMatchPoint > 99) {
			toast.error('マッチポイントは1から99の間で設定してください');
			return;
		}
		
		// 設定を保存
		appState.settings.matchPoint = newMatchPoint;
		saveSettings();

		// 結果に影響するため、順位表を再計算
		calculateStandings();

		toast.success('設定を保存しました！');
	});
}

export { calculateStandings, renderStandings, initializeSettingsForm };
