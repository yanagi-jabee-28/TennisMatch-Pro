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

	// CSVヘッダーとタイトル
	let csvContent = '\ufeff'; // BOMを追加してExcelで日本語を正しく表示
	
	// タイトルとエクスポート情報
	const now = new Date();
	csvContent += '============================================\n';
	csvContent += '硬式テニス 試合管理アプリ - 詳細分析レポート\n';
	csvContent += '============================================\n';
	csvContent += `エクスポート日時: ${formatDateTime(now, 'display')}\n`;
	csvContent += `参加チーム数: ${appState.teams.length}チーム\n`;
	csvContent += `総試合数: ${Object.keys(appState.matches).length}試合\n`;
	csvContent += '\n';

	// 1. チームメンバー情報のエクスポート
	csvContent += '============================================\n';
	csvContent += '1. チーム構成メンバー一覧\n';
	csvContent += '============================================\n';
	csvContent += 'チームID,チーム名,メンバー名\n';

	appState.teams.forEach(team => {
		team.members.forEach((member, index) => {
			csvContent += `${team.id},チーム${team.id},${member}\n`;
		});
	});
	csvContent += '\n';

	// 2. 全試合結果一覧のエクスポート
	csvContent += '============================================\n';
	csvContent += '2. 全試合結果一覧\n';
	csvContent += '============================================\n';
	csvContent += '対戦ID,対戦チームA,対戦チームB,チームAスコア,チームBスコア,試合結果,試合状況\n';

	// 対戦結果をCSVに変換
	Object.entries(appState.matches).forEach(([matchId, match]) => {
		// 試合結果の表示方法を決定
		let resultDisplay = '';
		let gameStatus = '';

		if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
			gameStatus = '未実施';
			resultDisplay = '-';
		} else if (match.winner === null) {
			resultDisplay = '引き分け';
			gameStatus = '終了';
		} else {
			resultDisplay = `チーム${match.winner}勝利`;
			gameStatus = '終了';
		}

		const score1 = match.scoreTeam1 !== null ? match.scoreTeam1 : '-';
		const score2 = match.scoreTeam2 !== null ? match.scoreTeam2 : '-';

		csvContent += `${matchId},チーム${match.team1},チーム${match.team2},${score1},${score2},${resultDisplay},${gameStatus}\n`;
	});

	csvContent += '\n';

	// 3. 最終順位表のエクスポート
	csvContent += '============================================\n';
	csvContent += '3. 最終順位表（順位順）\n';
	csvContent += '============================================\n';
	csvContent += '最終順位,チームID,チーム名,勝利数,敗北数,引き分け数,総試合数,得点,失点,得失点差,勝率(%)\n';

	// 各チームの勝敗統計を計算（共有関数を使用）
	const teamStats = calculateTeamStats(appState.teams, appState.matches);
		// 順位付けのために統計データを並び替え
	const rankedTeams = Object.entries(teamStats)
		.map(([teamId, stats]) => ({ teamId, ...stats }))
		.sort((a, b) => {
			if (b.winRate !== a.winRate) return b.winRate - a.winRate; // 勝率で比較（第1優先）
			if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff; // 得失点差で比較（第2優先）
			
			// 勝率と得失点差が同じ場合は直接対戦結果で比較（第3優先）
			const directResult = getDirectMatchResult(parseInt(a.teamId), parseInt(b.teamId), appState.matches);
			if (directResult !== 0) return directResult; // 直接対戦で決着がつく場合
			
			if (b.wins !== a.wins) return b.wins - a.wins; // 勝利数で比較（第4優先）
			return b.pointsFor - a.pointsFor; // 得点合計で比較（第5優先）
		});
	
	// 順位付きで出力
	rankedTeams.forEach((teamData, index) => {
		const rank = index + 1;
		const totalGames = teamData.wins + teamData.losses + teamData.draws;
		const winPercentage = (teamData.winRate * 100).toFixed(1);
		csvContent += `${rank},${teamData.teamId},チーム${teamData.teamId},${teamData.wins},${teamData.losses},${teamData.draws},`;
		csvContent += `${totalGames},${teamData.pointsFor},${teamData.pointsAgainst},${teamData.pointDiff},`;
		csvContent += `${winPercentage}%\n`;
	});

	csvContent += '\n';

	// 4. チームID順勝敗表のエクスポート
	csvContent += '============================================\n';
	csvContent += '4. チーム別統計（チームID順）\n';
	csvContent += '============================================\n';
	csvContent += 'チームID,チーム名,勝利数,敗北数,引き分け数,総試合数,得点,失点,得失点差,勝率(%),順位\n';

	// チームID順に並び替えて出力
	Object.keys(teamStats)
		.sort((a, b) => parseInt(a) - parseInt(b))
		.forEach(teamId => {
			const stats = teamStats[teamId];
			const totalGames = stats.wins + stats.losses + stats.draws;
			const winPercentage = (stats.winRate * 100).toFixed(1);
			// 順位を取得
			const rank = rankedTeams.findIndex(team => team.teamId == teamId) + 1;
			csvContent += `${teamId},チーム${teamId},${stats.wins},${stats.losses},${stats.draws},`;
			csvContent += `${totalGames},${stats.pointsFor},${stats.pointsAgainst},${stats.pointDiff},`;
			csvContent += `${winPercentage}%,${rank}位\n`;
		});

	csvContent += '\n';

	// 5. 試合別詳細スコア
	csvContent += '============================================\n';
	csvContent += '5. 試合別詳細スコア一覧\n';
	csvContent += '============================================\n';
	csvContent += '対戦ID,対戦カード,チーム1,チーム2,チーム1スコア,チーム2スコア,スコア差,試合結果\n';

	Object.entries(appState.matches).forEach(([matchId, match]) => {
		const score1 = match.scoreTeam1 !== null ? match.scoreTeam1 : 0;
		const score2 = match.scoreTeam2 !== null ? match.scoreTeam2 : 0;
		const scoreDiff = Math.abs(score1 - score2);
		const matchCard = `チーム${match.team1} vs チーム${match.team2}`;
		
		let result = '';
		if (match.scoreTeam1 === null || match.scoreTeam2 === null) {
			result = '未実施';
		} else if (match.winner === null) {
			result = '引き分け';
		} else {
			result = `チーム${match.winner}勝利`;
		}

		csvContent += `${matchId},${matchCard},チーム${match.team1},チーム${match.team2},${score1},${score2},${scoreDiff},${result}\n`;
	});

	csvContent += '\n';

	// 6. 統計サマリーの追加
	csvContent += '============================================\n';
	csvContent += '6. 大会統計サマリー\n';
	csvContent += '============================================\n';
	
	// 全体統計を計算
	const totalMatches = Object.keys(appState.matches).length;
	const completedMatches = Object.values(appState.matches).filter(m => m.scoreTeam1 !== null && m.scoreTeam2 !== null).length;
	const pendingMatches = totalMatches - completedMatches;
	const totalPoints = Object.values(teamStats).reduce((sum, stats) => sum + stats.pointsFor, 0);
	const averagePointsPerMatch = completedMatches > 0 ? (totalPoints / (completedMatches * 2)).toFixed(1) : 0;
	
	// 勝敗統計を計算
	const drawMatches = Object.values(appState.matches).filter(m => m.scoreTeam1 !== null && m.scoreTeam2 !== null && m.winner === null).length;
	const decidedMatches = completedMatches - drawMatches;
	
	csvContent += `項目,値\n`;
	csvContent += `総チーム数,${appState.teams.length}チーム\n`;
	csvContent += `総試合数,${totalMatches}試合\n`;
	csvContent += `完了試合数,${completedMatches}試合\n`;
	csvContent += `未実施試合数,${pendingMatches}試合\n`;
	csvContent += `勝敗決着試合数,${decidedMatches}試合\n`;
	csvContent += `引き分け試合数,${drawMatches}試合\n`;
	csvContent += `進行率,${totalMatches > 0 ? ((completedMatches / totalMatches) * 100).toFixed(1) : 0}%\n`;
	csvContent += `総得点数,${totalPoints}点\n`;
	csvContent += `1試合平均得点,${averagePointsPerMatch}点\n`;
	csvContent += `現在のマッチポイント,${appState.settings.matchPoint}点\n`;
	
	csvContent += '\n';

	// 7. システム設定情報
	csvContent += '============================================\n';
	csvContent += '7. システム設定情報\n';
	csvContent += '============================================\n';
	csvContent += `項目,設定値\n`;
	csvContent += `マッチポイント,${appState.settings.matchPoint}点\n`;
	csvContent += `エクスポート日時,${formatDateTime(now, 'display')}\n`;
	csvContent += `アプリバージョン,v2.1.0\n`;
	csvContent += `データ形式,CSV (UTF-8 with BOM)\n`;
	
	csvContent += '\n';

	// 8. 大会情報の追加（config.jsonから）
	fetchConfigAndExport(csvContent, filename);
}

