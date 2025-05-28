/**
 * 試合・対戦関連の機能
 * 
 * 試合の生成、管理、結果記録に関する機能を提供します。
 */

// TennisMatchAppクラスのプロトタイプにメソッドを追加
Object.assign(TennisMatchApp.prototype, {
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
    },
    
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
    },
    
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
    },
    
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
    },
    
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
    },
    
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
    },
    
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
    },
    
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
});
