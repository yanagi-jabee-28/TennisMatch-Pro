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
    standings: [],
    settings: {
        matchPoint: 7       // マッチポイント（勝利と最大スコアを決定）
    },
    originalTeams: []      // オリジナルのチーム構成を保存
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

// ローカルストレージから設定を読み込む
function loadSettings() {
    const savedSettings = localStorage.getItem('tennisGameSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            appState.settings = {...appState.settings, ...settings};
        } catch (e) {
            console.error('設定の読み込みに失敗しました:', e);
        }
    }
}

// ローカルストレージに試合結果を保存する
function saveMatchResults() {
    localStorage.setItem('tennisMatchResults', JSON.stringify(appState.matches));
}

// ローカルストレージに設定を保存する
function saveSettings() {
    localStorage.setItem('tennisGameSettings', JSON.stringify(appState.settings));
}

// ローカルストレージにカスタムチームメンバーを保存
function saveTeamMembers() {
    localStorage.setItem('tennisCustomTeams', JSON.stringify(appState.teams));
}

// ローカルストレージからカスタムチームメンバーを読み込む
function loadTeamMembers() {
    const savedTeams = localStorage.getItem('tennisCustomTeams');
    if (savedTeams) {
        try {
            appState.teams = JSON.parse(savedTeams);
        } catch (e) {
            console.error('チームメンバーの読み込みに失敗しました:', e);
            // 読み込み失敗時は元のチームを使用
            appState.teams = JSON.parse(JSON.stringify(appState.originalTeams));
        }
    }
}

// チーム情報を表示する関数
function renderTeams() {
    const teamsContainer = document.getElementById('teams-container');
    teamsContainer.innerHTML = '';

    appState.teams.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        teamCard.innerHTML = `
            <div class="team-header">
                <h3>チーム${team.id}</h3>
                <button class="edit-team-btn btn-small" data-team-id="${team.id}">
                    <span class="edit-icon">✎</span> 編集
                </button>
            </div>
            <ul class="team-members">
                ${team.members.map(member => `<li>${member}</li>`).join('')}
            </ul>
        `;
        
        teamsContainer.appendChild(teamCard);
        
        // 編集ボタンにイベントリスナーを追加
        const editBtn = teamCard.querySelector('.edit-team-btn');
        editBtn.addEventListener('click', () => openTeamEditModal(team.id));
    });
}

