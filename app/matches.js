// 対戦表と試合管理関連の機能

import { domCache } from './dom.js';
import { appState, saveMatchResults } from './state.js';
import { getMatchId } from './utils.js';
import { customConfirm } from './components/customConfirm.js';
import { openScoreModal } from './components/scoreModal.js';
import { openTeamEditModal } from './components/teamEditor.js';

// チーム情報を表示する関数
function renderTeams() {
	const teamsContainer = domCache.teamsContainer;
	if (!teamsContainer) return;
	
	teamsContainer.innerHTML = '';

	const documentFragment = document.createDocumentFragment();

	appState.teams.forEach(team => {
		const teamCard = document.createElement('div');
		teamCard.className = 'team-card';

		teamCard.innerHTML = `
            <div class="team-header">
                <h3>チーム${team.id}</h3>
                <button class="edit-team-btn btn-small" data-team-id="${team.id}">
                    <span class="edit-icon">✎</span> 編集
                </button>
            </div>
            <ul class="team-members">
                ${team.members.map(member => `<li>${member}</li>`).join('')}
            </ul>
        `;

		documentFragment.appendChild(teamCard);
	});

	teamsContainer.appendChild(documentFragment);

	// イベント委譲で編集ボタンのクリックイベントを処理
	teamsContainer.removeEventListener('click', handleTeamEditClick);
	teamsContainer.addEventListener('click', handleTeamEditClick);
}

// チーム編集ボタンのクリック処理（イベント委譲）
function handleTeamEditClick(event) {
	const editBtn = event.target.closest('.edit-team-btn');
	if (!editBtn) return;
	
	const teamId = parseInt(editBtn.dataset.teamId);
	openTeamEditModal(teamId);
}

// 対戦表を作成する関数
function createMatchTable() {
	const tableHeader = domCache.tableHeader;
	const tableBody = domCache.tableBody;
	
	if (!tableHeader || !tableBody) return;

	// ヘッダー行にチーム番号を追加
	tableHeader.innerHTML = '<th class="empty-cell"></th>';
	appState.teams.forEach(team => {
		tableHeader.innerHTML += `<th>${team.id}</th>`;
	});

	// 対戦表の行を作成
	tableBody.innerHTML = '';
	const documentFragment = document.createDocumentFragment(); // パフォーマンス最適化

	appState.teams.forEach((rowTeam, rowIndex) => {
		const row = document.createElement('tr');

		// 行の最初のセルにチーム番号
		const firstCell = document.createElement('th');
		firstCell.textContent = rowTeam.id;
		row.appendChild(firstCell);

		// 各対戦相手との結果セルを作成
		appState.teams.forEach((colTeam, colIndex) => {
			const cell = document.createElement('td');

			if (rowIndex === colIndex) {
				// 同じチーム同士の対戦はない（対角線を引く）
				cell.className = 'diagonal-line';
			} else {
				// 対戦カードのIDを作成（小さい番号が先）
				const matchId = getMatchId(rowTeam.id, colTeam.id);

				// データ属性を追加してクリックイベントで使用
				cell.dataset.rowTeamId = rowTeam.id;
				cell.dataset.colTeamId = colTeam.id;
				cell.dataset.matchId = matchId;
				cell.classList.add('clickable-cell');

				// 試合結果があれば表示
				const match = appState.matches[matchId];
				if (match) {
					// 勝者が存在するか引き分けかで表示スタイルを変更
					let resultClass;
					if (match.winner === null) {
						resultClass = 'draw';
					} else {
						resultClass = match.winner === rowTeam.id ? 'winner' : 'loser';
					}

					// 行側のチーム（自チーム）を常に左側に表示するため、
					// 適切な順序でスコアを表示
					let displayScore;
					if (match.team1 === rowTeam.id) {
						displayScore = `${match.scoreTeam1}-${match.scoreTeam2}`;
					} else {
						displayScore = `${match.scoreTeam2}-${match.scoreTeam1}`;
					}

					cell.innerHTML = `<span class="match-result ${resultClass}">${displayScore}</span>`;
				} else {
					cell.textContent = '未対戦';
				}
			}

			row.appendChild(cell);
		});

		documentFragment.appendChild(row);
	});

	tableBody.appendChild(documentFragment);

	// イベントリスナーを一括で追加（イベント委譲を使用）
	tableBody.removeEventListener('click', handleTableClick); // 既存のリスナーを削除
	tableBody.addEventListener('click', handleTableClick);
}
	// イベント委譲によるテーブルクリック処理
function handleTableClick(event) {
	const cell = event.target.closest('td.clickable-cell');
	if (!cell) return;

	const rowTeamId = parseInt(cell.dataset.rowTeamId);
	const colTeamId = parseInt(cell.dataset.colTeamId);
	const matchId = cell.dataset.matchId;
	
	// 常に直接スコア入力モーダルを開く
	// 既存データがある場合は編集モードで開く
	openScoreModal(rowTeamId, colTeamId, matchId);
}

export { renderTeams, createMatchTable, handleTeamEditClick, handleTableClick };
