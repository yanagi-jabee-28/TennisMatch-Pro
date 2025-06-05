// DOM要素キャッシュ（パフォーマンス最適化）

const domCache = {
	teamsContainer: null,
	tableHeader: null,
	tableBody: null,
	standingsBody: null,
	scoreModal: null,
	teamEditModal: null,
	tableContainer: null,
	
	// 初期化関数
	init() {
		this.teamsContainer = document.getElementById('teams-container');
		this.tableHeader = document.getElementById('header-row');
		this.tableBody = document.querySelector('#match-grid tbody');
		this.standingsBody = document.getElementById('standings-body');
		this.scoreModal = document.getElementById('score-modal');
		this.teamEditModal = document.getElementById('team-edit-modal');
		this.tableContainer = document.querySelector('#match-table .table-container');
		
		// スマホでのスクロール案内を初期化
		this.initMobileScrollHint();
	},
	
	// スマホでのスクロール案内を初期化
	initMobileScrollHint() {
		if (window.innerWidth <= 768 && this.tableContainer) {
			// スクロール案内がまだない場合のみ追加
			if (!this.tableContainer.querySelector('.mobile-scroll-hint')) {
				const hint = document.createElement('div');
				hint.className = 'mobile-scroll-hint';
				hint.textContent = '← 横にスワイプして全体を表示 →';
				hint.style.cssText = `
					text-align: center;
					font-size: 0.85rem;
					color: #666;
					padding: 0.5rem;
					background-color: #f8f9fa;
					border: 1px dashed #ddd;
					border-radius: 4px;
					margin-bottom: 0.5rem;
				`;
				this.tableContainer.insertBefore(hint, this.tableContainer.firstChild);
				
				// スクロールイベントで案内を非表示に
				let scrollTimeout;
				this.tableContainer.addEventListener('scroll', () => {
					hint.style.opacity = '0.5';
					clearTimeout(scrollTimeout);
					scrollTimeout = setTimeout(() => {
						hint.style.opacity = '1';
					}, 1000);
				});
			}
		}
	}
};

export { domCache };
