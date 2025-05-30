// 設定ファイルのデータをロードする関数（config.jsの関数を使用）
async function loadConfig() {
	return await loadConfigData();
}

// トースト通知システム
const toast = {
    // トースト通知を表示する
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // トースト要素を作成
        const toastElement = document.createElement('div');
        toastElement.className = `toast toast-${type}`;
        toastElement.textContent = message;
        
        // コンテナに追加
        container.appendChild(toastElement);
        
        // 自動削除
        setTimeout(() => {
            if (toastElement && toastElement.parentElement) {
                toastElement.parentElement.removeChild(toastElement);
            }
        }, duration);
    },
    
    // 成功通知
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    // エラー通知
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    
    // 情報通知
    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// カスタム確認ダイアログシステム
const customConfirm = {
    dialog: null,
    titleElement: null,
    messageElement: null,
    yesButton: null,
    noButton: null,
    currentResolve: null,
    
    init() {
        this.dialog = document.getElementById('confirm-dialog');
        this.titleElement = document.getElementById('confirm-title');
        this.messageElement = document.getElementById('confirm-message');
        this.yesButton = document.getElementById('confirm-yes-btn');
        this.noButton = document.getElementById('confirm-no-btn');
        
        // ボタンにイベントリスナーを追加
        this.yesButton.addEventListener('click', () => this.handleConfirm(true));
        this.noButton.addEventListener('click', () => this.handleConfirm(false));
    },
    
    show(message, title = '確認') {
        if (!this.dialog) this.init();
        
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;
        this.dialog.classList.add('show');
        
        // Promiseを返して非同期で結果を処理できるようにする
        return new Promise(resolve => {
            this.currentResolve = resolve;
        });
    },
    
    handleConfirm(result) {
        this.dialog.classList.remove('show');
        if (this.currentResolve) {
            this.currentResolve(result);
            this.currentResolve = null;
        }
    }
};

// アプリケーション状態の管理
const appState = {
	teams: [],
	matches: {},
	standings: [],
	settings: {
		matchPoint: 7       // マッチポイント（勝利と最大スコアを決定）
	},
	originalTeams: []      // オリジナルのチーム構成を保存
};

// DOM要素キャッシュ（パフォーマンス最適化）
const domCache = {
	teamsContainer: null,
	tableHeader: null,
	tableBody: null,
	standingsBody: null,
	scoreModal: null,
	teamEditModal: null,
	
	// 初期化関数
	init() {
		this.teamsContainer = document.getElementById('teams-container');
		this.tableHeader = document.getElementById('header-row');
		this.tableBody = document.querySelector('#match-grid tbody');
		this.standingsBody = document.getElementById('standings-body');
		this.scoreModal = document.getElementById('score-modal');
		this.teamEditModal = document.getElementById('team-edit-modal');
	}
};

// ローカルストレージから試合結果を読み込む
function loadMatchResults() {
	const savedMatches = localStorage.getItem('tennisMatchResults');
	if (savedMatches) {
		try {
			appState.matches = JSON.parse(savedMatches);
		} catch (e) {
			console.error('試合結果の読み込みに失敗しました:', e);
			appState.matches = {};
		}
	}
}

// ローカルストレージから設定を読み込む
function loadSettings() {
	const savedSettings = localStorage.getItem('tennisGameSettings');
	if (savedSettings) {
		try {
			const settings = JSON.parse(savedSettings);
			appState.settings = { ...appState.settings, ...settings };
		} catch (e) {
			console.error('設定の読み込みに失敗しました:', e);
		}
	}
}

// ローカルストレージに試合結果を保存する
function saveMatchResults() {
	localStorage.setItem('tennisMatchResults', JSON.stringify(appState.matches));
}

// ローカルストレージに設定を保存する
function saveSettings() {
	localStorage.setItem('tennisGameSettings', JSON.stringify(appState.settings));
}

// ローカルストレージにカスタムチームメンバーを保存
function saveTeamMembers() {
	localStorage.setItem('tennisCustomTeams', JSON.stringify(appState.teams));
}

