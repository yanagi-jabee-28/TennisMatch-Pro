// 対戦表と試合管理関連の機能

import { domCache } from './dom.js';
import { appState, saveMatchResults, markMemberAsAbsent, returnMemberFromAbsent } from './state.js';
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
	// 通常のチーム1-5を表示
	appState.teams.forEach(team => {
		const teamCard = document.createElement('div');
		teamCard.className = 'team-card';
		
		// メンバーが選択されている場合、チームヘッダーをクリック可能にする
		const hasSelectedMembers = selectedMembers.size > 0;
		const headerClass = hasSelectedMembers ? 'team-header clickable-team-header assignable' : 'team-header';
		
		teamCard.innerHTML = `
            <div class="${headerClass}" data-team-id="${team.id}">
                <h3>チーム${team.id}</h3>
                <button class="edit-team-btn btn-small" data-team-id="${team.id}">
                    <span class="edit-icon">✎</span> 編集
                </button>
            </div>
            <ul class="team-members">
                ${team.members.map(member => `<li class="member-item clickable-member" data-member="${member}" data-team-id="${team.id}">${member}</li>`).join('')}
            </ul>
        `;

		documentFragment.appendChild(teamCard);
	});
	// 欠席チーム（チーム6）を表示
	const absentTeamCard = document.createElement('div');
	absentTeamCard.className = 'team-card absent-team-card';
	
	// メンバーが選択されている場合、欠席チームヘッダーもクリック可能にする
	const hasSelectedMembers = selectedMembers.size > 0;
	const absentHeaderClass = hasSelectedMembers ? 'team-header clickable-team-header assignable' : 'team-header';
	
	absentTeamCard.innerHTML = `
        <div class="${absentHeaderClass}" data-team-id="6">
            <h3>欠席チーム</h3>
            <span class="team-subtitle">（チーム6）</span>
        </div>
        <ul class="team-members">
            ${appState.absentTeam.members.map(member => `
                <li class="member-item clickable-member absent-member" data-member="${member}" data-team-id="6">
                    <span class="member-name">${member}</span>
                    <button class="return-member-btn" data-member="${member}" title="復帰させる">↩</button>
                </li>
            `).join('')}
            ${appState.absentTeam.members.length === 0 ? '<li class="empty-message">欠席メンバーはいません</li>' : ''}
        </ul>
    `;

	documentFragment.appendChild(absentTeamCard);
	teamsContainer.appendChild(documentFragment);

	// イベント委譲で編集ボタンとメンバークリックのイベントを処理
	teamsContainer.removeEventListener('click', handleTeamEditClick);
	teamsContainer.addEventListener('click', handleTeamEditClick);
	
	// 右クリックイベントも追加
	teamsContainer.removeEventListener('contextmenu', handleTeamRightClick);
	teamsContainer.addEventListener('contextmenu', handleTeamRightClick);

	// 未割り当てメンバーも表示
	renderUnassignedMembers();
}

// 未割り当てメンバーを取得する関数
function getUnassignedMembers() {
	// オリジナルの全メンバーリストを取得
	const allOriginalMembers = [];
	appState.originalTeams.forEach(team => {
		allOriginalMembers.push(...team.members);
	});
	
	// 現在どのチームにも所属していないメンバーを特定
	const assignedMembers = [];
	appState.teams.forEach(team => {
		assignedMembers.push(...team.members);
	});
	
	// 欠席チームのメンバーも除外
	return allOriginalMembers.filter(member => 
		!assignedMembers.includes(member) && 
		!appState.absentTeam.members.includes(member)
	);
}

