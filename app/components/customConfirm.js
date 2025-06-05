// カスタム確認ダイアログシステム

const customConfirm = {
    dialog: null,
    titleElement: null,
    messageElement: null,
    yesButton: null,
    noButton: null,
    currentResolve: null,
    
    init() {
        this.dialog = document.getElementById('confirm-dialog');
        this.titleElement = document.getElementById('confirm-title');
        this.messageElement = document.getElementById('confirm-message');
        this.yesButton = document.getElementById('confirm-yes-btn');
        this.noButton = document.getElementById('confirm-no-btn');
        
        // ボタンにイベントリスナーを追加
        this.yesButton.addEventListener('click', () => this.handleConfirm(true));
        this.noButton.addEventListener('click', () => this.handleConfirm(false));
    },
    
    show(message, title = '確認') {
        if (!this.dialog) this.init();
        
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;
        this.dialog.classList.add('show');
        
        // Promiseを返して非同期で結果を処理できるようにする
        return new Promise(resolve => {
            this.currentResolve = resolve;
        });
    },
      handleConfirm(result) {
        this.dialog.classList.remove('show');
        
        // Chrome for Android専用の強制非表示処理
        if (navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Mobile')) {
            // 即座に非表示にする
            this.dialog.style.display = 'none';
            this.dialog.style.opacity = '0';
            this.dialog.style.visibility = 'hidden';
            this.dialog.style.pointerEvents = 'none';
            
            // 少し遅れて元に戻す（次回表示のため）
            setTimeout(() => {
                if (!this.dialog.classList.contains('show')) {
                    this.dialog.style.display = '';
                    this.dialog.style.opacity = '';
                    this.dialog.style.visibility = '';
                    this.dialog.style.pointerEvents = '';
                }
            }, 300);
        }
        
        if (this.currentResolve) {
            this.currentResolve(result);
            this.currentResolve = null;
        }
    }
};

export { customConfirm };
