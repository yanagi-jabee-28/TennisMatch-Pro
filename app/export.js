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
	const filename = `テニス対戦結果_${dateStr}.csv`;

	// CSVヘッダー
	let csvContent = '\ufeff'; // BOMを追加してExcelで日本語を正しく表示

	// 0. チームメンバー情報のエクスポート
	csvContent += '# チームメンバー情報\n';
	csvContent += 'チームID,メンバー\n';

	appState.teams.forEach(team => {
		team.members.forEach(member => {
			csvContent += `チーム${team.id},${member}\n`;
		});
	});

	csvContent += '\n';

	// 1. 対戦表データのエクスポート
	csvContent += '# 対戦表データ\n';
	csvContent += 'チーム1,チーム2,チーム1スコア,チーム2スコア,勝者,引き分け\n';

	// 対戦結果をCSVに変換
	Object.values(appState.matches).forEach(match => {
		// 勝者の表示方法を決定
		let winnerDisplay = '';
		let drawDisplay = 'FALSE';

		if (match.winner === null) {
			drawDisplay = 'TRUE';
		} else {
			winnerDisplay = `チーム${match.winner}`;
		}

		csvContent += `チーム${match.team1},チーム${match.team2},${match.scoreTeam1},${match.scoreTeam2},${winnerDisplay},${drawDisplay}\n`;
	});

	// 2. 勝敗表のエクスポート
	csvContent += '\n# 勝敗表データ\n';
	csvContent += 'チームID,勝利数,敗北数,引き分け数,得点,失点,得失点差,勝率\n';

	// 各チームの勝敗統計を計算
	const teamStats = calculateTeamStats();
	
	// チームID順に並び替えて出力
	Object.keys(teamStats)
		.sort((a, b) => parseInt(a) - parseInt(b))
		.forEach(teamId => {
			const stats = teamStats[teamId];
			csvContent += `チーム${teamId},${stats.wins},${stats.losses},${stats.draws},`;
			csvContent += `${stats.pointsFor},${stats.pointsAgainst},${stats.pointDiff},`;
			csvContent += `${stats.winRate.toFixed(3)}\n`;
		});

	// 3. チーム間の点数詳細
	csvContent += '\n# チーム間の得点詳細\n';
	csvContent += '対戦ID,チーム1,チーム2,チーム1スコア,チーム2スコア\n';

	Object.entries(appState.matches).forEach(([matchId, match]) => {
		csvContent += `${matchId},チーム${match.team1},チーム${match.team2},${match.scoreTeam1},${match.scoreTeam2}\n`;
	});

	// 4. 設定情報の追加
	csvContent += '\n# 設定情報\n';
	csvContent += `マッチポイント,${appState.settings.matchPoint}\n`;
	csvContent += `エクスポート日時,${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}\n`;

	// 5. 大会情報の追加（config.jsonから）
	fetchConfigAndExport(csvContent, filename);
}

// 設定ファイルを取得してエクスポートを完了する関数
function fetchConfigAndExport(csvContent, filename) {
	// 複数のパスを順番に試す
	const paths = ['config.json', '/config.json', '../config.json', './config.json'];
	let currentPathIndex = 0;
	
	// 再帰的にパスを試す
	function tryNextPath() {
		if (currentPathIndex >= paths.length) {
			// 全てのパスを試した後、エクスポートだけを行う
			console.error('設定ファイルの読み込みに失敗しました。基本データのみエクスポートします。');
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
			})
			.then(config => {
				// 大会情報があれば追加
				if (config.tournamentInfo) {
					csvContent += '\n# 大会情報\n';
					csvContent += `大会名,${config.tournamentInfo.name || '不明'}\n`;
					csvContent += `開催日,${config.tournamentInfo.date || '不明'}\n`;
					csvContent += `場所,${config.tournamentInfo.location || '不明'}\n`;
					csvContent += `形式,${config.tournamentInfo.format || '不明'}\n`;
				}
				
				// データをダウンロード
				downloadCSV(csvContent, filename);
				
				// 成功時に設定をセッションストレージにキャッシュ
				try {
					sessionStorage.setItem('tennisAppConfig', JSON.stringify(config));
				} catch (e) {
					console.error('設定のキャッシュに失敗:', e);
				}
			})
			.catch(error => {
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
