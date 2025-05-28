/**
 * テニス対戦表アプリケーション
 * 
 * このファイルは、テニス対戦表アプリケーションのすべての機能を含みます。
 */

// アプリケーションクラス
class TennisMatchApp {
	constructor() {
		this.selectedTeam = null;
		this.matchResults = [];
		
		// チーム割り当てを初期化（デフォルト割り当てを使用）
		if (CONFIG.DEFAULT_TEAM_ASSIGNMENTS) {
			// デフォルトのチーム割り当てを使用
			this.teamAssignments = JSON.parse(JSON.stringify(CONFIG.DEFAULT_TEAM_ASSIGNMENTS));
		} else {
			// 旧バージョン互換：空のチーム割り当てで初期化
			this.teamAssignments = {};
			CONFIG.TEAM_NAMES.forEach(team => {
				this.teamAssignments[team] = [];
			});
		}

		this.init();
	}

	// 初期化
	init() {
		this.loadSettingsFromCookie();
		this.setupEventListeners();
		this.setupMobileFeatures();
		this.initializeMatchPoint();
		this.renderTeamSelection();
		this.renderRounds();
		this.renderMatchHistory();
		this.updateStats();
		this.setupAutosave();
		this.setupPageUnloadHandler();
		
		// 設定パネルの追加
		this.renderSettingsPanel();
	}
	
	// Cookie から設定を読み込む
	loadSettingsFromCookie() {
		if (!checkCookieConsent()) {
			return; // Cookie使用に同意していない場合は何もしない
		}
		
		// ダークモード設定の復元
		const darkModeSetting = getCookie('darkMode');
		if (darkModeSetting === 'true') {
			document.body.classList.add('dark-mode');
			// ダークモードトグルボタンのテキストを更新
			const darkModeToggle = document.getElementById('darkModeToggle');
			if (darkModeToggle) {
				darkModeToggle.textContent = '☀️';
			}
		}
		
		// 保存された試合結果の復元
		const savedResults = getCookie('matchResults');
		if (savedResults) {
			try {
				this.matchResults = JSON.parse(savedResults);
				console.log('保存された試合結果を復元しました');
			} catch (e) {
				console.error('保存された試合結果の解析に失敗しました', e);
			}
		}
		
		// 保存されたチーム割り当ての復元
		const savedAssignments = getCookie('teamAssignments');
		if (savedAssignments) {
			try {
				this.teamAssignments = JSON.parse(savedAssignments);
				console.log('保存されたチーム割り当てを復元しました');
			} catch (e) {
				console.error('保存されたチーム割り当ての解析に失敗しました', e);
			}
		}
	}

