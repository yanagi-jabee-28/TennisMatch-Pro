// 設定ファイルを読み込むためのJSファイル

// 設定データを一度だけ読み込むためのPromiseキャッシュ
let configPromise = null;

// 設定ファイルをキャッシュ付きで読み込む
async function loadConfigData() {
	if (configPromise) return configPromise;
	configPromise = (async () => {
	try {
			console.log('設定ファイル読み込み開始...');
			const response = await fetch('/config.json');
			console.log('Fetch レスポンス:', response);
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			const text = await response.text();
			console.log('レスポンステキスト:', text.substring(0, 100) + '...');
			try {
				const data = JSON.parse(text);
				console.log('設定ファイルを正常に読み込みました');
				return data;
			} catch (jsonError) {
				console.error('JSONのパースに失敗:', jsonError);
				return null;
			}
		} catch (error) {
			console.error('設定ファイルの読み込みに失敗しました:', error);
			configPromise = null;
			return null;
		}
	})();
	return configPromise;
}

// 他スクリプトから設定データ取得用（エイリアス）
const getConfig = loadConfigData;

export { loadConfigData, getConfig };