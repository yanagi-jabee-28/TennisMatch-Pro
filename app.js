// 設定ファイルのデータをロードする関数
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('設定ファイルの読み込みに失敗しました:', error);
        return null;
    }
}

// アプリケーション状態の管理
const appState = {
    teams: [],
    matches: {},
    standings: []
};

// ローカルストレージから試合結果を読み込む
function loadMatchResults() {
    const savedMatches = localStorage.getItem('tennisMatchResults');
    if (savedMatches) {
        try {
            appState.matches = JSON.parse(savedMatches);
        } catch (e) {
            console.error('試合結果の読み込みに失敗しました:', e);
            appState.matches = {};
        }
    }
}

// ローカルストレージに試合結果を保存する
function saveMatchResults() {
    localStorage.setItem('tennisMatchResults', JSON.stringify(appState.matches));
}

// チーム情報を表示する関数
function renderTeams() {
    const teamsContainer = document.getElementById('teams-container');
    teamsContainer.innerHTML = '';

    appState.teams.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        teamCard.innerHTML = `
            <h3>${team.name}</h3>
            <ul class="team-members">
                ${team.members.map(member => `<li>${member}</li>`).join('')}
            </ul>
        `;
        
        teamsContainer.appendChild(teamCard);
    });
}

// 対戦表を作成する関数
function createMatchTable() {
    const tableHeader = document.getElementById('header-row');
    const tableBody = document.querySelector('#match-grid tbody');
    
    // ヘッダー行にチーム名を追加
    tableHeader.innerHTML = '<th class="empty-cell"></th>';
    appState.teams.forEach(team => {
        tableHeader.innerHTML += `<th>${team.name}</th>`;
    });
    
    // 対戦表の行を作成
    tableBody.innerHTML = '';
    appState.teams.forEach((rowTeam, rowIndex) => {
        const row = document.createElement('tr');
        
        // 行の最初のセルにチーム名
        const firstCell = document.createElement('th');
        firstCell.textContent = rowTeam.name;
        row.appendChild(firstCell);
        
        // 各対戦相手との結果セルを作成
        appState.teams.forEach((colTeam, colIndex) => {
            const cell = document.createElement('td');
            
            if (rowIndex === colIndex) {
                // 同じチーム同士の対戦はない（対角線を引く）
                cell.className = 'diagonal-line';
            } else {
                // 対戦カードのIDを作成（小さい番号が先）
                const matchId = getMatchId(rowTeam.id, colTeam.id);
                
                // データ属性を追加してクリックイベントで使用
                cell.dataset.rowTeamId = rowTeam.id;
                cell.dataset.colTeamId = colTeam.id;
                cell.dataset.matchId = matchId;
                cell.classList.add('clickable-cell');
                
                // 試合結果があれば表示
                if (appState.matches[matchId]) {
                    const match = appState.matches[matchId];
                    const isWinner = match.winner === rowTeam.id;
                    const resultClass = isWinner ? 'winner' : 'loser';
                    
                    cell.innerHTML = `<span class="match-result ${resultClass}">${match.scoreTeam1}-${match.scoreTeam2}</span>`;
                    
                    // 修正のためのクリックイベント追加
                    cell.addEventListener('click', function() {
                        if (confirm('この試合結果を削除して再入力しますか？')) {
                            delete appState.matches[matchId];
                            saveMatchResults();
                            createMatchTable();
                            calculateStandings();
                        }
                    });
                } else {
                    cell.textContent = '未対戦';
                    // クリックイベントを追加
                    cell.addEventListener('click', handleCellClick);
                }
            }
            
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}

// セルクリック時の処理
function handleCellClick(event) {
    const cell = event.currentTarget;
    const rowTeamId = parseInt(cell.dataset.rowTeamId);
    const colTeamId = parseInt(cell.dataset.colTeamId);
    const matchId = cell.dataset.matchId;
    
    const rowTeamName = getTeamNameById(rowTeamId);
    const colTeamName = getTeamNameById(colTeamId);
    
    // 行側のチーム（クリックされたセルの行）のスコア入力
    const team1ScoreInput = prompt(`${rowTeamName}の点数を入力してください (0-7):`);
    
    // キャンセルが押された場合
    if (team1ScoreInput === null) return;
    
    // 入力値のバリデーション
    const team1Score = parseInt(team1ScoreInput);
    if (isNaN(team1Score) || team1Score < 0 || team1Score > 7) {
        alert('スコアは0から7の間で入力してください');
        return;
    }
    
    // 列側のチーム（対戦相手）のスコア入力
    const team2ScoreInput = prompt(`${colTeamName}の点数を入力してください (0-7):`);
    
    // キャンセルが押された場合
    if (team2ScoreInput === null) return;
    
    // 入力値のバリデーション
    const team2Score = parseInt(team2ScoreInput);
    if (isNaN(team2Score) || team2Score < 0 || team2Score > 7) {
        alert('スコアは0から7の間で入力してください');
        return;
    }
    
    // 同点の場合は確認
    if (team1Score === team2Score) {
        if (!confirm('同点の場合、タイブレークなどで決着をつける必要があります。このまま記録しますか？')) {
            return;
        }
    }
    
    // 勝者を決定
    let winner;
    if (team1Score > team2Score) {
        winner = rowTeamId;
    } else if (team2Score > team1Score) {
        winner = colTeamId;
    } else {
        // 同点の場合はnullまたは特別な処理
        winner = null; // または引き分けを表す特別な値
    }
    
    // 小さいチームIDが先になるように調整（データの一貫性のため）
    const firstTeamId = Math.min(rowTeamId, colTeamId);
    const secondTeamId = Math.max(rowTeamId, colTeamId);
    
    // スコアも正しい順序で保存
    let scoreTeam1, scoreTeam2;
    if (firstTeamId === rowTeamId) {
        scoreTeam1 = team1Score;
        scoreTeam2 = team2Score;
    } else {
        scoreTeam1 = team2Score;
        scoreTeam2 = team1Score;
    }
    
    // 試合結果を保存
    appState.matches[matchId] = {
        team1: firstTeamId,
        team2: secondTeamId,
        scoreTeam1: scoreTeam1,
        scoreTeam2: scoreTeam2,
        winner: winner
    };
    
    // ローカルストレージに保存
    saveMatchResults();
    
    // UI更新
    createMatchTable();
    calculateStandings();
}

// チームIDからチーム名を取得する関数
function getTeamNameById(teamId) {
    const team = appState.teams.find(t => t.id === teamId);
    return team ? team.name : `不明なチーム(${teamId})`;
}

// チーム選択フォームを初期化
function initializeResultForm() {
    const team1Select = document.getElementById('team1-select');
    const team2Select = document.getElementById('team2-select');
    
    team1Select.innerHTML = '<option value="">チームを選択</option>';
    team2Select.innerHTML = '<option value="">チームを選択</option>';
    
    appState.teams.forEach(team => {
        team1Select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
        team2Select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
    });
    
    // チーム1の選択が変わったときに、チーム2の選択肢を更新
    team1Select.addEventListener('change', () => {
        const selectedTeam1 = team1Select.value;
        
        // チーム2のオプションをリセット
        team2Select.innerHTML = '<option value="">チームを選択</option>';
        
        // 選択されていないチームのみ表示
        appState.teams.forEach(team => {
            if (team.id != selectedTeam1) {
                team2Select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
            }
        });
    });
    
    // フォーム送信イベントのリスナー
    document.getElementById('result-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const team1Id = parseInt(team1Select.value);
        const team2Id = parseInt(team2Select.value);
        
        if (team1Id === team2Id) {
            alert('異なるチームを選択してください');
            return;
        }
        
        const scoreTeam1 = parseInt(document.getElementById('score-team1').value);
        const scoreTeam2 = parseInt(document.getElementById('score-team2').value);
        
        // 勝者を決定
        const winner = scoreTeam1 > scoreTeam2 ? team1Id : scoreTeam2 > scoreTeam1 ? team2Id : null;
        
        // matchIdを生成（小さい番号のチームが先）
        const matchId = getMatchId(team1Id, team2Id);
        
        // 試合結果を保存
        appState.matches[matchId] = {
            team1: team1Id,
            team2: team2Id,
            scoreTeam1: scoreTeam1,
            scoreTeam2: scoreTeam2,
            winner: winner
        };
        
        // ローカルストレージに保存
        saveMatchResults();
        
        // UI更新
        createMatchTable();
        calculateStandings();
        
        // フォームをリセット
        this.reset();
        team1Select.innerHTML = '<option value="">チームを選択</option>';
        team2Select.innerHTML = '<option value="">チームを選択</option>';
        
        appState.teams.forEach(team => {
            team1Select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
            team2Select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
        });
        
        alert('試合結果を保存しました！');
    });
}

// マッチIDを生成（小さい番号のチームが先）
function getMatchId(team1Id, team2Id) {
    return team1Id < team2Id ? `${team1Id}-${team2Id}` : `${team2Id}-${team1Id}`;
}

// 順位表を計算して表示する関数
function calculateStandings() {
    // チームごとの成績を初期化
    const teamStats = {};
    
    appState.teams.forEach(team => {
        teamStats[team.id] = {
            teamId: team.id,
            teamName: team.name,
            wins: 0,
            losses: 0,
            draws: 0,
            totalScore: 0,
            winRate: 0
        };
    });
    
    // 試合結果から勝敗を集計
    Object.values(appState.matches).forEach(match => {
        if (match.winner) {
            // 勝者が存在する場合
            teamStats[match.winner].wins++;
            
            // 負けたチームを特定
            const loserId = match.winner === match.team1 ? match.team2 : match.team1;
            teamStats[loserId].losses++;
            
            // スコアも加算
            if (match.team1 === match.winner) {
                teamStats[match.team1].totalScore += match.scoreTeam1;
                teamStats[match.team2].totalScore += match.scoreTeam2;
            } else {
                teamStats[match.team1].totalScore += match.scoreTeam1;
                teamStats[match.team2].totalScore += match.scoreTeam2;
            }
        } else {
            // 引き分けの場合
            teamStats[match.team1].draws++;
            teamStats[match.team2].draws++;
            
            // スコアを加算
            teamStats[match.team1].totalScore += match.scoreTeam1;
            teamStats[match.team2].totalScore += match.scoreTeam2;
        }
    });
    
    // 勝率を計算
    Object.values(teamStats).forEach(stats => {
        const totalMatches = stats.wins + stats.losses + stats.draws;
        stats.winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 1000) / 1000 : 0;
    });
    
    // 順位付け（勝利数 → 得点合計 → 勝率の順）
    appState.standings = Object.values(teamStats).sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.winRate - a.winRate;
    });
    
    // 順位表の表示
    renderStandings();
}

// 順位表を表示する関数
function renderStandings() {
    const standingsBody = document.getElementById('standings-body');
    standingsBody.innerHTML = '';
    
    appState.standings.forEach((team, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${team.teamName}</td>
            <td>${team.wins}</td>
            <td>${team.losses}</td>
            <td>${team.draws > 0 ? team.draws : '-'}</td>
            <td>${team.totalScore}</td>
            <td>${(team.winRate * 100).toFixed(1)}%</td>
        `;
        
        standingsBody.appendChild(row);
    });
}

// 設定ファイルを読み込んでアプリケーションを初期化
document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    if (!config) {
        alert('設定ファイルの読み込みに失敗しました。ページを再読み込みしてください。');
        return;
    }
    
    appState.teams = config.teams;
    
    // 保存された試合結果を読み込む
    loadMatchResults();
    
    // UI初期化
    renderTeams();
    createMatchTable();
    initializeResultForm();
    calculateStandings();
});
