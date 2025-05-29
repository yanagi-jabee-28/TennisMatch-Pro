// 動的フォントサイズ調整システム
class ResponsiveFontManager {
  constructor() {
    this.init();
    this.setupEventListeners();
  }

  init() {
    this.updateFontSize();
  }

  setupEventListeners() {
    // 画面サイズ変更時の対応
    window.addEventListener('resize', this.debounce(() => {
      this.updateFontSize();
    }, 250));

    // デバイスの向き変更時の対応
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateFontSize();
      }, 100);
    });
  }

  updateFontSize() {
    const viewport = this.getViewportInfo();
    const deviceInfo = this.getDeviceInfo();
    const optimalSizes = this.calculateOptimalSizes(viewport, deviceInfo);
    
    this.applySizes(optimalSizes);
  }

  getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.innerWidth / window.innerHeight,
      area: window.innerWidth * window.innerHeight
    };
  }

  getDeviceInfo() {
    return {
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
  }
  calculateOptimalSizes(viewport, device) {
    // 基準フォントサイズの計算（画面面積とDPIを考慮）
    let baseFontSize = 16;
    
    // スマートフォン判定の強化（画面幅でより細かく判定）
    const isMobile = viewport.width <= 768;
    const isSmallMobile = viewport.width <= 480;
    const isTinyMobile = viewport.width <= 360;
    
    // 画面面積に基づく調整
    const areaFactor = Math.sqrt(viewport.area) / 1000;
    baseFontSize *= Math.max(0.8, Math.min(1.5, areaFactor));
    
    // スマートフォン向けの大幅な調整
    if (isTinyMobile) {
      baseFontSize *= 1.3; // 極小画面では30%増加
    } else if (isSmallMobile) {
      baseFontSize *= 1.25; // 小画面では25%増加
    } else if (isMobile) {
      baseFontSize *= 1.2; // モバイル画面では20%増加
    }
    
    // DPI/解像度による調整
    if (device.pixelRatio > 1.5) {
      baseFontSize *= 1.1; // 高DPIディスプレイでは少し大きく
    }
    
    // タッチデバイスでは追加で大きく（指での操作を考慮）
    if (device.touchSupport) {
      baseFontSize *= isMobile ? 1.1 : 1.05; // モバイルではより大きく
    }
    
    // アスペクト比による調整（縦長の画面では読みやすさを重視）
    if (viewport.ratio < 0.8) {
      baseFontSize *= 1.15; // 縦長画面での調整を強化
    }
    
    // 最小・最大値の制限（モバイル向けに調整）
    const minSize = isMobile ? 15 : 12;
    const maxSize = isMobile ? 26 : 22;
    baseFontSize = Math.max(minSize, Math.min(maxSize, baseFontSize));
    
    return {
      base: baseFontSize,
      scale: this.calculateScaleFactor(viewport, device)
    };
  }
  calculateScaleFactor(viewport, device) {
    // スケールファクターの計算
    let scale = 1;
    
    // モバイル判定
    const isMobile = viewport.width <= 768;
    const isSmallMobile = viewport.width <= 480;
    
    // 画面幅に基づくスケール調整（モバイル向けに強化）
    if (viewport.width < 400) {
      scale = 1.0; // 極小画面でもスケールダウンしない
    } else if (isSmallMobile) {
      scale = 1.05; // 小画面では少し拡大
    } else if (isMobile) {
      scale = 1.1; // モバイル画面では10%拡大
    } else if (viewport.width > 1200) {
      scale = 1.15;
    }
    
    // 高DPIディスプレイでのスケール調整
    if (device.pixelRatio > 2) {
      scale *= isMobile ? 1.1 : 1.05; // モバイルでより強く調整
    }
    
    return Math.max(0.85, Math.min(1.4, scale)); // 範囲を拡大
  }

  applySizes(sizes) {
    const root = document.documentElement;
    
    // CSS変数を動的に更新
    root.style.setProperty('--base-font-size', `${sizes.base}px`);
    root.style.setProperty('--scale-factor', sizes.scale);
    
    // ログ出力（デバッグ用）
    console.log(`フォントサイズ調整: ${sizes.base.toFixed(1)}px, スケール: ${sizes.scale.toFixed(2)}`);
  }

  // デバウンス関数（パフォーマンス向上）
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// アプリケーション読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  new ResponsiveFontManager();
});
