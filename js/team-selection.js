/**
 * チーム選択関連の機能
 * 
 * チームの選択、メンバー割り当て、チーム管理に関する機能を提供します。
 */

// TennisMatchAppクラスのプロトタイプにメソッドを追加
Object.assign(TennisMatchApp.prototype, {
    // チーム選択画面のレンダリング
    renderTeamSelection() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // チームカードを作成
        CONFIG.TEAM_NAMES.forEach(teamName => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            if (this.selectedTeam === teamName) {
                teamCard.classList.add('selected');
            }
            
            // チームヘッダー
            const teamHeader = document.createElement('div');
            teamHeader.className = 'team-header';
            teamHeader.textContent = teamName;
            teamCard.appendChild(teamHeader);
            
            // メンバーリスト
            const memberList = document.createElement('div');
            memberList.className = 'member-list';
            
            // チームに割り当てられたメンバーを表示
            const assignedMembers = this.teamAssignments[teamName] || [];
            assignedMembers.forEach(member => {
                const memberItem = document.createElement('div');
                memberItem.className = 'member-item';
                memberItem.textContent = member;
                memberList.appendChild(memberItem);
            });
            
            teamCard.appendChild(memberList);
            
            // クリックイベント
            teamCard.addEventListener('click', () => {
                this.selectTeam(teamName);
            });
            
            container.appendChild(teamCard);
        });
        
        // 選択状態の表示
        this.updateSelectionStatus();
        
        // 利用可能なメンバーリストの表示
        this.renderAvailableMembers();
    },
    
    // チーム選択
    selectTeam(teamName) {
        // 同じチームを選択した場合は選択解除
        if (this.selectedTeam === teamName) {
            this.selectedTeam = null;
        } else {
            this.selectedTeam = teamName;
        }
        
        // 選択状態を更新
        this.renderTeamSelection();
    },
    
    // 選択状態の更新
    updateSelectionStatus() {
        const statusElement = document.getElementById('selectionStatus');
        if (!statusElement) return;
        
        if (this.selectedTeam) {
            statusElement.textContent = `${this.selectedTeam} を選択中`;
            statusElement.querySelector('.status-dot').classList.add('ready');
        } else {
            statusElement.textContent = 'チームを選択してください';
            statusElement.querySelector('.status-dot').classList.remove('ready');
        }
    },
    
    // 利用可能なメンバーリストのレンダリング
    renderAvailableMembers() {
        const container = document.getElementById('availableMembersContainer');
        if (!container) return;
        
        // 既に割り当てられているメンバーを取得
        const assignedMembers = new Set();
        Object.values(this.teamAssignments).forEach(members => {
            members.forEach(member => {
                assignedMembers.add(member);
            });
        });
        
        // 利用可能なメンバーを表示
        const availableMembersElement = document.createElement('div');
        availableMembersElement.className = 'available-members';
        
        CONFIG.ALL_MEMBERS.filter(member => !assignedMembers.has(member)).forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'available-member';
            memberElement.textContent = member;
            
            // クリックイベント（選択中のチームにメンバーを追加）
            memberElement.addEventListener('click', () => {
                if (this.selectedTeam) {
                    this.addMemberToTeam(this.selectedTeam, member);
                } else {
                    this.showNotification('先にチームを選択してください', 'error');
                }
            });
            
            availableMembersElement.appendChild(memberElement);
        });
        
        container.innerHTML = '';
        
        // タイトル
        const title = document.createElement('div');
        title.className = 'available-members-title';
        title.textContent = '利用可能なメンバー';
        container.appendChild(title);
        
        container.appendChild(availableMembersElement);
    },
    
    // チームにメンバーを追加
    addMemberToTeam(teamName, memberName) {
        // チームが存在しない場合は作成
        if (!this.teamAssignments[teamName]) {
            this.teamAssignments[teamName] = [];
        }
        
        // 既に追加されている場合は何もしない
        if (this.teamAssignments[teamName].includes(memberName)) {
            this.showNotification(`${memberName} は既に ${teamName} に追加されています`, 'info');
            return;
        }
        
        // メンバーがどこかのチームに既に属している場合は、そのチームから削除
        Object.keys(this.teamAssignments).forEach(team => {
            const index = this.teamAssignments[team].indexOf(memberName);
            if (index !== -1) {
                this.teamAssignments[team].splice(index, 1);
            }
        });
        
        // 新しいチームに追加
        this.teamAssignments[teamName].push(memberName);
        
        // UI更新
        this.renderTeamSelection();
        this.showNotification(`${memberName} を ${teamName} に追加しました`, 'success');
    },
    
    // チームからメンバーを削除
    removeMemberFromTeam(teamName, memberName) {
        if (!this.teamAssignments[teamName]) return;
        
        const index = this.teamAssignments[teamName].indexOf(memberName);
        if (index !== -1) {
            this.teamAssignments[teamName].splice(index, 1);
            
            // UI更新
            this.renderTeamSelection();
            this.showNotification(`${memberName} を ${teamName} から削除しました`, 'info');
        }
    },
    
    // チームメンバーをリセット
    resetTeamMembers() {
        // デフォルト割り当てに戻すか、すべて空にする
        if (CONFIG.DEFAULT_TEAM_ASSIGNMENTS) {
            this.teamAssignments = JSON.parse(JSON.stringify(CONFIG.DEFAULT_TEAM_ASSIGNMENTS));
        } else {
            Object.keys(this.teamAssignments).forEach(team => {
                this.teamAssignments[team] = [];
            });
        }
        
        // UI更新
        this.renderTeamSelection();
        this.showNotification('チームメンバーをリセットしました', 'info');
    },
    
    // チーム名を取得（インデックスから）
    getTeamName(index) {
        return CONFIG.TEAM_NAMES[index] || `チーム${index + 1}`;
    },
    
    // チームメンバーを取得
    getTeamMembers(teamName) {
        return this.teamAssignments[teamName] || [];
    }
});
