/**
 * 対戦表のVS表示を整えるための補助スクリプト
 */
document.addEventListener('DOMContentLoaded', function() {
    // VSの位置を揃える
    function alignVsElements() {
        // 対戦表示のコンテナ要素を取得
        const vsCells = document.querySelectorAll('td .match-vs');
        
        if (vsCells.length === 0) return;
        
        // 各要素に対して処理
        vsCells.forEach(cell => {
            // VS要素の高さを統一
            const sepElement = cell.querySelector('.vs-separator');
            if (sepElement) {
                sepElement.style.height = '40px';
                sepElement.style.lineHeight = '40px';
            }
            
            // チーム表示部分の高さを統一
            const teamDisplays = cell.querySelectorAll('.team-vs-display');
            if (teamDisplays.length >= 2) {
                // 高さを取得して統一
                const heights = Array.from(teamDisplays).map(el => el.offsetHeight);
                const maxHeight = Math.max(...heights);
                teamDisplays.forEach(display => {
                    display.style.minHeight = `${maxHeight}px`;
                });
            }
        });
    }
    
    // 画面サイズ変更時にも対応
    window.addEventListener('resize', alignVsElements);
    
    // 初回読み込み時と少し遅延させて実行（動的コンテンツの対応）
    alignVsElements();
    setTimeout(alignVsElements, 500);
    setTimeout(alignVsElements, 1500);
});
