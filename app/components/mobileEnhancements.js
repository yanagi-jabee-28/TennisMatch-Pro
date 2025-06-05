// スマホ向けタッチ操作の改善機能

// タッチ操作のサポート検出
const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// スマホでの操作性改善を初期化
export function initMobileEnhancements() {
    if (!isTouchDevice()) return;

    // タッチ操作のフィードバック改善
    addTouchFeedback();
    
    // スワイプによる横スクロール改善
    enhanceTableScrolling();
    
    // モーダルでのキーボード表示対応
    handleVirtualKeyboard();
    
    // ダブルタップズーム防止
    preventDoubleTabZoom();
    
    // 長押しメニュー防止
    preventContextMenu();
    
    // スクロール位置の調整
    handleScrollPosition();
}

// タッチフィードバックの追加
function addTouchFeedback() {
    // 対戦表のセルにタッチフィードバック
    document.addEventListener('touchstart', (e) => {
        const cell = e.target.closest('#match-grid td[data-match-id]');
        if (cell) {
            cell.style.transform = 'scale(0.95)';
            cell.style.transition = 'transform 0.1s ease';
        }
    });

    document.addEventListener('touchend', (e) => {
        const cell = e.target.closest('#match-grid td[data-match-id]');
        if (cell) {
            setTimeout(() => {
                cell.style.transform = '';
            }, 100);
        }
    });

    // ボタンにタッチフィードバック
    document.addEventListener('touchstart', (e) => {
        const button = e.target.closest('button, .btn');
        if (button && !button.disabled) {
            button.style.transform = 'scale(0.95)';
            button.style.transition = 'transform 0.1s ease';
        }
    });

    document.addEventListener('touchend', (e) => {
        const button = e.target.closest('button, .btn');
        if (button) {
            setTimeout(() => {
                button.style.transform = '';
            }, 100);
        }
    });
}

// テーブルの横スクロール改善
function enhanceTableScrolling() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    // タッチスクロールの改善
    tableContainer.addEventListener('touchstart', (e) => {
        isScrolling = true;
        startX = e.touches[0].pageX - tableContainer.offsetLeft;
        scrollLeft = tableContainer.scrollLeft;
    });

    tableContainer.addEventListener('touchmove', (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.touches[0].pageX - tableContainer.offsetLeft;
        const walk = (x - startX) * 2; // スクロール速度調整
        tableContainer.scrollLeft = scrollLeft - walk;
    });

    tableContainer.addEventListener('touchend', () => {
        isScrolling = false;
    });

    // スクロール位置のスナップ効果
    let scrollTimeout;
    tableContainer.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const cellWidth = 70; // モバイルでのセル幅
            const scrollLeft = tableContainer.scrollLeft;
            const snapPosition = Math.round(scrollLeft / cellWidth) * cellWidth;
            
            tableContainer.scrollTo({
                left: snapPosition,
                behavior: 'smooth'
            });
        }, 150);
    });
}

// バーチャルキーボード表示時の対応
function handleVirtualKeyboard() {
    let initialViewportHeight = window.innerHeight;

    // 初期ビューポート高さを記録
    window.addEventListener('load', () => {
        initialViewportHeight = window.innerHeight;
    });

    // ウィンドウサイズ変更時の処理
    window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        
        // キーボードが表示されたと判断（150px以上の高さ減少）
        if (heightDifference > 150) {
            document.body.classList.add('keyboard-visible');
            
            // モーダルが開いている場合の調整
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                const modalContent = openModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.position = 'fixed';
                    modalContent.style.top = '10px';
                    modalContent.style.transform = 'translateX(-50%)';
                    modalContent.style.left = '50%';
                    modalContent.style.maxHeight = `${currentHeight - 40}px`;
                }
            }
        } else {
            document.body.classList.remove('keyboard-visible');
            
            // モーダルの位置をリセット
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                const modalContent = openModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.position = '';
                    modalContent.style.top = '';
                    modalContent.style.transform = '';
                    modalContent.style.left = '';
                    modalContent.style.maxHeight = '';
                }
            }
        }
    });

    // 入力フィールドにフォーカス時の処理
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea')) {
            setTimeout(() => {
                e.target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300); // キーボード表示アニメーション後
        }
    });
}

// ダブルタップズーム防止
function preventDoubleTabZoom() {
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// 長押しコンテキストメニュー防止
function preventContextMenu() {
    // 対戦表とボタンでの長押しメニューを防止
    document.addEventListener('contextmenu', (e) => {
        const target = e.target.closest('#match-grid td, button, .btn');
        if (target) {
            e.preventDefault();
        }
    });

    // 長押し選択を防止
    document.addEventListener('selectstart', (e) => {
        const target = e.target.closest('#match-grid td, button, .btn');
        if (target) {
            e.preventDefault();
        }
    });
}

// スクロール位置の調整
function handleScrollPosition() {
    // ページ読み込み時に一番上にスクロール
    window.addEventListener('load', () => {
        window.scrollTo(0, 0);
    });

    // モーダル表示時の背景スクロール防止
    const originalAddEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click' && this.matches('[data-match-id], .edit-team-btn')) {
            const originalListener = listener;
            listener = function(e) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top = `-${window.scrollY}px`;
                document.body.style.width = '100%';
                
                return originalListener.call(this, e);
            };
        }
        return originalAddEventListener.call(this, type, listener, options);
    };

    // モーダル閉じる時の処理
    document.addEventListener('click', (e) => {
        if (e.target.matches('.close-modal, .modal')) {
            setTimeout(() => {
                const scrollY = document.body.style.top;
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                
                if (scrollY) {
                    window.scrollTo(0, parseInt(scrollY || '0') * -1);
                }
            }, 100);
        }
    });
}

// スワイプジェスチャーの検出と処理
export function addSwipeGestures() {
    if (!isTouchDevice()) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        
        handleSwipe();
    });

    function handleSwipe() {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // 最小スワイプ距離
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 横スワイプ
                if (deltaX > 0) {
                    // 右スワイプ - モーダルを閉じる
                    const openModal = document.querySelector('.modal[style*="block"]');
                    if (openModal) {
                        const closeBtn = openModal.querySelector('.close-modal');
                        if (closeBtn) closeBtn.click();
                    }
                }
            } else {
                // 縦スワイプ
                if (deltaY > 0) {
                    // 下スワイプ - モーダルを閉じる
                    const openModal = document.querySelector('.modal[style*="block"]');
                    if (openModal) {
                        const closeBtn = openModal.querySelector('.close-modal');
                        if (closeBtn) closeBtn.click();
                    }
                }
            }
        }
    }
}

// 画面回転時の処理
export function handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
        // 回転後にレイアウトを調整
        setTimeout(() => {
            // ビューポート高さを再計算
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // テーブル幅を再計算
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.style.width = '';
                setTimeout(() => {
                    tableContainer.style.width = tableContainer.scrollWidth + 'px';
                }, 100);
            }
        }, 100);
    });
}

// パフォーマンス最適化
export function optimizePerformance() {
    // タッチイベントをパッシブに設定してスクロール性能を向上
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    
    passiveEvents.forEach(eventType => {
        document.addEventListener(eventType, () => {}, { passive: true });
    });

    // アニメーション最適化
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // アイドル時間に重い処理を実行
            console.log('モバイル最適化が完了しました');
        });
    }
}
