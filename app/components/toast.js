// トースト通知システム

const toast = {
    // トースト通知を表示する
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // トースト要素を作成
        const toastElement = document.createElement('div');
        toastElement.className = `toast toast-${type}`;
        toastElement.textContent = message;
        
        // コンテナに追加
        container.appendChild(toastElement);
        
        // 自動削除
        setTimeout(() => {
            if (toastElement && toastElement.parentElement) {
                toastElement.parentElement.removeChild(toastElement);
            }
        }, duration);
    },
    
    // 成功通知
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    // エラー通知
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    
    // 情報通知
    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

export { toast };
