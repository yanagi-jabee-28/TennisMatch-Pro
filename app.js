// グローバル変数
let teams = [];
let teamMatchHistory = [];
let allMatchesData = [];
let currentRound = 1; // 現在表示中のラウンド

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  loadTeamsAndMatches();
  
  // ナビゲーションタブの設定
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      
      // タブコンテンツの切り替え
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(targetId).classList.add('active');
      
      // アクティブなタブボタンをハイライト
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
    });
  });
    // 初期ラウンド表示（前のラウンドと次のラウンドのボタン設定）
  setupRoundNavigation();
});

// チームと試合情報を読み込み
async function loadTeamsAndMatches() {
  try {
    // チーム戦用のチーム読み込み
    const teamsResponse = await fetch('teams.json');
    const teamsData = await teamsResponse.json();
    teams = teamsData.teams;
    
    // 全試合のデータを読み込む
    try {
      const allMatchesResponse = await fetch('allMatches.json');
      allMatchesData = await allMatchesResponse.json();
      console.log("全試合データを読み込みました", allMatchesData);
    } catch (matchError) {
      console.log("全試合データの読み込みに失敗しました", matchError);
    }
    
    // ローカルストレージから保存された結果を読み込み
    loadMatchResults();
    
    generateMatchSchedule();
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
  }
}

