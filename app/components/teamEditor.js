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
	// 利用可能なメンバーリストを表示
	renderAvailableMembersList();

	// モーダルを表示
	const teamEditModal = domCache.teamEditModal;
	if (teamEditModal) {
		teamEditModal.style.display = 'block';
	} else {
		console.error('チーム編集モーダル要素が見つかりません');
	}
}

// モーダルを閉じる関数
function closeTeamEditModal() {
	const teamEditModal = domCache.teamEditModal;
	if (teamEditModal) {
		teamEditModal.style.display = 'none';
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
				tempTeamMembers.splice(index, 1);				// リストを更新
				renderMembersList();
				// メンバーが削除されたら、利用可能なメンバーリストも更新
				renderAvailableMembersList();
			});
		}
	});
}

// メンバーを追加（元のチームから自動削除）
function addNewMember() {
	const availableMembersSelect = document.getElementById('unassigned-members-select');
	if (!availableMembersSelect) {
		console.error('メンバー選択リストが見つかりません');
		return;
	}

	const newMemberName = availableMembersSelect.value;
	if (newMemberName) {
		// 重複チェック（念のため）
		if (tempTeamMembers.includes(newMemberName)) {
			toast.error('同じ名前のメンバーが既に存在します');
			return;
		}

		// 元のチームからメンバーを削除
		const currentTeam = findCurrentTeamForMember(newMemberName);
		if (currentTeam) {
			const memberIndex = currentTeam.members.indexOf(newMemberName);
			if (memberIndex !== -1) {
				currentTeam.members.splice(memberIndex, 1);
				console.log(`メンバー "${newMemberName}" をチーム${currentTeam.id}から削除しました`);
			}
		}

		// 編集中のチームに追加
		tempTeamMembers.push(newMemberName);
		console.log(`新しいメンバー "${newMemberName}" をチーム${currentEditTeamId}に追加しました`);
		
		// メンバーリストと利用可能なメンバーリストを更新
		renderMembersList();
		renderAvailableMembersList();
		
		// 選択をリセット
		availableMembersSelect.value = '';
	} else {
		toast.error('追加するメンバーを選択してください');
	}
}

// 指定されたメンバーが現在所属しているチームを見つける関数
function findCurrentTeamForMember(memberName) {
	return appState.teams.find(team => team.members.includes(memberName));
}

// 全メンバーリストを取得する関数（現在編集中のチームに既にいるメンバーは除外）
function getAllAvailableMembers() {
	// オリジナルの全メンバーリストを取得
	const allOriginalMembers = [];
	appState.originalTeams.forEach(team => {
		allOriginalMembers.push(...team.members);
	});

	// 現在編集中のチームに既に割り当てられているメンバーは除外（重複を防ぐ）
	return allOriginalMembers.filter(member => !tempTeamMembers.includes(member));
}

// 利用可能なメンバーリストを表示する関数
function renderAvailableMembersList() {
	const availableMembersSelect = document.getElementById('unassigned-members-select');
	if (!availableMembersSelect) {
		console.error('メンバー選択リストが見つかりません');
		return;
	}

	// 選択リストをリセット
	availableMembersSelect.innerHTML = '<option value="">-- メンバーを選択してチームに追加 --</option>';

	// 利用可能なメンバーを取得
	const availableMembers = getAllAvailableMembers();
	console.log('利用可能なメンバー:', availableMembers);

	// 利用可能なメンバーがない場合
	if (availableMembers.length === 0) {
		const option = document.createElement('option');
		option.value = "";
		option.disabled = true;
		option.textContent = "追加可能なメンバーがありません";
		availableMembersSelect.appendChild(option);
	} else {
		// 現在どのチームに所属しているかを取得するヘルパー関数
		const getCurrentTeamForMember = (memberName) => {
			for (let team of appState.teams) {
				if (team.members.includes(memberName)) {
					return team.id;
				}
			}
			return null;
		};

		// 利用可能なメンバーをリストに追加
		availableMembers.forEach(member => {
			const option = document.createElement('option');
			option.value = member;

			// 現在どのチームに所属しているかを表示
			const currentTeam = getCurrentTeamForMember(member);
			if (currentTeam) {
				option.textContent = `${member} (現在: チーム${currentTeam})`;
				option.classList.add('assigned-member');
			} else {
				option.textContent = `${member} (未所属)`;
				option.classList.add('unassigned-member');
			}

			availableMembersSelect.appendChild(option);
		});
	}
}

// チームメンバーを保存する関数
function saveTeamMembersHandler(renderTeams) {
	if (currentEditTeamId !== null) {
		// メンバーが存在する場合のみ重複チェック（0人のチームも保存可能）
		if (tempTeamMembers.length > 0) {
			const uniqueMembers = [...new Set(tempTeamMembers)];
			if (uniqueMembers.length !== tempTeamMembers.length) {
				toast.error('同じ名前のメンバーが重複しています。メンバー名はそれぞれ一意である必要があります。');
				return;
			}
		}
		
		const result = saveTeamMembers(currentEditTeamId, tempTeamMembers);
		if (result) {
			renderTeams();
			closeTeamEditModal();
			if (tempTeamMembers.length === 0) {
				toast.success('チームメンバーをクリアしました！');
			} else {
				toast.success('チームメンバーを更新しました！');
			}
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
		console.log('メンバー選択リストのリスナーを設定しました');
	}
}

export { 
	openTeamEditModal, 
	closeTeamEditModal, 
	renderMembersList, 
	addNewMember,
	getAllAvailableMembers,
	renderAvailableMembersList,
	findCurrentTeamForMember,
	saveTeamMembersHandler,
	initializeTeamEditListeners,
	currentEditTeamId,
	tempTeamMembers
};
