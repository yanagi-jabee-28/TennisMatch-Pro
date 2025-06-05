// デバッグ機能

import { appState, saveMatchResults } from './state.js';
import { getMatchId } from './utils.js';
import { customConfirm } from './components/customConfirm.js';
import { toast } from './components/toast.js';

// ランダムスコア生成
function generateRandomScores(createMatchTable, calculateStandings) {
    console.log('ランダムスコア生成開始');
    const matchPoint = appState.settings.matchPoint;
    console.log('マッチポイント:', matchPoint);
    console.log('チーム数:', appState.teams.length);
    
    // 各チームのペア組み合わせを生成
    const matchesToGenerate = [];
    
    for (let i = 0; i < appState.teams.length; i++) {
        for (let j = i + 1; j < appState.teams.length; j++) {
            const team1 = appState.teams[i];
            const team2 = appState.teams[j];
            const matchId = getMatchId(team1.id, team2.id);
            
            matchesToGenerate.push({
                matchId,
                team1Id: team1.id,
                team2Id: team2.id
            });
        }
    }
    
    console.log('生成する試合数:', matchesToGenerate.length);
    
    // 各試合にランダムスコアを設定
    matchesToGenerate.forEach(match => {
        // マッチポイントの範囲内でランダムスコアを生成
        // 0からマッチポイントまでの範囲でランダム生成
        const score1 = Math.floor(Math.random() * (matchPoint + 1));
        const score2 = Math.floor(Math.random() * (matchPoint + 1));
        
        // 勝者を決定
        let winner;
        if (score1 === score2) {
            winner = null; // 引き分け
        } else if (score1 > score2) {
            winner = match.team1Id;
        } else {
            winner = match.team2Id;
        }
        
        // 試合結果を保存
        appState.matches[match.matchId] = {
            team1: match.team1Id,
            team2: match.team2Id,
            scoreTeam1: score1,
            scoreTeam2: score2,
            winner: winner
        };
        
        console.log(`試合 ${match.matchId}: ${score1}-${score2}, 勝者: ${winner}`);
    });
    
    console.log('試合データ保存前:', Object.keys(appState.matches).length);
    
    // データを保存してUIを更新
    saveMatchResults();
    createMatchTable();
    calculateStandings();
    
    console.log('UI更新完了');
    toast.success(`${matchesToGenerate.length}試合のランダムスコアを生成しました！`);
}

// 全試合結果をクリア
async function clearAllMatches(createMatchTable, calculateStandings) {
    const confirmed = await customConfirm.show(
        '全ての試合結果をクリアしますか？この操作は元に戻せません。',
        '全試合結果クリア'
    );
    
    if (confirmed) {
        // 全試合データをクリア
        appState.matches = {};
        
        // データを保存してUIを更新
        saveMatchResults();
        createMatchTable();
        calculateStandings();
        
        toast.success('全ての試合結果をクリアしました');
    }
}

// デバッグボタンのイベントリスナーを設定
function initializeDebugListeners(createMatchTable, calculateStandings) {
    console.log('デバッグリスナーを初期化中...');
    
    const debugFillBtn = document.getElementById('debug-fill-btn');
    const clearAllMatchesBtn = document.getElementById('clear-all-matches-btn');
    
    console.log('デバッグボタン:', debugFillBtn);
    console.log('クリアボタン:', clearAllMatchesBtn);
    
    if (debugFillBtn) {
        debugFillBtn.addEventListener('click', async () => {
            console.log('デバッグボタンがクリックされました');
            const confirmed = await customConfirm.show(
                '全ての対戦にランダムなスコアを生成しますか？既存の結果は上書きされます。',
                'ランダムスコア生成'
            );
            
            if (confirmed) {
                console.log('ランダムスコア生成を開始');
                generateRandomScores(createMatchTable, calculateStandings);
            }
        });
        console.log('デバッグボタンのイベントリスナーが設定されました');
    } else {
        console.error('デバッグボタンが見つかりません');
    }
    
    if (clearAllMatchesBtn) {
        clearAllMatchesBtn.addEventListener('click', () => {
            console.log('クリアボタンがクリックされました');
            clearAllMatches(createMatchTable, calculateStandings);
        });
        console.log('クリアボタンのイベントリスナーが設定されました');
    } else {
        console.error('クリアボタンが見つかりません');
    }
}

export { initializeDebugListeners };
