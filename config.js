// 設定ファイルを読み込むためのJSファイル

// 設定データを一度だけ読み込むためのPromiseキャッシュ
let configPromise = null;

// JavaScriptで設定ファイルを読み込む（キャッシュ機能付き）
async function loadConfigData() {
	// 既に読み込み処理が開始されている場合は同じPromiseを返す
	if (configPromise) {
		return configPromise;
	}

	configPromise = (async () => {
		try {
			const response = await fetch('config.json');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			console.log('設定ファイルを正常に読み込みました');
			return data;
		} catch (error) {
			console.error('設定ファイルの読み込みに失敗しました:', error);
			// エラー時はPromiseキャッシュをクリアして再試行可能にする
			configPromise = null;
			return null;
		}
	})();

	return configPromise;
}

// 他のスクリプトから設定データを取得するためのヘルパー関数
async function getConfig() {
	return await loadConfigData();
}
