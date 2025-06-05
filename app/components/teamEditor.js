// チームメンバー編集用モーダル

import { domCache } from '../dom.js';
import { appState, saveTeamMembers } from '../state.js';
import { toast } from './toast.js';

// モーダル関連データ
let currentEditTeamId = null;
let tempTeamMembers = [];

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
		teamEditModal.classList.add('show');
	}else {
		console.error('チーム編集モーダル要素が見つかりません');
	}
}

// モーダルを閉じる関数
function closeTeamEditModal() {
	const teamEditModal = domCache.teamEditModal;
	if (teamEditModal) {
		teamEditModal.classList.remove('show');
	}
	currentEditTeamId = null;
	tempTeamMembers = [];
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

// チームメンバーを保存する関数
function saveTeamMembersHandler(renderTeams) {
	if (currentEditTeamId !== null && tempTeamMembers.length > 0) {
		// 重複チェック
		const uniqueMembers = [...new Set(tempTeamMembers)];
		if (uniqueMembers.length !== tempTeamMembers.length) {
			toast.error('同じ名前のメンバーが重複しています。メンバー名はそれぞれ一意である必要があります。');
			return;
		}
		
		const result = saveTeamMembers(currentEditTeamId, tempTeamMembers);
		if (result) {
			renderTeams();
			closeTeamEditModal();
			toast.success('チームメンバーを更新しました！');
		} else {
			toast.error('チーム情報の更新に失敗しました');
		}
	}
}

// チーム編集モーダルのイベントリスナーを初期化
function initializeTeamEditListeners(renderTeams) {
	console.log('チームメンバー編集モーダルのイベントリスナーを初期化します');

	// モーダルの保存ボタンのクリックイベント
	const saveTeamBtn = document.getElementById('save-team-btn');
	if (saveTeamBtn) {
		saveTeamBtn.addEventListener('click', () => saveTeamMembersHandler(renderTeams));
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

export { 
	openTeamEditModal, 
	closeTeamEditModal, 
	renderMembersList, 
	addNewMember,
	getUnassignedMembers,
	renderUnassignedMembersList,
	saveTeamMembersHandler,
	initializeTeamEditListeners,
	currentEditTeamId,
	tempTeamMembers
};
