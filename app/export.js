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

	// 2. 順位表データのエクスポート
	csvContent += '\n# 順位表データ\n';
	csvContent += '順位,チーム,勝利数,敗北数,引分,得点,得失点差,勝率\n';

	appState.standings.forEach((team, index) => {
		const scoreDifferenceDisplay = team.scoreDifference > 0 ? `+${team.scoreDifference}` : team.scoreDifference;
		csvContent += `${index + 1},チーム${team.teamId},${team.wins},${team.losses},${team.draws},${team.totalScore},${scoreDifferenceDisplay},${(team.winRate * 100).toFixed(1)}%\n`;
	});

	// 3. 対戦分析データの追加
	csvContent += '\n# 対戦分析データ\n';
	csvContent += 'チーム,対戦相手,勝利数,敗北数,引分,得点,失点,得失点差\n';

	// チームごとの対戦成績を集計
	appState.teams.forEach(team => {
		const teamId = team.id;

		// 他の各チームとの対戦成績
		appState.teams.forEach(opponent => {
			if (teamId === opponent.id) return; // 自分自身との対戦はスキップ

			const opponentId = opponent.id;
			const matchId = getMatchId(teamId, opponentId);
			const match = appState.matches[matchId];

			if (match) {
				let wins = 0;
				let losses = 0;
				let draws = 0;
				let scoredPoints = 0;
				let concededPoints = 0;

				if (match.winner === null) {
					draws = 1;
					// チームのスコアを正しく取得
					if (match.team1 === teamId) {
						scoredPoints = match.scoreTeam1;
						concededPoints = match.scoreTeam2;
					} else {
						scoredPoints = match.scoreTeam2;
						concededPoints = match.scoreTeam1;
					}
				} else if (match.winner === teamId) {
					wins = 1;
					// チームのスコアを正しく取得
					if (match.team1 === teamId) {
						scoredPoints = match.scoreTeam1;
						concededPoints = match.scoreTeam2;
					} else {
						scoredPoints = match.scoreTeam2;
						concededPoints = match.scoreTeam1;
					}
				} else {
					losses = 1;
					// チームのスコアを正しく取得
					if (match.team1 === teamId) {
						scoredPoints = match.scoreTeam1;
						concededPoints = match.scoreTeam2;
					} else {
						scoredPoints = match.scoreTeam2;
						concededPoints = match.scoreTeam1;
					}
				}

				const pointDiff = scoredPoints - concededPoints;
				csvContent += `チーム${teamId},チーム${opponentId},${wins},${losses},${draws},${scoredPoints},${concededPoints},${pointDiff}\n`;
			} else {
				// 対戦していない場合
				csvContent += `チーム${teamId},チーム${opponentId},0,0,0,0,0,0\n`;
			}
		});
	});

	// 4. 設定情報の追加
	csvContent += '\n# 設定情報\n';
	csvContent += `マッチポイント,${appState.settings.matchPoint}\n`;
	csvContent += `エクスポート日時,${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}\n`;

	// 5. 大会情報の追加（config.jsonから）
	try {
		fetch('../config.json')
			.then(response => response.json())
			.then(config => {
				if (config.tournamentInfo) {
					csvContent += '\n# 大会情報\n';
					csvContent += `大会名,${config.tournamentInfo.name || '不明'}\n`;
					csvContent += `開催日,${config.tournamentInfo.date || '不明'}\n`;
					csvContent += `場所,${config.tournamentInfo.location || '不明'}\n`;
					csvContent += `形式,${config.tournamentInfo.format || '不明'}\n`;
				}

				// データを準備した後でダウンロードを実行
				downloadCSV(csvContent, filename);
			})
			.catch(error => {
				console.error('大会情報の取得に失敗しました:', error);
				// エラーが発生しても基本データはダウンロードできるようにする
				downloadCSV(csvContent, filename);
			});
	} catch (error) {
		console.error('大会情報の取得に失敗しました:', error);
		// エラーが発生しても基本データはダウンロードできるようにする
		downloadCSV(csvContent, filename);
	}
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

	toast.success('試合分析データをダウンロードしました！');
}

export { exportMatchAnalysis };
