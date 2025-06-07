// 編成選択機能

import { formations } from './formations.js';
import { appState, saveTeamMembers, saveAbsentTeam, addToFormationHistory, loadFormationHistory } from './state.js';
import { toast } from './components/toast.js';
import { customConfirm } from './components/customConfirm.js';
import { EventListenerManager } from './utils.js';

// 編成選択機能を初期化する
function initializeFormationSelector(renderTeamsCallback, createMatchTableCallback, calculateStandingsCallback) {
	console.log('編成選択機能を初期化しています...');
	console.log('利用可能な編成数:', Object.keys(formations).length);
	
	const formationSelector = document.getElementById('formation-selector');
	const applyFormationBtn = document.getElementById('apply-formation-btn');
	const currentFormationName = document.getElementById('current-formation-name');
	const formationHistoryList = document.getElementById('formation-history-list');
	
	if (!formationSelector || !applyFormationBtn || !currentFormationName || !formationHistoryList) {
		console.error('編成選択要素が見つかりません');
		console.error('formationSelector:', !!formationSelector);
		console.error('applyFormationBtn:', !!applyFormationBtn);
		console.error('currentFormationName:', !!currentFormationName);
		console.error('formationHistoryList:', !!formationHistoryList);
		return;
	}

	console.log('編成選択要素が見つかりました');
	
	// 編成履歴を読み込み
	loadFormationHistory();
	console.log('編成履歴読み込み完了:', appState.formationHistory);
	
	// 編成オプションをセレクトボックスに追加
	populateFormationOptions(formationSelector);
	
	// 現在の編成を表示
	updateCurrentFormationDisplay(currentFormationName);
	
	// 編成履歴を表示
	updateFormationHistoryDisplay(formationHistoryList);

	// 編成選択時のイベントリスナー
	EventListenerManager.safeAddEventListener(formationSelector, 'change', (e) => {
		const selectedFormation = e.target.value;
		applyFormationBtn.disabled = !selectedFormation;
	});

	// 編成適用ボタンのイベントリスナー
	EventListenerManager.safeAddEventListener(applyFormationBtn, 'click', async () => {
		const selectedFormation = formationSelector.value;
		if (!selectedFormation) return;

		const confirmed = await customConfirm.show(
			`${formations[selectedFormation].name}を適用しますか？現在のチーム構成は上書きされます。`,
			'編成適用の確認'
		);
		if (confirmed) {
			try {
				applyFormation(selectedFormation);
				
				// 履歴に追加
				addToFormationHistory(selectedFormation, formations[selectedFormation].name);
				
				// UI更新
				renderTeamsCallback();
				createMatchTableCallback();
				calculateStandingsCallback();
				updateCurrentFormationDisplay(document.getElementById('current-formation-name'));
				updateFormationHistoryDisplay(document.getElementById('formation-history-list'));
				
				toast.success(`${formations[selectedFormation].name}を適用しました`);
			} catch (error) {
				console.error('編成適用中にエラーが発生しました:', error);
				toast.error('編成の適用に失敗しました');
			}
			
			// 選択をリセット
			formationSelector.value = '';
			applyFormationBtn.disabled = true;
		}
	});

	// 履歴項目のクリックイベントリスナー
	EventListenerManager.safeAddEventListener(formationHistoryList, 'click', async (e) => {
		const historyItem = e.target.closest('.formation-history-item');
		if (!historyItem) return;
		
		const formationKey = historyItem.dataset.formationKey;
		if (!formationKey || !formations[formationKey]) return;
		
		const confirmed = await customConfirm.show(
			`${formations[formationKey].name}を再適用しますか？現在のチーム構成は上書きされます。`,
			'編成再適用の確認'
		);
		if (confirmed) {
			try {
				applyFormation(formationKey);
				
				// 履歴の先頭に移動
				addToFormationHistory(formationKey, formations[formationKey].name);
				
				// UI更新
				renderTeamsCallback();
				createMatchTableCallback();
				calculateStandingsCallback();
				updateCurrentFormationDisplay(currentFormationName);
				updateFormationHistoryDisplay(formationHistoryList);
				
				toast.success(`${formations[formationKey].name}を再適用しました`);
			} catch (error) {
				console.error('編成再適用中にエラーが発生しました:', error);
				toast.error('編成の再適用に失敗しました');
			}
		}
	});
}

// 編成オプションをセレクトボックスに追加
function populateFormationOptions(selectElement) {
	console.log('編成オプションを追加しています...');
	
	// 既存のオプション（最初のデフォルトオプション以外）をクリア
	const defaultOption = selectElement.querySelector('option[value=""]');
	selectElement.innerHTML = '';
	if (defaultOption) {
		selectElement.appendChild(defaultOption);
	}

	// 編成オプションを追加
	Object.entries(formations).forEach(([key, formation]) => {
		const option = document.createElement('option');
		option.value = key;
		option.textContent = formation.name;
		selectElement.appendChild(option);
	});
	
	console.log(`${Object.keys(formations).length}個の編成オプションを追加しました`);
}

