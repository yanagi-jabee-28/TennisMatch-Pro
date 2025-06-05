// Chrome for Android専用のモーダル修正スクリプト
// スマホのChromeで薄暗い部分が残る問題を修正

// モーダルの表示・非表示を監視してボディクラスを管理
function fixChromeModalOverlay() {
    // Chrome for Androidでのみ実行
    if (!(navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Mobile'))) {
        return;
    }

    // MutationObserverでモーダルの状態変化を監視
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('modal')) {
                    updateBodyClass();
                }
            }
        });
    });

    // 全てのモーダルを監視
    document.querySelectorAll('.modal').forEach(modal => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });
    });

    // ボディクラスの更新
    function updateBodyClass() {
        const hasOpenModal = document.querySelector('.modal.show');
        
        if (hasOpenModal) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
            
            // 薄暗いオーバーレイが残っている場合の強制除去
            setTimeout(() => {
                document.querySelectorAll('.modal:not(.show)').forEach(modal => {
                    modal.style.display = 'none';
                    modal.style.opacity = '0';
                    modal.style.visibility = 'hidden';
                    modal.style.pointerEvents = 'none';
                    modal.style.backgroundColor = 'transparent';
                });
            }, 100);
        }
    }

    // 初期チェック
    updateBodyClass();

    // 定期的なチェック（保険）
    setInterval(() => {
        const hasOpenModal = document.querySelector('.modal.show');
        const bodyHasClass = document.body.classList.contains('modal-open');
        
        if (hasOpenModal && !bodyHasClass) {
            document.body.classList.add('modal-open');
        } else if (!hasOpenModal && bodyHasClass) {
            document.body.classList.remove('modal-open');
        }
    }, 1000);
}

// DOM読み込み完了後に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixChromeModalOverlay);
} else {
    fixChromeModalOverlay();
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fixChromeModalOverlay };
}