// 対戦表を作成する関数
function createMatchTable() {
    const tableHeader = document.getElementById('header-row');
    const tableBody = document.querySelector('#match-grid tbody');
    
    // ヘッダー行にチーム番号を追加
    tableHeader.innerHTML = '<th class="empty-cell"></th>';
    appState.teams.forEach(team => {
        tableHeader.innerHTML += `<th>${team.id}</th>`;
    });    // 対戦表の行を作成
    tableBody.innerHTML = '';
    appState.teams.forEach((rowTeam, rowIndex) => {
        const row = document.createElement('tr');
        
        // 行の最初のセルにチーム番号
        const firstCell = document.createElement('th');
        firstCell.textContent = rowTeam.id;
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
                      // 勝者が存在するか引き分けかで表示スタイルを変更
                    let resultClass;
                    if (match.winner === null) {
                        resultClass = 'draw';
                    } else {
                        resultClass = match.winner === rowTeam.id ? 'winner' : 'loser';
                    }
                    
                    // 行側のチーム（自チーム）を常に左側に表示するため、
                    // 適切な順序でスコアを表示
                    let displayScore;
                    if (match.team1 === rowTeam.id) {
                        displayScore = `${match.scoreTeam1}-${match.scoreTeam2}`;
                    } else {
                        displayScore = `${match.scoreTeam2}-${match.scoreTeam1}`;
                    }
                    
                    cell.innerHTML = `<span class="match-result ${resultClass}">${displayScore}</span>`;
                    
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

// モーダルの要素
const scoreModal = document.getElementById('score-modal');
let currentMatchData = null;

// モーダルを開く関数
function openScoreModal(rowTeamId, colTeamId, matchId) {
    // モーダルのタイトルと入力ラベルを設定
    document.getElementById('score-modal-title').textContent = `スコア入力`;
    document.getElementById('team1-label').textContent = `チーム${rowTeamId}:`;
    document.getElementById('team2-label').textContent = `チーム${colTeamId}:`;
    
    // 入力欄の初期化と最大値設定
    const score1Input = document.getElementById('modal-score-team1');
    const score2Input = document.getElementById('modal-score-team2');
    
    score1Input.value = 0;
    score2Input.value = 0;
    
    // マッチポイントを取得（最大スコアとして使用）
    const matchPoint = appState.settings.matchPoint;
    score1Input.max = matchPoint;
    score2Input.max = matchPoint;
    
    // 現在の試合データを保存
    currentMatchData = {
        rowTeamId: rowTeamId,
        colTeamId: colTeamId,
        matchId: matchId
    };
    
    // モーダルを表示
    scoreModal.style.display = 'block';
}

// モーダルを閉じる関数
function closeScoreModal() {
    scoreModal.style.display = 'none';
    currentMatchData = null;
}

// チームメンバー編集用のモーダル要素
const teamEditModal = document.getElementById('team-edit-modal');
let currentEditTeamId = null;
let tempTeamMembers = [];

// チームメンバー編集用モーダルを開く
function openTeamEditModal(teamId) {
    currentEditTeamId = teamId;
    
    // モーダルのタイトルを設定
    document.getElementById('team-edit-modal-title').textContent = `チーム${teamId} メンバー編集`;
    document.getElementById('edit-team-id').textContent = `チーム${teamId}`;
    
    // 現在のチームメンバーを取得
    const team = appState.teams.find(t => t.id === teamId);
    if (!team) return;
    
    // 一時的なメンバーリストにコピー
    tempTeamMembers = [...team.members];
    
    // メンバーリストを表示
    renderMembersList();
    
    // モーダルを表示
    teamEditModal.style.display = 'block';
}

// メンバーリストをレンダリング
function renderMembersList() {
    const membersList = document.getElementById('edit-members-list');
    membersList.innerHTML = '';
    
    tempTeamMembers.forEach((member, index) => {
        const li = document.createElement('li');
        li.className = 'member-item';
        li.innerHTML = `
            <span class="member-name">${member}</span>
            <button class="remove-member-btn" data-index="${index}">×</button>
        `;
        membersList.appendChild(li);
        
        // 削除ボタンにイベントリスナーを追加
        const removeBtn = li.querySelector('.remove-member-btn');
        removeBtn.addEventListener('click', () => {
            tempTeamMembers.splice(index, 1);
            renderMembersList();
        });
    });
}

// チームメンバーの変更を保存
function saveTeamMembers() {
    if (currentEditTeamId === null || tempTeamMembers.length === 0) {
        alert('メンバーを少なくとも1人は登録してください');
        return;
    }
    
    // 変更を適用
    const teamIndex = appState.teams.findIndex(t => t.id === currentEditTeamId);
    if (teamIndex !== -1) {
        appState.teams[teamIndex].members = [...tempTeamMembers];
        
        // ローカルストレージに保存
        saveTeamMembers();
        
        // UI更新
        renderTeams();
        
        // モーダルを閉じる
        closeTeamEditModal();
        
        alert('チームメンバーを更新しました！');
    }
}

// チームメンバー編集モーダルを閉じる
function closeTeamEditModal() {
    teamEditModal.style.display = 'none';
    currentEditTeamId = null;
    tempTeamMembers = [];
}

// 新しいメンバーを追加
function addNewMember() {
    const newMemberInput = document.getElementById('new-member-name');
    const newMemberName = newMemberInput.value.trim();
    
    if (newMemberName) {
        tempTeamMembers.push(newMemberName);
        newMemberInput.value = '';
        renderMembersList();
    }
}

// スコアを保存する関数
function saveScore() {
    if (!currentMatchData) return;
    
    const { rowTeamId, colTeamId, matchId } = currentMatchData;
    const score1Input = document.getElementById('modal-score-team1');
    const score2Input = document.getElementById('modal-score-team2');
    
    // 入力値の取得
    let team1Score = parseInt(score1Input.value);
    let team2Score = parseInt(score2Input.value);
    
    // 入力値のバリデーション
    if (isNaN(team1Score) || isNaN(team2Score) || team1Score < 0 || team2Score < 0) {
        alert('スコアは0以上の数字を入力してください');
        return;
    }
    
    // マッチポイントを取得（最大スコアとして使用）
    const matchPoint = appState.settings.matchPoint;
    
    // マッチポイントを超える場合は自動的に上限を設定
    if (team1Score > matchPoint) team1Score = matchPoint;
    if (team2Score > matchPoint) team2Score = matchPoint;
    
    // スコアを保存
    processMatchScore(rowTeamId, colTeamId, matchId, team1Score, team2Score);
    
    // モーダルを閉じる
    closeScoreModal();
}

// モーダルのイベントリスナー設定
document.addEventListener('DOMContentLoaded', function() {
    // 保存ボタンのクリックイベント
    document.getElementById('save-score-btn').addEventListener('click', saveScore);
    
    // キャンセルボタンのクリックイベント
    document.getElementById('cancel-score-btn').addEventListener('click', closeScoreModal);
    
    // 閉じるボタン（×）のクリックイベント
    document.querySelector('.close-modal').addEventListener('click', closeScoreModal);
    
    // モーダル外をクリックした時に閉じる
    window.addEventListener('click', function(event) {
        if (event.target === scoreModal) {
            closeScoreModal();
        }
    });
});

// チームメンバー編集モーダルのイベントリスナーを初期化
function initializeTeamEditListeners() {
    // モーダルの保存ボタンのクリックイベント
    document.getElementById('save-team-btn').addEventListener('click', saveTeamMembers);
    
    // キャンセルボタンのクリックイベント
    document.getElementById('cancel-team-btn').addEventListener('click', closeTeamEditModal);
    
    // 閉じるボタン（×）のクリックイベント
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        if (closeBtn.closest('#team-edit-modal')) {
            closeBtn.addEventListener('click', closeTeamEditModal);
        }
    });
    
    // モーダル外をクリックした時に閉じる
    window.addEventListener('click', function(event) {
        if (event.target === teamEditModal) {
            closeTeamEditModal();
        }
    });
    
    // 新しいメンバーを追加するボタンのクリックイベント
    document.getElementById('add-member-btn').addEventListener('click', addNewMember);
    
    // エンターキーでも新しいメンバーを追加できるように
    document.getElementById('new-member-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewMember();
        }
    });
}

