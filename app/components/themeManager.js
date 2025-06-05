// ダークモード管理とテーマ切り替え機能

// ダークモードの状態管理
let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
let userPreference = localStorage.getItem('darkMode');

// ダークモード管理クラス
export class DarkModeManager {
    constructor() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.initializeDarkMode();
        this.addToggleButton();
        this.bindEvents();
    }

    // ダークモードの初期化
    initializeDarkMode() {
        // ユーザーの設定があればそれを優先、なければシステム設定に従う
        if (userPreference !== null) {
            isDarkMode = userPreference === 'true';
        } else {
            isDarkMode = this.mediaQuery.matches;
        }
        
        this.applyTheme(isDarkMode);
    }

    // テーマの適用
    applyTheme(dark) {
        const root = document.documentElement;
        
        if (dark) {
            document.body.classList.add('dark-mode');
            root.style.setProperty('color-scheme', 'dark');
            
            // ダークモード時のメタテーマカラーを設定
            this.updateThemeColor('#303134');
            
            // ダークモード専用のCSS変数を設定
            this.setDarkModeVariables();
        } else {
            document.body.classList.remove('dark-mode');
            root.style.setProperty('color-scheme', 'light');
            
            // ライトモード時のメタテーマカラーを設定
            this.updateThemeColor('#1a73e8');
            
            // ライトモード専用のCSS変数を設定
            this.setLightModeVariables();
        }
        
        isDarkMode = dark;
        localStorage.setItem('darkMode', dark.toString());
        
        // カスタムイベントを発火して他のコンポーネントに通知
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { isDarkMode: dark }
        }));
    }

    // ダークモード専用のCSS変数設定
    setDarkModeVariables() {
        const root = document.documentElement;
        
        // カスタムプロパティを直接設定
        root.style.setProperty('--background-body', '#202124');
        root.style.setProperty('--background-section', '#303134');
        root.style.setProperty('--text-primary', '#e8eaed');
        root.style.setProperty('--text-secondary', '#bdc1c6');
        root.style.setProperty('--border-main', '#5f6368');
    }

    // ライトモード専用のCSS変数設定
    setLightModeVariables() {
        const root = document.documentElement;
        
        root.style.setProperty('--background-body', '#f9f9f9');
        root.style.setProperty('--background-section', '#ffffff');
        root.style.setProperty('--text-primary', '#202124');
        root.style.setProperty('--text-secondary', '#5f6368');
        root.style.setProperty('--border-main', '#dadce0');
    }

    // メタテーマカラーの更新
    updateThemeColor(color) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = color;
    }

    // ダークモード切り替えボタンの追加
    addToggleButton() {
        const settingsPanel = document.querySelector('.settings-panel');
        if (!settingsPanel) return;

        // 切り替えボタンを作成
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        toggleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: 1rem;
        `;

        const toggleButton = document.createElement('button');
        toggleButton.id = 'theme-toggle-btn';
        toggleButton.className = 'btn btn-small theme-toggle';
        toggleButton.innerHTML = isDarkMode ? '☀️ ライト' : '🌙 ダーク';
        toggleButton.title = 'テーマを切り替え';
        
        // ボタンのスタイル
        toggleButton.style.cssText = `
            min-width: 100px;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        `;

        toggleContainer.appendChild(toggleButton);
        settingsPanel.appendChild(toggleContainer);

        // クリックイベント
        toggleButton.addEventListener('click', () => {
            this.toggle();
        });
    }

    // イベントバインディング
    bindEvents() {
        // システムのダークモード設定変更を監視
        this.mediaQuery.addEventListener('change', (e) => {
            // ユーザーが手動で設定していない場合のみシステム設定に従う
            if (userPreference === null) {
                this.applyTheme(e.matches);
            }
        });

        // テーマ変更イベントを監視
        window.addEventListener('themeChanged', (e) => {
            this.updateButtonText();
            this.updateTableStyles();
            this.updateModalStyles();
        });

        // ページロード時にボタンテキストを更新
        document.addEventListener('DOMContentLoaded', () => {
            this.updateButtonText();
        });
    }

    // ボタンテキストの更新
    updateButtonText() {
        const toggleButton = document.getElementById('theme-toggle-btn');
        if (toggleButton) {
            toggleButton.innerHTML = isDarkMode ? '☀️ ライト' : '🌙 ダーク';
            
            // ボタンの色も更新
            if (isDarkMode) {
                toggleButton.style.backgroundColor = '#8ab4f8';
                toggleButton.style.color = '#202124';
            } else {
                toggleButton.style.backgroundColor = '#1a73e8';
                toggleButton.style.color = 'white';
            }
        }
    }

    // テーブルスタイルの動的更新
    updateTableStyles() {
        const tables = document.querySelectorAll('#match-grid, #standings-table');
        tables.forEach(table => {
            if (isDarkMode) {
                table.style.backgroundColor = 'var(--surface-color)';
            } else {
                table.style.backgroundColor = '#ffffff';
            }
        });
    }

    // モーダルスタイルの動的更新
    updateModalStyles() {
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            if (isDarkMode) {
                modal.style.backgroundColor = '#303134';
                modal.style.borderColor = '#5f6368';
            } else {
                modal.style.backgroundColor = '#ffffff';
                modal.style.borderColor = '#dadce0';
            }
        });
    }

    // ダークモード切り替え
    toggle() {
        const newMode = !isDarkMode;
        this.applyTheme(newMode);
        
        // アニメーション効果
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);

        // フィードバック音（対応ブラウザのみ）
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }

        // 切り替え完了のトースト表示
        if (window.toast) {
            const message = newMode ? 'ダークモードに切り替えました' : 'ライトモードに切り替えました';
            window.toast.success(message);
        }
    }

    // 現在のテーマ状態を取得
    isDarkMode() {
        return isDarkMode;
    }

    // テーマの強制設定（プログラム用）
    setTheme(dark) {
        this.applyTheme(dark);
    }

    // テーマ設定のリセット（システム設定に戻す）
    resetToSystem() {
        localStorage.removeItem('darkMode');
        userPreference = null;
        this.applyTheme(this.mediaQuery.matches);
    }
}

// ダークモード関連のユーティリティ関数
export const darkModeUtils = {
    // 要素の色を現在のテーマに合わせて調整
    adjustElementColor: (element, lightColor, darkColor) => {
        if (isDarkMode) {
            element.style.color = darkColor;
        } else {
            element.style.color = lightColor;
        }
    },

    // 背景色を現在のテーマに合わせて調整
    adjustElementBackground: (element, lightBg, darkBg) => {
        if (isDarkMode) {
            element.style.backgroundColor = darkBg;
        } else {
            element.style.backgroundColor = lightBg;
        }
    },

    // CSS変数の値を取得
    getCSSVariable: (variableName) => {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(variableName);
    },

    // 現在のテーマに適した色を返す
    getThemeColor: (lightColor, darkColor) => {
        return isDarkMode ? darkColor : lightColor;
    }
};

// テーマの適応的調整（時間や環境に基づく自動調整）
export class AdaptiveThemeManager {
    constructor(darkModeManager) {
        this.darkModeManager = darkModeManager;
        this.initializeAdaptiveFeatures();
    }

    initializeAdaptiveFeatures() {
        this.checkTimeBasedTheme();
        this.checkAmbientLight();
        this.setupPeriodicCheck();
    }

    // 時間に基づくテーマ切り替え
    checkTimeBasedTheme() {
        const hour = new Date().getHours();
        const isNightTime = hour < 7 || hour > 19; // 夜7時から朝7時

        // 夜間の場合はダークモードを推奨
        if (isNightTime && userPreference === null) {
            this.darkModeManager.setTheme(true);
        }
    }

    // 環境光センサー（対応デバイスのみ）
    checkAmbientLight() {
        if ('AmbientLightSensor' in window) {
            try {
                const sensor = new AmbientLightSensor();
                sensor.addEventListener('reading', () => {
                    // 低照度の場合はダークモードを推奨
                    if (sensor.illuminance < 50 && userPreference === null) {
                        this.darkModeManager.setTheme(true);
                    }
                });
                sensor.start();
            } catch (error) {
                console.log('環境光センサーは利用できません');
            }
        }
    }

    // 定期的なチェック（1時間ごと）
    setupPeriodicCheck() {
        setInterval(() => {
            this.checkTimeBasedTheme();
        }, 60 * 60 * 1000); // 1時間
    }
}
