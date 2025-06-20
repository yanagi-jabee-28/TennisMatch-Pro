# 硬式テニス試合管理アプリ - プロジェクト再構築プロンプト（TypeScript版）

## 🎯 プロジェクト概要

硬式テニスのチーム戦における試合スケジュール管理・結果記録を行う高機能WebアプリケーションをTypeScript + Vanilla JavaScript で作成してください。

## 📋 必須機能一覧

### 🏆 1. チーム管理システム
- **基本構成**: 5チーム（1-5）+ 欠席チーム（6）
- **メンバー選択**: クリック式の直感的なメンバー選択システム
- **チーム編成**: チームヘッダークリックによる割り当て機能
- **参加制御**: 個別チームの参加ON/OFF切り替え（✓/✗トグルボタン）
- **視覚的識別**: 不参加チームは半透明表示と破線ボーダー
- **未割り当てメンバー**: 専用エリアでの表示・管理
- **リアルタイム更新**: 即座にUIに反映される変更

### ⚡ 2. 試合管理システム
- **総当たり戦**: 参加チーム間での全組み合わせ自動生成
- **スコア入力**: 対戦表マスクリックによるモーダル入力
- **マッチポイント**: 1-99点の範囲で設定可能（デフォルト7点）
- **自動勝敗判定**: スコア差による勝利・敗北・引き分け判定
- **色分け表示**: 勝利（緑）、敗北（赤）、引き分け（グレー）
- **結果修正**: 既存結果の再編集機能

### 📊 3. 高精度順位計算システム
順位決定基準（優先順位）:
1. **勝率** - 引き分けを0.5勝として計算
2. **得失点差** - 得点から失点を引いた値
3. **直接対戦結果** - 同率チーム間の勝敗
4. **勝利数** - 勝った試合の数
5. **得点合計** - 総得点数

### 💾 4. データ管理機能
- **LocalStorage**: 自動保存・復元
- **詳細CSVエクスポート**: 8セクション構成の包括的レポート
  - 大会情報・システム設定・統計サマリー
  - チーム構成・全試合結果・チーム別統計
  - UTF-8 BOM付き、Excel対応フォーマット
- **ファイル名**: `テニス対戦結果_詳細分析_YYYY-MM-DD HH_MM.csv`

### 🎨 5. ユーザーインターフェース
- **レスポンシブデザイン**: PC・タブレット・スマホ完全対応
- **メンバー選択パレット**: 選択されたメンバーの一覧表示
- **トースト通知**: 重要操作時の一時通知
- **ホバー効果**: 視覚的フィードバック
- **モーダルダイアログ**: スコア入力・チーム編集用

### 🛠️ 6. デバッグ・設定機能
- **ランダムスコア生成**: テスト用データ自動生成
- **全データクリア**: 試合結果の一括削除
- **設定パネル**: ヘッダーでのマッチポイント設定
- **編成管理**: 複数編成の保存・切り替え機能

## 🏗️ 技術仕様

### 使用技術
- **フロントエンド**: HTML5, CSS3, TypeScript, Vanilla JavaScript
- **モジュール**: ES6 Modules
- **データ永続化**: LocalStorage API
- **レスポンシブ**: CSS Grid, Flexbox
- **ビルドツール**: Vite (推奨) または TypeScript Compiler
- **型チェック**: TypeScript Compiler (strict mode)
- **互換性**: モダンブラウザ対応（IE非対応）

### アーキテクチャ
- **モジュール分離**: 機能別のTSファイル構成
- **型安全性**: TypeScriptによる静的型チェック
- **状態管理**: 中央集権的な状態管理パターン（型安全）
- **イベント管理**: EventListenerManagerクラス（型定義付き）
- **コンポーネント化**: 再利用可能なUIコンポーネント（型安全）

## 📁 プロジェクト構造

