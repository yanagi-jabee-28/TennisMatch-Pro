// データエクスポート機能

import { appState } from './state.js';
import { toast } from './components/toast.js';
import { getMatchId } from './utils.js';

// 試合分析データをエクスポートする関数
function exportMatchAnalysis() {
	// 現在の日時をフォーマットしてファイル名に使用
	const now = new Date();
	const dateStr = now.getFullYear() +
		('0' + (now.getMonth() + 1)).slice(-2) +
		('0' + now.getDate()).slice(-2) + '_' +
		('0' + now.getHours()).slice(-2) +
		('0' + now.getMinutes()).slice(-2);
	const filename = `テニス対戦結果_詳細分析_${dateStr}.csv`;

	// CSVヘッダーとタイトル
	let csvContent = '\ufeff'; // BOMを追加してExcelで日本語を正しく表示
	
	// タイトルとエクスポート情報
	csvContent += '============================================\n';
	csvContent += '硬式テニス 試合管理アプリ - 詳細分析レポート\n';
	csvContent += '============================================\n';
	csvContent += `エクスポート日時: ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}\n`;
	csvContent += `参加チーム数: ${appState.teams.length}チーム\n`;
	csvContent += `総試合数: ${Object.keys(appState.matches).length}試合\n`;
	csvContent += '\n';
	// 0. チームメンバー情報のエクスポート
	csvContent += '============================================\n';	csvContent += '1. チーム構成メンバー一覧\n';
	csvContent += '============================================\n';
	csvContent += 'チームID,チーム名,メンバー名\n';

	appState.teams.forEach(team => {
		team.members.forEach((member, index) => {
			csvContent += `${team.id},チーム${team.id},${member}\n`;
		});
	});
	csvContent += '\n';	// 1. 対戦表データのエクスポート
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

	csvContent += '\n';	// 2. 最終順位表のエクスポート
	csvContent += '============================================\n';
	csvContent += '3. 最終順位表（順位順）\n';
	csvContent += '============================================\n';
	csvContent += '最終順位,チームID,チーム名,勝利数,敗北数,引き分け数,総試合数,得点,失点,得失点差,勝率(%)\n';

	// 各チームの勝敗統計を計算
	const teamStats = calculateTeamStats();
	
	// 順位付けのために統計データを並び替え（standings.jsと同じロジック）
	const rankedTeams = Object.entries(teamStats)
		.map(([teamId, stats]) => ({ teamId, ...stats }))
		.sort((a, b) => {
			if (b.winRate !== a.winRate) return b.winRate - a.winRate; // 勝率で比較（第1優先）
			if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff; // 得失点差で比較（第2優先）
			if (b.wins !== a.wins) return b.wins - a.wins; // 勝利数で比較（第3優先）
			return b.pointsFor - a.pointsFor; // 得点合計で比較（第4優先）
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
	// 3. チームID順勝敗表のエクスポート
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

	csvContent += '\n';	// 4. 試合別詳細スコア
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
	// 5. 統計サマリーの追加
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

	// 6. 設定情報の追加
	csvContent += '============================================\n';
	csvContent += '7. システム設定情報\n';
	csvContent += '============================================\n';
	csvContent += `項目,設定値\n`;
	csvContent += `マッチポイント,${appState.settings.matchPoint}点\n`;
	csvContent += `エクスポート日時,${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}\n`;
	csvContent += `アプリバージョン,v2.1.0\n`;
	csvContent += `データ形式,CSV (UTF-8 with BOM)\n`;
	
	csvContent += '\n';
	// 7. 大会情報の追加（config.jsonから）
	fetchConfigAndExport(csvContent, filename);
}

// 設定ファイルを取得してエクスポートを完了する関数
function fetchConfigAndExport(csvContent, filename) {	// 複数のパスを順番に試す
	const paths = ['config.json', '/config.json', '../config.json', './config.json'];
	let currentPathIndex = 0;
	
	// 再帰的にパスを試す
	function tryNextPath() {
		if (currentPathIndex >= paths.length) {
			// 全てのパスを試した後、大会情報なしでエクスポートを完了
			console.error('設定ファイルの読み込みに失敗しました。基本データのみエクスポートします。');
			csvContent += '============================================\n';
			csvContent += '8. 大会情報\n';
			csvContent += '============================================\n';
			csvContent += `項目,情報\n`;
			csvContent += `大会名,設定ファイル読み込み失敗\n`;
			csvContent += `開催日,不明\n`;
			csvContent += `開催場所,不明\n`;
			csvContent += `大会形式,リーグ戦\n`;
			csvContent += '\n';
			
			// 最終的なフッター
			csvContent += '============================================\n';
			csvContent += 'レポート終了\n';
			csvContent += '============================================\n';
			csvContent += '※このデータは硬式テニス試合管理アプリで生成されました\n';
			csvContent += '※詳細な分析や追加機能については、アプリをご利用ください\n';
			
			downloadCSV(csvContent, filename);
			return;
		}
		
		const path = paths[currentPathIndex];
		currentPathIndex++;
		
		fetch(path)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})			.then(config => {
				// 大会情報があれば追加
				if (config.tournamentInfo) {
					csvContent += '============================================\n';
					csvContent += '8. 大会情報\n';
					csvContent += '============================================\n';
					csvContent += `項目,情報\n`;
					csvContent += `大会名,${config.tournamentInfo.name || '不明'}\n`;
					csvContent += `開催日,${config.tournamentInfo.date || '不明'}\n`;
					csvContent += `開催場所,${config.tournamentInfo.location || '不明'}\n`;
					csvContent += `大会形式,${config.tournamentInfo.format || 'リーグ戦'}\n`;
					if (config.tournamentInfo.description) {
						csvContent += `大会説明,${config.tournamentInfo.description}\n`;
					}
					csvContent += '\n';
				}
				
				// 最終的なフッター
				csvContent += '============================================\n';
				csvContent += 'レポート終了\n';
				csvContent += '============================================\n';
				csvContent += '※このデータは硬式テニス試合管理アプリで生成されました\n';
				csvContent += '※詳細な分析や追加機能については、アプリをご利用ください\n';
				
				// データをダウンロード
				downloadCSV(csvContent, filename);
				
				// 成功時に設定をセッションストレージにキャッシュ
				try {
					sessionStorage.setItem('tennisAppConfig', JSON.stringify(config));
				} catch (e) {
					console.error('設定のキャッシュに失敗:', e);
				}
			})			.catch(error => {
				console.error(`${path}からの読み込み失敗:`, error);
				// 次のパスを試す
				tryNextPath();
			});
	}
	
	// 最初のパスから開始
	tryNextPath();
}