// セルクリック時の処理
function handleCellClick(event) {
    const cell = event.currentTarget;    
    const rowTeamId = parseInt(cell.dataset.rowTeamId);
    const colTeamId = parseInt(cell.dataset.colTeamId);
    const matchId = cell.dataset.matchId;
    
    // モーダルを開く
    openScoreModal(rowTeamId, colTeamId, matchId);
}

// スコアを処理して結果を保存する関数
function processMatchScore(rowTeamId, colTeamId, matchId, team1Score, team2Score) {
    // 勝者を決定
    let winner;
    
    // 同点の場合は引き分け
    if (team1Score === team2Score) {
        winner = null;
    } else if (team1Score > team2Score) {
        // チーム1が点数が高い場合は勝ち
        winner = rowTeamId;
    } else {
        // チーム2が点数が高い場合は勝ち
        winner = colTeamId;
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

// チームIDからチーム番号を取得する関数（現在は未使用）
function getTeamNameById(teamId) {
    return `${teamId}`;
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
        }          let scoreTeam1 = parseInt(document.getElementById('score-team1').value);
        let scoreTeam2 = parseInt(document.getElementById('score-team2').value);
        
        // スコアがマッチポイントを超えていたら上限を適用
        const matchPoint = appState.settings.matchPoint;
        if (scoreTeam1 > matchPoint) scoreTeam1 = matchPoint;
        if (scoreTeam2 > matchPoint) scoreTeam2 = matchPoint;
        
        // 勝者を決定
        let winner;
        
        if (scoreTeam1 === scoreTeam2) {
            // 同点は引き分け
            winner = null;
        } else if (scoreTeam1 > scoreTeam2) {
            // チーム1のスコアが高ければチーム1が勝ち
            winner = team1Id;
        } else {
            // チーム2のスコアが高ければチーム2が勝ち
            winner = team2Id;
        }
        
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
            <td>${team.teamId}</td>
            <td>${team.wins}</td>
            <td>${team.losses}</td>
            <td>${team.draws > 0 ? team.draws : '-'}</td>
            <td>${team.totalScore}</td>
            <td>${(team.winRate * 100).toFixed(1)}%</td>
        `;
        
        standingsBody.appendChild(row);
    });
}

// 試合設定フォームの初期化と処理
function initializeSettingsForm() {
    const settingsForm = document.getElementById('header-settings-form');
    const matchPointInput = document.getElementById('header-match-point');
    
    // スコア入力欄の最大値を設定
    const scoreTeam1Input = document.getElementById('score-team1');
    const scoreTeam2Input = document.getElementById('score-team2');
    if (scoreTeam1Input && scoreTeam2Input) {
        scoreTeam1Input.max = appState.settings.matchPoint;
        scoreTeam2Input.max = appState.settings.matchPoint;
    }
    
    // 現在の設定を表示
    matchPointInput.value = appState.settings.matchPoint;
    
    // 設定変更時の処理
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newMatchPoint = parseInt(matchPointInput.value);
        
        // 入力値の検証
        if (isNaN(newMatchPoint) || newMatchPoint < 1 || newMatchPoint > 99) {
            alert('マッチポイントは1から99の間で設定してください');
            return;
        }
          // 設定を保存
        appState.settings.matchPoint = newMatchPoint;
        saveSettings();
        
        // スコア入力欄の最大値を更新
        const scoreTeam1Input = document.getElementById('score-team1');
        const scoreTeam2Input = document.getElementById('score-team2');
        if (scoreTeam1Input && scoreTeam2Input) {
            scoreTeam1Input.max = newMatchPoint;
            scoreTeam2Input.max = newMatchPoint;
        }
        
        // 結果に影響するため、順位表を再計算
        calculateStandings();
        
        alert('設定を保存しました！');
    });
}

// 設定ファイルを読み込んでアプリケーションを初期化
document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    if (!config) {
        alert('設定ファイルの読み込みに失敗しました。ページを再読み込みしてください。');
        return;
    }
    
    // オリジナルのチーム構成を保存（リセット用）
    appState.originalTeams = JSON.parse(JSON.stringify(config.teams));
    
    // 初期データとして設定
    appState.teams = JSON.parse(JSON.stringify(config.teams));
      
    // 設定ファイルから初期設定を読み込み
    if (config.matchSettings) {
        appState.settings.matchPoint = config.matchSettings.matchPoint || 7;
    }
    
    // 保存された設定と試合結果を読み込む
    loadSettings();
    loadMatchResults();
    loadTeamMembers(); // カスタムチームメンバーがあれば読み込む
    
    // UI初期化
    renderTeams();
    createMatchTable();
    initializeResultForm();
    initializeSettingsForm();
    calculateStandings();
    
    // エクスポートボタンのイベントリスナーを追加
    document.getElementById('export-results-btn').addEventListener('click', exportMatchAnalysis);
    
    // チームメンバー編集用のモーダルのイベントリスナー設定
    initializeTeamEditListeners();
});

// 試合分析データをエクスポートする関数
function exportMatchAnalysis() {
    // 現在の日時をフォーマットしてファイル名に使用
    const now = new Date();
    const dateStr = now.getFullYear() + 
                    ('0' + (now.getMonth() + 1)).slice(-2) + 
                    ('0' + now.getDate()).slice(-2) + '_' + 
                    ('0' + now.getHours()).slice(-2) + 
                    ('0' + now.getMinutes()).slice(-2);
    const filename = `テニス対戦結果_${dateStr}.csv`;
    
    // CSVヘッダー
    let csvContent = '\ufeff'; // BOMを追加してExcelで日本語を正しく表示
    
    // 1. 対戦表データのエクスポート
    csvContent += '# 対戦表データ\n';
    csvContent += 'チーム1,チーム2,チーム1スコア,チーム2スコア,勝者,引き分け\n';
    
    // 対戦結果をCSVに変換
    Object.values(appState.matches).forEach(match => {
        // 勝者の表示方法を決定
        let winnerDisplay = '';
        let drawDisplay = 'FALSE';
        
        if (match.winner === null) {
            drawDisplay = 'TRUE';
        } else {
            winnerDisplay = `チーム${match.winner}`;
        }
        
        csvContent += `チーム${match.team1},チーム${match.team2},${match.scoreTeam1},${match.scoreTeam2},${winnerDisplay},${drawDisplay}\n`;
    });
    
    // 2. 順位表データのエクスポート
    csvContent += '\n# 順位表データ\n';
    csvContent += '順位,チーム,勝利数,敗北数,引分,得点,勝率\n';
    
    appState.standings.forEach((team, index) => {
        csvContent += `${index + 1},チーム${team.teamId},${team.wins},${team.losses},${team.draws},${team.totalScore},${(team.winRate * 100).toFixed(1)}%\n`;
    });
    
    // 3. 対戦分析データの追加
    csvContent += '\n# 対戦分析データ\n';
    csvContent += 'チーム,対戦相手,勝利数,敗北数,引分,得点,失点,得失点差\n';
    
    // チームごとの対戦成績を集計
    appState.teams.forEach(team => {
        const teamId = team.id;
        
        // 他の各チームとの対戦成績
        appState.teams.forEach(opponent => {
            if (teamId === opponent.id) return; // 自分自身との対戦はスキップ
            
            const opponentId = opponent.id;
            const matchId = getMatchId(teamId, opponentId);
            const match = appState.matches[matchId];
            
            if (match) {
                let wins = 0;
                let losses = 0;
                let draws = 0;
                let scoredPoints = 0;
                let concededPoints = 0;
                
                if (match.winner === null) {
                    draws = 1;
                    // チームのスコアを正しく取得
                    if (match.team1 === teamId) {
                        scoredPoints = match.scoreTeam1;
                        concededPoints = match.scoreTeam2;
                    } else {
                        scoredPoints = match.scoreTeam2;
                        concededPoints = match.scoreTeam1;
                    }
                } else if (match.winner === teamId) {
                    wins = 1;
                    // チームのスコアを正しく取得
                    if (match.team1 === teamId) {
                        scoredPoints = match.scoreTeam1;
                        concededPoints = match.scoreTeam2;
                    } else {
                        scoredPoints = match.scoreTeam2;
                        concededPoints = match.scoreTeam1;
                    }
                } else {
                    losses = 1;
                    // チームのスコアを正しく取得
                    if (match.team1 === teamId) {
                        scoredPoints = match.scoreTeam1;
                        concededPoints = match.scoreTeam2;
                    } else {
                        scoredPoints = match.scoreTeam2;
                        concededPoints = match.scoreTeam1;
                    }
                }
                
                const pointDiff = scoredPoints - concededPoints;
                csvContent += `チーム${teamId},チーム${opponentId},${wins},${losses},${draws},${scoredPoints},${concededPoints},${pointDiff}\n`;
            } else {
                // 対戦していない場合
                csvContent += `チーム${teamId},チーム${opponentId},0,0,0,0,0,0\n`;
            }
        });
    });
      // 4. 設定情報の追加
    csvContent += '\n# 設定情報\n';
    csvContent += `マッチポイント,${appState.settings.matchPoint}\n`;
    csvContent += `エクスポート日時,${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}\n`;
    
    // 5. 大会情報の追加（config.jsonから）
    try {
        fetch('config.json')
            .then(response => response.json())
            .then(config => {
                if (config.tournamentInfo) {
                    csvContent += '\n# 大会情報\n';
                    csvContent += `大会名,${config.tournamentInfo.name || '不明'}\n`;
                    csvContent += `開催日,${config.tournamentInfo.date || '不明'}\n`;
                    csvContent += `場所,${config.tournamentInfo.location || '不明'}\n`;
                    csvContent += `形式,${config.tournamentInfo.format || '不明'}\n`;
                }
                
                // データを準備した後でダウンロードを実行
                downloadCSV(csvContent, filename);
            });
    } catch (error) {
        console.error('大会情報の取得に失敗しました:', error);
        // エラーが発生しても基本データはダウンロードできるようにする
        downloadCSV(csvContent, filename);
    }
}

// CSVデータをダウンロードする関数
function downloadCSV(csvContent, filename) {
    // BlobオブジェクトとURLを作成
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    // ダウンロードリンクを作成して実行
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);

    alert('試合分析データをダウンロードしました！');
}

// チームメンバーを編集するモーダルを開く関数
function openTeamEditModal(teamId) {
    const team = appState.teams.find(t => t.id === teamId);
    if (!team) return;
    
    // モーダルのタイトルを設定
    document.getElementById('team-edit-modal-title').textContent = `チーム${teamId}のメンバー編集`;
    
    // メンバー一覧を表示
    const membersList = document.getElementById('team-members-list');
    membersList.innerHTML = '';
    
    team.members.forEach((member, index) => {
        const memberItem = document.createElement('li');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
            <input type="text" class="member-name" value="${member}" data-index="${index}" />
            <button class="remove-member-btn" data-index="${index}">削除</button>
        `;
        
        membersList.appendChild(memberItem);
    });
    
    // メンバー追加ボタンの設定
    document.getElementById('add-member-btn').onclick = () => {
        const newMemberName = document.getElementById('new-member-name').value.trim();
        if (newMemberName) {
            team.members.push(newMemberName);
            document.getElementById('new-member-name').value = '';
            renderTeams();
            openTeamEditModal(teamId); // モーダルを再表示
        } else {
            alert('メンバー名を入力してください');
        }
    };
    
    // モーダルの保存ボタン
    document.getElementById('save-team-btn').onclick = () => {
        const updatedMembers = Array.from(document.querySelectorAll('.member-name')).map(input => input.value.trim()).filter(name => name);
        
        if (updatedMembers.length === 0) {
            alert('少なくとも1人のメンバーを残してください');
            return;
        }
        
        // チーム情報を更新
        const teamIndex = appState.teams.findIndex(t => t.id === teamId);
        appState.teams[teamIndex].members = updatedMembers;
        
        // オリジナルのチーム構成も更新
        appState.originalTeams[teamIndex].members = updatedMembers;
        
        saveSettings();
        renderTeams();
        closeTeamEditModal();
    };
    
    // モーダルを表示
    document.getElementById('team-edit-modal').style.display = 'block';
}

