// スコア入力用モーダル

import { domCache } from '../dom.js';
import { appState, saveMatchResults } from '../state.js';
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
	};	// モーダルを表示
	const scoreModal = domCache.scoreModal;
	if (scoreModal) {
		scoreModal.classList.add('show');
		
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
		scoreModal.classList.remove('show');
		// スマートフォンChrome対応：強制的にdisplayをnoneに
		setTimeout(() => {
			if (!scoreModal.classList.contains('show')) {
				scoreModal.style.display = 'none';
			}
		}, 50);
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
	// 保存ボタンのクリックイベント
	document.getElementById('save-score-btn').addEventListener('click', () => saveScore(createMatchTable, calculateStandings));

	// キャンセルボタンのクリックイベント
	document.getElementById('cancel-score-btn').addEventListener('click', closeScoreModal);

	// 閉じるボタン（×）のクリックイベント - スコア入力モーダルの閉じるボタンを特定
	document.querySelector('#score-modal .close-modal').addEventListener('click', closeScoreModal);
	
	// 入力フィールドのフォーカス時に全選択する
	const score1Input = document.getElementById('modal-score-team1');
	const score2Input = document.getElementById('modal-score-team2');
	
	score1Input.addEventListener('focus', function() {
		this.select();
	});
	
	score2Input.addEventListener('focus', function() {
		this.select();
	});
		// Enterキーで次のフィールドに移動、またはフォームを送信
	score1Input.addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			score2Input.focus();
		}
	});
	
	score2Input.addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveScore(createMatchTable, calculateStandings);
		}
	});
	
	// 数字以外の入力を制限（デリートキーやバックスペースは許可）
	function restrictToNumbers(e) {
		const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
		if (allowedKeys.includes(e.key) || (e.key >= '0' && e.key <= '9')) {
			return;
		}
		e.preventDefault();
	}
	
	score1Input.addEventListener('keydown', restrictToNumbers);
	score2Input.addEventListener('keydown', restrictToNumbers);
	
	// 負の値を防ぐ
	function preventNegative() {
		if (this.value < 0) {
			this.value = 0;
		}
	}
	
	score1Input.addEventListener('input', preventNegative);
	score2Input.addEventListener('input', preventNegative);
	
	// モーダル外をクリックした時に閉じる
	window.addEventListener('click', function (event) {
		const scoreModal = domCache.scoreModal;
		if (event.target === scoreModal) {
			closeScoreModal();
		}
	});
}

export { 
	openScoreModal, 
	closeScoreModal, 
	saveScore, 
	processMatchScore, 
	initializeScoreModalListeners,
	currentMatchData 
};
