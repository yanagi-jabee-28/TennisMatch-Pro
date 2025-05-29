// 参加者リストを読み込んでセレクトボックスに反映
fetch('players.json')
  .then(res => res.json())
  .then(players => {
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
  });

function addMatch(match) {
  const list = document.getElementById('matchList');
  const li = document.createElement('li');
  li.innerHTML = `<span>${match.player1} vs ${match.player2}｜スコア: ${match.score}</span>`;
  li.style.opacity = 0;
  list.insertBefore(li, list.firstChild);
  setTimeout(() => { li.style.transition = 'opacity 0.5s'; li.style.opacity = 1; }, 10);
}

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