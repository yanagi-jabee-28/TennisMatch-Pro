// 順位表に関する機能

import { domCache } from './dom.js';
import { appState } from './state.js';

// 順位表を計算して表示する関数
function calculateStandings() {
	// チームごとの成績を初期化
	const teamStats = {};

	appState.teams.forEach(team => {
		teamStats[team.id] = {
			teamId: team.id,
			wins: 0,
			losses: 0,
			draws: 0,
			totalScore: 0,
			totalConceded: 0, // 失点の合計を追加
			scoreDifference: 0, // 得失点差を追加
			winRate: 0
		};
	});

	// 試合結果から勝敗を集計
	Object.values(appState.matches).forEach(match => {
		if (match.winner) {
			// 勝者が存在する場合
			teamStats[match.winner].wins++;

			// 負けたチームを特定
			const loserId = match.winner === match.team1 ? match.team2 : match.team1;
			teamStats[loserId].losses++;

			// スコアも加算（得点と失点両方を記録）
			if (match.team1 === match.winner) {
				teamStats[match.team1].totalScore += match.scoreTeam1;
				teamStats[match.team1].totalConceded += match.scoreTeam2;
				teamStats[match.team2].totalScore += match.scoreTeam2;
				teamStats[match.team2].totalConceded += match.scoreTeam1;
			} else {
				teamStats[match.team1].totalScore += match.scoreTeam1;
				teamStats[match.team1].totalConceded += match.scoreTeam2;
				teamStats[match.team2].totalScore += match.scoreTeam2;
				teamStats[match.team2].totalConceded += match.scoreTeam1;
			}
		} else {
			// 引き分けの場合
			teamStats[match.team1].draws++;
			teamStats[match.team2].draws++;

			// スコアを加算（得点と失点両方を記録）
			teamStats[match.team1].totalScore += match.scoreTeam1;
			teamStats[match.team1].totalConceded += match.scoreTeam2;
			teamStats[match.team2].totalScore += match.scoreTeam2;
			teamStats[match.team2].totalConceded += match.scoreTeam1;
		}
	});

	// 勝率と得失点差を計算
	Object.values(teamStats).forEach(stats => {
		const totalMatches = stats.wins + stats.losses + stats.draws;
		stats.winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 1000) / 1000 : 0;
		stats.scoreDifference = stats.totalScore - stats.totalConceded; // 得失点差を計算
	});

	// 順位付け（勝利数 → 得失点差 → 得点合計 → 勝率の順）
	appState.standings = Object.values(teamStats).sort((a, b) => {
		if (b.wins !== a.wins) return b.wins - a.wins;
		if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference; // 得失点差で比較
		if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
		return b.winRate - a.winRate;
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

	// 設定変更時の処理
	settingsForm.addEventListener('submit', (e) => {
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
