// アプリケーションクラス
class TennisMatchApp {
	constructor() {
		this.teamAssignments = {};
		this.selectedTeam = null;
		this.matchResults = [];

		// チーム割り当てを初期化
		CONFIG.TEAM_NAMES.forEach(team => {
			this.teamAssignments[team] = [];
		});

		// モバイル機能のための変数
		this.pullToRefreshEnabled = false;
		this.swipeThreshold = 50;
		this.touchStartX = 0;
		this.touchStartY = 0;
		this.isVerticalScroll = false;

		this.init();
	}

	// 初期化
	init() {
		this.setupEventListeners();
		this.setupMobileFeatures();
		this.renderTeamSelection();
		this.renderRounds();
		this.renderMatchHistory();
		this.updateStats();
	}

	// モバイル機能のセットアップ
	setupMobileFeatures() {
		this.setupPullToRefresh();
		this.setupSwipeGestures();
		this.setupHapticFeedback();
		this.setupInstallPrompt();
		this.setupOrientationChange();
		this.setupDoubleTapPrevention();
		this.setupFocusManagement();
		this.registerServiceWorker();
	}

	// プルトゥリフレッシュ機能
	setupPullToRefresh() {
		let startY = 0;
		let currentY = 0;
		let isPulling = false;
		const pullThreshold = 100;
		
		const refreshIndicator = document.createElement('div');
		refreshIndicator.className = 'pull-refresh-indicator';
		refreshIndicator.innerHTML = '↓ 引っ張って更新';
		document.body.appendChild(refreshIndicator);

		document.addEventListener('touchstart', (e) => {
			if (window.scrollY === 0) {
				startY = e.touches[0].clientY;
				isPulling = false;
			}
		}, { passive: true });

		document.addEventListener('touchmove', (e) => {
			if (window.scrollY === 0 && startY > 0) {
				currentY = e.touches[0].clientY;
				const pullDistance = currentY - startY;

				if (pullDistance > 0) {
					isPulling = true;
					const progress = Math.min(pullDistance / pullThreshold, 1);
					
					refreshIndicator.style.transform = `translateY(${Math.min(pullDistance * 0.5, 50)}px)`;
					refreshIndicator.style.opacity = progress;
					
					if (pullDistance > pullThreshold) {
						refreshIndicator.innerHTML = '↑ 離して更新';
						refreshIndicator.classList.add('ready');
					} else {
						refreshIndicator.innerHTML = '↓ 引っ張って更新';
						refreshIndicator.classList.remove('ready');
					}
				}
			}
		}, { passive: true });

		document.addEventListener('touchend', () => {
			if (isPulling && currentY - startY > pullThreshold) {
				this.performRefresh();
			}
			
			refreshIndicator.style.transform = 'translateY(-100%)';
			refreshIndicator.style.opacity = '0';
			refreshIndicator.classList.remove('ready');
			startY = 0;
			isPulling = false;
		}, { passive: true });
	}

	// 更新実行
	performRefresh() {
		this.triggerHapticFeedback('light');
		this.showNotification('データを更新しています...', 'info');
		
		// アニメーション付きで更新
		setTimeout(() => {
			this.updateStats();
			this.renderTeamSelection();
			this.updateTeamDisplayNames();
			this.showNotification('更新完了', 'success');
		}, 1000);
	}

	// スワイプジェスチャー
	setupSwipeGestures() {
		const tabContainer = document.querySelector('.tabs');
		if (!tabContainer) return;

		tabContainer.addEventListener('touchstart', (e) => {
			this.touchStartX = e.touches[0].clientX;
			this.touchStartY = e.touches[0].clientY;
			this.isVerticalScroll = false;
		}, { passive: true });

		tabContainer.addEventListener('touchmove', (e) => {
			const currentX = e.touches[0].clientX;
			const currentY = e.touches[0].clientY;
			const deltaX = Math.abs(currentX - this.touchStartX);
			const deltaY = Math.abs(currentY - this.touchStartY);

			// 縦スクロールの判定
			if (deltaY > deltaX && deltaY > 10) {
				this.isVerticalScroll = true;
			}
		}, { passive: true });
		tabContainer.addEventListener('touchend', (e) => {
			if (this.isVerticalScroll) return;

			const touchEndX = e.changedTouches[0].clientX;
			const deltaX = touchEndX - this.touchStartX;
			const absDeltaX = Math.abs(deltaX);

			if (absDeltaX > this.swipeThreshold) {
				const currentTab = document.querySelector('.tab-btn.active');
				const tabs = Array.from(document.querySelectorAll('.tab-btn'));
				const currentIndex = tabs.indexOf(currentTab);

				let targetIndex;
				if (deltaX > 0 && currentIndex > 0) {
					// 右スワイプ（前のタブ）
					targetIndex = currentIndex - 1;
				} else if (deltaX < 0 && currentIndex < tabs.length - 1) {
					// 左スワイプ（次のタブ）
					targetIndex = currentIndex + 1;
				}

				if (targetIndex !== undefined) {
					this.triggerHapticFeedback('light');
					this.switchTab(tabs[targetIndex].dataset.tab);
				}
			}
		}, { passive: true });
	}

	// ハプティックフィードバック
	setupHapticFeedback() {
		// ボタンクリック時のフィードバック
		document.addEventListener('click', (e) => {
			if (e.target.matches('button, .tab-btn, .team-card, .member-item, .available-member')) {
				this.triggerHapticFeedback('light');
			}
		});

		// 選択変更時のフィードバック
		document.addEventListener('change', (e) => {
			if (e.target.matches('select, input[type="number"]')) {
				this.triggerHapticFeedback('selection');
			}
		});
	}