// 選択された編成を適用する
function applyFormation(formationKey) {
	const formation = formations[formationKey];
	if (!formation) {
		console.error('無効な編成キーです:', formationKey);
		throw new Error(`無効な編成キー: ${formationKey}`);
	}

	console.log('編成を適用中:', formation.name);

	// チーム構成を更新
	appState.teams = formation.teams.map(team => ({
		id: team.id,
		members: [...team.members]
	}));

	// 欠席メンバーがある場合は欠席チームに設定
	if (formation.absentMembers && formation.absentMembers.length > 0) {
		appState.absentTeam.members = [...formation.absentMembers];
	} else {
		appState.absentTeam.members = [];
	}

	// チーム参加状態をリセット
	appState.teamParticipation = {};
	appState.teams.forEach(team => {
		appState.teamParticipation[team.id] = { 
			active: team.members.length > 0 
		};
	});
	
	// 変更をローカルストレージに保存
	try {
		saveTeamMembers(null, null);
		saveAbsentTeam();
		console.log('編成を正常に適用しました:', formation.name);
	} catch (error) {
		console.error('編成保存中にエラーが発生しました:', error);
		throw error;
	}
}

// 現在の編成を特定の編成データと比較
function isCurrentFormationMatching(formationKey) {
	const formation = formations[formationKey];
	if (!formation) return false;

	// チーム数の確認
	if (appState.teams.length !== formation.teams.length) return false;

	// 各チームのメンバーを比較
	for (const team of formation.teams) {
		const currentTeam = appState.teams.find(t => t.id === team.id);
		if (!currentTeam) return false;

		// メンバー数の確認
		if (currentTeam.members.length !== team.members.length) return false;

		// メンバーの内容を確認（順序は問わない）
		const currentMembers = [...currentTeam.members].sort();
		const formationMembers = [...team.members].sort();
		
		for (let i = 0; i < currentMembers.length; i++) {
			if (currentMembers[i] !== formationMembers[i]) return false;
		}
	}

	// 欠席メンバーの確認
	const currentAbsentMembers = [...(appState.absentTeam.members || [])].sort();
	const formationAbsentMembers = [...(formation.absentMembers || [])].sort();
	
	if (currentAbsentMembers.length !== formationAbsentMembers.length) return false;
	
	for (let i = 0; i < currentAbsentMembers.length; i++) {
		if (currentAbsentMembers[i] !== formationAbsentMembers[i]) return false;
	}

	return true;
}

// 現在の編成を識別する
function identifyCurrentFormation() {
	// まず保存されている現在の編成をチェック
	if (appState.currentFormation && formations[appState.currentFormation]) {
		if (isCurrentFormationMatching(appState.currentFormation)) {
			return appState.currentFormation;
		}
	}
	
	// 全ての編成と比較して一致するものを探す
	for (const [key, formation] of Object.entries(formations)) {
		if (isCurrentFormationMatching(key)) {
			appState.currentFormation = key;
			return key;
		}
	}
	
	// 一致する編成が見つからない場合
	appState.currentFormation = null;
	return null;
}

// 現在の編成表示を更新
function updateCurrentFormationDisplay(element) {
	if (!element) {
		console.error('現在の編成表示要素が見つかりません');
		return;
	}
	
	const currentFormationKey = identifyCurrentFormation();
	console.log('現在の編成識別結果:', currentFormationKey);
	
	if (currentFormationKey && formations[currentFormationKey]) {
		element.textContent = formations[currentFormationKey].name;
		element.parentElement.style.display = 'flex';
		console.log('現在の編成表示を更新:', formations[currentFormationKey].name);
	} else {
		element.textContent = 'カスタム編成';
		element.parentElement.style.display = 'flex';
		console.log('現在の編成表示をカスタム編成に設定');
	}
}

// 編成履歴表示を更新
function updateFormationHistoryDisplay(element) {
	if (!element) {
		console.error('編成履歴表示要素が見つかりません');
		return;
	}
	
	element.innerHTML = '';
	console.log('編成履歴を更新中:', appState.formationHistory);
	
	if (appState.formationHistory.length === 0) {
		const emptyDiv = document.createElement('div');
		emptyDiv.className = 'formation-history-empty';
		emptyDiv.textContent = '編成履歴はありません';
		element.appendChild(emptyDiv);
		return;
	}
	
	appState.formationHistory.forEach((entry, index) => {
		console.log(`履歴項目 ${index}:`, entry);
		
		const historyItem = document.createElement('div');
		historyItem.className = 'formation-history-item';
		historyItem.dataset.formationKey = entry.key;
		
		const nameSpan = document.createElement('span');
		nameSpan.className = 'formation-history-name';
		nameSpan.textContent = entry.name;
		
		const timeSpan = document.createElement('span');
		timeSpan.className = 'formation-history-time';
		const date = new Date(entry.timestamp);
		timeSpan.textContent = date.toLocaleString('ja-JP', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		
		historyItem.appendChild(nameSpan);
		historyItem.appendChild(timeSpan);
		element.appendChild(historyItem);
	});
}

export { 
	initializeFormationSelector, 
	applyFormation, 
	isCurrentFormationMatching 
};