```
tennis-match-app/
├── index.html              # メインHTMLファイル
├── package.json            # npm設定ファイル
├── tsconfig.json           # TypeScript設定
├── vite.config.ts          # Vite設定（推奨）
├── config.json             # チーム設定・大会情報
├── README.md               # プロジェクト説明書
├── src/                    # TypeScriptソースコード
│   ├── main.ts             # メインエントリーポイント
│   ├── types/              # 型定義ファイル
│   │   ├── index.ts        # 基本型定義
│   │   ├── api.ts          # API型定義
│   │   └── ui.ts           # UI型定義
│   ├── core/               # コアロジック
│   │   ├── state.ts        # アプリケーション状態管理
│   │   ├── matches.ts      # 試合管理機能
│   │   ├── standings.ts    # 順位表計算
│   │   ├── export.ts       # データエクスポート
│   │   ├── config.ts       # 設定読み込み
│   │   ├── formations.ts   # 編成管理
│   │   └── storage.ts      # LocalStorage管理
│   ├── components/         # UIコンポーネント
│   │   ├── ScoreModal.ts   # スコア入力モーダル
│   │   ├── TeamEditor.ts   # チーム編集機能
│   │   ├── ConfirmDialog.ts# 確認ダイアログ
│   │   ├── Toast.ts        # 通知システム
│   │   └── FormationSelector.ts # 編成選択UI
│   ├── utils/              # ユーティリティ
│   │   ├── dom.ts          # DOM要素操作
│   │   ├── validation.ts   # 入力検証
│   │   └── helpers.ts      # ヘルパー関数
│   └── debug/              # デバッグ機能
│       ├── randomData.ts   # テストデータ生成
│       └── devTools.ts     # 開発ツール
├── dist/                   # ビルド出力ディレクトリ
├── css/                    # スタイルシート
│   ├── styles.css          # メインスタイル（統合）
│   ├── base.css            # 基本スタイル
│   ├── layout.css          # レイアウト
│   ├── responsive.css      # レスポンシブデザイン
│   └── components/         # コンポーネント別スタイル
│       ├── buttons.css     # ボタンスタイル
│       ├── tables.css      # テーブルスタイル
│       ├── modals.css      # モーダルスタイル
│       ├── forms.css       # フォームスタイル
│       ├── dialog.css      # ダイアログスタイル
│       ├── teams.css       # チーム表示スタイル
│       └── toast.css       # 通知スタイル
└── public/                 # 静的ファイル
    └── favicon.ico
```