// ローカルストレージからカスタムチームメンバーを読み込む
function loadTeamMembers() {
	const savedTeams = localStorage.getItem('tennisCustomTeams');
	if (savedTeams) {
		try {
			appState.teams = JSON.parse(savedTeams);
		} catch (e) {
			console.error('チームメンバーの読み込みに失敗しました:', e);
			// 読み込み失敗時は元のチームを使用
			appState.teams = JSON.parse(JSON.stringify(appState.originalTeams));
		}
	}
}

// チーム情報を表示する関数（最適化版）
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

// 対戦表を作成する関数（最適化版）
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

// モーダルの要素（DOM読み込み時に初期化されます）

// モーダルを開く関数（最適化版）
function openScoreModal(rowTeamId, colTeamId, matchId) {
	// モーダルのタイトルと入力ラベルを設定
	document.getElementById('score-modal-title').textContent = `スコア入力`;
	document.getElementById('team1-label').textContent = `チーム${rowTeamId}:`;
	document.getElementById('team2-label').textContent = `チーム${colTeamId}:`;

	// 入力欄の初期化と最大値設定
	const score1Input = document.getElementById('modal-score-team1');
	const score2Input = document.getElementById('modal-score-team2');

	score1Input.value = 0;
	score2Input.value = 0;

	// マッチポイントを取得（最大スコアとして使用）
	const matchPoint = appState.settings.matchPoint;
	score1Input.max = matchPoint;
	score2Input.max = matchPoint;

	// 現在の試合データを保存
	currentMatchData = {
		rowTeamId: rowTeamId,
		colTeamId: colTeamId,
		matchId: matchId
	};

	// モーダルを表示
	const scoreModal = domCache.scoreModal;
	if (scoreModal) {
		scoreModal.style.display = 'block';
	}
}

// モーダルを閉じる関数（最適化版）
function closeScoreModal() {
	const scoreModal = domCache.scoreModal;
	if (scoreModal) {
		scoreModal.style.display = 'none';
	}
	currentMatchData = null;
}

// モーダル関連データ（DOM読み込み時に初期化）
let currentMatchData = null;
let currentEditTeamId = null;
let tempTeamMembers = [];

// DOMが読み込まれた後にモーダル要素を初期化する関数（廃止済み）
function initializeModalElements() {
	console.log('モーダル要素は domCache で管理されています');
}

// チームメンバー編集用モーダルを開く
function openTeamEditModal(teamId) {
	console.log(`チーム${teamId}の編集モーダルを開きます`);
	currentEditTeamId = teamId;

	// モーダルのタイトルを設定
	const modalTitle = document.getElementById('team-edit-modal-title');
	if (modalTitle) {
		modalTitle.textContent = `チーム${teamId} メンバー編集`;
	}

	const teamIdElement = document.getElementById('edit-team-id');
	if (teamIdElement) {
		teamIdElement.textContent = `チーム${teamId}`;
	}

	// 現在のチームメンバーを取得
	const team = appState.teams.find(t => t.id === teamId);
	if (!team) {
		console.error(`チームID ${teamId} が見つかりません`);
		return;
	}

	// 一時的なメンバーリストにコピー
	tempTeamMembers = [...team.members];
	console.log('メンバーリストをコピーしました:', tempTeamMembers);

	// メンバーリストを表示
	renderMembersList();
	// 未割り当てのメンバーリストを表示
	renderUnassignedMembersList();

	// モーダルを表示
	const teamEditModal = domCache.teamEditModal;
	if (teamEditModal) {
		teamEditModal.style.display = 'block';
	} else {
		console.error('チーム編集モーダル要素が見つかりません');
	}
}

