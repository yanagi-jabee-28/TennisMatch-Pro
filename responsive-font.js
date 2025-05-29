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
    
    // 画面面積に基づく調整
    const areaFactor = Math.sqrt(viewport.area) / 1000;
    baseFontSize *= Math.max(0.8, Math.min(1.5, areaFactor));
    
    // DPI/解像度による調整
    if (device.pixelRatio > 1.5) {
      baseFontSize *= 1.1; // 高DPIディスプレイでは少し大きく
    }
    
    // タッチデバイスでは少し大きく（指での操作を考慮）
    if (device.touchSupport) {
      baseFontSize *= 1.05;
    }
    
    // アスペクト比による調整（縦長の画面では読みやすさを重視）
    if (viewport.ratio < 0.8) {
      baseFontSize *= 1.1;
    }
    
    // 最小・最大値の制限
    baseFontSize = Math.max(12, Math.min(22, baseFontSize));
    
    return {
      base: baseFontSize,
      scale: this.calculateScaleFactor(viewport, device)
    };
  }

  calculateScaleFactor(viewport, device) {
    // スケールファクターの計算
    let scale = 1;
    
    // 画面幅に基づくスケール調整
    if (viewport.width < 400) {
      scale = 0.9;
    } else if (viewport.width > 1200) {
      scale = 1.15;
    }
    
    // 高DPIディスプレイでのスケール調整
    if (device.pixelRatio > 2) {
      scale *= 1.05;
    }
    
    return Math.max(0.8, Math.min(1.3, scale));
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
