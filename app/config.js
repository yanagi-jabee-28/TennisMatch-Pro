// 設定ファイルを読み込むためのJSファイル

// 設定データを一度だけ読み込むためのPromiseキャッシュ
let configPromise = null;

// 設定ファイルをキャッシュ付きで読み込む
async function loadConfigData() {
	if (configPromise) return configPromise;
	configPromise = (async () => {
		try {
			console.log('設定ファイル読み込み開始...');
			// 異なるパターンでの読み込みを試みる（ブラウザ互換性のため）
			let response;
			try {
				// まず相対パスで試す
				response = await fetch('../config.json');
				console.log('Fetch レスポンス (相対パス):', response);
			} catch (e) {
				console.log('相対パスでの読み込みに失敗、ルートパスで試します');
				// 失敗したらルートパスで試す
				response = await fetch('/config.json');
				console.log('Fetch レスポンス (ルートパス):', response);
			}
			
			if (!response.ok) {
				// 両方失敗した場合、単純なパスで試す
				response = await fetch('config.json');
				console.log('Fetch レスポンス (単純パス):', response);
				
				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			}
			
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
			// 最後の手段として、フォールバックの設定を提供
			console.log('デフォルト設定を使用します');
			configPromise = null;
			
			// 基本的なデフォルト設定を返す
			return {
				teams: [
					{ id: 1, members: ["チーム1"] },
					{ id: 2, members: ["チーム2"] },
					{ id: 3, members: ["チーム3"] }
				],
				matchSettings: {
					matchPoint: 7,
					scoringSystem: "points",
					winCondition: "highestScore",
					maxSetsPerMatch: 3,
					pointsPerSet: 6
				},
				tournamentInfo: {
					name: "テニス大会",
					date: "2025年5月30日",
					location: "テニスコート",
					format: "総当たり戦"
				}
			};
		}
	})();
	return configPromise;
}

// 他スクリプトから設定データ取得用（エイリアス）
const getConfig = loadConfigData;

export { loadConfigData, getConfig };