// メンバーリストをレンダリング
function renderMembersList() {
	const membersList = document.getElementById('edit-members-list');
	if (!membersList) {
		console.error('メンバーリスト要素が見つかりません');
		return;
	}

	membersList.innerHTML = '';
	console.log('メンバーリストを描画します:', tempTeamMembers);

	tempTeamMembers.forEach((member, index) => {
		const li = document.createElement('li');
		li.className = 'member-item';
		li.innerHTML = `
            <span class="member-name">${member}</span>
            <button class="remove-member-btn" data-index="${index}">×</button>
        `;
		membersList.appendChild(li);
		// 削除ボタンにイベントリスナーを追加
		const removeBtn = li.querySelector('.remove-member-btn');
		if (removeBtn) {
			removeBtn.addEventListener('click', () => {
				// 削除されるメンバーを保存
				const removedMember = tempTeamMembers[index];
				console.log(`メンバー "${removedMember}" を削除します`);

				// チームメンバーリストから削除
				tempTeamMembers.splice(index, 1);

				// リストを更新
				renderMembersList();
				// メンバーが削除されたら、未割り当てのメンバーリストも更新
				renderUnassignedMembersList();
			});
		}
	});
}

// チームメンバーの変更を保存
function saveTeamMembers() {
	console.log('チームメンバーの保存を試みます', currentEditTeamId, tempTeamMembers);

	if (currentEditTeamId === null) {
		console.error('現在編集中のチームIDがnullです');
		toast.error('編集するチームが選択されていません');
		return;
	}

	if (tempTeamMembers.length === 0) {
		toast.error('メンバーを少なくとも1人は登録してください');
		return;
	}

	// メンバーの重複チェック
	const uniqueMembers = [...new Set(tempTeamMembers)];
	if (uniqueMembers.length !== tempTeamMembers.length) {
		toast.error('同じ名前のメンバーが重複しています。メンバー名はそれぞれ一意である必要があります。');
		return;
	}

	// 変更を適用
	const teamIndex = appState.teams.findIndex(t => t.id === currentEditTeamId);
	if (teamIndex !== -1) {
		appState.teams[teamIndex].members = [...tempTeamMembers];
		console.log(`チーム${currentEditTeamId}のメンバーを更新しました:`, appState.teams[teamIndex].members);

		// ローカルストレージに保存
		try {
			localStorage.setItem('tennisCustomTeams', JSON.stringify(appState.teams));
			console.log('メンバー情報をローカルストレージに保存しました');
		} catch (e) {
			console.error('ローカルストレージへの保存に失敗しました:', e);
		}

		// UI更新
		renderTeams();
		// モーダルを閉じる
		closeTeamEditModal();

		toast.success('チームメンバーを更新しました！');
	} else {
		console.error(`チームID ${currentEditTeamId} が見つかりません`);
		toast.error('チーム情報の更新に失敗しました');
	}
}

// チームメンバー編集モーダルを閉じる
function closeTeamEditModal() {
	const teamEditModal = domCache.teamEditModal;
	if (teamEditModal) {
		teamEditModal.style.display = 'none';
		console.log('チーム編集モーダルを閉じました');
	}
	currentEditTeamId = null;
	tempTeamMembers = [];
}

// メンバーを追加
function addNewMember() {
	const unassignedMembersSelect = document.getElementById('unassigned-members-select');
	if (!unassignedMembersSelect) {
		console.error('未割り当てメンバー選択リストが見つかりません');
		return;
	}

	const newMemberName = unassignedMembersSelect.value;
	if (newMemberName) {
		// 重複チェック（念のため）
		if (tempTeamMembers.includes(newMemberName)) {
			toast.error('同じ名前のメンバーが既に存在します');
			return;
		}

		tempTeamMembers.push(newMemberName);
		console.log(`新しいメンバー "${newMemberName}" を追加しました`);
		// メンバーリストと未割り当てのメンバーリストを更新
		renderMembersList();
		renderUnassignedMembersList();
	} else {
		toast.error('追加するメンバーを選択してください');
	}
}