// 未割り当てメンバーを表示する関数
function renderUnassignedMembers() {
	const unassignedContainer = document.getElementById('unassigned-members-container');
	if (!unassignedContainer) return;
	
	const unassignedMembers = getUnassignedMembers();
	unassignedContainer.innerHTML = '';
	
	if (unassignedMembers.length === 0) {
		const emptyMessage = document.createElement('div');
		emptyMessage.className = 'unassigned-members-empty';
		emptyMessage.textContent = 'すべてのメンバーがチームに所属しています';
		unassignedContainer.appendChild(emptyMessage);
	} else {
		unassignedMembers.forEach(member => {
			const memberItem = document.createElement('div');
			memberItem.className = 'unassigned-member-item clickable-member';
			memberItem.dataset.member = member;
			memberItem.dataset.teamId = 'unassigned';
			memberItem.textContent = member;
			unassignedContainer.appendChild(memberItem);
		});
				// イベント委譲で未割り当てメンバーのクリックを処理
		unassignedContainer.removeEventListener('click', handleUnassignedMemberClick);
		unassignedContainer.addEventListener('click', handleUnassignedMemberClick);
		
		// 右クリックイベントも追加
		unassignedContainer.removeEventListener('contextmenu', handleUnassignedRightClick);
		unassignedContainer.addEventListener('contextmenu', handleUnassignedRightClick);
	}
}

// チーム編集ボタンとメンバークリックの処理（イベント委譲）
function handleTeamEditClick(event) {
	// 復帰ボタンのクリック処理
	const returnBtn = event.target.closest('.return-member-btn');
	if (returnBtn) {
		const memberName = returnBtn.dataset.member;
		handleReturnFromAbsent(memberName);
		return;
	}

	// 編集ボタンのクリック処理
	const editBtn = event.target.closest('.edit-team-btn');
	if (editBtn) {
		const teamId = parseInt(editBtn.dataset.teamId);
		openTeamEditModal(teamId);
		return;
	}
	
	// チームヘッダーのクリック処理（メンバー割り当て）
	const teamHeader = event.target.closest('.clickable-team-header');
	if (teamHeader && selectedMembers.size > 0) {
		const teamId = parseInt(teamHeader.dataset.teamId);
		if (teamId === 6) {
			// 欠席チームに割り当て
			assignSelectedMembersAsAbsent();
		} else {
			// 通常のチームに割り当て
			assignSelectedMembersToTeam(teamId);
		}
		return;
	}
	
	// メンバークリックの処理
	const memberItem = event.target.closest('.clickable-member');
	if (memberItem && !event.target.closest('.return-member-btn')) {
		const memberName = memberItem.dataset.member;
		const teamId = parseInt(memberItem.dataset.teamId);
		handleMemberClick(memberName, teamId);
		return;
	}
}

// メンバークリック時の処理
function handleMemberClick(memberName, currentTeamId) {
	console.log(`メンバー "${memberName}" (チーム${currentTeamId}) がクリックされました`);
	
	// メンバーを選択状態にする（パレットモード用）
	toggleMemberSelection(memberName, currentTeamId);
}

// メンバーの選択状態を管理する変数
let selectedMembers = new Set();
let memberPaletteMode = false;

// メンバーの選択状態を切り替える
function toggleMemberSelection(memberName, teamId) {
	const memberKey = `${memberName}-${teamId}`;
	
	if (selectedMembers.has(memberKey)) {
		selectedMembers.delete(memberKey);
		console.log(`メンバー "${memberName}" の選択を解除しました`);
	} else {
		selectedMembers.add(memberKey);
		console.log(`メンバー "${memberName}" を選択しました`);
	}
	
	// UI上での選択状態を更新
	updateMemberSelectionUI();
	
	// パレットモードの表示を更新
	updateMemberPalette();
}

// メンバー選択のUIを更新
function updateMemberSelectionUI() {
	const allMemberItems = document.querySelectorAll('.clickable-member');
	
	allMemberItems.forEach(item => {
		const memberName = item.dataset.member;
		const teamId = item.dataset.teamId;
		const memberKey = `${memberName}-${teamId}`;
		
		if (selectedMembers.has(memberKey)) {
			item.classList.add('selected-member');
		} else {
			item.classList.remove('selected-member');
		}
	});
	
	// チームヘッダーのスタイルも更新（メンバーが選択されている場合にクリック可能にする）
	const teamHeaders = document.querySelectorAll('.team-header');
	teamHeaders.forEach(header => {
		if (selectedMembers.size > 0) {
			header.classList.add('clickable-team-header', 'assignable');
		} else {
			header.classList.remove('clickable-team-header', 'assignable');
		}
	});
}