// 試合スケジュールを生成
function generateMatchSchedule() {
  const allRoundsContainer = document.getElementById('all-rounds');
  allRoundsContainer.innerHTML = '';
  
  // 現在のラウンドだけを表示
  const roundData = allMatchesData[currentRound - 1];
  if (!roundData) return;
  
  const roundDiv = document.createElement('div');
  roundDiv.className = 'round-container';
  
  roundDiv.innerHTML = `
    <h3 class="round-title">ラウンド ${roundData.id}</h3>
    <div class="match-courts-horizontal">
      ${roundData.matches.filter(match => match.team1 && match.team2).map((match, index) => {
        const court = index + 1;
        const team1 = getTeamById(match.team1);
        const team2 = getTeamById(match.team2);
        return `
          <div class="court">
            <h4>コート ${court}</h4>
            <div class="team-match">
              <div class="team-selector">
                <div class="team-display team-clickable" data-round="${roundData.id}" data-court="${court}" data-position="team1" data-team="${match.team1}" onclick="showTeamDetail('${match.team1}')">
                  ${match.team1} (${team1 ? team1.members.join(', ') : ''})
                </div>
                <span class="vs">vs</span>
                <div class="team-display team-clickable" data-round="${roundData.id}" data-court="${court}" data-position="team2" data-team="${match.team2}" onclick="showTeamDetail('${match.team2}')">
                  ${match.team2} (${team2 ? team2.members.join(', ') : ''})
                </div>
                <input type="hidden" class="team-value" value="${match.team1}" data-round="${roundData.id}" data-court="${court}" data-position="team1">
                <input type="hidden" class="team-value" value="${match.team2}" data-round="${roundData.id}" data-court="${court}" data-position="team2">
              </div>
              <div class="score-input-container" data-round="${roundData.id}" data-court="${court}">
                <div class="structured-score-input">
                  <div class="set-score">
                    <label>1セット:</label>
                    <input type="number" min="0" max="99" class="set-input" data-set="1" data-team="1" placeholder="0" value="${getSetScore(match.score, 1, 1)}">
                    <span>-</span>
                    <input type="number" min="0" max="99" class="set-input" data-set="1" data-team="2" placeholder="0" value="${getSetScore(match.score, 1, 2)}">
                  </div>
                  <div class="set-score">
                    <label>2セット:</label>
                    <input type="number" min="0" max="99" class="set-input" data-set="2" data-team="1" placeholder="0" value="${getSetScore(match.score, 2, 1)}">
                    <span>-</span>
                    <input type="number" min="0" max="99" class="set-input" data-set="2" data-team="2" placeholder="0" value="${getSetScore(match.score, 2, 2)}">
                  </div>
                  <div class="set-score">
                    <label>3セット:</label>
                    <input type="number" min="0" max="99" class="set-input" data-set="3" data-team="1" placeholder="0" value="${getSetScore(match.score, 3, 1)}">
                    <span>-</span>
                    <input type="number" min="0" max="99" class="set-input" data-set="3" data-team="2" placeholder="0" value="${getSetScore(match.score, 3, 2)}">
                  </div>
                  <input type="hidden" class="score-input" placeholder="スコア" value="${match.score || ''}" data-round="${roundData.id}" data-court="${court}">
                </div>
                <button class="record-btn" onclick="recordStructuredScore(${roundData.id}, ${court})">記録</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="resting-team">
      <span class="resting-label">休憩:</span>
      <span class="resting-team-name team-clickable" onclick="showTeamDetail('${roundData.matches.find(match => match.restingTeam)?.restingTeam || ''}')">
        ${roundData.matches.find(match => match.restingTeam)?.restingTeam || ''}
      </span>
    </div>
  `;
  
  allRoundsContainer.appendChild(roundDiv);
  
  // ラウンドナビゲーション表示を更新
  updateRoundNavigation();
}

// ラウンドナビゲーション設定
function setupRoundNavigation() {
  const prevRoundBtn = document.getElementById('prevRoundBtn');
  const nextRoundBtn = document.getElementById('nextRoundBtn');
  const currentRoundDisplay = document.getElementById('currentRoundDisplay');
  
  prevRoundBtn.addEventListener('click', () => {
    if (currentRound > 1) {
      currentRound--;
      generateMatchSchedule();
    }
  });
  
  nextRoundBtn.addEventListener('click', () => {
    if (currentRound < allMatchesData.length) {
      currentRound++;
      generateMatchSchedule();
    }
  });
}

// ラウンドナビゲーション表示更新
function updateRoundNavigation() {
  const prevRoundBtn = document.getElementById('prevRoundBtn');
  const nextRoundBtn = document.getElementById('nextRoundBtn');
  const currentRoundDisplay = document.getElementById('currentRoundDisplay');
  
  // ボタンの有効・無効設定
  prevRoundBtn.disabled = currentRound <= 1;
  nextRoundBtn.disabled = currentRound >= allMatchesData.length;
  
  // 現在のラウンド表示
  currentRoundDisplay.textContent = `${currentRound} / ${allMatchesData.length}`;
}

// セットスコアを取得（スコア文字列から特定のセットと特定のチームのスコアを抽出）
function getSetScore(scoreString, setNumber, teamNumber) {
  if (!scoreString) return '';
  
  try {
    // "21-19, 18-21, 21-15" などの形式を想定
    const sets = scoreString.split(',').map(s => s.trim());
    if (sets.length < setNumber) return '';
    
    const setScore = sets[setNumber - 1].split('-');
    return teamNumber === 1 ? setScore[0] : setScore[1];
  } catch (e) {
    return '';
  }
}

// 構造化されたスコア入力から記録
function recordStructuredScore(round, court) {
  const container = document.querySelector(`.score-input-container[data-round="${round}"][data-court="${court}"]`);
  if (!container) return;
  
  // 各セット入力を取得
  const set1Team1 = container.querySelector('.set-input[data-set="1"][data-team="1"]').value || '0';
  const set1Team2 = container.querySelector('.set-input[data-set="1"][data-team="2"]').value || '0';
  const set2Team1 = container.querySelector('.set-input[data-set="2"][data-team="1"]').value || '0';
  const set2Team2 = container.querySelector('.set-input[data-set="2"][data-team="2"]').value || '0';
  const set3Team1 = container.querySelector('.set-input[data-set="3"][data-team="1"]').value || '';
  const set3Team2 = container.querySelector('.set-input[data-set="3"][data-team="2"]').value || '';
  
  // スコアフォーマットを構築
  let scoreFormat = `${set1Team1}-${set1Team2}, ${set2Team1}-${set2Team2}`;
  if (set3Team1 && set3Team2) {
    scoreFormat += `, ${set3Team1}-${set3Team2}`;
  }
  
  // 隠しスコア入力に値をセット
  const scoreInput = container.querySelector('.score-input');
  scoreInput.value = scoreFormat;
  
  // 従来の記録関数を呼び出す
  recordMatchScore(round, court);
}

// チーム詳細表示
function showTeamDetail(teamName) {
  const team = getTeamById(teamName);
  if (!team) return;
  
  // モーダル表示
  const modalContent = `
    <div class="team-detail-header">
      <h3>${team.name}</h3>
      <span class="close-modal">&times;</span>
    </div>
    <div class="team-detail-content">
      <h4>メンバー:</h4>
      <ul>
        ${team.members.map(member => `<li>${member}</li>`).join('')}
      </ul>
      <h4>試合結果:</h4>
      <div class="team-match-results">
        ${getTeamMatchResults(team.name)}
      </div>
    </div>
  `;
  
  const modal = document.getElementById('teamDetailModal');
  const modalContentContainer = document.getElementById('teamDetailContent');
  
  modalContentContainer.innerHTML = modalContent;
  modal.style.display = 'block';
  
  // モーダルを閉じる処理
  const closeBtn = document.querySelector('.close-modal');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // モーダル外クリックで閉じる
  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });
}

// チームの試合結果を取得
function getTeamMatchResults(teamName) {
  const teamMatches = teamMatchHistory.filter(match => 
    match.team1 === teamName || match.team2 === teamName
  );
  
  if (teamMatches.length === 0) {
    return '<p>まだ試合結果がありません。</p>';
  }
  
  return teamMatches.map(match => {
    const isTeam1 = match.team1 === teamName;
    const opponent = isTeam1 ? match.team2 : match.team1;
    const result = calculateMatchResult(match.score, isTeam1);
    
    return `
      <div class="team-match-result ${result.class}">
        <div>vs ${opponent} (R${match.round})</div>
        <div>${match.score} ${result.text}</div>
      </div>
    `;
  }).join('');
}

// 試合結果を計算
function calculateMatchResult(score, isTeam1) {
  if (!score) return { text: '結果なし', class: '' };
  
  try {
    const sets = score.split(',').map(s => s.trim());
    let team1Wins = 0;
    let team2Wins = 0;
    
    sets.forEach(set => {
      const [score1, score2] = set.split('-').map(Number);
      if (score1 > score2) team1Wins++;
      else if (score2 > score1) team2Wins++;
    });
    
    if (team1Wins === team2Wins) {
      return { text: '引き分け', class: 'draw' };
    }
    
    const won = isTeam1 ? team1Wins > team2Wins : team2Wins > team1Wins;
    return won 
      ? { text: '勝利', class: 'win' }
      : { text: '敗北', class: 'lose' };
  } catch (e) {
    return { text: '結果不明', class: '' };
  }
}



// チームIDでチーム情報を取得
function getTeamById(teamName) {
  return teams.find(team => team.name === teamName);
}

// 試合スコアを記録する
function recordMatchScore(round, court) {
  const scoreInput = document.querySelector(`.score-input[data-round="${round}"][data-court="${court}"]`);
  const score = scoreInput.value.trim();
    if (!score) {
    showErrorIndicator(round, court, 'スコアを入力してください');
    return;
  }
  
  // allMatchesDataから該当する試合データを取得
  const roundData = allMatchesData[round - 1];
  const matchData = roundData.matches[court - 1];
  
  // 隠しフィールドからチーム情報を取得
  const team1Input = document.querySelector(`.team-value[data-round="${round}"][data-court="${court}"][data-position="team1"]`);
  const team2Input = document.querySelector(`.team-value[data-round="${round}"][data-court="${court}"][data-position="team2"]`);
  
  const team1 = team1Input.value;
  const team2 = team2Input.value;
  
  if (!team1 || !team2) {
    showErrorIndicator(round, court, 'チーム情報が不正です');
    return;
  }
  
  // データを更新
  matchData.team1 = team1;
  matchData.team2 = team2;
  matchData.score = score;
  
  const match = {
    round: round,
    court: court,
    team1: matchData.team1,
    team2: matchData.team2,
    score: score,
    timestamp: new Date().toLocaleString('ja-JP')
  };
    addTeamMatch(match);
  
  // 成功メッセージ（アラートの代わりに視覚的フィードバックを表示）
  showSuccessIndicator(round, court);
  
  // JSONファイルに保存（実際の実装では、サーバーサイドAPIが必要）
  saveMatchResults();
}

// 試合結果をローカルストレージに保存（JSONファイル保存の代替）
function saveMatchResults() {
  try {
    localStorage.setItem('allMatchesData', JSON.stringify(allMatchesData));
    localStorage.setItem('teamMatchHistory', JSON.stringify(teamMatchHistory));
    console.log('試合結果をローカルストレージに保存しました');
  } catch (error) {
    console.error('試合結果の保存に失敗しました:', error);
  }
}

// ローカルストレージから試合結果を読み込み
function loadMatchResults() {
  try {
    const savedMatchesData = localStorage.getItem('allMatchesData');
    const savedHistory = localStorage.getItem('teamMatchHistory');
    
    if (savedMatchesData) {
      allMatchesData = JSON.parse(savedMatchesData);
    }
    
    if (savedHistory) {
      teamMatchHistory = JSON.parse(savedHistory);
      // 保存された履歴を表示
      teamMatchHistory.forEach(match => {
        addTeamMatchToDisplay(match);
      });
    }
  } catch (error) {
    console.error('保存された試合結果の読み込みに失敗しました:', error);
  }
}

// チーム戦の結果をリストに追加
function addTeamMatch(match) {
  teamMatchHistory.push(match);
  addTeamMatchToDisplay(match);
  saveMatchResults();
}

// チーム戦の結果を表示に追加
function addTeamMatchToDisplay(match) {
  const list = document.getElementById('teamMatchHistory');
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="match-info">
      <div class="match-players">R${match.round} コート${match.court}: ${match.team1} vs ${match.team2}</div>
      <div class="match-score">スコア: ${match.score} | ${match.timestamp}</div>
    </div>
  `;
  li.style.opacity = 0;
  li.style.transform = 'translateY(-20px)';
  list.insertBefore(li, list.firstChild);
    setTimeout(() => { 
    li.style.transition = 'all 0.5s ease';
    li.style.opacity = 1;
    li.style.transform = 'translateY(0)';
  }, 10);
}