	// ハプティックフィードバック実行
	triggerHapticFeedback(type = 'light') {
		if ('vibrate' in navigator) {
			switch (type) {
				case 'light':
					navigator.vibrate(10);
					break;
				case 'medium':
					navigator.vibrate(20);
					break;
				case 'heavy':
					navigator.vibrate([30, 10, 30]);
					break;
				case 'selection':
					navigator.vibrate(5);
					break;
				case 'success':
					navigator.vibrate([50, 10, 50]);
					break;
				case 'error':
					navigator.vibrate([100, 50, 100]);
					break;
			}
		}
	}

	// PWAインストールプロンプト
	setupInstallPrompt() {
		let deferredPrompt;

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			
			// インストールボタンを表示
			const installBtn = document.createElement('button');
			installBtn.className = 'install-btn';
			installBtn.innerHTML = '📱 アプリをインストール';
			installBtn.onclick = () => this.showInstallPrompt(deferredPrompt);
			
			const header = document.querySelector('header .header-controls');
			if (header) {
				header.appendChild(installBtn);
			}
		});

		window.addEventListener('appinstalled', () => {
			this.showNotification('アプリがインストールされました！', 'success');
			this.triggerHapticFeedback('success');
			
			// インストールボタンを削除
			const installBtn = document.querySelector('.install-btn');
			if (installBtn) {
				installBtn.remove();
			}
		});
	}

	// インストールプロンプト表示
	async showInstallPrompt(deferredPrompt) {
		if (!deferredPrompt) return;

		const result = await deferredPrompt.prompt();
		if (result.outcome === 'accepted') {
			this.triggerHapticFeedback('success');
		}
		deferredPrompt = null;
	}

	// イベントリスナー設定
	setupEventListeners() {
		// マッチポイント変更
		document.getElementById('matchPointSetting').addEventListener('change', () => {
			this.updateStats();
		});

		// チームリセットボタン
		document.getElementById('resetTeamsBtn').addEventListener('click', () => {
			this.resetTeams();
		});

		// タブ切り替え
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				this.switchTab(e.target.dataset.tab);
			});
		});

		// ヘッダーコントロール
		this.setupHeaderControls();

		// 検索・フィルタ
		this.setupSearchAndFilter();

		// キーボードショートカット
		this.setupKeyboardShortcuts();
	}    // ヘッダーコントロール設定
	setupHeaderControls() {
		// ダークモード切り替え
		const darkModeToggle = document.getElementById('darkModeToggle');
		if (darkModeToggle) {
			darkModeToggle.addEventListener('click', () => {
				document.body.classList.toggle('dark-mode');
				const isDark = document.body.classList.contains('dark-mode');
				darkModeToggle.textContent = isDark ? '☀️' : '🌙';
				this.showNotification(isDark ? 'ダークモードを有効にしました' : 'ライトモードに切り替えました', 'info');
			});
		}

		// データ保存
		const saveBtn = document.getElementById('saveDataBtn');
		if (saveBtn) {
			saveBtn.addEventListener('click', () => this.saveData());
		}

		// データ読み込み
		const loadBtn = document.getElementById('loadDataBtn');
		if (loadBtn) {
			loadBtn.addEventListener('click', () => this.loadData());
		}

		// ファイル入力の変更イベント
		const loadDataInput = document.getElementById('loadDataInput');
		if (loadDataInput) {
			loadDataInput.addEventListener('change', (e) => {
				if (e.target.files.length > 0) {
					this.handleFileLoad(e.target.files[0]);
					e.target.value = ''; // ファイル選択をリセット
				}
			});
		}

		// エクスポート
		const exportBtn = document.getElementById('exportBtn');
		if (exportBtn) {
			exportBtn.addEventListener('click', () => this.exportResults());
		}

		// ヘルプ
		const helpBtn = document.getElementById('helpBtn');
		if (helpBtn) {
			helpBtn.addEventListener('click', () => this.showHelp());
		}
	}

	// 検索・フィルタ設定
	setupSearchAndFilter() {
		const searchInput = document.getElementById('searchInput');
		const filterRound = document.getElementById('filterRound');
		const filterResult = document.getElementById('filterResult');

		if (searchInput) {
			searchInput.addEventListener('input', (e) => {
				this.filterMatches(e.target.value, filterRound?.value, filterResult?.value);
			});
		}

		if (filterRound) {
			filterRound.addEventListener('change', (e) => {
				this.filterMatches(searchInput?.value || '', e.target.value, filterResult?.value);
			});
		}

		if (filterResult) {
			filterResult.addEventListener('change', (e) => {
				this.filterMatches(searchInput?.value || '', filterRound?.value, e.target.value);
			});
		}
	}

	// キーボードショートカット設定
	setupKeyboardShortcuts() {
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case 's':
						e.preventDefault();
						this.saveData();
						break;
					case 'l':
						e.preventDefault();
						this.loadData();
						break;
					case 'd':
						e.preventDefault();
						document.body.classList.toggle('dark-mode');
						break;
				}
			}
		});
	}

	// 通知表示
	showNotification(message, type = 'info') {
		const notification = document.createElement('div');
		notification.className = `notification ${type}`;
		notification.textContent = message;
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 3000);
	}    // 試合結果取得
	getMatchResults() {
		const results = [];
		document.querySelectorAll('.winner-select').forEach((select, index) => {
			const loserScoreInput = document.querySelector(`.loser-score[data-match="${index}"]`);
			results.push({
				winner: select.value,
				loserScore: parseInt(loserScoreInput.value) || 0
			});
		});
		return results;
	}

	// 試合結果復元
	restoreMatchResults(results) {
		results.forEach((result, index) => {
			const winnerSelect = document.querySelector(`.winner-select[data-match="${index}"]`);
			const loserScoreInput = document.querySelector(`.loser-score[data-match="${index}"]`);

			if (winnerSelect) winnerSelect.value = result.winner || '';
			if (loserScoreInput) loserScoreInput.value = result.loserScore || '';
		});
	}    // 結果エクスポート
	exportResults() {
		const stats = this.calculateTeamStats();
		const matchPoint = parseInt(document.getElementById('matchPointSetting').value);
		let exportText = '🎾 硬式テニス 対戦結果 🎾\n';
		exportText += '========================================\n\n';

		// 基本情報
		exportText += '📋 基本情報:\n';
		exportText += `・マッチポイント: ${matchPoint}ポイント\n`;
		exportText += `・出力日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

		// チーム別統計
		exportText += '📊 チーム別統計:\n';
		exportText += '----------------------------------------\n';
		stats.forEach((teamStats, index) => {
			const teamName = CONFIG.TEAM_NAMES[index];
			const members = this.teamAssignments[teamName] || [];
			exportText += `🏆 ${teamName} (${members.join(', ')})\n`;
			exportText += `   成績: ${teamStats.wins}勝${teamStats.losses}敗\n`;
			exportText += `   得点: ${teamStats.pointsFor} / 失点: ${teamStats.pointsAgainst}\n`;
			if (teamStats.wins + teamStats.losses > 0) {
				const winRate = Math.round((teamStats.wins / (teamStats.wins + teamStats.losses)) * 100);
				exportText += `   勝率: ${winRate}%\n`;
			}
			exportText += '\n';
		});

		// 詳細な試合結果
		exportText += '⚔️ 詳細な試合結果:\n';
		exportText += '----------------------------------------\n';

		CONFIG.MATCH_SCHEDULE.forEach(roundData => {
			exportText += `\n🔸 ラウンド${roundData.round}:\n`;

			roundData.matches.forEach((match, matchIndex) => {
				const globalIndex = this.getGlobalMatchIndex(roundData.round, matchIndex);
				const winnerSelect = document.querySelector(`.winner-select[data-match="${globalIndex}"]`);
				const loserScoreInput = document.querySelector(`.loser-score[data-match="${globalIndex}"]`);

				if (winnerSelect && loserScoreInput) {
					const winner = winnerSelect.value;
					const loserScore = parseInt(loserScoreInput.value) || 0;

					if (winner) {
						const loser = winner === match.teams[0] ? match.teams[1] : match.teams[0];
						const winnerScore = matchPoint;

						exportText += `   ${match.teams[0]} vs ${match.teams[1]} → `;
						exportText += `🏅 ${winner} ${winnerScore}-${loserScore} ${loser}\n`;

						// 勝者・敗者のメンバー情報
						const winnerMembers = this.teamAssignments[winner] || [];
						const loserMembers = this.teamAssignments[loser] || [];
						if (winnerMembers.length > 0 || loserMembers.length > 0) {
							exportText += `      勝者: ${winnerMembers.join(', ')} / 敗者: ${loserMembers.join(', ')}\n`;
						}
					} else {
						exportText += `   ${match.teams[0]} vs ${match.teams[1]} → ⏳ 未完了\n`;
					}
				}
			});
		});

		// 総合統計
		const totalMatches = CONFIG.MATCH_SCHEDULE.reduce((total, round) => total + round.matches.length, 0);
		let completedMatches = 0;
		document.querySelectorAll('.winner-select').forEach(select => {
			if (select.value) completedMatches++;
		});

		exportText += '\n📈 総合統計:\n';
		exportText += '----------------------------------------\n';
		exportText += `・総試合数: ${totalMatches}\n`;
		exportText += `・完了試合: ${completedMatches}\n`;
		exportText += `・進行率: ${Math.round((completedMatches / totalMatches) * 100)}%\n`;

		// 最高勝利チーム
		const maxWins = Math.max(...stats.map(s => s.wins));
		if (maxWins > 0) {
			const topTeams = stats.filter(s => s.wins === maxWins)
				.map((_, i) => CONFIG.TEAM_NAMES[stats.findIndex(s => s.wins === maxWins)]);
			exportText += `・現在首位: ${topTeams.join(', ')} (${maxWins}勝)\n`;
		}

		exportText += '\n========================================\n';
		exportText += '📝 この結果は自動生成されました\n';

		// クリップボードにコピー
		navigator.clipboard.writeText(exportText).then(() => {
			this.showNotification('詳細な結果をクリップボードにコピーしました', 'success');
		}).catch(() => {
			this.showNotification('エクスポートに失敗しました', 'error');
		});
	}

	// ヘルプ表示
	showHelp() {
		const helpContent = `
            <h3>使い方</h3>
            <h4>基本操作</h4>
            <ul>
                <li>チーム分け: チームを選択してからメンバーをクリック</li>
                <li>試合結果: 勝者を選択し、負けチームの点数を入力</li>
                <li>タブ切り替え: 詳細な統計や分析を確認</li>
            </ul>
            <h4>キーボードショートカット</h4>
            <ul>
                <li>Ctrl+S: データ保存</li>
                <li>Ctrl+L: データ読み込み</li>
                <li>Ctrl+D: ダークモード切り替え</li>
            </ul>
            <h4>機能</h4>
            <ul>
                <li>🌙: ダークモード切り替え</li>
                <li>💾: データ保存</li>
                <li>📁: データ読み込み</li>
                <li>📊: 結果エクスポート</li>
            </ul>
        `;

		// 簡易モーダル表示
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'block';
		modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                ${helpContent}
            </div>
        `;

		document.body.appendChild(modal);

		modal.querySelector('.modal-close').addEventListener('click', () => {
			modal.remove();
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});
	}

	// 試合フィルタ
	filterMatches(searchTerm, roundFilter, resultFilter) {
		const rows = document.querySelectorAll('#matchHistoryTable tbody tr');

		rows.forEach(row => {
			const roundText = row.cells[0].textContent;
			const matchText = row.cells[1].textContent;
			const resultText = row.cells[2].textContent;

			let showRow = true;

			// 検索フィルタ
			if (searchTerm) {
				const searchLower = searchTerm.toLowerCase();
				const matchLower = matchText.toLowerCase();
				showRow = showRow && matchLower.includes(searchLower);
			}

			// ラウンドフィルタ
			if (roundFilter) {
				showRow = showRow && roundText.includes(`ラウンド${roundFilter}`);
			}

			// 結果フィルタ
			if (resultFilter) {
				if (resultFilter === 'completed') {
					showRow = showRow && resultText !== '--';
				} else if (resultFilter === 'pending') {
					showRow = showRow && resultText === '--';
				}
			}

			row.style.display = showRow ? '' : 'none';
		});
	}

	// タブ切り替え
	switchTab(tabName) {
		// すべてのタブボタンとコンテンツを非アクティブに
		document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
		document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

		// 選択されたタブをアクティブに
		document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
		document.getElementById(tabName).classList.add('active');
	}

	// チーム選択画面をレンダリング
	renderTeamSelection() {
		const container = document.getElementById('teamSelectionContainer');
		container.innerHTML = '';

		// 操作説明
		const instruction = this.createInstructionElement();
		container.appendChild(instruction);

		// チームカード作成
		CONFIG.TEAM_NAMES.forEach(teamName => {
			const teamCard = this.createTeamCard(teamName);
			container.appendChild(teamCard);
		});

		// 未割り当てメンバー表示
		const availableContainer = this.createAvailableMembersContainer();
		container.appendChild(availableContainer);
	}

	// 操作説明要素作成
	createInstructionElement() {
		const div = document.createElement('div');
		div.className = 'selection-instruction';
		div.innerHTML = `
            <h4>操作方法：</h4>
            <ol>
                <li>まずチームをクリックして選択（緑色になります）</li>
                <li>次に割り当てたいメンバーをクリック</li>
                <li>メンバーをチームから外したい場合は、そのメンバーをクリック</li>
            </ol>
        `;
		return div;
	}

	// チームカード作成
	createTeamCard(teamName) {
		const card = document.createElement('div');
		card.className = `team-card ${this.selectedTeam === teamName ? 'selected' : ''}`;
		card.onclick = () => this.selectTeam(teamName);

		const members = this.teamAssignments[teamName];
		const memberElements = members.map(member =>
			`<span class="member-item" onclick="event.stopPropagation(); app.removeMemberFromTeam('${member}', '${teamName}')">${member}</span>`
		).join('');

		card.innerHTML = `
            <div class="team-header">${teamName} ${this.selectedTeam === teamName ? '(選択中)' : ''}</div>
            <div class="member-list">${memberElements}</div>
        `;

		return card;
	}

	// 未割り当てメンバーコンテナ作成
	createAvailableMembersContainer() {
		const container = document.createElement('div');
		container.className = 'available-members-container';

		const assignedMembers = Object.values(this.teamAssignments).flat();
		const availableMembers = CONFIG.MEMBERS.filter(member => !assignedMembers.includes(member));

		const instructionText = this.selectedTeam
			? `<strong style="color: #4CAF50;">${this.selectedTeam}</strong> が選択されています。メンバーをクリックして追加してください。`
			: 'まず上のチームを選択してから、メンバーをクリックしてください。';

		const memberElements = availableMembers.map(member =>
			`<span class="available-member" onclick="app.assignMemberToSelectedTeam('${member}')">${member}</span>`
		).join('');

		container.innerHTML = `
            <h3>未割り当てメンバー</h3>
            <div style="margin-bottom: 15px; color: #666;">${instructionText}</div>
            <div class="available-members">${memberElements}</div>
        `;

		return container;
	}

	// チーム選択
	selectTeam(teamName) {
		this.selectedTeam = this.selectedTeam === teamName ? null : teamName;
		this.renderTeamSelection();
	}

	// メンバーを選択されたチームに割り当て
	assignMemberToSelectedTeam(member) {
		if (!this.selectedTeam) {
			alert('まずチームを選択してください。');
			return;
		}

		this.teamAssignments[this.selectedTeam].push(member);
		this.renderTeamSelection();
		this.updateTeamDisplayNames();
	}

	// メンバーをチームから削除
	removeMemberFromTeam(member, teamName) {
		this.teamAssignments[teamName] = this.teamAssignments[teamName].filter(m => m !== member);
		this.renderTeamSelection();
		this.updateTeamDisplayNames();
	}

	// チーム分けリセット
	resetTeams() {
		if (confirm('チーム分けをリセットしますか？')) {
			CONFIG.TEAM_NAMES.forEach(team => {
				this.teamAssignments[team] = [];
			});
			this.selectedTeam = null;
			this.renderTeamSelection();
			this.updateTeamDisplayNames();
		}
	}

	// ラウンドをレンダリング
	renderRounds() {
		const container = document.getElementById('roundsContainer');
		container.innerHTML = '';

		CONFIG.MATCH_SCHEDULE.forEach(roundData => {
			const roundElement = this.createRoundElement(roundData);
			container.appendChild(roundElement);
		});
	}

	// ラウンド要素作成
	createRoundElement(roundData) {
		const div = document.createElement('div');
		div.className = 'round-container';

		const tableRows = roundData.matches.map((match, matchIndex) => {
			const globalIndex = this.getGlobalMatchIndex(roundData.round, matchIndex);
			return `
                <tr>
                    <td class="court-info">コート${match.court}</td>
                    <td class="match-vs" data-match="${globalIndex}">${match.teams[0]} vs ${match.teams[1]}</td>                    <td>
                        <select class="winner-select" data-match="${globalIndex}">
                            <option value="">--</option>
                            <option value="${match.teams[0]}">${match.teams[0].replace('チーム', '')}</option>
                            <option value="${match.teams[1]}">${match.teams[1].replace('チーム', '')}</option>
                        </select>
                    </td>
                    <td>
                        <input type="number" class="loser-score" data-match="${globalIndex}" min="0" placeholder="0">
                    </td>
                    <td class="score-display" data-match="${globalIndex}">--</td>
                </tr>
            `;
		}).join('');

		div.innerHTML = `
            <h3 class="round-title">ラウンド${roundData.round}</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>コート</th>
                            <th>対戦</th>
                            <th>勝者</th>
                            <th>負けチームの点数</th>
                            <th>試合結果</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div class="scroll-hint">← 横にスワイプしてスクロール →</div>
            <div class="rest-info">(休憩: ${roundData.rest})</div>
        `;

		// イベントリスナーを追加
		setTimeout(() => {
			div.querySelectorAll('.winner-select, .loser-score').forEach(element => {
				element.addEventListener('change', () => this.updateStats());
				if (element.type === 'number') {
					element.addEventListener('input', () => this.updateStats());
				}
			});
		}, 0);

		return div;
	}

	// グローバル試合インデックス取得
	getGlobalMatchIndex(round, matchIndex) {
		let index = 0;
		for (let r = 1; r < round; r++) {
			const roundData = CONFIG.MATCH_SCHEDULE.find(rd => rd.round === r);
			index += roundData.matches.length;
		}
		return index + matchIndex;
	}

	// 試合履歴テーブルをレンダリング
	renderMatchHistory() {
		const tbody = document.querySelector('#matchHistoryTable tbody');
		tbody.innerHTML = '';

		CONFIG.MATCH_SCHEDULE.forEach(roundData => {
			roundData.matches.forEach((match, matchIndex) => {
				const globalIndex = this.getGlobalMatchIndex(roundData.round, matchIndex);
				const row = document.createElement('tr');
				row.innerHTML = `
                    <td>ラウンド${roundData.round}</td>
                    <td>${match.teams[0]} vs ${match.teams[1]}</td>
                    <td class="match-result" data-match="${globalIndex}">--</td>
                    <td class="match-winner" data-match="${globalIndex}">--</td>
                    <td class="match-loser" data-match="${globalIndex}">--</td>
                `;
				tbody.appendChild(row);
			});
		});
	}

	// チーム表示名を更新
	updateTeamDisplayNames() {
		document.querySelectorAll('.match-vs').forEach(element => {
			const matchIndex = parseInt(element.dataset.match);
			const match = this.getMatchByGlobalIndex(matchIndex);
			if (match) {
				const team1Display = this.getTeamDisplayName(match.teams[0]);
				const team2Display = this.getTeamDisplayName(match.teams[1]);
				element.textContent = `${team1Display} vs ${team2Display}`;
			}
		});
	}

	// チーム表示名取得
	getTeamDisplayName(teamName) {
		const members = this.teamAssignments[teamName];
		return members.length > 0 ? `${teamName} (${members.join(', ')})` : teamName;
	}

	// グローバルインデックスから試合情報取得
	getMatchByGlobalIndex(globalIndex) {
		let currentIndex = 0;
		for (const roundData of CONFIG.MATCH_SCHEDULE) {
			for (const match of roundData.matches) {
				if (currentIndex === globalIndex) {
					return match;
				}
				currentIndex++;
			}
		}
		return null;
	}    // 統計更新
	updateStats() {
		this.updateScoreDisplays();
		this.updateMatchHistory();
		this.updateTeamStats();
		this.updateAnalytics();
		this.updateProgress();
	}

	// スコア表示更新
	updateScoreDisplays() {
		const matchPoint = parseInt(document.getElementById('matchPointSetting').value);

		document.querySelectorAll('.score-display').forEach(element => {
			const matchIndex = parseInt(element.dataset.match);
			const winnerSelect = document.querySelector(`.winner-select[data-match="${matchIndex}"]`);
			const loserScoreInput = document.querySelector(`.loser-score[data-match="${matchIndex}"]`);

			if (winnerSelect && loserScoreInput) {
				const winner = winnerSelect.value;
				const loserScore = parseInt(loserScoreInput.value) || 0;

				if (winner && loserScore >= 0) {
					const match = this.getMatchByGlobalIndex(matchIndex);
					if (match) {
						const winnerScore = matchPoint;
						if (winner === match.teams[0]) {
							element.textContent = `${winnerScore}-${loserScore}`;
						} else {
							element.textContent = `${loserScore}-${winnerScore}`;
						}
					}
				} else {
					element.textContent = '--';
				}
			}
		});
	}

	// 試合履歴更新
	updateMatchHistory() {
		const matchPoint = parseInt(document.getElementById('matchPointSetting').value);

		document.querySelectorAll('.match-result').forEach(element => {
			const matchIndex = parseInt(element.dataset.match);
			const winnerSelect = document.querySelector(`.winner-select[data-match="${matchIndex}"]`);
			const loserScoreInput = document.querySelector(`.loser-score[data-match="${matchIndex}"]`);

			if (winnerSelect && loserScoreInput) {
				const winner = winnerSelect.value;
				const loserScore = parseInt(loserScoreInput.value) || 0;
				const match = this.getMatchByGlobalIndex(matchIndex);

				const resultElement = element;
				const winnerElement = document.querySelector(`.match-winner[data-match="${matchIndex}"]`);
				const loserElement = document.querySelector(`.match-loser[data-match="${matchIndex}"]`);

				if (winner && match && loserScore >= 0) {
					const winnerScore = matchPoint;
					const loser = winner === match.teams[0] ? match.teams[1] : match.teams[0];

					resultElement.textContent = `${winnerScore}-${loserScore}`;
					winnerElement.textContent = winner;
					loserElement.textContent = loser;
				} else {
					resultElement.textContent = '--';
					winnerElement.textContent = '--';
					loserElement.textContent = '--';
				}
			}
		});
	}

	// チーム統計更新
	updateTeamStats() {
		const container = document.getElementById('teamStatsContainer');
		container.innerHTML = '';

		const stats = this.calculateTeamStats();

		CONFIG.TEAM_NAMES.forEach((teamName, index) => {
			const teamStats = stats[index];
			const card = this.createTeamStatsCard(teamName, teamStats);
			container.appendChild(card);
		});
	}

	// チーム統計計算
	calculateTeamStats() {
		const stats = CONFIG.TEAM_NAMES.map(() => ({
			wins: 0,
			losses: 0,
			pointsFor: 0,
			pointsAgainst: 0,
			matches: []
		}));

		const matchPoint = parseInt(document.getElementById('matchPointSetting').value);

		document.querySelectorAll('.winner-select').forEach(select => {
			const matchIndex = parseInt(select.dataset.match);
			const winner = select.value;
			const loserScoreInput = document.querySelector(`.loser-score[data-match="${matchIndex}"]`);
			const loserScore = parseInt(loserScoreInput.value) || 0;

			if (!winner) return;

			const match = this.getMatchByGlobalIndex(matchIndex);
			if (!match) return;

			const winnerScore = matchPoint;
			const loser = winner === match.teams[0] ? match.teams[1] : match.teams[0];

			const winnerIndex = CONFIG.TEAM_NAMES.indexOf(winner);
			const loserIndex = CONFIG.TEAM_NAMES.indexOf(loser);

			// 勝者の統計
			stats[winnerIndex].wins++;
			stats[winnerIndex].pointsFor += winnerScore;
			stats[winnerIndex].pointsAgainst += loserScore;

			// 敗者の統計
			stats[loserIndex].losses++;
			stats[loserIndex].pointsFor += loserScore;
			stats[loserIndex].pointsAgainst += winnerScore;

			// 試合詳細を追加
			const roundData = this.getRoundByGlobalIndex(matchIndex);
			stats[winnerIndex].matches.push({
				round: roundData.round,
				opponent: loser,
				result: 'win',
				score: `${winnerScore}-${loserScore}`
			});

			stats[loserIndex].matches.push({
				round: roundData.round,
				opponent: winner,
				result: 'lose',
				score: `${loserScore}-${winnerScore}`
			});
		});

		return stats;
	}

	// グローバルインデックスからラウンド取得
	getRoundByGlobalIndex(globalIndex) {
		let currentIndex = 0;
		for (const roundData of CONFIG.MATCH_SCHEDULE) {
			if (globalIndex < currentIndex + roundData.matches.length) {
				return roundData;
			}
			currentIndex += roundData.matches.length;
		}
		return null;
	}

	// チーム統計カード作成
	createTeamStatsCard(teamName, stats) {
		const card = document.createElement('div');
		card.className = 'team-stats-card';

		const matchDetails = stats.matches.map(match => `
            <div class="match-detail-item ${match.result}">
                ラウンド${match.round}: vs ${match.opponent}<br>
                <strong>${match.result === 'win' ? '勝利' : '敗北'}</strong> (${match.score})
            </div>
        `).join('') || '<div style="color: #666; font-style: italic;">試合結果がまだありません</div>';

		const pointDiff = stats.pointsFor - stats.pointsAgainst;

		card.innerHTML = `
            <div class="team-stats-header">${teamName}</div>
            <div class="stats-summary">
                <div class="stat-item">
                    <div class="stat-label">勝利</div>
                    <div class="stat-value">${stats.wins}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">敗北</div>
                    <div class="stat-value">${stats.losses}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">総得点</div>
                    <div class="stat-value">${stats.pointsFor}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">総失点</div>
                    <div class="stat-value">${stats.pointsAgainst}</div>
                </div>
            </div>
            <div style="text-align: center; margin: 10px 0; font-weight: 600; font-size: 1.1rem;">
                得失点差: ${pointDiff > 0 ? '+' : ''}${pointDiff}
            </div>
            <div class="match-details">
                <h4 style="margin-bottom: 10px;">試合結果詳細</h4>
                ${matchDetails}
            </div>
        `; return card;
	}

	// 詳細分析更新
	updateAnalytics() {
		// 基本統計の計算
		const totalMatches = CONFIG.MATCH_SCHEDULE.reduce((total, round) => total + round.matches.length, 0);
		let completedMatches = 0;
		let totalPoints = 0;
		let totalGames = 0;

		const teamStats = this.calculateTeamStats();

		// 完了した試合をカウント
		document.querySelectorAll('.winner-select').forEach(select => {
			if (select.value) {
				completedMatches++;
			}
		});        // 総得点を計算
		teamStats.forEach(stats => {
			totalPoints += stats.pointsFor;
			totalGames += stats.wins + stats.losses;
		});

		const completionRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
		// 1試合あたりの平均総得点（両チーム合計）に変更
		const averageScore = completedMatches > 0 ? Math.round(totalPoints / completedMatches) : 0;

		// サマリーカードを更新
		document.getElementById('totalMatches').textContent = totalMatches;
		document.getElementById('completedMatches').textContent = completedMatches;
		document.getElementById('completionRate').textContent = `${completionRate}%`;
		document.getElementById('averageScore').textContent = averageScore;

		// チーム勝率チャートを更新
		this.updateWinRateChart(teamStats);

		// 得失点チャートを更新
		this.updateScoreChart(teamStats);

		// 詳細統計を更新
		this.updateDetailedStats(teamStats, totalMatches, completedMatches);
	}

	// 勝率チャートを更新
	updateWinRateChart(teamStats) {
		const chartContainer = document.getElementById('winRateChart');
		chartContainer.innerHTML = '';

		teamStats.forEach((stats, index) => {
			const totalGames = stats.wins + stats.losses;
			const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;

			const chartBar = document.createElement('div');
			chartBar.className = 'chart-bar';
			chartBar.innerHTML = `
                <div class="chart-label">${CONFIG.TEAM_NAMES[index]}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${winRate}%">
                        ${winRate > 20 ? Math.round(winRate) + '%' : ''}
                    </div>
                </div>
                <div class="chart-value">${Math.round(winRate)}%</div>
            `;
			chartContainer.appendChild(chartBar);
		});
	}

	// 得失点チャートを更新
	updateScoreChart(teamStats) {
		const chartContainer = document.getElementById('scoreChart');
		chartContainer.innerHTML = '';

		const maxPointDiff = Math.max(...teamStats.map(stats => Math.abs(stats.pointsFor - stats.pointsAgainst)));

		teamStats.forEach((stats, index) => {
			const pointDiff = stats.pointsFor - stats.pointsAgainst;
			const percentage = maxPointDiff > 0 ? Math.abs(pointDiff) / maxPointDiff * 100 : 0;
			const isPositive = pointDiff >= 0;

			const chartBar = document.createElement('div');
			chartBar.className = 'chart-bar';
			chartBar.innerHTML = `
                <div class="chart-label">${CONFIG.TEAM_NAMES[index]}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%; background: ${isPositive ? 'linear-gradient(90deg, #4CAF50, #66BB6A)' : 'linear-gradient(90deg, #f44336, #e57373)'}">
                        ${percentage > 20 ? (pointDiff > 0 ? '+' : '') + pointDiff : ''}
                    </div>
                </div>
                <div class="chart-value">${pointDiff > 0 ? '+' : ''}${pointDiff}</div>
            `;
			chartContainer.appendChild(chartBar);
		});
	}

	// 詳細統計を更新
	updateDetailedStats(teamStats, totalMatches, completedMatches) {
		const container = document.getElementById('detailedStats');
		container.innerHTML = '';

		// 最も勝利の多いチーム
		const maxWins = Math.max(...teamStats.map(stats => stats.wins));
		const topTeams = teamStats.filter(stats => stats.wins === maxWins);
		const topTeamNames = topTeams.map((_, index) =>
			CONFIG.TEAM_NAMES[teamStats.findIndex(stats => stats.wins === maxWins)]
		);        // 平均得点（チーム1試合あたり）
		const totalTeamGames = teamStats.reduce((sum, stats) => sum + stats.wins + stats.losses, 0);
		const avgPointsFor = totalTeamGames > 0 ? teamStats.reduce((sum, stats) => sum + stats.pointsFor, 0) / totalTeamGames : 0;
		const avgPointsAgainst = totalTeamGames > 0 ? teamStats.reduce((sum, stats) => sum + stats.pointsAgainst, 0) / totalTeamGames : 0; const statsData = [
			{ label: '進行状況', value: `${completedMatches}/${totalMatches} 試合完了` },
			{ label: '最多勝利チーム', value: maxWins > 0 ? `${topTeamNames.join(', ')} (${maxWins}勝)` : 'まだありません' },
			{ label: '1試合平均得点', value: Math.round(avgPointsFor * 10) / 10 },
			{ label: '1試合平均失点', value: Math.round(avgPointsAgainst * 10) / 10 },
			{ label: '総試合数', value: totalMatches },
			{ label: '残り試合', value: totalMatches - completedMatches }
		];

		statsData.forEach(stat => {
			const row = document.createElement('div');
			row.className = 'stat-row';
			row.innerHTML = `
                <span class="stat-label">${stat.label}</span>
                <span class="stat-value">${stat.value}</span>
            `;
			container.appendChild(row);
		});
	}

	// プログレス更新
	updateProgress() {
		const totalMatches = CONFIG.MATCH_SCHEDULE.reduce((total, round) => total + round.matches.length, 0);
		let completedMatches = 0;

		document.querySelectorAll('.winner-select').forEach(select => {
			if (select.value) {
				completedMatches++;
			}
		});

		const percentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

		const progressFill = document.getElementById('progressFill');
		const progressText = document.getElementById('progressText');

		if (progressFill) {
			progressFill.style.width = `${percentage}%`;
		}
		if (progressText) {
			progressText.textContent = `進行状況: ${completedMatches}/${totalMatches} 試合完了 (${Math.round(percentage)}%)`;
		}
	}    // データ管理モーダルを開く
	openDataManager() {
		// この機能は削除されました
	}

	// データ管理初期化
	initDataManager() {
		// この機能は削除されました
	}    // 現在の試合結果を収集
	collectCurrentResults() {
		const results = [];

		document.querySelectorAll('.winner-select').forEach(select => {
			const matchIndex = parseInt(select.dataset.match);
			const winner = select.value;
			const loserScoreInput = document.querySelector(`.loser-score[data-match="${matchIndex}"]`);
			const loserScore = parseInt(loserScoreInput?.value) || 0;

			// 勝者が選択されているかどうかに関わらず、全ての試合状態を保存
			const match = this.getMatchByGlobalIndex(matchIndex);
			if (match) {
				const roundData = this.getRoundByGlobalIndex(matchIndex);
				const matchPoint = parseInt(document.getElementById('matchPointSetting').value);

				// 勝者が選択されている場合の処理
				if (winner) {
					const loser = winner === match.teams[0] ? match.teams[1] : match.teams[0];

					results.push({
						matchIndex: matchIndex,
						round: roundData.round,
						court: match.court,
						teams: match.teams,
						winner: winner,
						loser: loser,
						winnerScore: matchPoint,
						loserScore: loserScore,
						completed: true,
						timestamp: new Date().toLocaleString('ja-JP')
					});
				} else {
					// 勝者が選択されていない場合も状態を保存
					results.push({
						matchIndex: matchIndex,
						round: roundData.round,
						court: match.court,
						teams: match.teams,
						winner: '',
						loser: '',
						winnerScore: 0,
						loserScore: loserScore,
						completed: false,
						timestamp: new Date().toLocaleString('ja-JP')
					});
				}
			}
		});

		return results;
	}

	// データを保存
	saveData() {
		const currentResults = this.collectCurrentResults();

		const data = {
			teamAssignments: this.teamAssignments,
			matchResults: currentResults,
			matchPoint: parseInt(document.getElementById('matchPointSetting').value),
			timestamp: new Date().toLocaleString('ja-JP'),
			version: '1.0'
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `tennis_match_data_${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		this.showNotification('データを保存しました', 'success');
	}

	// データを読み込み
	loadData() {
		const fileInput = document.getElementById('loadDataInput');
		fileInput.click();
	}

	// ファイルからデータを読み込み
	handleFileLoad(file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target.result);
				this.importData(data);
			} catch (error) {
				this.showNotification('ファイルの読み込みに失敗しました', 'error');
			}
		};
		reader.readAsText(file);
	}    // データインポート実行
	importData(data) {
		if (confirm('現在のデータを上書きしますか？')) {
			console.log('データインポート開始:', data);

			// チーム分けを復元
			if (data.teamAssignments) {
				this.teamAssignments = data.teamAssignments;
				this.renderTeamSelection();
				this.updateTeamDisplayNames();
			}

			// 試合ポイント設定を復元
			if (data.matchPoint) {
				document.getElementById('matchPointSetting').value = data.matchPoint;
			}

			// UI要素を先に再描画
			this.renderRounds();
			this.renderMatchHistory();

			// 試合結果を復元（UI要素の再描画後に実行）
			if (data.matchResults && data.matchResults.length > 0) {
				console.log('試合結果復元開始:', data.matchResults.length, '件');

				// 短い遅延を入れてDOM要素が確実に生成されるのを待つ
				setTimeout(() => {
					// 全ての試合選択とスコア入力をクリア
					document.querySelectorAll('.winner-select').forEach(select => {
						select.value = '';
					});
					document.querySelectorAll('.loser-score').forEach(input => {
						input.value = '';
					});

					// 保存されたデータから試合結果を復元
					let restoredCount = 0;
					data.matchResults.forEach((result, index) => {
						const winnerSelect = document.querySelector(`.winner-select[data-match="${result.matchIndex}"]`);
						const loserScoreInput = document.querySelector(`.loser-score[data-match="${result.matchIndex}"]`);

						console.log(`試合${result.matchIndex}復元:`, {
							winnerSelect: !!winnerSelect,
							loserScoreInput: !!loserScoreInput,
							winner: result.winner,
							loserScore: result.loserScore
						});

						if (winnerSelect && loserScoreInput) {
							winnerSelect.value = result.winner || '';
							loserScoreInput.value = result.loserScore || '';
							restoredCount++;
						}
					});

					console.log(`${restoredCount}/${data.matchResults.length} の試合結果を復元しました`);

					// 統計とプログレスを更新
					this.updateStats();
					this.updateProgress();

					this.showNotification(`データを読み込みました (${restoredCount}件の試合結果を復元)`, 'success');
				}, 100);
			} else {
				// 試合結果がない場合は即座に更新
				this.updateStats();
				this.updateProgress();
				this.showNotification('データを読み込みました (試合結果なし)', 'info');
			}
		}
	}

	// 画面方向変更の処理
	setupOrientationChange() {
		window.addEventListener('orientationchange', () => {
			// 横向きになった時の処理
			setTimeout(() => {
				this.updateStats();
				this.adjustTableLayout();
			}, 100);
		});
	}

	// テーブルレイアウト調整
	adjustTableLayout() {
		const tables = document.querySelectorAll('.table-container');
		tables.forEach(container => {
			const table = container.querySelector('table');
			if (table && window.innerWidth < 768) {
				// モバイルでテーブルが画面幅を超える場合の処理
				const tableWidth = table.scrollWidth;
				const containerWidth = container.clientWidth;
				
				if (tableWidth > containerWidth) {
					container.style.borderLeft = '3px solid #4CAF50';
					container.style.borderRight = '3px solid #4CAF50';
				}
			}
		});
	}

	// ダブルタップズーム防止
	setupDoubleTapPrevention() {
		let lastTouchEnd = 0;
		document.addEventListener('touchend', (event) => {
			const now = (new Date()).getTime();
			if (now - lastTouchEnd <= 300) {
				event.preventDefault();
			}
			lastTouchEnd = now;
		}, false);
	}

	// フォーカス管理の改善
	setupFocusManagement() {
		// 入力フィールドにフォーカスした時のズーム防止
		const inputs = document.querySelectorAll('input, select, textarea');
		inputs.forEach(input => {
			input.addEventListener('focus', () => {
				if (window.innerWidth < 768) {
					// モバイルでズームアウトして全体を見えるようにする
					setTimeout(() => {
						window.scrollTo(0, input.offsetTop - 100);
					}, 300);
				}
			});
		});
	}

	// サービスワーカー登録（オフライン対応）
	registerServiceWorker() {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('sw.js')
				.then(registration => {
					console.log('Service Worker registered:', registration);
				})
				.catch(error => {
					console.log('Service Worker registration failed:', error);
				});
		}
	}
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
	app = new TennisMatchApp();
	
	// 追加のモバイル最適化
	setupAdditionalMobileFeatures();
});

function setupAdditionalMobileFeatures() {
	// 画面方向変更対応
	window.addEventListener('orientationchange', () => {
		setTimeout(() => {
			if (app) {
				app.updateStats();
			}
		}, 100);
	});

	// ダブルタップズーム防止
	let lastTouchEnd = 0;
	document.addEventListener('touchend', (event) => {
		const now = (new Date()).getTime();
		if (now - lastTouchEnd <= 300) {
			event.preventDefault();
		}
		lastTouchEnd = now;
	}, false);

	// フォーカス時のスクロール調整
	document.addEventListener('focusin', (e) => {
		if (window.innerWidth < 768 && e.target.matches('input, select, textarea')) {
			setTimeout(() => {
				e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 300);
		}
	});
}
