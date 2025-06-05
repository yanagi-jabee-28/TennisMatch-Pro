// デバッグ用：モーダルの状態をチェック
function checkModalStates() {
    const modals = document.querySelectorAll('.modal');
    console.log('=== モーダル状態チェック ===');
    modals.forEach((modal, index) => {
        const computedStyle = window.getComputedStyle(modal);
        console.log(`モーダル ${index + 1} (ID: ${modal.id}):`);
        console.log(`  display: ${computedStyle.display}`);
        console.log(`  visibility: ${computedStyle.visibility}`);
        console.log(`  opacity: ${computedStyle.opacity}`);
        console.log(`  z-index: ${computedStyle.zIndex}`);
        console.log(`  background-color: ${computedStyle.backgroundColor}`);
        console.log(`  pointer-events: ${computedStyle.pointerEvents}`);
        console.log(`  transform: ${computedStyle.transform}`);
        console.log(`  classes: ${modal.className}`);
    });
    
    // 薄暗いオーバーレイがないかチェック
    const overlays = document.querySelectorAll('[style*="rgba(0, 0, 0"]');
    if (overlays.length > 0) {
        console.log('=== 薄暗いオーバーレイ発見 ===');
        overlays.forEach((overlay, index) => {
            console.log(`オーバーレイ ${index + 1}:`, overlay);
            console.log(`  スタイル: ${overlay.getAttribute('style')}`);
            console.log(`  表示状態: ${window.getComputedStyle(overlay).display}`);
        });
    }
    
    // Chrome for Android特有の問題をチェック
    if (navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Mobile')) {
        console.log('=== Chrome for Android 検出 ===');
        console.log('薄暗いオーバーレイ修正が有効になっているはずです');
        
        // ボディクラスのチェック
        console.log(`body.modal-open: ${document.body.classList.contains('modal-open')}`);
        
        // 隠れたモーダルのチェック
        const hiddenModals = document.querySelectorAll('.modal:not(.show)');
        console.log(`非表示モーダル数: ${hiddenModals.length}`);
        hiddenModals.forEach((modal, index) => {
            const style = window.getComputedStyle(modal);
            if (style.display !== 'none' || style.opacity !== '0') {
                console.warn(`非表示モーダル ${index + 1} が完全に隠れていません:`, {
                    display: style.display,
                    opacity: style.opacity,
                    visibility: style.visibility
                });
            }
        });
    }
}

// Chrome for Android 薄暗いオーバーレイ問題の緊急修正
function emergencyOverlayFix() {
    if (navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Mobile')) {
        console.log('Chrome for Android緊急修正を実行中...');
        
        // 全ての薄暗いオーバーレイを除去
        const darkOverlays = document.querySelectorAll('[style*="rgba(0, 0, 0"], [style*="rgba(0,0,0"]');
        darkOverlays.forEach(overlay => {
            if (!overlay.classList.contains('show')) {
                overlay.style.display = 'none !important';
                overlay.style.opacity = '0 !important';
                overlay.style.visibility = 'hidden !important';
                overlay.style.pointerEvents = 'none !important';
                overlay.style.backgroundColor = 'transparent !important';
            }
        });
        
        // モーダルの強制修正
        document.querySelectorAll('.modal:not(.show)').forEach(modal => {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.style.pointerEvents = 'none';
            modal.style.backgroundColor = 'transparent';
        });
        
        console.log('緊急修正完了');
    }
}

// ページ読み込み後にチェック
window.addEventListener('load', checkModalStates);

// グローバルに公開
window.checkModalStates = checkModalStates;
window.emergencyOverlayFix = emergencyOverlayFix;