// 成功インジケーターを表示する関数
function showSuccessIndicator(round, court) {
  // 対象のスコア入力コンテナを特定
  const container = document.querySelector(`.score-input-container[data-round="${round}"][data-court="${court}"]`);
  if (!container) {
    const container = document.querySelector(`.score-input[data-round="${round}"][data-court="${court}"]`).parentElement;
    if (!container) return;
  }
  
  // 既存の通知があれば削除
  clearNotifications(container);
  
  // 成功通知要素を作成
  const successNotice = document.createElement('div');
  successNotice.className = 'success-notice';
  successNotice.textContent = '✓ 記録しました';
  
  // 新しい通知を追加
  container.appendChild(successNotice);
  
  // ボタンを一時的に無効化
  const recordButton = container.querySelector('.record-btn');
  if (recordButton) {
    recordButton.disabled = true;
    recordButton.classList.add('success');
    
    // 2秒後に通知を消して、ボタンを再有効化
    setTimeout(() => {
      if (container.contains(successNotice)) {
        container.removeChild(successNotice);
      }
      recordButton.disabled = false;
      recordButton.classList.remove('success');
    }, 2000);
  }
}

// エラーインジケーターを表示する関数
function showErrorIndicator(round, court, message) {
  // 対象のスコア入力コンテナを特定
  const container = document.querySelector(`.score-input-container[data-round="${round}"][data-court="${court}"]`);
  if (!container) {
    const container = document.querySelector(`.score-input[data-round="${round}"][data-court="${court}"]`).parentElement;
    if (!container) return;
  }
  
  // 既存の通知があれば削除
  clearNotifications(container);
  
  // エラー通知要素を作成
  const errorNotice = document.createElement('div');
  errorNotice.className = 'error-notice';
  errorNotice.textContent = message;
  
  // 新しい通知を追加
  container.appendChild(errorNotice);
  
  // インプットをハイライト
  const scoreInput = container.querySelector('.score-input');
  if (scoreInput) {
    scoreInput.classList.add('error');
    
    // 3秒後に通知を消す
    setTimeout(() => {
      if (container.contains(errorNotice)) {
        container.removeChild(errorNotice);
      }
      scoreInput.classList.remove('error');
    }, 3000);
  }
}

// 通知要素をクリアする関数
function clearNotifications(container) {
  // 既存の通知があれば削除
  const existingNotices = container.querySelectorAll('.success-notice, .error-notice');
  existingNotices.forEach(notice => {
    container.removeChild(notice);
  });
}