// スコア入力用モーダル

import { domCache } from '../dom.js';
import { appState, saveMatchResults } from '../state.js';
import { getMatchId, EventListenerManager, addModalOutsideClickHandler, addNumberInputRestriction } from '../utils.js';
import { toast } from './toast.js';

// モーダル関連データ
let currentMatchData = null;

// モーダルを開く関数（最適化版）
function openScoreModal(rowTeamId, colTeamId, matchId) {
	// モーダルのタイトルと入力ラベルを設定
	document.getElementById('score-modal-title').textContent = `スコア入力`;
	document.getElementById('team1-label').textContent = `チーム${rowTeamId}:`;
	document.getElementById('team2-label').textContent = `チーム${colTeamId}:`;

	// 入力欄の初期化と最大値設定
	const score1Input = document.getElementById('modal-score-team1');
	const score2Input = document.getElementById('modal-score-team2');
	// 既存のデータがある場合は、それを表示する
	if (appState.matches[matchId]) {
		score1Input.value = appState.matches[matchId].scoreTeam1;
		score2Input.value = appState.matches[matchId].scoreTeam2;
	} else {
		// 新規入力の場合は空にして入力しやすくする
		score1Input.value = '';
		score2Input.value = '';
	}
	
	// プレースホルダーを設定
	score1Input.placeholder = '0';
	score2Input.placeholder = '0';

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
		
		// モーダルが表示されたら最初の入力フィールドにフォーカスを当てる
		setTimeout(() => {
			score1Input.focus();
			score1Input.select(); // 既存の値がある場合は全選択
		}, 100);
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

// スコアを保存する関数
function saveScore(createMatchTable, calculateStandings) {
	if (!currentMatchData) return;

	const { rowTeamId, colTeamId, matchId } = currentMatchData;
	const score1Input = document.getElementById('modal-score-team1');
	const score2Input = document.getElementById('modal-score-team2');
	// 入力値の取得（空の場合は0として扱う）
	let team1Score = score1Input.value === '' ? 0 : parseInt(score1Input.value);
	let team2Score = score2Input.value === '' ? 0 : parseInt(score2Input.value);
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
	processMatchScore(rowTeamId, colTeamId, matchId, team1Score, team2Score, createMatchTable, calculateStandings);

	// モーダルを閉じる
	closeScoreModal();
}

// 試合結果処理関数
function processMatchScore(rowTeamId, colTeamId, matchId, scoreTeam1, scoreTeam2, createMatchTable, calculateStandings) {
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

// モーダルのイベントリスナー設定
function initializeScoreModalListeners(createMatchTable, calculateStandings) {
	// ボタンのイベントリスナー設定
	const saveBtn = document.getElementById('save-score-btn');
	const cancelBtn = document.getElementById('cancel-score-btn');
	const closeBtn = document.querySelector('#score-modal .close-modal');
	
	if (saveBtn) EventListenerManager.safeAddEventListener(saveBtn, 'click', () => saveScore(createMatchTable, calculateStandings));
	if (cancelBtn) EventListenerManager.safeAddEventListener(cancelBtn, 'click', closeScoreModal);
	if (closeBtn) EventListenerManager.safeAddEventListener(closeBtn, 'click', closeScoreModal);
	
	// 入力フィールドの設定
	const score1Input = document.getElementById('modal-score-team1');
	const score2Input = document.getElementById('modal-score-team2');
	
	// 数値入力制限を適用
	if (score1Input) addNumberInputRestriction(score1Input);
	if (score2Input) addNumberInputRestriction(score2Input);
	
	// Enterキーでのフィールド移動
	if (score1Input && score2Input) {
		EventListenerManager.safeAddEventListener(score1Input, 'keypress', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				score2Input.focus();
			}
		});
		
		EventListenerManager.safeAddEventListener(score2Input, 'keypress', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				saveScore(createMatchTable, calculateStandings);
			}
		});
	}
	
	// モーダル外クリックで閉じる
	addModalOutsideClickHandler(domCache.scoreModal, closeScoreModal);
}

export { 
	openScoreModal, 
	closeScoreModal, 
	saveScore, 
	processMatchScore, 
	initializeScoreModalListeners,
	currentMatchData 
};
