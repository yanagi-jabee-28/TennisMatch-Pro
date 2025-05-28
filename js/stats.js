/**
 * 統計・分析関連の機能
 * 
 * チーム統計、試合結果の集計、分析に関する機能を提供します。
 */

// TennisMatchAppクラスのプロトタイプにメソッドを追加
Object.assign(TennisMatchApp.prototype, {
    // 統計の更新
    updateStats() {
        this.renderTeamStats();
        this.renderAnalytics();
    },
    
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
    },
    
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
    },
    
    // 分析データのレンダリング
    renderAnalytics() {
        const container = document.getElementById('analyticsContainer');
        if (!container) return;
        
        // サマリーカードを表示
        this.renderAnalyticsSummary();
        
        // チャートを表示
        this.renderAnalyticsCharts();
    },
    
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
    },
    
    // 平均敗者スコアの計算
    calculateAverageLoserScore() {
        const completedMatches = this.matchResults.filter(m => m.winner);
        if (completedMatches.length === 0) return 0;
        
        const totalLoserScore = completedMatches.reduce((total, match) => total + match.loserScore, 0);
        return totalLoserScore / completedMatches.length;
    },
    
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
    },
    
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
    },
    
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
    },
    
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
    },
    
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
});