// スコアを保存する関数
function saveScore() {
	if (!currentMatchData) return;

	const { rowTeamId, colTeamId, matchId } = currentMatchData;
	const score1Input = document.getElementById('modal-score-team1');
	const score2Input = document.getElementById('modal-score-team2');

	// 入力値の取得
	let team1Score = parseInt(score1Input.value);
	let team2Score = parseInt(score2Input.value);
	// 入力値のバリデーション
	if (isNaN(team1Score) || isNaN(team2Score) || team1Score < 0 || team2Score < 0) {
		toast.error('スコアは0以上の数字を入力してください');
		return;
	}

	// マッチポイントを取得（最大スコアとして使用）
	const matchPoint = appState.settings.matchPoint;

	// マッチポイントを超える場合は自動的に上限を設定
	if (team1Score > matchPoint) team1Score = matchPoint;
	if (team2Score > matchPoint) team2Score = matchPoint;

	// スコアを保存
	processMatchScore(rowTeamId, colTeamId, matchId, team1Score, team2Score);

	// モーダルを閉じる
	closeScoreModal();
}

// モーダルのイベントリスナー設定
document.addEventListener('DOMContentLoaded', function () {
	// 保存ボタンのクリックイベント
	document.getElementById('save-score-btn').addEventListener('click', saveScore);

	// キャンセルボタンのクリックイベント
	document.getElementById('cancel-score-btn').addEventListener('click', closeScoreModal);

	// 閉じるボタン（×）のクリックイベント - スコア入力モーダルの閉じるボタンを特定
	document.querySelector('#score-modal .close-modal').addEventListener('click', closeScoreModal);
	// モーダル外をクリックした時に閉じる
	window.addEventListener('click', function (event) {
		const scoreModal = domCache.scoreModal;
		if (event.target === scoreModal) {
			closeScoreModal();
		}
	});
});

// チームメンバー編集モーダルのイベントリスナーを初期化
function initializeTeamEditListeners() {
	console.log('チームメンバー編集モーダルのイベントリスナーを初期化します');

	// モーダルの保存ボタンのクリックイベント
	const saveTeamBtn = document.getElementById('save-team-btn');
	if (saveTeamBtn) {
		saveTeamBtn.addEventListener('click', saveTeamMembers);
		console.log('保存ボタンのリスナーを設定しました');
	}

	// キャンセルボタンのクリックイベント
	const cancelTeamBtn = document.getElementById('cancel-team-btn');
	if (cancelTeamBtn) {
		cancelTeamBtn.addEventListener('click', closeTeamEditModal);
		console.log('キャンセルボタンのリスナーを設定しました');
	}

	// 閉じるボタン（×）のクリックイベント - チームメンバー編集モーダル内の閉じるボタンを特定
	const closeModalBtn = document.querySelector('#team-edit-modal .close-modal');
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', closeTeamEditModal);
		console.log('閉じるボタンのリスナーを設定しました');
	}
	// モーダル外をクリックした時に閉じる
	window.addEventListener('click', function (event) {
		const teamEditModal = domCache.teamEditModal;
		if (event.target === teamEditModal) {
			closeTeamEditModal();
		}
	});

	// 新しいメンバーを追加するボタンのクリックイベント
	const addMemberBtn = document.getElementById('add-member-btn');
	if (addMemberBtn) {
		addMemberBtn.addEventListener('click', addNewMember);
		console.log('追加ボタンのリスナーを設定しました');
	}

	// 選択リストが変更されたときのイベント
	const unassignedMembersSelect = document.getElementById('unassigned-members-select');
	if (unassignedMembersSelect) {
		unassignedMembersSelect.addEventListener('change', function () {
			// 選択されたらボタンにフォーカスを移動（使いやすさのため）
			if (this.value) {
				const addMemberBtn = document.getElementById('add-member-btn');
				if (addMemberBtn) addMemberBtn.focus();
			}
		});
		console.log('未割り当てメンバー選択リストのリスナーを設定しました');
	}
}