// メンバーパレットの表示を更新
function updateMemberPalette() {
	let paletteContainer = document.getElementById('member-palette');
	
	// パレットコンテナが存在しない場合は作成
	if (!paletteContainer) {
		paletteContainer = createMemberPalette();
	}
	
	// 選択されたメンバーの表示を更新
	renderSelectedMembers(paletteContainer);
	
	// パレットの表示/非表示を制御
	if (selectedMembers.size > 0) {
		paletteContainer.style.display = 'block';
		memberPaletteMode = true;
	} else {
		paletteContainer.style.display = 'none';
		memberPaletteMode = false;
	}
}

// メンバーパレットコンテナを作成
function createMemberPalette() {
	const paletteContainer = document.createElement('div');
	paletteContainer.id = 'member-palette';
	paletteContainer.className = 'member-palette-container';
	
	paletteContainer.innerHTML = `
		<div class="palette-header">
			<h3>選択されたメンバー</h3>
			<div class="palette-controls">
				<button id="clear-selection-btn" class="btn btn-small btn-secondary">選択をクリア</button>
				<button id="close-palette-btn" class="btn btn-small">&times;</button>
			</div>
		</div>
		<div class="palette-content">
			<div class="selected-members-list" id="selected-members-list">
				<!-- 選択されたメンバーがここに表示されます -->
			</div>
			<div class="team-assignment-section">
				<h4>チームに割り当て</h4>
				<div class="team-buttons" id="team-assignment-buttons">
					<!-- チームボタンがここに動的に生成されます -->
				</div>
			</div>
		</div>
	`;
	
	// チーム情報セクションと対戦表セクションの間に挿入
	const teamInfoSection = document.getElementById('team-info');
	const matchTableSection = document.getElementById('match-table');
	
	if (teamInfoSection && matchTableSection) {
		teamInfoSection.parentNode.insertBefore(paletteContainer, matchTableSection);
	}
	
	// イベントリスナーを追加
	setupPaletteEventListeners(paletteContainer);
	
	return paletteContainer;
}

// パレットのイベントリスナーを設定
function setupPaletteEventListeners(paletteContainer) {
	// 選択をクリアボタン
	const clearBtn = paletteContainer.querySelector('#clear-selection-btn');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			selectedMembers.clear();
			updateMemberSelectionUI();
			updateMemberPalette();
		});
	}
	
	// パレットを閉じるボタン
	const closeBtn = paletteContainer.querySelector('#close-palette-btn');
	if (closeBtn) {
		closeBtn.addEventListener('click', () => {
			selectedMembers.clear();
			updateMemberSelectionUI();
			updateMemberPalette();
		});
	}
}

// 選択されたメンバーをパレットに表示
function renderSelectedMembers(paletteContainer) {
	const selectedMembersList = paletteContainer.querySelector('#selected-members-list');
	const teamButtonsContainer = paletteContainer.querySelector('#team-assignment-buttons');
	
	if (!selectedMembersList || !teamButtonsContainer) return;
		// 選択されたメンバーリストを表示
	selectedMembersList.innerHTML = '';
	Array.from(selectedMembers).forEach(memberKey => {
		const [memberName, teamId] = memberKey.split('-');
		const memberItem = document.createElement('div');
		memberItem.className = 'selected-member-item';
				// 未割り当てメンバーと欠席メンバーの場合の表示を変更
		let currentTeamText;		if (teamId === 'unassigned') {
			currentTeamText = '未割り当て';
		} else if (teamId === 6) {
			currentTeamText = '欠席';
		} else {
			currentTeamText = `チーム${teamId}`;
		}
		
		memberItem.innerHTML = `
			<span class="member-name">${memberName}</span>
			<span class="current-team">現在: ${currentTeamText}</span>
			<button class="remove-from-selection-btn" data-member-key="${memberKey}">&times;</button>
		`;
		selectedMembersList.appendChild(memberItem);
		
		// 個別削除ボタンのイベントリスナー
		const removeBtn = memberItem.querySelector('.remove-from-selection-btn');
		if (removeBtn) {
			removeBtn.addEventListener('click', () => {
				selectedMembers.delete(memberKey);
				updateMemberSelectionUI();
				updateMemberPalette();
			});
		}
	});
	// チーム割り当てボタンを非表示にし、チームヘッダークリック機能に移行
	teamButtonsContainer.innerHTML = `
		<div class="assignment-instructions">
			<p>💡 チームヘッダーをクリックして選択されたメンバーを割り当てできます</p>
		</div>
	`;
}

