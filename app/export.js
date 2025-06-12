// データエクスポート機能 - 最適化版

import { appState } from './state.js';
import { toast } from './components/toast.js';
import { getMatchId, calculateTeamStats, formatDateTime, fetchConfigWithPaths } from './utils.js';

// 直接対戦結果を計算する関数（standings.jsと同じロジック）
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

// 試合分析データをエクスポートする関数
function exportMatchAnalysis() {
	// ファイル名用の現在日時を取得
	const dateStr = formatDateTime(new Date(), 'filename');
	const filename = `テニス対戦結果_詳細分析_${dateStr}.csv`;

	let baseCsvContent = ''; // BOMをここでは追加しない
	const now = new Date();

	// # 0. レポートヘッダー
	baseCsvContent += '# 硬式テニス 試合管理アプリ - 詳細分析レポート\n';
	baseCsvContent += `# エクスポート日時: ${formatDateTime(now, 'display')}\n`;
	baseCsvContent += `# アプリバージョン: v2.1.0\n`;
	baseCsvContent += `# データ形式: CSV (UTF-8 with BOM)\n`;
	baseCsvContent += '\n';

	// # 2. システム設定情報 (大会情報が1になるため番号調整)
	baseCsvContent += '# 2. システム設定情報\n';
	baseCsvContent += '項目,設定値\n';
	baseCsvContent += `マッチポイント,${appState.settings.matchPoint}点\n`;
	baseCsvContent += '\n';

	// # 3. 大会統計サマリー
	baseCsvContent += '# 3. 大会統計サマリー\n';
	const totalMatches = Object.keys(appState.matches).length;
	const completedMatches = Object.values(appState.matches).filter(m => m.scoreTeam1 !== null && m.scoreTeam2 !== null).length;
	const pendingMatches = totalMatches - completedMatches;
	const teamStatsForSummary = calculateTeamStats(appState.teams, appState.matches);
	const totalPoints = Object.values(teamStatsForSummary).reduce((sum, stats) => sum + stats.pointsFor, 0);
	const averagePointsPerMatch = completedMatches > 0 ? (totalPoints / (completedMatches * 2)).toFixed(1) : 0;
	const drawMatches = Object.values(appState.matches).filter(m => m.scoreTeam1 !== null && m.scoreTeam2 !== null && m.winner === null).length;
	const decidedMatches = completedMatches - drawMatches;

	baseCsvContent += '項目,値\n';
	baseCsvContent += `総チーム数,${appState.teams.length}チーム\n`;
	baseCsvContent += `総試合数,${totalMatches}試合\n`;
	baseCsvContent += `完了試合数,${completedMatches}試合\n`;
	baseCsvContent += `未実施試合数,${pendingMatches}試合\n`;
	baseCsvContent += `勝敗決着試合数,${decidedMatches}試合\n`;
	baseCsvContent += `引き分け試合数,${drawMatches}試合\n`;
	baseCsvContent += `進行率,${totalMatches > 0 ? ((completedMatches / totalMatches) * 100).toFixed(1) : 0}%\n`;
	baseCsvContent += `総得点数,${totalPoints}点\n`;
	baseCsvContent += `1試合平均得点（チーム毎）,${averagePointsPerMatch}点\n`;
	baseCsvContent += '\n';

	// # 4. チーム構成メンバー一覧
	baseCsvContent += '# 4. チーム構成メンバー一覧\n';
	baseCsvContent += 'チームID,チーム名,メンバー名\n';
	appState.teams.forEach(team => {
		if (team.members && team.members.length > 0) {
			team.members.forEach((member) => {
				baseCsvContent += `${team.id},チーム${team.id},${member}\n`;
			});
		} else {
			baseCsvContent += `${team.id},チーム${team.id},(メンバー未登録)\n`;
		}
	});
	baseCsvContent += '\n';

	// # 5. 全試合結果一覧
	baseCsvContent += '# 5. 全試合結果一覧\n';
	baseCsvContent += '対戦ID,対戦チームA_ID,対戦チームA_名,対戦チームB_ID,対戦チームB_名,チームAスコア,チームBスコア,勝者チームID,試合結果,試合状況\n';
	Object.entries(appState.matches).forEach(([matchId, match]) => {
		let resultDisplay = '';
		let gameStatus = '';
		let winnerTeamId = '-';

		if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
			gameStatus = '未実施';
			resultDisplay = '-';
		} else if (match.winner === null) {
			resultDisplay = '引き分け';
			gameStatus = '終了';
		} else {
			winnerTeamId = match.winner;
			resultDisplay = `チーム${match.winner}勝利`;
			gameStatus = '終了';
		}
		const score1 = match.scoreTeam1 !== null ? match.scoreTeam1 : '-';
		const score2 = match.scoreTeam2 !== null ? match.scoreTeam2 : '-';

		baseCsvContent += `${matchId},${match.team1},チーム${match.team1},${match.team2},チーム${match.team2},${score1},${score2},${winnerTeamId},${resultDisplay},${gameStatus}\n`;
	});
	baseCsvContent += '\n';

	// # 6. チーム別統計 (チームID順、順位含む)
	baseCsvContent += '# 6. チーム別統計（チームID順）\n';
	baseCsvContent += 'チームID,チーム名,最終順位,勝利数,敗北数,引き分け数,総試合数,得点,失点,得失点差,勝率(%)\n';

	const teamStats = calculateTeamStats(appState.teams, appState.matches);
	const rankedTeams = Object.entries(teamStats)
		.map(([teamId, stats]) => ({ teamId, ...stats }))
		.sort((a, b) => {
			if (b.winRate !== a.winRate) return b.winRate - a.winRate;
			if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
			const directResult = getDirectMatchResult(parseInt(a.teamId), parseInt(b.teamId), appState.matches);
			if (directResult !== 0) return -directResult;
			if (b.wins !== a.wins) return b.wins - a.wins;
			return b.pointsFor - a.pointsFor;
		});

	const finalRanks = {};
	rankedTeams.forEach((team, index) => {
		finalRanks[team.teamId] = index + 1;
	});

	Object.keys(teamStats)
		.sort((a, b) => parseInt(a) - parseInt(b))
		.forEach(teamId => {
			const stats = teamStats[teamId];
			const totalGames = stats.wins + stats.losses + stats.draws;
			const winPercentage = (stats.winRate * 100).toFixed(1);
			const rank = finalRanks[teamId] || '-';
			baseCsvContent += `${teamId},チーム${teamId},${rank}位,${stats.wins},${stats.losses},${stats.draws},`;
			baseCsvContent += `${totalGames},${stats.pointsFor},${stats.pointsAgainst},${stats.pointDiff},`;
			baseCsvContent += `${winPercentage}%\n`;
		});
	baseCsvContent += '\n';

	fetchConfigAndExport(baseCsvContent, filename);
}

