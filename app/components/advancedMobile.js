// バイブレーション機能とハプティックフィードバック

// バイブレーション機能の対応状況を確認
const isVibrationSupported = () => {
    return 'vibrate' in navigator;
};

// タッチフィードバック用のバイブレーション
export function addHapticFeedback() {
    if (!isVibrationSupported()) return;

    // 軽いタップフィードバック
    const lightVibration = () => {
        navigator.vibrate(10); // 10ms
    };

    // 中程度のフィードバック
    const mediumVibration = () => {
        navigator.vibrate(25); // 25ms
    };

    // 成功時のフィードバック
    const successVibration = () => {
        navigator.vibrate([50, 30, 50]); // パターン
    };

    // エラー時のフィードバック
    const errorVibration = () => {
        navigator.vibrate([100, 50, 100, 50, 100]); // 長めのパターン
    };

    // 対戦表のセルタップ時
    document.addEventListener('touchstart', (e) => {
        const cell = e.target.closest('#match-grid td[data-match-id]');
        if (cell) {
            lightVibration();
        }
    });

    // ボタンタップ時
    document.addEventListener('touchstart', (e) => {
        const button = e.target.closest('button, .btn');
        if (button && !button.disabled) {
            if (button.classList.contains('btn-debug') || 
                button.classList.contains('btn-secondary')) {
                mediumVibration();
            } else {
                lightVibration();
            }
        }
    });

    // 保存成功時
    document.addEventListener('scoreSubmitted', () => {
        successVibration();
    });

    // エラー時
    document.addEventListener('errorOccurred', () => {
        errorVibration();
    });

    // スワイプでモーダルを閉じた時
    document.addEventListener('modalClosedBySwipe', () => {
        mediumVibration();
    });
}

// PWA風の機能追加
export function addPWAFeatures() {
    // ステータスバーの色を設定
    const setStatusBarColor = (color) => {
        let metaTag = document.querySelector('meta[name="theme-color"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = 'theme-color';
            document.head.appendChild(metaTag);
        }
        metaTag.content = color;
    };

    // ページの状態に応じてステータスバーの色を変更
    const updateStatusBar = () => {
        const isModalOpen = document.querySelector('.modal[style*="block"]');
        if (isModalOpen) {
            setStatusBarColor('#0d5bba'); // モーダル表示時は濃い青
        } else {
            setStatusBarColor('#1a73e8'); // 通常時
        }
    };

    // モーダルの開閉を監視
    const observer = new MutationObserver(() => {
        updateStatusBar();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
    });

    // 初期設定
    updateStatusBar();

    // ホームスクリーンに追加のプロンプト
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // インストールボタンを表示するかユーザーに判断させる
        showInstallPrompt();
    });

    function showInstallPrompt() {
        // インストールプロンプトを表示するかの判断
        const hasShownPrompt = localStorage.getItem('installPromptShown');
        if (!hasShownPrompt) {
            setTimeout(() => {
                if (confirm('このアプリをホーム画面に追加しますか？オフラインでも使用できるようになります。')) {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then((choiceResult) => {
                            localStorage.setItem('installPromptShown', 'true');
                            deferredPrompt = null;
                        });
                    }
                } else {
                    localStorage.setItem('installPromptShown', 'true');
                }
            }, 5000); // 5秒後にプロンプト表示
        }
    }
}

// 省電力モードの検出と対応
export function handlePowerSavingMode() {
    // バッテリー情報の取得（対応ブラウザのみ）
    if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
            const updatePowerMode = () => {
                if (battery.level < 0.2 || battery.charging === false) {
                    // 省電力モードを有効化
                    document.body.classList.add('power-saving-mode');
                    
                    // アニメーションを無効化
                    const style = document.createElement('style');
                    style.textContent = `
                        .power-saving-mode * {
                            animation-duration: 0.01ms !important;
                            animation-iteration-count: 1 !important;
                            transition-duration: 0.01ms !important;
                        }
                    `;
                    document.head.appendChild(style);
                } else {
                    document.body.classList.remove('power-saving-mode');
                }
            };

            battery.addEventListener('levelchange', updatePowerMode);
            battery.addEventListener('chargingchange', updatePowerMode);
            updatePowerMode();
        });
    }
}

// ネットワーク状態の監視
export function monitorNetworkStatus() {
    const updateNetworkStatus = () => {
        if (navigator.onLine) {
            document.body.classList.remove('offline');
            // オンライン復帰時の処理
        } else {
            document.body.classList.add('offline');
            // オフライン時の通知
            if ('serviceWorker' in navigator) {
                // サービスワーカーがある場合はオフラインメッセージを表示
                const offlineMessage = document.createElement('div');
                offlineMessage.className = 'offline-banner';
                offlineMessage.textContent = 'オフラインモードです。データはローカルに保存されます。';
                document.body.appendChild(offlineMessage);
                
                setTimeout(() => {
                    offlineMessage.remove();
                }, 5000);
            }
        }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
}

// スマートフォン特有の操作改善
export function enhanceSmartphoneExperience() {
    // 画面の明度調整（ダークモード対応の改善）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (e) => {
        if (e.matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    mediaQuery.addListener(handleColorSchemeChange);
    handleColorSchemeChange(mediaQuery);

    // フォーカス管理の改善
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea, select')) {
            e.target.classList.add('focused');
        }
    });

    document.addEventListener('focusout', (e) => {
        if (e.target.matches('input, textarea, select')) {
            e.target.classList.remove('focused');
        }
    });

    // 長押し操作の改善
    let longPressTimer;
    const LONG_PRESS_DURATION = 500; // 0.5秒

    document.addEventListener('touchstart', (e) => {
        const cell = e.target.closest('#match-grid td[data-match-id]');
        if (cell) {
            longPressTimer = setTimeout(() => {
                // 長押し時の動作（例：詳細情報表示）
                cell.classList.add('long-pressed');
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // ここで詳細情報やコンテキストメニューを表示
                showCellContextMenu(cell);
            }, LONG_PRESS_DURATION);
        }
    });

    document.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
        document.querySelectorAll('.long-pressed').forEach(cell => {
            cell.classList.remove('long-pressed');
        });
    });

    document.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });
}

// セルの長押しコンテキストメニュー
function showCellContextMenu(cell) {
    const matchId = cell.getAttribute('data-match-id');
    if (!matchId) return;

    // 簡単なコンテキストメニューを作成
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" data-action="edit">スコア編集</div>
        <div class="context-menu-item" data-action="clear">スコアクリア</div>
        <div class="context-menu-item" data-action="cancel">キャンセル</div>
    `;

    // メニューの位置を計算
    const rect = cell.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 10}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.zIndex = '2000';

    document.body.appendChild(menu);

    // メニューアイテムのクリックハンドラ
    menu.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        switch (action) {
            case 'edit':
                cell.click(); // 通常のクリック動作
                break;
            case 'clear':
                // スコアクリア処理
                if (confirm('このスコアをクリアしますか？')) {
                    // スコアクリア処理を実装
                }
                break;
        }
        menu.remove();
    });

    // 外側クリックでメニューを閉じる
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}
