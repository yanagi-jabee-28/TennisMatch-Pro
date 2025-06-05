// 表示モード切り替え機能

import { appState, saveSettings } from '../state.js';
import { domCache } from '../dom.js';

class DisplayModeManager {
	constructor() {
		this.toggleButton = null;
		this.tableContainer = null;
		this.init();
	}
	init() {
		this.toggleButton = document.getElementById('toggle-scroll-mode-btn');
		this.tableContainer = document.querySelector('#match-table .table-container');
		
		if (this.toggleButton) {
			this.toggleButton.addEventListener('click', () => this.toggleMode());
		}
		
		// リサイズイベントリスナーを追加
		window.addEventListener('resize', () => {
			// デバウンス処理
			clearTimeout(this.resizeTimeout);
			this.resizeTimeout = setTimeout(() => this.handleResize(), 250);
		});
		
		// 初期状態を設定
		this.updateDisplay();
	}

	toggleMode() {
		appState.settings.compactMode = !appState.settings.compactMode;
		this.updateDisplay();
		saveSettings();
		
		// スクロール案内の更新
		this.updateScrollHint();
	}
	updateDisplay() {
		if (!this.tableContainer || !this.toggleButton) return;

		if (appState.settings.compactMode) {
			// コンパクトモードON
			this.tableContainer.classList.add('compact-mode');
			this.toggleButton.classList.add('compact-mode');
			this.toggleButton.innerHTML = '📊 通常表示';
			this.toggleButton.title = '通常の表示モードに戻します';
			
			// チーム数に応じてレイアウトを最適化
			this.optimizeCompactLayout();
		} else {
			// 通常モードON
			this.tableContainer.classList.remove('compact-mode');
			this.toggleButton.classList.remove('compact-mode');
			this.toggleButton.innerHTML = '📱 コンパクト表示';
			this.toggleButton.title = 'スクロールなしのコンパクト表示に切り替えます';
			
			// CSSカスタムプロパティをリセット
			document.documentElement.style.removeProperty('--team-count');
		}
	}
	// チーム数に応じてコンパクトレイアウトを最適化
	optimizeCompactLayout() {
		const teamCount = appState.teams.length;
		document.documentElement.style.setProperty('--team-count', teamCount);
		
		// 画面幅に応じてセルサイズを動的調整（より細かい制御）
		const viewportWidth = window.innerWidth;
		const maxTableWidth = viewportWidth - 40; // パディング分を考慮
		let cellSize;
		
		// チーム数による基本サイズを計算
		const baseSize = Math.floor(maxTableWidth / (teamCount + 1.5)); // +1.5 は行ヘッダーの幅
		
		if (viewportWidth <= 360) {
			cellSize = Math.max(25, Math.min(35, baseSize));
		} else if (viewportWidth <= 480) {
			cellSize = Math.max(30, Math.min(40, baseSize));
		} else if (viewportWidth <= 768) {
			cellSize = Math.max(35, Math.min(50, baseSize));
		} else if (viewportWidth <= 1024) {
			cellSize = Math.max(40, Math.min(60, baseSize));
		} else {
			cellSize = Math.max(45, Math.min(70, baseSize));
		}
		
		// セルサイズを設定
		document.documentElement.style.setProperty('--compact-cell-size', `${cellSize}px`);
		
		// デバッグ情報（本番では削除可能）
		console.log(`Compact mode: teams=${teamCount}, viewport=${viewportWidth}px, cellSize=${cellSize}px`);
	}

	updateScrollHint() {
		// コンパクトモードではスクロール案内を非表示
		const hint = this.tableContainer?.querySelector('.mobile-scroll-hint');
		if (hint) {
			if (appState.settings.compactMode) {
				hint.style.display = 'none';
			} else {
				hint.style.display = 'block';
			}
		}
	}
	// 画面サイズ変更時の調整
	handleResize() {
		// コンパクトモードの場合、レイアウトを再計算
		if (appState.settings.compactMode) {
			this.optimizeCompactLayout();
		}
		
		// 小画面では自動的にコンパクトモードを推奨
		if (window.innerWidth <= 480 && !appState.settings.compactMode) {
			this.showCompactModeRecommendation();
		}
	}

	showCompactModeRecommendation() {
		// 小画面でのコンパクトモード推奨通知
		if (this.toggleButton && !this.toggleButton.classList.contains('recommendation-shown')) {
			this.toggleButton.classList.add('recommendation-shown');
			this.toggleButton.style.animation = 'pulse 2s infinite';
			
			setTimeout(() => {
				this.toggleButton.style.animation = '';
				this.toggleButton.classList.remove('recommendation-shown');
			}, 6000);
		}
	}
}

// CSSアニメーションをJavaScriptで動的に追加
const style = document.createElement('style');
style.textContent = `
	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(103, 58, 183, 0.5); }
		100% { transform: scale(1); }
	}
`;
document.head.appendChild(style);

export { DisplayModeManager };