// イベント委譲によるテーブルクリック処理（最適化版）
function handleTableClick(event) {
	const cell = event.target.closest('td.clickable-cell');
	if (!cell) return;

	const rowTeamId = parseInt(cell.dataset.rowTeamId);
	const colTeamId = parseInt(cell.dataset.colTeamId);
	const matchId = cell.dataset.matchId;
	// 試合結果が既に存在する場合は修正処理
	if (appState.matches[matchId]) {
		// カスタム確認ダイアログを使用
		customConfirm.show('この試合結果を削除して再入力しますか？', '試合結果の修正')
			.then(confirmed => {
				if (confirmed) {
					delete appState.matches[matchId];
					saveMatchResults();
					createMatchTable();
					calculateStandings();
				}
			});
	} else {
		// 新しい試合のスコア入力
		openScoreModal(rowTeamId, colTeamId, matchId);
	}
}

// チームIDからチーム番号を取得する関数（現在は未使用）
// function getTeamNameById(teamId) {
//     return `${teamId}`;
// }

// app.js内の試合結果処理関数（モーダルベース）
function processMatchScore(rowTeamId, colTeamId, matchId, scoreTeam1, scoreTeam2) {
	// マッチポイントを取得（最大スコアとして使用）
	const matchPoint = appState.settings.matchPoint;
	
	// スコアがマッチポイントを超えていたら上限を適用
	if (scoreTeam1 > matchPoint) scoreTeam1 = matchPoint;
	if (scoreTeam2 > matchPoint) scoreTeam2 = matchPoint;

	// 勝者を決定
	let winner;
	if (scoreTeam1 === scoreTeam2) {
		// 同点は引き分け
		winner = null;
	} else if (scoreTeam1 > scoreTeam2) {
		// チーム1のスコアが高ければチーム1が勝ち
		winner = rowTeamId;
	} else {
		// チーム2のスコアが高ければチーム2が勝ち
		winner = colTeamId;
	}

	// 試合結果を保存
	appState.matches[matchId] = {
		team1: rowTeamId,
		team2: colTeamId,
		scoreTeam1: scoreTeam1,
		scoreTeam2: scoreTeam2,
		winner: winner
	};

	// ローカルストレージに保存
	saveMatchResults();

	// UI更新
	createMatchTable();
	calculateStandings();
}

// マッチIDを生成（小さい番号のチームが先）
function getMatchId(team1Id, team2Id) {
	return team1Id < team2Id ? `${team1Id}-${team2Id}` : `${team2Id}-${team1Id}`;
}

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

// 順位表を表示する関数（最適化版）
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