// CSVデータをダウンロードする関数
function downloadCSV(csvContent, filename) {
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

// 各チームの勝敗統計を計算する関数
function calculateTeamStats() {
	const teamStats = {};
	
	// チームの初期統計を作成
	appState.teams.forEach(team => {
		teamStats[team.id] = {
			wins: 0,
			losses: 0,
			draws: 0,
			pointsFor: 0,
			pointsAgainst: 0,
			pointDiff: 0,
			winRate: 0
		};
	});
	
	// 試合結果から統計を計算
	Object.values(appState.matches).forEach(match => {
		// 得失点の記録
		const team1 = match.team1;
		const team2 = match.team2;
		const score1 = match.scoreTeam1;
		const score2 = match.scoreTeam2;
		
		if (score1 !== null && score2 !== null) {
			// 得失点を加算
			teamStats[team1].pointsFor += score1;
			teamStats[team1].pointsAgainst += score2;
			teamStats[team2].pointsFor += score2;
			teamStats[team2].pointsAgainst += score1;
			
			// 勝敗を記録
			if (match.winner === team1) {
				teamStats[team1].wins++;
				teamStats[team2].losses++;
			} else if (match.winner === team2) {
				teamStats[team2].wins++;
				teamStats[team1].losses++;
			} else {
				// 引き分け
				teamStats[team1].draws++;
				teamStats[team2].draws++;
			}
		}
	});
	
	// 得失点差と勝率を計算
	Object.values(teamStats).forEach(stat => {
		stat.pointDiff = stat.pointsFor - stat.pointsAgainst;
		const totalGames = stat.wins + stat.losses + stat.draws;
		stat.winRate = totalGames > 0 ? stat.wins / totalGames : 0;
	});
	
	return teamStats;
}

export { exportMatchAnalysis };
