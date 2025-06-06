// 設定ファイルを読み込むためのJSファイル

import { fetchConfigWithPaths, loadFromSessionStorage, saveToSessionStorage } from './utils.js';

// 設定データを一度だけ読み込むためのPromiseキャッシュ
let configPromise = null;

// デフォルト設定
const DEFAULT_CONFIG = {
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

// 設定ファイルをキャッシュ付きで読み込む
async function loadConfigData() {
	if (configPromise) return configPromise;
	
	configPromise = (async () => {
		try {
			// セッションストレージからキャッシュを確認
			const cachedConfig = loadFromSessionStorage('tennisAppConfig');
			if (cachedConfig) {
				console.log('セッションストレージから設定を読み込みました');
				return cachedConfig;
			}
			
			console.log('設定ファイル読み込み開始...');
			const paths = ['config.json', '/config.json', '../config.json', './config.json'];
			
			const data = await fetchConfigWithPaths(paths);
			console.log('設定ファイルを正常に読み込みました');
			
			// セッションストレージにキャッシュ
			saveToSessionStorage('tennisAppConfig', data);
			console.log('設定をセッションストレージにキャッシュしました');
			
			return data;
		} catch (error) {
			console.error('設定ファイルの読み込みに失敗しました:', error);
			console.log('デフォルト設定を使用します');
			configPromise = null;
			return DEFAULT_CONFIG;
		}
	})();
	
	return configPromise;
}

// 他スクリプトから設定データ取得用（エイリアス）
const getConfig = loadConfigData;

export { loadConfigData, getConfig };