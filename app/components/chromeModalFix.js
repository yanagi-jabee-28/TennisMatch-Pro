// Chrome for Android専用のモーダル修正スクリプト
// スマホのChromeで薄暗い部分が残る問題を修正

// 強力な薄暗いオーバーレイ除去機能
function aggressiveOverlayRemoval() {
    // 全ての要素をチェックして薄暗い背景を持つものを除去
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        
        // 薄暗い背景色を検出（rgba(0,0,0,0.X) や rgba(0, 0, 0, 0.X)）
        if (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) {
            // モーダルが開いていない場合は強制的に透明にする
            const isModalOpen = document.querySelector('.modal.show');
            if (!isModalOpen && !element.classList.contains('show')) {
                element.style.backgroundColor = 'transparent !important';
                element.style.display = 'none !important';
                element.style.opacity = '0 !important';
                element.style.visibility = 'hidden !important';
                element.style.pointerEvents = 'none !important';
                element.style.zIndex = '-9999 !important';
            }
        }
    });
}

// 緊急用の最強薄暗いオーバーレイ除去機能
function nuclearOverlayRemoval() {
    console.log('緊急薄暗いオーバーレイ除去を実行中...');
    
    // ボディに緊急クラスを追加
    document.body.classList.add('no-dark-overlay');
    
    // 全ての要素をチェック
    const allElements = document.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        
        // モーダルが開いていない場合のみ処理
        if (!document.querySelector('.modal.show')) {
            const style = element.style;
            const computedStyle = window.getComputedStyle(element);
            
            // インラインスタイルで薄暗い背景を検出
            if (style.backgroundColor && 
                (style.backgroundColor.includes('rgba(0, 0, 0') || 
                 style.backgroundColor.includes('rgba(0,0,0'))) {
                
                element.style.backgroundColor = 'transparent';
                element.style.background = 'transparent';
                element.style.display = 'none';
                element.style.opacity = '0';
                element.style.visibility = 'hidden';
                element.style.pointerEvents = 'none';
                element.style.zIndex = '-9999';
            }
            
            // 計算済みスタイルで薄暗い背景を検出
            if (computedStyle.backgroundColor && 
                (computedStyle.backgroundColor.includes('rgba(0, 0, 0') || 
                 computedStyle.backgroundColor.includes('rgba(0,0,0'))) {
                
                element.style.backgroundColor = 'transparent !important';
                element.style.background = 'transparent !important';
                element.style.display = 'none !important';
                element.style.opacity = '0 !important';
                element.style.visibility = 'hidden !important';
                element.style.pointerEvents = 'none !important';
                element.style.zIndex = '-9999 !important';
            }
        }
    }
    
    console.log('緊急薄暗いオーバーレイ除去完了');
}

// モーダルの表示・非表示を監視してボディクラスを管理
function fixChromeModalOverlay() {
    // Chrome for Androidでのみ実行
    if (!(navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Mobile'))) {
        return;
    }
    
    console.log('Chrome for Android薄暗いオーバーレイ修正を開始...');

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
    });    // ボディクラスの更新
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
                
                // さらに強力な除去
                aggressiveOverlayRemoval();
            }, 50);
        }
    }    // 初期チェック
    updateBodyClass();
    
    // 即座に強力な除去を実行
    aggressiveOverlayRemoval();
    nuclearOverlayRemoval();

    // 定期的なチェック（保険）- より頻繁に実行
    setInterval(() => {
        const hasOpenModal = document.querySelector('.modal.show');
        const bodyHasClass = document.body.classList.contains('modal-open');
        
        if (hasOpenModal && !bodyHasClass) {
            document.body.classList.add('modal-open');
        } else if (!hasOpenModal && bodyHasClass) {
            document.body.classList.remove('modal-open');
            // モーダルが閉じた時は強力な除去を実行
            aggressiveOverlayRemoval();
            nuclearOverlayRemoval();
        }
        
        // 常に薄暗いオーバーレイをチェック
        if (!hasOpenModal) {
            aggressiveOverlayRemoval();
            // 10回に1回は最強除去を実行
            if (Math.random() < 0.1) {
                nuclearOverlayRemoval();
            }
        }
    }, 300); // より頻繁に実行（0.3秒間隔）
    
    // ページの可視化時にもチェック
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(aggressiveOverlayRemoval, 100);
        }
    });
      // スクロール時にもチェック
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (!document.querySelector('.modal.show')) {
                aggressiveOverlayRemoval();
            }
        }, 100);
    });
    
    // タッチイベント時にも薄暗いオーバーレイをチェック
    document.addEventListener('touchstart', () => {
        if (!document.querySelector('.modal.show')) {
            setTimeout(aggressiveOverlayRemoval, 50);
        }
    });
    
    document.addEventListener('touchend', () => {
        if (!document.querySelector('.modal.show')) {
            setTimeout(() => {
                aggressiveOverlayRemoval();
                nuclearOverlayRemoval();
            }, 100);
        }
    });
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
