// デバッグ機能

import { appState, saveMatchResults, getActiveTeams, toggleTeamParticipation } from './state.js';
import { getMatchId, EventListenerManager, calculateTeamStats } from './utils.js';
import { customConfirm } from './components/customConfirm.js';
import { toast } from './components/toast.js';

// ランダムスコア生成
function generateRandomScores(createMatchTable, calculateStandings) {
    console.log('ランダムスコア生成開始');
    const matchPoint = appState.settings.matchPoint;
    console.log('マッチポイント:', matchPoint);
    
    // 参加中のチームのみを取得
    const activeTeams = getActiveTeams();
    console.log('参加中のチーム数:', activeTeams.length);
    
    // 各チームのペア組み合わせを生成（参加中のチームのみ）
    const matchesToGenerate = [];
    
    for (let i = 0; i < activeTeams.length; i++) {
        for (let j = i + 1; j < activeTeams.length; j++) {
            const team1 = activeTeams[i];
            const team2 = activeTeams[j];
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
        // どちらのチームが勝つかを先にランダムに決定
        const team1Wins = Math.random() < 0.5;
        
        let score1, score2, winner;
        
        if (team1Wins) {
            // team1が勝利：team1は必ずマッチポイント、team2は0からマッチポイント-1
            score1 = matchPoint;
            score2 = Math.floor(Math.random() * matchPoint);
            winner = match.team1Id;
        } else {
            // team2が勝利：team2は必ずマッチポイント、team1は0からマッチポイント-1
            score1 = Math.floor(Math.random() * matchPoint);
            score2 = matchPoint;
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





// チーム参加状態変更時の詳細ログ機能
function logTeamParticipationChange(teamId, newState) {
    console.log(`=== チーム参加状態変更: チーム${teamId} → ${newState ? '参加' : '不参加'} ===`);
    
    if (!newState) {
        // 不参加になる場合、削除対象の試合を詳細ログ
        const matchesToDelete = Object.entries(appState.matches).filter(([matchId, match]) => 
            match.team1 === teamId || match.team2 === teamId
        );
        
        console.log(`削除対象の試合: ${matchesToDelete.length}件`);
        matchesToDelete.forEach(([matchId, match]) => {
            console.log(`  - ${matchId}: チーム${match.team1} vs チーム${match.team2} (${match.scoreTeam1}-${match.scoreTeam2})`);
        });
    }
    
    // 変更後の状態を確認
    setTimeout(() => {
        const activeTeams = getActiveTeams();
        const remainingMatches = Object.keys(appState.matches).length;
        console.log(`変更後 - 参加チーム: ${activeTeams.map(t => t.id).join(', ')}, 残り試合: ${remainingMatches}件`);
    }, 100);
}



// デバッグボタンのイベントリスナーを設定
function initializeDebugListeners(createMatchTable, calculateStandings) {
    console.log('デバッグリスナーを初期化中...');    const debugButtonHandlers = {
        'debug-fill-btn': async () => {
            console.log('デバッグボタンがクリックされました');
            const confirmed = await customConfirm.show(
                '全ての対戦にランダムなスコアを生成しますか？既存の結果は上書きされます。',
                'ランダムスコア生成'
            );
            
            if (confirmed) {
                console.log('ランダムスコア生成を開始');
                generateRandomScores(createMatchTable, calculateStandings);
            }
        },
        'clear-all-matches-btn': () => {
            console.log('クリアボタンがクリックされました');
            clearAllMatches(createMatchTable, calculateStandings);
        }
    };
    
    Object.entries(debugButtonHandlers).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            EventListenerManager.safeAddEventListener(button, 'click', handler);
            console.log(`${id}のイベントリスナーが設定されました`);
        } else {
            console.error(`${id}が見つかりません`);
        }
    });
}



export { initializeDebugListeners, logTeamParticipationChange };
