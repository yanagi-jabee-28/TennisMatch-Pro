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

// マッチIDを生成（小さい番号のチームが先）
function getMatchId(team1Id, team2Id) {
	return team1Id < team2Id ? `T${team1Id}_vs_T${team2Id}` : `T${team2Id}_vs_T${team1Id}`;
}

export {
	saveToLocalStorage,
	loadFromLocalStorage,
	getMatchId
};