// 設定ファイルを取得してエクスポートを完了する関数
function fetchConfigAndExport(csvContent, filename) {
	const paths = ['config.json', '/config.json', '../config.json', './config.json'];
	
	fetchConfigWithPaths(paths)
		.then(config => {
			// 設定が取得できた場合は大会情報を追加
			csvContent += '============================================\n';
			csvContent += '8. 大会情報\n';
			csvContent += '============================================\n';
			csvContent += `大会名,${config.tournamentInfo?.name || '不明'}\n`;
			csvContent += `開催日,${config.tournamentInfo?.date || '不明'}\n`;
			csvContent += `会場,${config.tournamentInfo?.location || '不明'}\n`;
			csvContent += `形式,${config.tournamentInfo?.format || '不明'}\n`;
			csvContent += '\n';
			
			// CSVダウンロードを実行
			downloadCSV(csvContent, filename);
		})
		.catch(error => {
			// 設定ファイルの読み込みに失敗した場合、基本データのみでエクスポート
			console.error('設定ファイルの読み込みに失敗しました。基本データのみエクスポートします。', error);
			downloadCSV(csvContent, filename);
		});
}

// CSVデータをダウンロードする関数
function downloadCSV(csvContent, filename) {
	// 最終的なフッター
	csvContent += '============================================\n';
	csvContent += 'レポート終了\n';
	csvContent += '============================================\n';
	csvContent += '※このデータは硬式テニス試合管理アプリで生成されました\n';
	csvContent += '※詳細な分析や追加機能については、アプリをご利用ください\n';

	// BlobオブジェクトとURLを作成
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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