// 試合設定フォームの初期化と処理（最適化版）
function initializeSettingsForm() {
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

// 設定ファイルを読み込んでアプリケーションを初期化
document.addEventListener('DOMContentLoaded', async () => {	const config = await loadConfig();
	if (!config) {
		toast.error('設定ファイルの読み込みに失敗しました。ページを再読み込みしてください。');
		return;
	}

	// オリジナルのチーム構成を保存（リセット用）
	appState.originalTeams = JSON.parse(JSON.stringify(config.teams));

	// 初期データとして設定
	appState.teams = JSON.parse(JSON.stringify(config.teams));

	// 設定ファイルから初期設定を読み込み
	if (config.matchSettings) {
		appState.settings.matchPoint = config.matchSettings.matchPoint || 7;
	}
	// 保存された設定と試合結果を読み込む
	loadSettings();
	loadMatchResults();
	loadTeamMembers(); // カスタムチームメンバーがあれば読み込む

	// DOM要素キャッシュを初期化
	domCache.init();
	// UI初期化
	renderTeams();
	createMatchTable();
	initializeSettingsForm();
	calculateStandings();

	// エクスポートボタンのイベントリスナーを追加
	document.getElementById('export-results-btn').addEventListener('click', exportMatchAnalysis);
	// チームメンバー編集用のモーダルのイベントリスナー設定
	initializeTeamEditListeners();
	initializeModalElements(); // モーダル要素の初期化を追加
	
	// カスタム確認ダイアログを初期化
	customConfirm.init();

	// リセットボタンのイベントリスナーを追加
	const resetButton = document.getElementById('reset-teams-btn');
	if (resetButton) {
		resetButton.addEventListener('click', resetToOriginalTeams);
	}
});

// オリジナルのチーム構成にリセットする機能
async function resetToOriginalTeams() {
	const confirmed = await customConfirm.show('すべてのチームをオリジナルの構成にリセットしますか？この操作は元に戻せません。', 'リセット確認');
	
	if (confirmed) {
		// オリジナルのチーム構成をコピー
		appState.teams = JSON.parse(JSON.stringify(appState.originalTeams));

		// ローカルストレージから現在のカスタム設定を削除
		try {
			localStorage.removeItem('tennisCustomTeams');
			console.log('カスタムチーム設定をローカルストレージから削除しました');
		} catch (e) {
			console.error('ローカルストレージからの削除に失敗しました:', e);
		}
		// UI更新
		renderTeams();
		toast.success('すべてのチームをオリジナルの構成にリセットしました');
	}
}

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
		fetch('config.json')
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

// 未割り当てのメンバーリストを取得する関数
function getUnassignedMembers() {
	// 全チームのメンバーを取得
	const allAssignedMembers = [];

	// 現在編集中のチーム以外の全てのチームのメンバーを取得
	appState.teams.forEach(team => {
		if (team.id !== currentEditTeamId) {
			allAssignedMembers.push(...team.members);
		}
	});

	// オリジナルの全メンバーリストを取得
	const allOriginalMembers = [];
	appState.originalTeams.forEach(team => {
		allOriginalMembers.push(...team.members);
	});

	// 編集中のチームのオリジナルメンバーを取得
	const originalTeam = appState.originalTeams.find(team => team.id === currentEditTeamId);
	const originalTeamMembers = originalTeam ? originalTeam.members : [];

	// 未割り当てのメンバー = オリジナルの全メンバー - 他のチームに割り当て済みのメンバー
	const unassignedMembers = allOriginalMembers.filter(member => {
		// 他のチームに割り当て済みでないメンバー、もしくは
		// 元々現在のチームにいたメンバー（これにより削除されたメンバーも未割当として表示される）
		return !allAssignedMembers.includes(member) || originalTeamMembers.includes(member);
	});

	// 現在編集中のチームに既に割り当てられているメンバーは除外（重複を防ぐ）
	return unassignedMembers.filter(member => !tempTeamMembers.includes(member));
}

// 未割り当てのメンバーリストを表示する関数
function renderUnassignedMembersList() {
	const unassignedMembersSelect = document.getElementById('unassigned-members-select');
	if (!unassignedMembersSelect) {
		console.error('未割り当てメンバー選択リストが見つかりません');
		return;
	}

	// 選択リストをリセット
	unassignedMembersSelect.innerHTML = '<option value="">-- 未割り当てのメンバーを選択 --</option>';

	// 未割り当てのメンバーを取得
	const unassignedMembers = getUnassignedMembers();
	console.log('未割り当てのメンバー:', unassignedMembers);

	// 未割り当てのメンバーがない場合
	if (unassignedMembers.length === 0) {
		const option = document.createElement('option');
		option.value = "";
		option.disabled = true;
		option.textContent = "利用可能なメンバーがありません";
		unassignedMembersSelect.appendChild(option);
	} else {
		// オリジナルチームの情報を取得
		const originalTeam = appState.originalTeams.find(team => team.id === currentEditTeamId);
		const originalTeamMembers = originalTeam ? originalTeam.members : [];

		// 未割り当てのメンバーをリストに追加
		unassignedMembers.forEach(member => {
			const option = document.createElement('option');
			option.value = member;

			// 元々このチームのメンバーだった場合、特別に表示
			if (originalTeamMembers.includes(member)) {
				option.textContent = `${member} (元のメンバー)`;
				option.classList.add('original-member');
			} else {
				option.textContent = member;
			}

			unassignedMembersSelect.appendChild(option);
		});
	}
}
