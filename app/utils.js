// 汎用ユーティリティ関数

// 汎用ローカルストレージ操作関数
function saveToLocalStorage(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error(`${key} の保存に失敗しました:`, e);
	}
}

function loadFromLocalStorage(key, defaultValue = null) {
	const saved = localStorage.getItem(key);
	if (saved) {
		try {
			return JSON.parse(saved);
		} catch (e) {
			console.error(`${key} の読み込みに失敗しました:`, e);
		}
	}
	return defaultValue;
}

// ローカルストレージから項目を削除する共通関数
function removeFromLocalStorage(key) {
	try {
		localStorage.removeItem(key);
		console.log(`${key} をローカルストレージから削除しました`);
		return true;
	} catch (e) {
		console.error(`${key} の削除に失敗しました:`, e);
		return false;
	}
}

// 複数のローカルストレージキーを一度に削除
function removeMultipleFromLocalStorage(keys) {
	const results = {};
	keys.forEach(key => {
		results[key] = removeFromLocalStorage(key);
	});
	return results;
}

// セッションストレージ操作関数
function saveToSessionStorage(key, value) {
	try {
		sessionStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error(`${key} のセッション保存に失敗しました:`, e);
	}
}

function loadFromSessionStorage(key, defaultValue = null) {
	try {
		const saved = sessionStorage.getItem(key);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (e) {
		console.error(`${key} のセッション読み込みに失敗しました:`, e);
	}
	return defaultValue;
}

// マッチIDを生成（小さい番号のチームが先）
function getMatchId(team1Id, team2Id) {
	return team1Id < team2Id ? `T${team1Id}_vs_T${team2Id}` : `T${team2Id}_vs_T${team1Id}`;
}

// 統計計算共通関数
function calculateTeamStats(teams, matches) {
	const teamStats = {};
	
	// チームの初期統計を作成
	teams.forEach(team => {
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
	Object.values(matches).forEach(match => {
		const team1 = match.team1;
		const team2 = match.team2;
		const score1 = match.scoreTeam1;
		const score2 = match.scoreTeam2;
		
		if (score1 !== null && score2 !== null && teamStats[team1] && teamStats[team2]) {
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

// 共通の設定ファイル読み込みロジック
async function fetchConfigWithPaths(paths = ['config.json', '/config.json', '../config.json', './config.json']) {
	for (const path of paths) {
		try {
			console.log(`${path} の読み込みを試みます...`);
			const response = await fetch(path);
			if (response.ok) {
				console.log(`${path} が正常に読み込まれました`);
				const data = await response.json();
				return data;
			}
		} catch (e) {
			console.log(`${path}の読み込みに失敗: ${e.message}`);
		}
	}
	throw new Error('全てのパスでの設定ファイル読み込みに失敗しました');
}

// 日時フォーマット共通関数
function formatDateTime(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 共通イベントリスナー管理機能
class EventListenerManager {
	static safeAddEventListener(element, eventType, handler, options = {}) {
		if (!element || typeof handler !== 'function') {
			console.warn('無効な要素またはハンドラーです:', element, handler);
			return false;
		}
		
		try {
			element.addEventListener(eventType, handler, options);
			return true;
		} catch (error) {
			console.error(`イベントリスナーの追加に失敗しました:`, error);
			return false;
		}
	}
	
	static safeRemoveEventListener(element, eventType, handler, options = {}) {
		if (!element || typeof handler !== 'function') {
			return false;
		}
		
		try {
			element.removeEventListener(eventType, handler, options);
			return true;
		} catch (error) {
			console.error(`イベントリスナーの削除に失敗しました:`, error);
			return false;
		}
	}
	
	// removeして再addする安全な更新パターン
	static updateEventListener(element, eventType, handler, options = {}) {
		if (!element || typeof handler !== 'function') {
			console.warn('無効な要素またはハンドラーです:', element, handler);
			return false;
		}
		
		this.safeRemoveEventListener(element, eventType, handler, options);
		return this.safeAddEventListener(element, eventType, handler, options);
	}
	
	// 複数のイベントリスナーを一度に設定
	static addMultipleListeners(element, eventHandlers) {
		if (!element || !eventHandlers || typeof eventHandlers !== 'object') {
			console.warn('無効な要素またはイベントハンドラーです:', element, eventHandlers);
			return false;
		}
		
		let success = true;
		Object.entries(eventHandlers).forEach(([eventType, handler]) => {
			if (!this.safeAddEventListener(element, eventType, handler)) {
				success = false;
			}
		});
		
		return success;
	}
}

// モーダル外クリックの共通処理
function addModalOutsideClickHandler(modalElement, closeHandler) {
	if (!modalElement || typeof closeHandler !== 'function') {
		console.warn('無効なモーダル要素または閉じるハンドラーです');
		return false;
	}
	
	const outsideClickHandler = function(event) {
		if (event.target === modalElement) {
			closeHandler();
		}
	};
	
	return EventListenerManager.safeAddEventListener(window, 'click', outsideClickHandler);
}

// 数値入力制限の共通処理
function addNumberInputRestriction(inputElement) {
	if (!inputElement || inputElement.type !== 'number') {
		console.warn('無効な数値入力要素です:', inputElement);
		return false;
	}
	
	const restrictToNumbers = function(e) {
		const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
		if (allowedKeys.includes(e.key) || (e.key >= '0' && e.key <= '9')) {
			return;
		}
		e.preventDefault();
	};
	
	const preventNegative = function() {
		if (this.value < 0) {
			this.value = 0;
		}
	};
	
	const selectOnFocus = function() {
		this.select();
	};
	
	const eventHandlers = {
		'keydown': restrictToNumbers,
		'input': preventNegative,
		'focus': selectOnFocus
	};
	
	return EventListenerManager.addMultipleListeners(inputElement, eventHandlers);
}

export {
	saveToLocalStorage,
	loadFromLocalStorage,
	removeFromLocalStorage,
	removeMultipleFromLocalStorage,
	saveToSessionStorage,
	loadFromSessionStorage,
	getMatchId,
	calculateTeamStats,
	fetchConfigWithPaths,
	formatDateTime,
	EventListenerManager,
	addModalOutsideClickHandler,
	addNumberInputRestriction
};