// 設定ファイルを取得してエクスポートを完了する関数
function fetchConfigAndExport(baseContent, filename) {
	const paths = ['config.json', '/config.json', '../config.json', './config.json'];

	fetchConfigWithPaths(paths)
		.then(config => {
			let configCsvSection = '';
			// # 1. 大会情報
			configCsvSection += '# 1. 大会情報\n';
			configCsvSection += '項目,設定値\n';
			configCsvSection += `大会名,${config.tournamentInfo?.name || '不明'}\n`;
			configCsvSection += `開催日,${config.tournamentInfo?.date || '不明'}\n`;
			configCsvSection += `会場,${config.tournamentInfo?.location || '不明'}\n`;
			configCsvSection += `形式,${config.tournamentInfo?.format || '不明'}\n`;
			configCsvSection += '\n';

			// BOM + 大会情報 + ベースコンテンツ の順で結合
			downloadCSV('\ufeff' + configCsvSection + baseContent, filename);
		})
		.catch(error => {
			console.warn('設定ファイルの読み込みに失敗しました。大会情報なしでエクスポートします。', error);
			let errorConfigCsvSection = '# 1. 大会情報\n';
			errorConfigCsvSection += '項目,設定値\n';
			errorConfigCsvSection += `大会名,(設定ファイル読込エラー)\n`;
			errorConfigCsvSection += `開催日,(設定ファイル読込エラー)\n`;
			errorConfigCsvSection += `会場,(設定ファイル読込エラー)\n`;
			errorConfigCsvSection += `形式,(設定ファイル読込エラー)\n`;
			errorConfigCsvSection += '\n';
			downloadCSV('\ufeff' + errorConfigCsvSection + baseContent, filename);
		});
}

// CSVデータをダウンロードする関数
function downloadCSV(fullCsvContent, filename) {
	// 最終的なフッター
	let finalCsvContent = fullCsvContent;
	finalCsvContent += '# レポート終了\n';
	finalCsvContent += '# ※このデータは硬式テニス試合管理アプリで生成されました\n';
	finalCsvContent += '# ※詳細な分析や追加機能については、アプリをご利用ください\n';

	// 改行コードをCRLFに統一 (Windows環境でのExcel互換性のため)
	const standardizedCsvContent = finalCsvContent.replace(/\n/g, '\r\n');

	// BlobオブジェクトとURLを作成
	const blob = new Blob([standardizedCsvContent], { type: 'text/csv;charset=utf-8;' });
	const url = window.URL.createObjectURL(blob);

	// ダウンロードリンクを作成して実行
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename);
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();

	// クリーンアップ
	setTimeout(() => {
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	}, 100);

	toast.success('データを正常にエクスポートしました');
}

export { exportMatchAnalysis };