// チームメンバー編集モーダルを閉じる関数
function closeTeamEditModal() {
    document.getElementById('team-edit-modal').style.display = 'none';
}

// ページ読み込み時の初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    if (!config) {
        alert('設定ファイルの読み込みに失敗しました。ページを再読み込みしてください。');
        return;
    }
    
    appState.teams = config.teams;
    appState.originalTeams = JSON.parse(JSON.stringify(config.teams)); // ディープコピー
    
    // 設定ファイルから初期設定を読み込み
    if (config.matchSettings) {
        appState.settings.matchPoint = config.matchSettings.matchPoint || 7;
    }
    
    // 保存された設定と試合結果を読み込む
    loadSettings();
    loadMatchResults();
    loadTeamMembers();
    
    // UI初期化
    renderTeams();
    createMatchTable();
    initializeResultForm();
    initializeSettingsForm();
    calculateStandings();
    
    // エクスポートボタンのイベントリスナーを追加
    document.getElementById('export-results-btn').addEventListener('click', exportMatchAnalysis);
});

// チームメンバーの変更を監視して保存する
document.getElementById('save-settings-btn').addEventListener('click', () => {
    appState.teams.forEach((team, index) => {
        const originalMembers = appState.originalTeams[index].members;
        const currentMembers = team.members;
        
        // メンバーが変更されているかチェック
        if (JSON.stringify(originalMembers) !== JSON.stringify(currentMembers)) {
            const confirmMessage = `チーム${team.id}のメンバーが変更されています。保存しますか？`;
            if (confirm(confirmMessage)) {
                // メンバーが変更されていれば保存
                appState.originalTeams[index].members = currentMembers;
            } else {
                // キャンセルされた場合は元に戻す
                team.members = JSON.parse(JSON.stringify(originalMembers));
                renderTeams();
            }
        }
    });
});

// メンバー削除ボタンの動作
document.addEventListener('click', function(event) {
    if (!event.target.classList.contains('remove-member-btn')) return;
    
    const index = event.target.dataset.index;
    const teamId = parseInt(event.target.closest('.team-card').querySelector('.edit-team-btn').dataset.teamId);
    const team = appState.teams.find(t => t.id === teamId);
    
    if (team && team.members.length > 1) {
        // メンバーが1人以上いる場合は削除を許可
        team.members.splice(index, 1);
        renderTeams();
    } else {
        alert('少なくとも1人のメンバーを残してください');
    }
});
