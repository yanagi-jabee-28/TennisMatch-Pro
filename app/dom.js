// DOM要素キャッシュ（パフォーマンス最適化）

const domCache = {
	teamsContainer: null,
	tableHeader: null,
	tableBody: null,
	standingsBody: null,
	scoreModal: null,
	teamEditModal: null,
	
	// 初期化関数
	init() {
		this.teamsContainer = document.getElementById('teams-container');
		this.tableHeader = document.getElementById('header-row');
		this.tableBody = document.querySelector('#match-grid tbody');
		this.standingsBody = document.getElementById('standings-body');
		this.scoreModal = document.getElementById('score-modal');
		this.teamEditModal = document.getElementById('team-edit-modal');
	}
};

export { domCache };