## 📝 TypeScript設定

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/components/*": ["src/components/*"],
      "@/core/*": ["src/core/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json
```json
{
  "name": "tennis-match-pro",
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.0.0",
    "@types/node": "^18.0.0"
  }
}
```

## 🎮 操作仕様

### 基本ワークフロー
1. **チーム編成**: メンバークリック選択 → チームヘッダークリック割り当て
2. **参加設定**: チームヘッダーのトグルボタンで参加ON/OFF切り替え
3. **試合実施**: 対戦表マスクリック → スコア入力 → 自動順位更新
4. **データ出力**: 詳細分析CSVダウンロード

### ショートカット機能
- **全選択解除**: 選択パレットの「選択をクリア」ボタン
- **全チームリセット**: 「オリジナル構成に戻す」ボタン
- **全未割り当て**: 「全メンバーを未割り当てにする」ボタン

## 📊 データ構造仕様

### アプリケーション状態（TypeScript）
```typescript
// src/types/index.ts
export interface Team {
  id: number;
  members: string[];
}

export interface Match {
  team1: number;
  team2: number;
  scoreTeam1: number;
  scoreTeam2: number;
  winner: number | null;
  isDraw: boolean;
}

export interface AppState {
  teams: Team[];                    // 通常チーム(1-5)
  absentTeam: Team;                 // 欠席チーム(6)
  originalTeams: Team[];            // 初期チーム構成
  matches: Record<string, Match>;   // 試合結果
  settings: AppSettings;            // アプリ設定
  teamParticipation: Record<number, boolean>; // チーム参加状態
  selectedMembers: Set<string>;     // 選択中メンバー
  formations: FormationData;        // 編成データ
}

export interface AppSettings {
  matchPoint: number;
}

export interface FormationData {
  current: string;
  saved: Record<string, Team[]>;
}
  ],
  absentTeam: {              // 欠席チーム(6)
    id: 6,
    members: [...]
  },
  originalTeams: [...],      // 初期チーム構成
  matches: {                 // 試合結果
    "1vs2": {
      team1: 1, team2: 2,
      scoreTeam1: 7, scoreTeam2: 5,
      winner: 1
    },
    // ...
  },
  settings: {                // アプリ設定
    matchPoint: 7
  },
  teamParticipation: {       // チーム参加状態
    1: true, 2: true, 3: false, // ...
  }
}
```

### Config.json構造
```json
{
  "teams": [
    {
      "id": 1,
      "members": ["メンバー1", "メンバー2", "メンバー3"]
    }
  ],
  "matchSettings": {
    "scoringSystem": "points",
    "winCondition": "highestScore",
    "matchPoint": 7
  },
  "tournamentInfo": {
    "name": "硬式テニス ダブルスチーム分け結果",
    "date": "2025年6月20日",
    "location": "テニスコート",
    "format": "総当たり戦"
  }
}
```

## 🎯 UI/UX要件

### デザイン原則
- **直感的操作**: クリック中心のシンプルな操作
- **視覚的フィードバック**: 選択状態、参加状態の明確な表示
- **レスポンシブ**: 全デバイスでの快適な操作
- **アクセシビリティ**: 明確なラベル、適切なコントラスト

### 色彩設計
- **勝利**: 緑系（#4CAF50）
- **敗北**: 赤系（#F44336）
- **引き分け**: グレー系（#9E9E9E）
- **選択状態**: 青系（#2196F3）
- **非参加**: 半透明、破線ボーダー

### インタラクション
- **ホバー効果**: ボタン、クリック可能要素
- **アニメーション**: 滑らかな状態変更
- **モーダル**: オーバーレイによる集中的操作
- **トースト**: 非侵入的な通知

## 🔧 実装上の重要ポイント

### パフォーマンス
- **イベント委譲**: 効率的なイベントリスナー管理
- **DOM操作最適化**: 不要な再描画の回避
- **メモリ管理**: 適切なイベントリスナー削除

### エラーハンドリング
- **入力値検証**: スコア範囲、必須項目チェック
- **例外処理**: try-catch による安全な処理
- **ユーザー通知**: エラー内容の分かりやすい表示

### セキュリティ
- **XSS対策**: innerHTML使用時のサニタイズ
- **データ検証**: LocalStorageデータの整合性チェック

## 📱 対応ブラウザ

### 必須対応
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

### 非対応
- Internet Explorer（全バージョン）

## 🚀 開発・デプロイ

### 開発環境
- **ローカルサーバー**: HTTP サーバーによる開発
- **ライブリロード**: 変更時の自動更新
- **デバッグツール**: ブラウザ開発者ツール活用

### デプロイメント
- **静的ホスティング**: GitHub Pages対応
- **CDN対応**: 高速配信可能
- **プログレッシブ**: オフライン機能拡張可能

## 📝 追加考慮事項

### 今後の拡張性
- チーム数の可変対応
- トーナメント形式への対応
- 印刷用レイアウト
- データインポート機能
- PWA化（プログレッシブウェブアプリ）

### ユーザビリティ
- **確認ダイアログ最小化**: スムーズな操作重視
- **元に戻す機能**: 誤操作からの復旧
- **状態の視覚化**: 現在の状況が一目で分かる設計

この仕様書を基に、モダンで使いやすい硬式テニス試合管理アプリケーションを作成してください。特に、直感的な操作性とデータの正確性を重視した実装をお願いします。
