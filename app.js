// グローバル変数
let teams = [];
let teamMatchHistory = [];
let currentRoundTeams = [];
let allMatchesData = [];

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  loadPlayersAndTeams();
  initializeTabs();
});

// プレイヤーとチーム情報を読み込み
async function loadPlayersAndTeams() {
  try {
    // 個人戦用のプレイヤー読み込み
    const playersResponse = await fetch('players.json');
    const players = await playersResponse.json();
    populatePlayerSelects(players);
    
    // チーム戦用のチーム読み込み
    const teamsResponse = await fetch('teams.json');
    const teamsData = await teamsResponse.json();
    teams = teamsData.teams;
    populateTeamSelects();
    
    // 全試合のデータを読み込む
    try {
      const allMatchesResponse = await fetch('allMatches.json');
      allMatchesData = await allMatchesResponse.json();
      console.log("全試合データを読み込みました", allMatchesData);
    } catch (matchError) {
      console.log("全試合データの読み込みに失敗しました", matchError);
    }
    
    generateNewRound();
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
  }
}

// プレイヤー選択肢を設定
function populatePlayerSelects(players) {
  const player1Select = document.getElementById('player1');
  const player2Select = document.getElementById('player2');
  
  players.forEach(name => {
    const opt1 = document.createElement('option');
    opt1.value = opt1.textContent = name;
    player1Select.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = opt2.textContent = name;
    player2Select.appendChild(opt2);
  });
}

// チーム選択肢を設定
function populateTeamSelects() {
  const teamSelects = document.querySelectorAll('.team-select');
  
  teamSelects.forEach(select => {
    // 既存のオプションをクリア（最初のオプションは残す）
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }
    
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = `${team.name} (${team.members.join(', ')})`;
      select.appendChild(option);
    });
  });
}

// タブ機能の初期化
function initializeTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // アクティブクラスを削除
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // 選択されたタブをアクティブに
      this.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });
}

// 新しいラウンドを生成
function generateNewRound() {
  // 利用可能なチームをシャッフル
  const availableTeams = [...teams];
  shuffleArray(availableTeams);
  
  // 2試合分のチーム（4チーム）を選択
  const matchTeams = availableTeams.slice(0, 4);
  const restingTeam = availableTeams[4];
  
  // コート1とコート2にチームを配置
  setCourtTeams(1, matchTeams[0], matchTeams[1]);
  setCourtTeams(2, matchTeams[2], matchTeams[3]);
  
  // 休憩チームを表示
  document.getElementById('restingTeam').textContent = 
    `${restingTeam.name} (${restingTeam.members.join(', ')})`;
  
  currentRoundTeams = {
    court1: [matchTeams[0], matchTeams[1]],
    court2: [matchTeams[2], matchTeams[3]],
    resting: restingTeam
  };
}

// コートにチームを設定
function setCourtTeams(courtNum, team1, team2) {
  document.getElementById(`team1-court${courtNum}`).value = team1.id;
  document.getElementById(`team2-court${courtNum}`).value = team2.id;
  document.getElementById(`score-court${courtNum}`).value = '';
}

// 配列をシャッフル
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 試合スコアを記録する
function recordMatchScore(round, court) {
  const scoreInput = document.querySelector(`.score-input[data-round="${round}"][data-court="${court}"]`);
  const score = scoreInput.value.trim();
  
  if (!score) {
    alert('スコアを入力してください');
    return;
  }
  
  // allMatchesDataから該当する試合データを取得
  const roundData = allMatchesData[round - 1];
  const matchData = roundData.matches[court - 1];
  
  const match = {
    round: round,
    court: court,
    team1: matchData.team1,
    team2: matchData.team2,
    score: score,
    timestamp: new Date().toLocaleString('ja-JP')
  };
  
  // スコアをJSONデータに記録
  matchData.score = score;
  
  addTeamMatch(match);
  
  // フォームをクリア
  scoreInput.value = '';
}

// チーム戦の結果をリストに追加
function addTeamMatch(match) {
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
  
  teamMatchHistory.push(match);
}

// 個人戦用の既存コード
function addMatch(match) {
  const list = document.getElementById('matchList');
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="match-info">
      <div class="match-players">${match.player1} vs ${match.player2}</div>
      <div class="match-score">スコア: ${match.score}</div>
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

// 個人戦フォームのイベントリスナー
document.getElementById('matchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const player1 = document.getElementById('player1').value;
    const player2 = document.getElementById('player2').value;
    const score = document.getElementById('score').value.trim();
    if (!player1 || !player2 || !score) return;
    if (player1 === player2) {
      alert('同じプレイヤーは選択できません');
      return;
    }
    const match = { player1, player2, score };
    addMatch(match);
    this.reset();
});