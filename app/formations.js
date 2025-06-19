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
	}, 'formation1': {
		name: '既編成1',
		teams: [
			{ id: 1, members: ['宮田 夢', 'ルダン', '丸山 美音'] },
			{ id: 2, members: ['笠井 陸', '伊藤 颯真'] },
			{ id: 3, members: ['倉科 純太郎', '栁原 魁人'] },
			{ id: 4, members: ['島津 日向太', '平林 智花'] },
			{ id: 5, members: [] } // 欠席: 田中 稜久, 関 ふみ菜
		],
		absentMembers: ['田中 稜久', '関 ふみ菜']
	}, 'formation2': {
		name: '既編成2',
		teams: [
			{ id: 1, members: ['宮田 夢', '倉科 純太郎', '伊藤 颯真'] },
			{ id: 2, members: ['ルダン', '平林 智花'] },
			{ id: 3, members: ['笠井 陸', '丸山 美音'] },
			{ id: 4, members: ['栁原 魁人', '島津 日向太'] },
			{ id: 5, members: [] } // 欠席: 田中 稜久, 関 ふみ菜
		],
		absentMembers: ['田中 稜久', '関 ふみ菜']
	}, 'formation3': {
		name: '既編成3',
		teams: [
			{ id: 1, members: ['笠井 陸', '栁原 魁人'] },
			{ id: 2, members: ['宮田 夢', '平林 智花'] },
			{ id: 3, members: ['倉科 純太郎', '丸山 美音'] },
			{ id: 4, members: ['ルダン', '田中 稜久'] },
			{ id: 5, members: ['伊藤 颯真', '関 ふみ菜'] }
		],
		absentMembers: ['島津日向太']
	}, 'formation4': {
		name: '新編成4',
		teams: [
			{ id: 1, members: ['田中 稜久', '平林 智花'] },
			{ id: 2, members: ['関 ふみ菜', '島津 日向太'] },
			{ id: 3, members: ['笠井 陸', 'ルダン'] },
			{ id: 4, members: ['伊藤 颯真', '丸山 美音'] },
			{ id: 5, members: ['宮田 夢', '栁原 魁人', '倉科 純太郎'] }
		]
	}
};

export { formations };
