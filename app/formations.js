// 編成データ管理

// 利用可能な編成データ
const formations = {
	'current': {
		name: '既編成0',
		teams: [
			{ id: 1, members: ['宮田 夢', '関 ふみ菜', '平林 智花'] },
			{ id: 2, members: ['伊藤 颯真', '栁原 魁人'] },
			{ id: 3, members: ['倉科 純太郎', 'ルダン'] },
			{ id: 4, members: ['田中 稜久', '丸山 美音'] },
			{ id: 5, members: ['島津 日向太', '笠井 陸'] }
		]
	},
	'formation1': {
		name: '既編成1',
		teams: [
			{ id: 1, members: ['宮田 夢', '倉科 純太郎', '伊藤 颯真'] },
			{ id: 2, members: ['ルダン', '平林 智花'] },
			{ id: 3, members: ['笠井 陸', '丸山 美音'] },
			{ id: 4, members: ['栁原 魁人', '島津 日向太'] },
			{ id: 5, members: [] } // 欠席: 田中 稜久, 関 ふみ菜
		],
		absentMembers: ['田中 稜久', '関 ふみ菜']
	},
	'formation2': {
		name: '既編成2',
		teams: [
			{ id: 1, members: ['宮田 夢', 'ルダン', '丸山 美音'] },
			{ id: 2, members: ['笠井 陸', '伊藤 颯真'] },
			{ id: 3, members: ['倉科 純太郎', '栁原 魁人'] },
			{ id: 4, members: ['島津 日向太', '平林 智花'] },
			{ id: 5, members: [] } // 欠席: 田中 稜久, 関 ふみ菜
		],
		absentMembers: ['田中 稜久', '関 ふみ菜']
	},
	'formation3': {
		name: '新編成3',
		teams: [
			{ id: 1, members: ['宮田 夢', '笠井 陸'] },
			{ id: 2, members: ['倉科 純太郎', '田中 稜久'] },
			{ id: 3, members: ['ルダン', '関 ふみ菜'] },
			{ id: 4, members: ['伊藤 颯真', '丸山 美音', '平林 智花'] },
			{ id: 5, members: ['栁原 魁人', '島津 日向太'] }
		]
	},
	'formation4': {
		name: '新編成4',
		teams: [
			{ id: 1, members: ['倉科 純太郎', '島津 日向太'] },
			{ id: 2, members: ['宮田 夢', '栁原 魁人', '関 ふみ菜'] },
			{ id: 3, members: ['ルダン', '伊藤 颯真'] },
			{ id: 4, members: ['田中 稜久', '笠井 陸'] },
			{ id: 5, members: ['平林 智花', '丸山 美音'] }
		]
	},
	'formation5': {
		name: '新編成5',
		teams: [
			{ id: 1, members: ['笠井 陸', '島津 日向太', '栁原 魁人'] },
			{ id: 2, members: ['宮田 夢', '平林 智花'] },
			{ id: 3, members: ['倉科 純太郎', '丸山 美音'] },
			{ id: 4, members: ['ルダン', '田中 稜久'] },
			{ id: 5, members: ['伊藤 颯真', '関 ふみ菜'] }
		]
	},
	'formation6': {
		name: '新編成6',
		teams: [
			{ id: 1, members: ['宮田 夢', '田中 稜久'] },
			{ id: 2, members: ['倉科 純太郎', '伊藤 颯真'] },
			{ id: 3, members: ['ルダン', '島津 日向太'] },
			{ id: 4, members: ['笠井 陸', '関 ふみ菜'] },
			{ id: 5, members: ['栁原 魁人', '平林 智花', '丸山 美音'] }
		]
	},
	'formation7': {
		name: '新編成7',
		teams: [
			{ id: 1, members: ['倉科 純太郎', 'ルダン'] },
			{ id: 2, members: ['宮田 夢', '関 ふみ菜'] },
			{ id: 3, members: ['伊藤 颯真', '田中 稜久', '島津 日向太'] },
			{ id: 4, members: ['笠井 陸', '平林 智花'] },
			{ id: 5, members: ['栁原 魁人', '丸山 美音'] }
		]
	},
	'formation8': {
		name: '新編成8',
		teams: [
			{ id: 1, members: ['宮田 夢', '丸山 美音'] },
			{ id: 2, members: ['倉科 純太郎', '関 ふみ菜'] },
			{ id: 3, members: ['ルダン', '平林 智花'] },
			{ id: 4, members: ['田中 稜久', '栁原 魁人', '笠井 陸'] },
			{ id: 5, members: ['伊藤 颯真', '島津 日向太'] }
		]
	},
	'formation9': {
		name: '新編成9',
		teams: [
			{ id: 1, members: ['宮田 夢', '倉科 純太郎', '笠井 陸'] },
			{ id: 2, members: ['ルダン', '丸山 美音'] },
			{ id: 3, members: ['伊藤 颯真', '平林 智花'] },
			{ id: 4, members: ['田中 稜久', '島津 日向太'] },
			{ id: 5, members: ['栁原 魁人', '関 ふみ菜'] }
		]
	},
	'formation10': {
		name: '新編成10',
		teams: [
			{ id: 1, members: ['宮田 夢', '栁原 魁人'] },
			{ id: 2, members: ['倉科 純太郎', '平林 智花'] },
			{ id: 3, members: ['ルダン', '関 ふみ菜'] },
			{ id: 4, members: ['伊藤 颯真', '笠井 陸'] },
			{ id: 5, members: ['田中 稜久', '丸山 美音', '島津 日向太'] }
		]
	},
	'formation11': {
		name: '新編成11',
		teams: [
			{ id: 1, members: ['倉科 純太郎', '栁原 魁人'] },
			{ id: 2, members: ['ルダン', '伊藤 颯真', '島津 日向太'] },
			{ id: 3, members: ['宮田 夢', '田中 稜久'] },
			{ id: 4, members: ['笠井 陸', '丸山 美音'] },
			{ id: 5, members: ['平林 智花', '関 ふみ菜'] }
		]
	},
	'formation12': {
		name: '新編成12',
		teams: [
			{ id: 1, members: ['宮田 夢', '島津 日向太'] },
			{ id: 2, members: ['倉科 純太郎', '笠井 陸'] },
			{ id: 3, members: ['栁原 魁人', '伊藤 颯真', '田中 稜久'] },
			{ id: 4, members: ['ルダン', '平林 智花'] },
			{ id: 5, members: ['丸山 美音', '関 ふみ菜'] }
		]
	},
	'formation13': {
		name: '新編成13',
		teams: [
			{ id: 1, members: ['宮田 夢', 'ルダン', '関 ふみ菜'] },
			{ id: 2, members: ['倉科 純太郎', '丸山 美音'] },
			{ id: 3, members: ['伊藤 颯真', '島津 日向太'] },
			{ id: 4, members: ['田中 稜久', '平林 智花'] },
			{ id: 5, members: ['栁原 魁人', '笠井 陸'] }
		]
	},
	'formation14': {
		name: '新編成14',
		teams: [
			{ id: 1, members: ['宮田 夢', '倉科 純太郎'] },
			{ id: 2, members: ['ルダン', '栁原 魁人'] },
			{ id: 3, members: ['伊藤 颯真', '丸山 美音'] },
			{ id: 4, members: ['田中 稜久', '関 ふみ菜', '笠井 陸'] },
			{ id: 5, members: ['平林 智花', '島津 日向太'] }
		]
	},
	'formation15': {
		name: '新編成15',
		teams: [
			{ id: 1, members: ['宮田 夢', '平林 智花'] },
			{ id: 2, members: ['倉科 純太郎', 'ルダン', '島津 日向太'] },
			{ id: 3, members: ['伊藤 颯真', '関 ふみ菜'] },
			{ id: 4, members: ['田中 稜久', '栁原 魁人'] },
			{ id: 5, members: ['笠井 陸', '丸山 美音'] }
		]
	},
	'formation16': {
		name: '新編成16',
		teams: [
			{ id: 1, members: ['宮田 夢', '笠井 陸'] },
			{ id: 2, members: ['倉科 純太郎', '島津 日向太'] },
			{ id: 3, members: ['ルダン', '田中 稜久'] },
			{ id: 4, members: ['伊藤 颯真', '平林 智花'] },
			{ id: 5, members: ['栁原 魁人', '関 ふみ菜', '丸山 美音'] }
		]
	},
	'formation17': {
		name: '新編成17',
		teams: [
			{ id: 1, members: ['宮田 夢', '倉科 純太郎', '平林 智花'] },
			{ id: 2, members: ['ルダン', '伊藤 颯真'] },
			{ id: 3, members: ['田中 稜久', '丸山 美音'] },
			{ id: 4, members: ['栁原 魁人', '関 ふみ菜'] },
			{ id: 5, members: ['笠井 陸', '島津 日向太'] }
		]
	},
	'formation18': {
		name: '新編成18',
		teams: [
			{ id: 1, members: ['宮田 夢', '伊藤 颯真'] },
			{ id: 2, members: ['倉科 純太郎', '関 ふみ菜'] },
			{ id: 3, members: ['ルダン', '笠井 陸', '栁原 魁人'] },
			{ id: 4, members: ['田中 稜久', '島津 日向太'] },
			{ id: 5, members: ['平林 智花', '丸山 美音'] }
		]
	},
	'formation19': {
		name: '新編成19',
		teams: [
			{ id: 1, members: ['宮田 夢', '丸山 美音'] },
			{ id: 2, members: ['倉科 純太郎', '田中 稜久', '伊藤 颯真'] },
			{ id: 3, members: ['ルダン', '島津 日向太'] },
			{ id: 4, members: ['栁原 魁人', '平林 智花'] },
			{ id: 5, members: ['笠井 陸', '関 ふみ菜'] }
		]
	},
	'formation20': {
		name: '新編成20',
		teams: [
			{ id: 1, members: ['宮田 夢', '栁原 魁人', '島津 日向太'] },
			{ id: 2, members: ['倉科 純太郎', '平林 智花'] },
			{ id: 3, members: ['ルダン', '丸山 美音'] },
			{ id: 4, members: ['伊藤 颯真', '田中 稜久'] },
			{ id: 5, members: ['笠井 陸', '関 ふみ菜'] }
		]
	}
};

export { formations };