// 選択されたメンバーを指定されたチームに割り当て
function assignSelectedMembersToTeam(targetTeamId) {
	if (selectedMembers.size === 0) {
		console.log('選択されたメンバーがありません');
		return;
	}
	
	console.log(`選択されたメンバーをチーム${targetTeamId}に割り当てます`);
		// 選択されたメンバーを元のチームから削除し、新しいチームに追加
	const membersToMove = Array.from(selectedMembers).map(memberKey => {
		const [memberName, currentTeamId] = memberKey.split('-');
		return {
			name: memberName,
			fromTeam: currentTeamId,
			toTeam: targetTeamId
		};
	});
	// チーム間でメンバーを移動
	membersToMove.forEach(move => {
		// 元のチームから削除（未割り当て・欠席の場合は特別処理）
		if (move.fromTeam === 'absent') {
			// 欠席リストから削除
			returnMemberFromAbsent(move.name);
		} else if (move.fromTeam !== 'unassigned' && !isNaN(parseInt(move.fromTeam))) {
			const fromTeam = appState.teams.find(team => team.id === parseInt(move.fromTeam));
			if (fromTeam) {
				const memberIndex = fromTeam.members.indexOf(move.name);
				if (memberIndex !== -1) {
					fromTeam.members.splice(memberIndex, 1);
				}
			}
		}
		
		// 新しいチームに追加
		const toTeam = appState.teams.find(team => team.id === move.toTeam);
		if (toTeam && !toTeam.members.includes(move.name)) {
			toTeam.members.push(move.name);
		}
	});
	
	// 選択をクリア
	selectedMembers.clear();
	
	// UIを更新
	renderTeams();
	updateMemberSelectionUI();
	updateMemberPalette();
	
	console.log('メンバーの移動が完了しました');
}

