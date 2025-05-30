// 設定ファイルを読み込むためのJSファイル

// JavaScriptで設定ファイルを読み込む
async function loadConfigData() {
	try {
		const response = await fetch('config.json');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('設定ファイルの読み込みに失敗しました:', error);
		return null;
	}
}

// グローバルに設定データを保持
let configData = null;

// DOMContentLoadedイベントで設定ファイルを読み込む
document.addEventListener('DOMContentLoaded', async () => {
	configData = await loadConfigData();

	if (configData) {
		console.log('設定ファイルを正常に読み込みました');
	}
});

// 他のスクリプトから設定データを取得するためのヘルパー関数
function getConfig() {
	return configData;
}
