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



// 統計計算の検証機能
function validateStats(createMatchTable, calculateStandings) {
    console.log('=== 統計計算検証開始 ===');
    
    // まず試合データの整合性をチェック
    const integrityResult = validateMatchDataIntegrity();
    
    const activeTeams = getActiveTeams();
    console.log('参加中のチーム:', activeTeams.map(t => t.id));
    
    const allMatches = Object.entries(appState.matches);
    console.log('全試合データ:', allMatches.length);
    
    // 参加中チーム間の試合のみをフィルタ
    const activeTeamIds = activeTeams.map(t => t.id);
    const validMatches = allMatches.filter(([matchId, match]) => {
        return activeTeamIds.includes(match.team1) && activeTeamIds.includes(match.team2);
    });
    
    console.log('有効な試合:', validMatches.length);
    console.log('有効な試合詳細:', validMatches.map(([id, match]) => ({
        id,
        teams: `${match.team1}vs${match.team2}`,
        score: `${match.scoreTeam1}-${match.scoreTeam2}`,
        winner: match.winner
    })));
    
    // 統計計算
    const teamStats = calculateTeamStats(activeTeams, appState.matches);
    console.log('計算された統計:');
    Object.entries(teamStats).forEach(([teamId, stats]) => {
        const totalGames = stats.wins + stats.losses + stats.draws;
        console.log(`チーム${teamId}: ${totalGames}試合 (勝${stats.wins}/負${stats.losses}/分${stats.draws}) 得失${stats.pointsFor}-${stats.pointsAgainst}=${stats.pointDiff} 勝率${(stats.winRate * 100).toFixed(1)}%`);
    });
    
    // 期待される試合数の計算
    const expectedMatchesPerTeam = activeTeams.length - 1;
    console.log(`期待される1チームあたりの試合数: ${expectedMatchesPerTeam}`);
    
    // 検証結果
    const issues = [];
    
    // 試合データ整合性の問題
    if (!integrityResult.valid) {
        issues.push('試合データに不参加チームとの試合が含まれています');
    }
    
    // 統計計算の問題
    Object.entries(teamStats).forEach(([teamId, stats]) => {
        const totalGames = stats.wins + stats.losses + stats.draws;
        if (totalGames !== expectedMatchesPerTeam) {
            issues.push(`チーム${teamId}: ${totalGames}試合（期待値: ${expectedMatchesPerTeam}）`);
        }
    });
    
    if (issues.length > 0) {
        console.warn('⚠️ 統計計算に問題があります:');
        issues.forEach(issue => console.warn(`  - ${issue}`));
        toast.error('統計計算に問題があります。詳細はコンソールを確認してください。');
    } else {
        console.log('✅ 統計計算は正常です');
        toast.success('統計計算は正常です');
    }
    
    console.log('=== 統計計算検証終了 ===');
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

// 試合データの整合性チェック機能
function validateMatchDataIntegrity() {
    console.log('=== 試合データ整合性チェック ===');
    
    const activeTeams = getActiveTeams();
    const activeTeamIds = activeTeams.map(t => t.id);
    
    console.log('参加中チーム:', activeTeamIds);
    
    // 全試合データを調査
    const allMatches = Object.entries(appState.matches);
    const invalidMatches = [];
    const validMatches = [];
    
    allMatches.forEach(([matchId, match]) => {
        const team1Active = activeTeamIds.includes(match.team1);
        const team2Active = activeTeamIds.includes(match.team2);
        
        if (!team1Active || !team2Active) {
            invalidMatches.push({
                id: matchId,
                match,
                reason: `不参加チームを含む試合: チーム${match.team1}(${team1Active ? '参加' : '不参加'}) vs チーム${match.team2}(${team2Active ? '参加' : '不参加'})`
            });
        } else {
            validMatches.push({id: matchId, match});
        }
    });
    
    if (invalidMatches.length > 0) {
        console.warn(`⚠️ 無効な試合データが${invalidMatches.length}件見つかりました:`);
        invalidMatches.forEach(invalid => {
            console.warn(`  - ${invalid.id}: ${invalid.reason}`);
        });
    } else {
        console.log('✅ 試合データの整合性に問題はありません');
    }
    
    console.log(`有効な試合: ${validMatches.length}件`);
    
    // 期待される試合数の計算
    const expectedTotalMatches = activeTeams.length * (activeTeams.length - 1) / 2;
    console.log(`期待される総試合数: ${expectedTotalMatches}件`);
    
    if (validMatches.length !== expectedTotalMatches) {
        console.warn(`⚠️ 試合数の不整合: 実際${validMatches.length}件 vs 期待${expectedTotalMatches}件`);
    }
    
    return {
        valid: invalidMatches.length === 0,
        validMatches,
        invalidMatches,
        expectedTotalMatches
    };
}

// デバッグボタンのイベントリスナーを設定
function initializeDebugListeners(createMatchTable, calculateStandings) {
    console.log('デバッグリスナーを初期化中...');
      const debugButtonHandlers = {        'debug-fill-btn': async () => {
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
        },        'validate-stats-btn': () => {
            console.log('統計検証ボタンがクリックされました');
            validateStats(createMatchTable, calculateStandings);
        },
        'comprehensive-test-btn': async () => {
            console.log('包括的テストボタンがクリックされました');
            const confirmed = await customConfirm.show(
                '包括的システムテストを実行しますか？既存のデータが変更される可能性があります。',
                '包括的システムテスト'
            );
            
            if (confirmed) {
                runComprehensiveTest(createMatchTable, calculateStandings);
            }
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

// 包括的なシステムテスト機能
function runComprehensiveTest(createMatchTable, calculateStandings) {
    console.log('=== 包括的システムテスト開始 ===');
    
    // 1. 初期状態の確認
    console.log('1. 初期状態の確認');
    validateStats(createMatchTable, calculateStandings);
    
    // 2. 全試合をクリアしてランダムデータを生成
    console.log('2. テストデータの生成');
    appState.matches = {};
    saveMatchResults();
    generateRandomScores(createMatchTable, calculateStandings);
    
    // 3. 全チーム参加状態での検証
    console.log('3. 全チーム参加状態での検証');
    validateStats(createMatchTable, calculateStandings);
    
    // 4. チーム4を不参加にして検証
    console.log('4. チーム4を不参加にして検証');
    const team4 = appState.teams.find(t => t.id === 4);
    if (team4) {
        // チーム4を不参加にする
        if (appState.teamParticipation[4]?.active !== false) {
            toggleTeamParticipation(4);
            
            // 関連試合を削除
            Object.keys(appState.matches).forEach(matchId => {
                const match = appState.matches[matchId];
                if (match.team1 === 4 || match.team2 === 4) {
                    delete appState.matches[matchId];
                }
            });
            saveMatchResults();
            
            createMatchTable();
            calculateStandings();
        }
        
        validateStats(createMatchTable, calculateStandings);
    }
    
    // 5. チーム3も不参加にして検証
    console.log('5. チーム3も不参加にして検証');
    const team3 = appState.teams.find(t => t.id === 3);
    if (team3) {
        if (appState.teamParticipation[3]?.active !== false) {
            toggleTeamParticipation(3);
            
            // 関連試合を削除
            Object.keys(appState.matches).forEach(matchId => {
                const match = appState.matches[matchId];
                if (match.team1 === 3 || match.team2 === 3) {
                    delete appState.matches[matchId];
                }
            });
            saveMatchResults();
            
            createMatchTable();
            calculateStandings();
        }
        
        validateStats(createMatchTable, calculateStandings);
    }
    
    // 6. チームを再度参加状態に戻す
    console.log('6. チームを再度参加状態に戻してテスト完了');
    if (appState.teamParticipation[3]?.active === false) {
        toggleTeamParticipation(3);
    }
    if (appState.teamParticipation[4]?.active === false) {
        toggleTeamParticipation(4);
    }
    
    generateRandomScores(createMatchTable, calculateStandings);
    validateStats(createMatchTable, calculateStandings);
    
    console.log('=== 包括的システムテスト完了 ===');
    toast.success('包括的システムテストが完了しました。詳細はコンソールを確認してください。');
}

export { initializeDebugListeners, validateStats, logTeamParticipationChange, validateMatchDataIntegrity, runComprehensiveTest };