// 選択されたメンバーを欠席にする
function assignSelectedMembersAsAbsent() {
	if (selectedMembers.size === 0) {
		console.log('選択されたメンバーがありません');
		return;
	}
	const memberNames = Array.from(selectedMembers).map(memberKey => {
		const [memberName] = memberKey.split('-');
		return memberName;
	});

	console.log(`選択されたメンバーを欠席にします:`, memberNames);

	// 各メンバーを欠席リストに追加
	memberNames.forEach(memberName => {
		markMemberAsAbsent(memberName);
	});

	// 選択をクリア
	selectedMembers.clear();

	// UIを更新
	renderTeams();
	updateMemberSelectionUI();
	updateMemberPalette();

	console.log('メンバーの欠席処理が完了しました');
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
					}					cell.innerHTML = `<span class="match-result ${resultClass}">${displayScore}</span>`;
				} else {
					cell.textContent = '-';
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

// 未割り当てメンバークリック時の処理
function handleUnassignedMemberClick(event) {
	const memberItem = event.target.closest('.clickable-member');
	if (memberItem) {
		const memberName = memberItem.dataset.member;
		handleMemberClick(memberName, 'unassigned');
	}
}

// チーム右クリック時の処理
function handleTeamRightClick(event) {
	const memberItem = event.target.closest('.clickable-member');
	if (memberItem) {
		event.preventDefault(); // デフォルトのコンテキストメニューを無効化
		
		const memberName = memberItem.dataset.member;
		const teamId = memberItem.dataset.teamId;
		
		// 欠席メンバーには右クリックメニューを表示しない
		if (teamId === 'absent') {
			return;
		}
		
		// コンテキストメニューを作成・表示
		const menu = createMemberContextMenu();
		menu.dataset.memberName = memberName;
		menu.dataset.teamId = teamId;
		
		// マウス位置にメニューを表示
		menu.style.left = event.pageX + 'px';
		menu.style.top = event.pageY + 'px';
		menu.style.display = 'block';
		
		console.log(`メンバー "${memberName}" を右クリックしました`);
	}
}

// 未割り当てメンバー右クリック時の処理
function handleUnassignedRightClick(event) {
	const memberItem = event.target.closest('.clickable-member');
	if (memberItem) {
		event.preventDefault(); // デフォルトのコンテキストメニューを無効化
		
		const memberName = memberItem.dataset.member;
		
		// 未割り当てメンバー用のコンテキストメニューを作成・表示
		const menu = createMemberContextMenu();
		menu.dataset.memberName = memberName;
		menu.dataset.teamId = 'unassigned';
		
		// マウス位置にメニューを表示
		menu.style.left = event.pageX + 'px';
		menu.style.top = event.pageY + 'px';
		menu.style.display = 'block';
		
		console.log(`未割り当てメンバー "${memberName}" を右クリックしました`);
	}
}

// メンバーを欠席から復帰させる処理
function handleReturnFromAbsent(memberName) {
	if (returnMemberFromAbsent(memberName)) {
		renderTeams(); // UI更新
		console.log(`${memberName}を欠席から復帰させました`);
	}
}

// コンテキストメニューの表示管理
let contextMenu = null;

// メンバー用コンテキストメニューを作成
function createMemberContextMenu() {
	if (contextMenu) {
		contextMenu.remove();
	}
	
	contextMenu = document.createElement('div');
	contextMenu.className = 'member-context-menu';
	contextMenu.innerHTML = `
		<div class="context-menu-item" data-action="mark-absent">
			<span>🚫</span> 欠席にする
		</div>
		<div class="context-menu-item" data-action="edit-team">
			<span>✎</span> チーム編集
		</div>
	`;
	
	// メニューアイテムのクリックイベント
	contextMenu.addEventListener('click', handleContextMenuClick);
	
	// 外部クリックでメニューを閉じる
	document.addEventListener('click', closeContextMenu);
	
	document.body.appendChild(contextMenu);
	return contextMenu;
}

// コンテキストメニューを閉じる
function closeContextMenu() {
	if (contextMenu) {
		contextMenu.remove();
		contextMenu = null;
	}
	document.removeEventListener('click', closeContextMenu);
}

// コンテキストメニューのクリック処理
function handleContextMenuClick(event) {
	event.stopPropagation();
	
	const action = event.target.closest('.context-menu-item')?.dataset.action;
	const memberName = contextMenu.dataset.memberName;
	const teamId = contextMenu.dataset.teamId;
	
	if (action === 'mark-absent' && memberName) {
		handleMarkMemberAsAbsent(memberName);
	} else if (action === 'edit-team' && teamId) {
		openTeamEditModal(parseInt(teamId));
	}
	
	closeContextMenu();
}

// メンバーを欠席にする処理
function handleMarkMemberAsAbsent(memberName) {
	if (markMemberAsAbsent(memberName)) {
		renderTeams(); // UI更新
		console.log(`${memberName}を欠席にしました`);
	}
}

export { 
	renderTeams, 
	createMatchTable, 
	handleTeamEditClick, 	handleTableClick,
	handleMemberClick,
	toggleMemberSelection,
	updateMemberPalette,
	assignSelectedMembersToTeam,
	assignSelectedMembersAsAbsent,
	getUnassignedMembers,
	renderUnassignedMembers,
	handleMarkMemberAsAbsent
};