	// イベントリスナーのセットアップ
	setupEventListeners() {
		// ダークモードトグル
		const darkModeToggle = document.getElementById('darkModeToggle');
		if (darkModeToggle) {
			darkModeToggle.addEventListener('click', () => {
				document.body.classList.toggle('dark-mode');
				const isDarkMode = document.body.classList.contains('dark-mode');
				
				// ボタンのテキストを更新
				darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
				
				if (checkCookieConsent()) {
					setCookie('darkMode', isDarkMode, 30); // 30日間の有効期限
				}
			});
		}
		
		// データ保存ボタン
		const saveDataBtn = document.getElementById('saveDataBtn');
		if (saveDataBtn) {
			saveDataBtn.addEventListener('click', () => {
				this.saveDataToFile();
			});
		}
		
		// データ読み込みボタン
		const loadDataBtn = document.getElementById('loadDataBtn');
		const loadDataInput = document.getElementById('loadDataInput');
		if (loadDataBtn && loadDataInput) {
			loadDataBtn.addEventListener('click', () => {
				loadDataInput.click();
			});
			
			loadDataInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file) {
					this.loadDataFromFile(file);
				}
			});
		}
		
		// エクスポートボタン
		const exportBtn = document.getElementById('exportBtn');
		if (exportBtn) {
			exportBtn.addEventListener('click', () => {
				this.exportResultsAsCSV();
			});
		}
		
		// ヘルプボタン
		const helpBtn = document.getElementById('helpBtn');
		if (helpBtn) {
			helpBtn.addEventListener('click', () => {
				this.showHelpModal();
			});
		}
		
		// タブ切り替え
		document.querySelectorAll('.tab-btn').forEach(button => {
			button.addEventListener('click', () => {
				const targetId = button.getAttribute('data-tab');
				
				// タブボタンのアクティブ状態を切り替え
				document.querySelectorAll('.tab-btn').forEach(btn => {
					btn.classList.remove('active');
				});
				button.classList.add('active');
				
				// タブコンテンツの表示を切り替え
				document.querySelectorAll('.tab-content').forEach(content => {
					content.classList.remove('active');
				});
				document.getElementById(targetId).classList.add('active');
			});
		});
		
		// 履歴検索
		const searchInput = document.getElementById('historySearch');
		if (searchInput) {
			searchInput.addEventListener('input', () => {
				this.filterMatchHistory(searchInput.value);
			});
		}
    
        // チームリセットボタン
        const resetTeamsBtn = document.getElementById('resetTeamsBtn');
        if (resetTeamsBtn) {
            resetTeamsBtn.addEventListener('click', () => {
                this.resetTeamMembers();
            });
        }
	}

	// モバイル向け機能のセットアップ
	setupMobileFeatures() {
		// タッチフィードバックを追加
		document.querySelectorAll('button, .team-card, .tab-btn').forEach(element => {
			element.classList.add('touch-feedback');
		});
		
		// スクロールヒントの表示（小画面の場合のみ）
		this.updateScrollHints();
		window.addEventListener('resize', () => {
			this.updateScrollHints();
		});
	}

	// スクロールヒントの更新
	updateScrollHints() {
		const scrollHints = document.querySelectorAll('.scroll-hint');
		const isMobile = window.innerWidth <= 768;
		
		scrollHints.forEach(hint => {
			hint.style.display = isMobile ? 'block' : 'none';
		});
	}

	// 自動保存の設定
	setupAutosave() {
		// 5分ごとに自動保存
		setInterval(() => {
			if (checkCookieConsent()) {
				setCookie('matchResults', JSON.stringify(this.matchResults), 30);
				setCookie('teamAssignments', JSON.stringify(this.teamAssignments), 30);
				console.log('データを自動保存しました');
				this.showNotification('データを自動保存しました', 'info', 2000);
			}
		}, 5 * 60 * 1000); // 5分 = 5 * 60 * 1000ミリ秒
	}

	// ページアンロード時の処理
	setupPageUnloadHandler() {
		window.addEventListener('beforeunload', (e) => {
			// Cookie に現在の状態を保存
			if (checkCookieConsent()) {
				setCookie('matchResults', JSON.stringify(this.matchResults), 30);
				setCookie('teamAssignments', JSON.stringify(this.teamAssignments), 30);
			}
		});
	}

	// マッチポイントの初期化
	initializeMatchPoint() {
		// マッチポイントセレクトの取得
		const matchPointSelect = document.getElementById('matchPointSetting');
		
		// イベントリスナーの設定
		matchPointSelect.addEventListener('change', () => {
			this.renderRounds(); // マッチポイント変更時にラウンド表示を更新
		});
	}

	// マッチポイントの取得
	getMatchPoint() {
		const matchPointSelect = document.getElementById('matchPointSetting');
		return parseInt(matchPointSelect.value);
	}

	// 設定パネルのレンダリング
	renderSettingsPanel() {
		// 必要に応じて実装
	}
  
    // チーム選択画面のレンダリング
    renderTeamSelection() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // チームカードを作成
        CONFIG.TEAM_NAMES.forEach(teamName => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            if (this.selectedTeam === teamName) {
                teamCard.classList.add('selected');
            }
            
            // チームヘッダー
            const teamHeader = document.createElement('div');
            teamHeader.className = 'team-header';
            teamHeader.textContent = teamName;
            teamCard.appendChild(teamHeader);
            
            // メンバーリスト
            const memberList = document.createElement('div');
            memberList.className = 'member-list';
            
            // チームに割り当てられたメンバーを表示
            const assignedMembers = this.teamAssignments[teamName] || [];
            assignedMembers.forEach(member => {
                const memberItem = document.createElement('div');
                memberItem.className = 'member-item';
                memberItem.textContent = member;
                memberList.appendChild(memberItem);
            });
            
            teamCard.appendChild(memberList);
            
            // クリックイベント
            teamCard.addEventListener('click', () => {
                this.selectTeam(teamName);
            });
            
            container.appendChild(teamCard);
        });
        
        // 選択状態の表示
        this.updateSelectionStatus();
        
        // 利用可能なメンバーリストの表示
        this.renderAvailableMembers();
    }
    
    // チーム選択
    selectTeam(teamName) {
        // 同じチームを選択した場合は選択解除
        if (this.selectedTeam === teamName) {
            this.selectedTeam = null;
        } else {
            this.selectedTeam = teamName;
        }
        
        // 選択状態を更新
        this.renderTeamSelection();
    }
    
    // 選択状態の更新
    updateSelectionStatus() {
        const statusElement = document.getElementById('selectionStatus');
        if (!statusElement) return;
        
        if (this.selectedTeam) {
            statusElement.innerHTML = `<div class="selection-status"><span class="status-dot ready"></span>${this.selectedTeam} を選択中</div>`;
        } else {
            statusElement.innerHTML = `<div class="selection-status"><span class="status-dot"></span>チームを選択してください</div>`;
        }
    }
    
    // 利用可能なメンバーリストのレンダリング
    renderAvailableMembers() {
        const container = document.getElementById('availableMembersContainer');
        if (!container) return;
        
        // 既に割り当てられているメンバーを取得
        const assignedMembers = new Set();
        Object.values(this.teamAssignments).forEach(members => {
            members.forEach(member => {
                assignedMembers.add(member);
            });
        });
        
        // 利用可能なメンバーを表示
        const availableMembersElement = document.createElement('div');
        availableMembersElement.className = 'available-members';
        
        CONFIG.ALL_MEMBERS.filter(member => !assignedMembers.has(member)).forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'available-member';
            memberElement.textContent = member;
            
            // クリックイベント（選択中のチームにメンバーを追加）
            memberElement.addEventListener('click', () => {
                if (this.selectedTeam) {
                    this.addMemberToTeam(this.selectedTeam, member);
                } else {
                    this.showNotification('先にチームを選択してください', 'error');
                }
            });
            
            availableMembersElement.appendChild(memberElement);
        });
        
        container.innerHTML = '';
        
        // タイトル
        const title = document.createElement('div');
        title.className = 'available-members-title';
        title.textContent = '利用可能なメンバー';
        container.appendChild(title);
        
        container.appendChild(availableMembersElement);
        
        // 指示文を追加
        const instruction = document.createElement('div');
        instruction.className = 'selection-instruction';
        instruction.innerHTML = `
            <p>1. チームを選択（クリック）します</p>
            <p>2. 利用可能なメンバーからチームに追加したいメンバーをクリックします</p>
            <p>3. すべてのチームにメンバーを割り当てたら、下のラウンド表でゲームを開始できます</p>
        `;
        container.appendChild(instruction);
    }
    
    // チームにメンバーを追加
    addMemberToTeam(teamName, memberName) {
        // チームが存在しない場合は作成
        if (!this.teamAssignments[teamName]) {
            this.teamAssignments[teamName] = [];
        }
        
        // 既に追加されている場合は何もしない
        if (this.teamAssignments[teamName].includes(memberName)) {
            this.showNotification(`${memberName} は既に ${teamName} に追加されています`, 'info');
            return;
        }
        
        // メンバーがどこかのチームに既に属している場合は、そのチームから削除
        Object.keys(this.teamAssignments).forEach(team => {
            const index = this.teamAssignments[team].indexOf(memberName);
            if (index !== -1) {
                this.teamAssignments[team].splice(index, 1);
            }
        });
        
        // 新しいチームに追加
        this.teamAssignments[teamName].push(memberName);
        
        // UI更新
        this.renderTeamSelection();
        this.showNotification(`${memberName} を ${teamName} に追加しました`, 'success');
    }
    
    // チームからメンバーを削除
    removeMemberFromTeam(teamName, memberName) {
        if (!this.teamAssignments[teamName]) return;
        
        const index = this.teamAssignments[teamName].indexOf(memberName);
        if (index !== -1) {
            this.teamAssignments[teamName].splice(index, 1);
            
            // UI更新
            this.renderTeamSelection();
            this.showNotification(`${memberName} を ${teamName} から削除しました`, 'info');
        }
    }
    
    // チームメンバーをリセット
    resetTeamMembers() {
        // デフォルト割り当てに戻すか、すべて空にする
        if (CONFIG.DEFAULT_TEAM_ASSIGNMENTS) {
            this.teamAssignments = JSON.parse(JSON.stringify(CONFIG.DEFAULT_TEAM_ASSIGNMENTS));
        } else {
            Object.keys(this.teamAssignments).forEach(team => {
                this.teamAssignments[team] = [];
            });
        }
        
        // UI更新
        this.renderTeamSelection();
        this.showNotification('チームメンバーをリセットしました', 'info');
    }
    
    // チーム名を取得（インデックスから）
    getTeamName(index) {
        return CONFIG.TEAM_NAMES[index] || `チーム${index + 1}`;
    }
    
    // チームメンバーを取得
    getTeamMembers(teamName) {
        return this.teamAssignments[teamName] || [];
    }
    
    // ラウンド表示の生成
    renderRounds() {
        const container = document.getElementById('roundsContainer');
        if (!container) return;
        
        // 既存のラウンドをクリア
        container.innerHTML = '';
        
        // マッチポイントを取得
        const matchPoint = this.getMatchPoint();
        
        // プレランダムマッチとランダムマッチを生成
        const matchups = this.generateMatchups();
        
        // ラウンド生成
        for (let roundIndex = 0; roundIndex < CONFIG.ROUNDS.length; roundIndex++) {
            // ラウンド情報を取得
            const round = CONFIG.ROUNDS[roundIndex];
            
            // ラウンドコンテナ作成
            const roundContainer = document.createElement('div');
            roundContainer.className = 'round-container';
            
            // ラウンドヘッダー作成
            const roundHeader = document.createElement('div');
            roundHeader.className = 'round-header';
            roundHeader.textContent = `${round.name}`;
            roundContainer.appendChild(roundHeader);
            
            // マッチコンテナ作成
            const matchesContainer = document.createElement('div');
            matchesContainer.className = 'matches-container';
            
            // マッチ生成
            for (let courtIndex = 0; courtIndex < round.courts; courtIndex++) {
                const matchIndex = this.getMatchIndexForRoundAndCourt(roundIndex, courtIndex);
                let match;
                
                if (matchIndex < matchups.length) {
                    match = matchups[matchIndex];
                } else {
                    // マッチが足りない場合は空マッチを生成
                    match = { teams: ['TBD', 'TBD'], winner: null, loserScore: 0 };
                }
                
                // マッチ要素の生成
                const matchElement = this.createMatchElement(match, matchPoint, roundIndex, courtIndex, matchIndex);
                matchesContainer.appendChild(matchElement);
            }
            
            roundContainer.appendChild(matchesContainer);
            container.appendChild(roundContainer);
        }
        
        // 進行状況の更新
        this.updateProgress();
    }
    
    // ラウンドとコートからマッチインデックスを取得
    getMatchIndexForRoundAndCourt(roundIndex, courtIndex) {
        let matchIndex = 0;
        
        // 前のラウンドのコート数を合計
        for (let i = 0; i < roundIndex; i++) {
            matchIndex += CONFIG.ROUNDS[i].courts;
        }
        
        // 現在のラウンドの該当コート
        matchIndex += courtIndex;
        
        return matchIndex;
    }
    
    // マッチ要素の生成
    createMatchElement(match, matchPoint, roundIndex, courtIndex, matchIndex) {
        const matchContainer = document.createElement('div');
        matchContainer.className = 'match-container';
        
        // コート情報
        const courtInfo = document.createElement('div');
        courtInfo.className = 'court-info';
        courtInfo.textContent = `コート ${courtIndex + 1}`;
        matchContainer.appendChild(courtInfo);
        
        // チーム情報
        const teamsInfo = document.createElement('div');
        teamsInfo.className = 'teams-info';
        
        // チーム1
        const team1 = document.createElement('div');
        team1.className = 'team';
        team1.textContent = match.teams[0];
        teamsInfo.appendChild(team1);
        
        // VS
        const vs = document.createElement('div');
        vs.className = 'vs';
        vs.textContent = 'vs';
        teamsInfo.appendChild(vs);
        
        // チーム2
        const team2 = document.createElement('div');
        team2.className = 'team';
        team2.textContent = match.teams[1];
        teamsInfo.appendChild(team2);
        
        matchContainer.appendChild(teamsInfo);
        
        // 勝者選択フォーム
        const winnerForm = document.createElement('div');
        winnerForm.className = 'winner-form';
        
        // 勝者ラベル
        const winnerLabel = document.createElement('label');
        winnerLabel.textContent = '勝者:';
        winnerForm.appendChild(winnerLabel);
        
        // 勝者選択
        const winnerSelect = document.createElement('select');
        winnerSelect.className = 'winner-select';
        winnerSelect.dataset.round = roundIndex;
        winnerSelect.dataset.court = courtIndex;
        winnerSelect.dataset.match = matchIndex;
        
        // 選択肢の追加
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '選択してください';
        winnerSelect.appendChild(defaultOption);
        
        // チーム選択肢を追加
        match.teams.forEach((team, index) => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            
            // マッチ結果に基づいて選択状態を設定
            if (match.winner === team) {
                option.selected = true;
            }
            
            winnerSelect.appendChild(option);
        });
        
        winnerForm.appendChild(winnerSelect);
        
        // 敗者スコア入力
        const loserScoreContainer = document.createElement('div');
        loserScoreContainer.className = 'loser-score-container';
        
        const loserScoreLabel = document.createElement('label');
        loserScoreLabel.textContent = '敗者スコア:';
        loserScoreContainer.appendChild(loserScoreLabel);
        
        const loserScoreInput = document.createElement('input');
        loserScoreInput.type = 'number';
        loserScoreInput.min = '0';
        loserScoreInput.max = String(matchPoint);
        loserScoreInput.className = 'loser-score';
        loserScoreInput.value = match.loserScore !== undefined ? match.loserScore : '';
        loserScoreInput.dataset.round = roundIndex;
        loserScoreInput.dataset.court = courtIndex;
        loserScoreInput.dataset.match = matchIndex;
        
        loserScoreContainer.appendChild(loserScoreInput);
        winnerForm.appendChild(loserScoreContainer);
        
        // イベントリスナー追加
        winnerSelect.addEventListener('change', (e) => {
            const winner = e.target.value;
            const matchIndex = parseInt(e.target.dataset.match);
            
            // マッチアップの更新
            this.updateMatchResult(matchIndex, winner, parseInt(loserScoreInput.value) || 0);
        });
        
        loserScoreInput.addEventListener('change', (e) => {
            const matchIndex = parseInt(e.target.dataset.match);
            const loserScore = parseInt(e.target.value) || 0;
            const winner = winnerSelect.value;
            
            if (winner) {
                this.updateMatchResult(matchIndex, winner, loserScore);
            }
        });
        
        matchContainer.appendChild(winnerForm);
        
        return matchContainer;
    }
    
    // マッチ結果の更新
    updateMatchResult(matchIndex, winner, loserScore) {
        // マッチアップ取得
        const matchups = this.generateMatchups();
        
        if (matchIndex < matchups.length) {
            const match = matchups[matchIndex];
            
            // 勝者が有効かどうかをチェック
            if (match.teams.includes(winner)) {
                // 既存の結果を検索
                let resultIndex = this.matchResults.findIndex(r => 
                    r.teams[0] === match.teams[0] && r.teams[1] === match.teams[1]);
                
                if (resultIndex === -1) {
                    // 新規結果を追加
                    this.matchResults.push({
                        teams: [...match.teams],
                        winner: winner,
                        loserScore: loserScore
                    });
                } else {
                    // 既存結果を更新
                    this.matchResults[resultIndex].winner = winner;
                    this.matchResults[resultIndex].loserScore = loserScore;
                }
                
                // UI更新
                this.renderMatchHistory();
                this.updateProgress();
                this.updateStats();
                
                // 通知
                this.showNotification(`試合結果を記録しました: ${winner} の勝利`, 'success');
            }
        }
    }
    
    // マッチアップの生成
    generateMatchups() {
        // 既存の結果を取得
        const existingResults = [...this.matchResults];
        
        // プレランダムマッチを使用
        const matchups = [];
        
        // 定義されたマッチアップを追加
        CONFIG.PREMADE_MATCHUPS.forEach(match => {
            // 既存の結果があれば、それを使用
            const existingResult = existingResults.find(r => 
                (r.teams[0] === match.teams[0] && r.teams[1] === match.teams[1]) ||
                (r.teams[0] === match.teams[1] && r.teams[1] === match.teams[0]));
            
            if (existingResult) {
                matchups.push(existingResult);
            } else {
                matchups.push({
                    teams: [...match.teams],
                    winner: null,
                    loserScore: 0
                });
            }
        });
        
        return matchups;
    }
    
    // 試合進行状況の更新
    updateProgress() {
        const progressBar = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (!progressBar || !progressText) return;
        
        // 完了した試合数
        const completedMatches = this.matchResults.length;
        
        // 総試合数
        const totalMatches = CONFIG.PREMADE_MATCHUPS.length;
        
        // 進捗率計算
        const progressPercent = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
        
        // UI更新
        progressBar.style.width = `${progressPercent}%`;
        progressText.textContent = `進行状況: ${completedMatches}/${totalMatches} 試合完了`;
    }
    
    // 試合履歴の表示
    renderMatchHistory() {
        const historyContainer = document.getElementById('matchHistoryTable');
        if (!historyContainer) return;
        
        // テーブルヘッダー作成
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>対戦</th>
                        <th>勝者</th>
                        <th>スコア</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // 結果の取得と表示
        const results = [...this.matchResults];
        
        // グローバルインデックス追跡用
        let globalIndex = 0;
        
        if (results.length === 0) {
            tableHTML += `
                <tr>
                    <td colspan="3" class="no-data">試合結果はまだありません</td>
                </tr>
            `;
        } else {
            // 各試合の結果を表示
            results.forEach((match, index) => {
                const [team1, team2] = match.teams;
                const winner = match.winner;
                const loserScore = match.loserScore;
                const matchPoint = this.getMatchPoint();
                
                // チーム1のメンバー
                const team1Members = this.getTeamMembers(team1);
                const team1MembersHtml = team1Members.length ? 
                    team1Members.map(m => `<span class="history-team-member">${m}</span>`).join(" ") : 
                    '<span class="history-no-members">メンバー未設定</span>';
                
                // チーム2のメンバー
                const team2Members = this.getTeamMembers(team2);
                const team2MembersHtml = team2Members.length ? 
                    team2Members.map(m => `<span class="history-team-member">${m}</span>`).join(" ") : 
                    '<span class="history-no-members">メンバー未設定</span>';
                
                tableHTML += `
                    <tr>
                        <td>
                            <div class="match-teams-info">
                                <div class="match-team-info">
                                    <div class="match-team-name">${team1}</div>
                                    <div class="match-team-members">${team1MembersHtml}</div>
                                </div>
                                <div class="match-vs-text">vs</div>
                                <div class="match-team-info">
                                    <div class="match-team-name">${team2}</div>
                                    <div class="match-team-members">${team2MembersHtml}</div>
                                </div>
                            </div>
                        </td>
                        <td>${winner || '-'}</td>
                        <td>${winner ? `${matchPoint}-${loserScore}` : '-'}</td>
                    </tr>
                `;
                
                globalIndex++;
            });
        }
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        historyContainer.innerHTML = tableHTML;
    }
    
    // 試合履歴のフィルタリング
    filterMatchHistory(query) {
        const historyTable = document.getElementById('matchHistoryTable');
        if (!historyTable) return;
        
        const rows = historyTable.querySelectorAll('tbody tr');
        const lowerQuery = query.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // 統計の更新
    updateStats() {
        this.renderTeamStats();
        this.renderAnalytics();
    }
    
    // チーム統計のレンダリング
    renderTeamStats() {
        const container = document.getElementById('teamStatsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // チームごとの戦績を計算
        const teamStats = this.calculateTeamStats();
        
        // 各チームのカードを作成
        Object.keys(teamStats).forEach(teamName => {
            const stats = teamStats[teamName];
            
            // チームカードの作成
            const teamCard = document.createElement('div');
            teamCard.className = 'team-stats-card';
            
            // チーム名
            const teamHeader = document.createElement('div');
            teamHeader.className = 'team-stats-header';
            teamHeader.textContent = teamName;
            teamCard.appendChild(teamHeader);
            
            // メンバー情報
            const teamMembers = this.getTeamMembers(teamName);
            if (teamMembers.length > 0) {
                const membersElement = document.createElement('div');
                membersElement.className = 'team-members';
                membersElement.textContent = `メンバー: ${teamMembers.join(', ')}`;
                teamCard.appendChild(membersElement);
            }
            
            // 試合データサマリー
            const statsSummary = document.createElement('div');
            statsSummary.className = 'stats-summary';
            
            // 勝利数
            const winsElement = document.createElement('div');
            winsElement.className = 'stat-item';
            winsElement.innerHTML = `
                <div class="stat-label">勝利</div>
                <div class="stat-value">${stats.wins}</div>
            `;
            statsSummary.appendChild(winsElement);
            
            // 敗北数
            const lossesElement = document.createElement('div');
            lossesElement.className = 'stat-item';
            lossesElement.innerHTML = `
                <div class="stat-label">敗北</div>
                <div class="stat-value">${stats.losses}</div>
            `;
            statsSummary.appendChild(lossesElement);
            
            teamCard.appendChild(statsSummary);
            
            // 詳細な試合結果
            if (stats.matches.length > 0) {
                const matchDetails = document.createElement('div');
                matchDetails.className = 'match-details';
                
                stats.matches.forEach(match => {
                    const opponent = match.opponent;
                    const isWinner = match.winner === teamName;
                    const score = match.score;
                    
                    const matchItem = document.createElement('div');
                    matchItem.className = `match-detail-item ${isWinner ? 'win' : 'lose'}`;
                    matchItem.innerHTML = `
                        <div>vs ${opponent}</div>
                        <div>${isWinner ? '勝利' : '敗北'} (${score})</div>
                    `;
                    
                    matchDetails.appendChild(matchItem);
                });
                
                teamCard.appendChild(matchDetails);
            }
            
            container.appendChild(teamCard);
        });
    }
    
    // チーム統計の計算
    calculateTeamStats() {
        const teamStats = {};
        
        // チームの初期化
        CONFIG.TEAM_NAMES.forEach(team => {
            teamStats[team] = {
                wins: 0,
                losses: 0,
                matches: []
            };
        });
        
        // 試合結果に基づいて統計を更新
        this.matchResults.forEach(result => {
            if (!result.winner) return; // まだ結果がない場合はスキップ
            
            const matchPoint = this.getMatchPoint();
            const [team1, team2] = result.teams;
            const winner = result.winner;
            const loser = winner === team1 ? team2 : team1;
            const loserScore = result.loserScore;
            
            // 勝者の統計更新
            if (teamStats[winner]) {
                teamStats[winner].wins++;
                teamStats[winner].matches.push({
                    opponent: loser,
                    winner: winner,
                    score: `${matchPoint}-${loserScore}`
                });
            }
            
            // 敗者の統計更新
            if (teamStats[loser]) {
                teamStats[loser].losses++;
                teamStats[loser].matches.push({
                    opponent: winner,
                    winner: winner,
                    score: `${loserScore}-${matchPoint}`
                });
            }
        });
        
        return teamStats;
    }
    
    // 分析データのレンダリング
    renderAnalytics() {
        const container = document.getElementById('analyticsContainer');
        if (!container) return;
        
        // サマリーカードを表示
        this.renderAnalyticsSummary();
        
        // チャートを表示
        this.renderAnalyticsCharts();
    }
    
    // 分析サマリーのレンダリング
    renderAnalyticsSummary() {
        const container = document.querySelector('.analytics-summary .summary-cards');
        if (!container) return;
        
        // 試合データの集計
        const totalMatches = this.matchResults.length;
        const completedMatches = this.matchResults.filter(m => m.winner).length;
        const highestScore = this.getMatchPoint();
        const avgLoserScore = this.calculateAverageLoserScore();
        
        // サマリーカードのHTML
        container.innerHTML = `
            <div class="summary-card">
                <h4>総試合数</h4>
                <div class="summary-value">${completedMatches}</div>
            </div>
            <div class="summary-card">
                <h4>平均敗者得点</h4>
                <div class="summary-value">${avgLoserScore.toFixed(1)}</div>
            </div>
            <div class="summary-card">
                <h4>勝点</h4>
                <div class="summary-value">${highestScore}</div>
            </div>
        `;
    }
    
    // 平均敗者スコアの計算
    calculateAverageLoserScore() {
        const completedMatches = this.matchResults.filter(m => m.winner);
        if (completedMatches.length === 0) return 0;
        
        const totalLoserScore = completedMatches.reduce((total, match) => total + match.loserScore, 0);
        return totalLoserScore / completedMatches.length;
    }
    
    // 分析チャートのレンダリング
    renderAnalyticsCharts() {
        const container = document.querySelector('.analytics-charts');
        if (!container) return;
        
        // チームの勝率チャートを表示
        container.innerHTML = `
            <div class="chart-container">
                <h4>チーム勝率</h4>
                <div class="chart" id="winRateChart"></div>
            </div>
        `;
        
        // 勝率チャートのデータ
        this.renderWinRateChart();
    }
    
    // 勝率チャートのレンダリング
    renderWinRateChart() {
        const chartElement = document.getElementById('winRateChart');
        if (!chartElement) return;
        
        const teamStats = this.calculateTeamStats();
        
        // 勝率でソートしたチームリスト
        const sortedTeams = Object.keys(teamStats).sort((a, b) => {
            const aRate = teamStats[a].wins / (teamStats[a].wins + teamStats[a].losses) || 0;
            const bRate = teamStats[b].wins / (teamStats[b].wins + teamStats[b].losses) || 0;
            return bRate - aRate;
        });
        
        // チャートHTML生成
        let chartHTML = '';
        
        sortedTeams.forEach(team => {
            const stats = teamStats[team];
            const totalMatches = stats.wins + stats.losses;
            const winRate = totalMatches > 0 ? (stats.wins / totalMatches) * 100 : 0;
            
            chartHTML += `
                <div class="chart-bar">
                    <div class="chart-label">${team}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${winRate}%">
                            ${winRate > 15 ? `${winRate.toFixed(0)}%` : ''}
                        </div>
                    </div>
                    <div class="chart-value">${stats.wins}勝${stats.losses}敗</div>
                </div>
            `;
        });
        
        chartElement.innerHTML = chartHTML;
    }
    
    // データのCSVエクスポート
    exportResultsAsCSV() {
        // ヘッダー行
        let csvContent = "データ種別,チーム1,チーム1メンバー,チーム2,チーム2メンバー,勝者,敗者得点\n";
        
        // 試合結果のエクスポート
        this.matchResults.forEach(match => {
            const team1 = match.teams[0];
            const team2 = match.teams[1];
            const team1Members = this.getTeamMembers(team1).join(', ');
            const team2Members = this.getTeamMembers(team2).join(', ');
            const winner = match.winner || '';
            const loserScore = match.winner ? match.loserScore : '';
            
            csvContent += `試合結果,${team1},"${team1Members}",${team2},"${team2Members}",${winner},${loserScore}\n`;
        });
        
        // チーム割り当てのエクスポート
        Object.keys(this.teamAssignments).forEach(team => {
            const members = this.teamAssignments[team].join(', ');
            csvContent += `チーム割り当て,${team},"${members}",,,,\n`;
        });
        
        // チーム統計のエクスポート
        const teamStats = this.calculateTeamStats();
        Object.keys(teamStats).forEach(team => {
            const stats = teamStats[team];
            csvContent += `チーム統計,${team},,,,${stats.wins}勝,${stats.losses}敗\n`;
        });
        
        // ダウンロードリンクの作成
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // 日付を取得
        const now = new Date();
        const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `tennis_results_${dateString}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('データをエクスポートしました', 'success');
    }
    
    // データを保存
    saveDataToFile() {
        const data = {
            matchResults: this.matchResults,
            teamAssignments: this.teamAssignments
        };
        
        // JSONに変換
        const jsonData = JSON.stringify(data, null, 2);
        
        // ダウンロードリンクの作成
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // 日付を取得
        const now = new Date();
        const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `tennis_data_${dateString}.json`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('データをファイルに保存しました', 'success');
    }
    
    // ファイルからデータを読み込み
    loadDataFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // データ検証
                if (data.matchResults && Array.isArray(data.matchResults) &&
                    data.teamAssignments && typeof data.teamAssignments === 'object') {
                    
                    this.matchResults = data.matchResults;
                    this.teamAssignments = data.teamAssignments;
                    
                    // UI更新
                    this.renderTeamSelection();
                    this.renderRounds();
                    this.renderMatchHistory();
                    this.updateStats();
                    
                    this.showNotification('データを正常に読み込みました', 'success');
                } else {
                    this.showNotification('無効なデータ形式です', 'error');
                }
            } catch (error) {
                console.error('ファイル読み込みエラー:', error);
                this.showNotification('ファイルの読み込み中にエラーが発生しました', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // 通知の表示
    showNotification(message, type = 'info', duration = 3000) {
        // 既存の通知があれば削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        // 通知要素の作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 通知を表示
        document.body.appendChild(notification);
        
        // 表示時間後に自動消去
        setTimeout(() => {
            if (notification.parentNode === document.body) {
                document.body.removeChild(notification);
            }
        }, duration);
    }
    
    // ヘルプモーダルの表示
    showHelpModal() {
        // モーダルコンテナがなければ作成
        let modal = document.getElementById('helpModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'helpModal';
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            // 閉じるボタン
            const closeButton = document.createElement('span');
            closeButton.className = 'modal-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            // ヘルプ内容
            const helpContent = document.createElement('div');
            helpContent.innerHTML = `
                <h2>使い方ガイド</h2>
                
                <h3>チーム編成</h3>
                <p>1. チームカードをクリックしてチームを選択します</p>
                <p>2. 利用可能なメンバーからチームに追加したいメンバーをクリックします</p>
                <p>3. すべてのチームにメンバーを割り当てます</p>
                
                <h3>試合の記録</h3>
                <p>1. ドロップダウンから勝者を選択します</p>
                <p>2. 敗者のスコアを入力します</p>
                <p>3. 結果が自動的に保存されます</p>
                
                <h3>データの管理</h3>
                <p>💾 ボタン: すべてのデータをJSONファイルとして保存</p>
                <p>📂 ボタン: 以前保存したデータを読み込み</p>
                <p>📊 ボタン: 結果をCSVファイルとしてエクスポート</p>
                <p>🌙/☀️ ボタン: ダークモード/ライトモードの切り替え</p>
                
                <h3>試合規則</h3>
                <p>マッチポイントは設定画面で変更できます（デフォルト: 6ポイント）</p>
                <p>勝者が先にマッチポイントに到達し、試合終了となります</p>
            `;
            
            modalContent.appendChild(closeButton);
            modalContent.appendChild(helpContent);
            modal.appendChild(modalContent);
            
            document.body.appendChild(modal);
            
            // モーダル外クリックで閉じる
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // モーダルを表示
        modal.style.display = 'block';
    }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TennisMatchApp();
});
