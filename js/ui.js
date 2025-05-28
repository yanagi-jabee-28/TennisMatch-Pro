/**
 * UI関連の機能
 * 
 * 通知、モーダル、UIヘルパー関数を提供します。
 */

// TennisMatchAppクラスのプロトタイプにメソッドを追加
Object.assign(TennisMatchApp.prototype, {
    // 通知の表示
    showNotification(message, type = 'info', duration = 3000) {
        // 既存の通知があれば削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        // 通知要素の作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 通知を表示
        document.body.appendChild(notification);
        
        // 表示時間後に自動消去
        setTimeout(() => {
            if (notification.parentNode === document.body) {
                document.body.removeChild(notification);
            }
        }, duration);
    },
    
    // ヘルプモーダルの表示
    showHelpModal() {
        // モーダルコンテナがなければ作成
        let modal = document.getElementById('helpModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'helpModal';
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            // 閉じるボタン
            const closeButton = document.createElement('span');
            closeButton.className = 'modal-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            // ヘルプ内容
            const helpContent = document.createElement('div');
            helpContent.innerHTML = `
                <h2>使い方ガイド</h2>
                
                <h3>チーム編成</h3>
                <p>1. チームカードをクリックしてチームを選択します</p>
                <p>2. 利用可能なメンバーからチームに追加したいメンバーをクリックします</p>
                <p>3. すべてのチームにメンバーを割り当てます</p>
                
                <h3>試合の記録</h3>
                <p>1. ドロップダウンから勝者を選択します</p>
                <p>2. 敗者のスコアを入力します</p>
                <p>3. 結果が自動的に保存されます</p>
                
                <h3>データの管理</h3>
                <p>💾 ボタン: すべてのデータをJSONファイルとして保存</p>
                <p>📂 ボタン: 以前保存したデータを読み込み</p>
                <p>📊 ボタン: 結果をCSVファイルとしてエクスポート</p>
                <p>🌙/☀️ ボタン: ダークモード/ライトモードの切り替え</p>
                
                <h3>試合規則</h3>
                <p>マッチポイントは設定画面で変更できます（デフォルト: 6ポイント）</p>
                <p>勝者が先にマッチポイントに到達し、試合終了となります</p>
            `;
            
            modalContent.appendChild(closeButton);
            modalContent.appendChild(helpContent);
            modal.appendChild(modalContent);
            
            document.body.appendChild(modal);
            
            // モーダル外クリックで閉じる
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // モーダルを表示
        modal.style.display = 'block';
    }
});
