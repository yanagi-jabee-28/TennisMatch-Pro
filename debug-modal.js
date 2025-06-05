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
    });
    
    // 薄暗いオーバーレイがないかチェック
    const overlays = document.querySelectorAll('[style*="rgba(0, 0, 0"]');
    if (overlays.length > 0) {
        console.log('=== 薄暗いオーバーレイ発見 ===');
        overlays.forEach((overlay, index) => {
            console.log(`オーバーレイ ${index + 1}:`, overlay);
        });
    }
}

// ページ読み込み後にチェック
window.addEventListener('load', checkModalStates);

// コンソールから手動でチェックできるように
window.checkModalStates = checkModalStates;
