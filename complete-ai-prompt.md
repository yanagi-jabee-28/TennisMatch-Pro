# プロジェクト再構築用 - 完全AIプロンプト（TypeScript版）

## 🎯 プロジェクト目標

硬式テニスのチーム戦管理を行う高機能Webアプリケーションを、**TypeScript + Vanilla JavaScript** で一から構築してください。現在のプロジェクトの全機能を包含し、さらに使いやすく改良したアプリケーションを作成してください。

---

## 📋 完全機能仕様書

### 🏆 1. チーム管理システム

#### 基本構成
- **通常チーム**: 5チーム（ID: 1-5）
- **欠席チーム**: 1チーム（ID: 6）独立管理
- **初期メンバー**: config.jsonから読み込み

#### メンバー選択・割り当てシステム
```javascript
// メンバー選択の流れ
// 1. メンバーをクリック → 選択状態（背景色変更）
// 2. 複数選択可能
// 3. チームヘッダークリック → 選択メンバー全て割り当て
// 4. 選択状態リセット
```

#### チーム参加制御
- **トグルボタン**: 各チームヘッダーに ✓（参加）/✗（不参加）
- **視覚的表示**: 不参加チームは半透明 + 破線ボーダー
- **最小参加数**: 2チーム以上必要（不足時は警告表示）
- **自動除外**: 不参加チームは対戦表・順位表から除外
- **状態永続化**: LocalStorageに自動保存・復元

#### チーム操作機能
- **編集モーダル**: 個別チームのメンバー詳細編集
- **全リセット**: 「オリジナル構成に戻す」ボタン
- **全クリア**: 「全メンバーを未割り当てにする」ボタン
- **確認ダイアログなし**: スムーズな操作を重視

### ⚡ 2. 試合管理システム

#### 対戦表生成
- **動的生成**: 参加チームのみで総当たり戦を自動生成
- **クリック入力**: 対戦マスクリック → スコア入力モーダル
- **リアルタイム更新**: スコア入力後即座に表示更新

#### スコア管理
```javascript
// スコア入力仕様
const scoreInput = {
  minScore: 0,
  maxScore: matchPoint, // 設定可能（1-99）
  defaultMatchPoint: 7,
  autoLimit: true, // マッチポイント超過防止
  judgment: 'automatic' // 自動勝敗判定
};
```

#### 勝敗判定と表示
- **勝利判定**: scoreA > scoreB
- **引き分け判定**: scoreA === scoreB
- **色分け表示**: 
  - 勝利: 緑 (#4CAF50)
  - 敗北: 赤 (#F44336)
  - 引き分け: グレー (#9E9E9E)
- **対称表示**: 対戦表の上下で同一試合結果が対称

### 📊 3. 高精度順位計算システム

#### 順位決定基準（優先順位）
```javascript
const rankingCriteria = [
  {
    priority: 1,
    name: '勝率',
    calculation: '勝利数 + (引き分け数 × 0.5) / 総試合数 × 100',
    sortOrder: 'desc'
  },
  {
    priority: 2,
    name: '得失点差',
    calculation: '総得点 - 総失点',
    sortOrder: 'desc'
  },
  {
    priority: 3,
    name: '直接対戦結果',
    calculation: '同率チーム間の勝敗比較',
    note: '引き分けは0.5勝として計算'
  },
  {
    priority: 4,
    name: '勝利数',
    calculation: '勝った試合の数',
    sortOrder: 'desc'
  },
  {
    priority: 5,
    name: '得点合計',
    calculation: '全試合での総得点',
    sortOrder: 'desc'
  }
];
```

#### 統計項目
- 勝利数、敗北数、引き分け数
- 総得点、総失点、得失点差
- 勝率（%表示）
- 総試合数

### 💾 4. データ管理・永続化

#### LocalStorage管理
```javascript
const storageKeys = {
  main: 'tennisMatchData',
  participation: 'teamParticipation',
  settings: 'appSettings',
  formations: 'savedFormations'
};
```

#### CSVエクスポート機能
**8セクション構成の詳細分析レポート**:

1. **大会情報**
   - 大会名、開催日、開催場所、形式
   - config.jsonから自動取得

2. **システム設定情報**
   - マッチポイント、アプリバージョン
   - エクスポート日時、システム情報

3. **大会統計サマリー**
   - 総チーム数、総試合数、完了試合数
   - 勝敗決着数、引き分け数、進行率(%)
   - 総得点数、1試合平均得点

4. **チーム構成メンバー一覧**
   - チームID、チーム名、メンバー名

5. **全試合結果一覧**
   - 対戦ID、チーム情報、スコア、勝者
   - 試合結果、試合状況

6. **チーム別統計（チームID順）**
   - 順位、勝敗記録、得失点、勝率

7. **順位表（最終順位順）**
   - 詳細統計と順位決定根拠

8. **進行状況・未実施試合**
   - 残り試合の詳細情報

**エクスポート仕様**:
- **ファイル名**: `テニス対戦結果_詳細分析_YYYY-MM-DD HH_MM.csv`
- **エンコーディング**: UTF-8 BOM付き
- **区切り文字**: カンマ
- **改行コード**: CRLF
- **セクション区切り**: `#` で始まるコメント行

### 🎨 5. ユーザーインターフェース

#### レスポンシブデザイン
```css
/* ブレークポイント */
@media (max-width: 768px) { /* モバイル */ }
@media (min-width: 769px) and (max-width: 1024px) { /* タブレット */ }
@media (min-width: 1025px) { /* デスクトップ */ }
```

#### インタラクション設計
- **メンバー選択**: クリックで背景色変更
- **選択パレット**: 選択メンバーの一覧表示
- **ホバー効果**: マウスオーバー時の視覚フィードバック
- **モーダル**: オーバーレイによる集中操作
- **トースト通知**: 重要操作時の一時的な通知

#### 操作フィードバック
- **状態表示**: チームヘッダーの割り当て可能状態
- **プログレス**: データ処理中の進行状況
- **エラー表示**: 分かりやすいエラーメッセージ

### 🛠️ 6. 設定・デバッグ機能

#### 設定機能
- **マッチポイント**: ヘッダーパネルで1-99点設定
- **即座反映**: 設定変更の即時適用
- **設定永続化**: LocalStorageに自動保存

#### デバッグ機能
```javascript
const debugFeatures = {
  randomScoreGeneration: {
    description: 'テスト用ランダムスコア生成',
    button: '🎲 ランダムスコア',
    function: 'generateRandomScores()'
  },
  clearAllData: {
    description: '全試合結果をクリア',
    button: '🗑️ データクリア',
    function: 'clearAllMatches()'
  },
  directMatchTest: {
    description: '直接対戦テスト用データ',
    function: 'generateDirectMatchTestData()'
  }
};
```

---

## 🏗️ 技術アーキテクチャ

### 使用技術スタック
- **フロントエンド**: HTML5, CSS3, TypeScript, Vanilla JavaScript
- **モジュールシステム**: ES6 Modules
- **データ永続化**: LocalStorage API
- **レイアウト**: CSS Grid, Flexbox
- **ビルドツール**: Vite (推奨) または TypeScript Compiler
- **型チェック**: TypeScript Compiler (strict mode)
- **互換性**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+

### プロジェクト構造
```
tennis-match-pro-ts/
├── index.html              # メインHTML
├── package.json            # npm設定
├── tsconfig.json           # TypeScript設定
├── vite.config.ts          # Vite設定（推奨）
├── config.json             # 設定・チーム情報
├── README.md               # ドキュメント
├── src/                    # TypeScriptソース
│   ├── main.ts             # エントリーポイント
│   ├── types/              # 型定義
│   │   ├── index.ts        # 基本型定義
│   │   ├── api.ts          # API型定義
│   │   └── ui.ts           # UI型定義
│   ├── core/               # コアロジック
│   │   ├── state.ts        # 状態管理
│   │   ├── matches.ts      # 試合管理
│   │   ├── standings.ts    # 順位計算
│   │   ├── export.ts       # データエクスポート
│   │   ├── config.ts       # 設定読み込み
│   │   ├── formations.ts   # 編成管理
│   │   └── storage.ts      # LocalStorage管理
│   ├── components/         # UIコンポーネント
│   │   ├── ScoreModal.ts   # スコア入力
│   │   ├── TeamEditor.ts   # チーム編集
│   │   ├── ConfirmDialog.ts# 確認ダイアログ
│   │   ├── Toast.ts        # 通知システム
│   │   └── FormationSelector.ts # 編成選択UI
│   ├── utils/              # ユーティリティ
│   │   ├── dom.ts          # DOM操作
│   │   ├── validation.ts   # 入力検証
│   │   └── helpers.ts      # ヘルパー関数
│   └── debug/              # デバッグ機能
│       ├── randomData.ts   # テストデータ生成
│       └── devTools.ts     # 開発ツール
├── dist/                   # ビルド出力
├── css/                    # スタイルシート
│   ├── styles.css          # メインCSS（統合）
│   ├── base.css            # 基本スタイル
│   ├── layout.css          # レイアウト
│   ├── responsive.css      # レスポンシブ
│   └── components/         # コンポーネント別CSS
│       ├── buttons.css     # ボタン
│       ├── tables.css      # テーブル
│       ├── modals.css      # モーダル
│       ├── forms.css       # フォーム
│       ├── dialog.css      # ダイアログ
│       ├── teams.css       # チーム表示
│       └── toast.css       # 通知
└── types/                  # 型定義（参考）
```

### アーキテクチャパターン
```javascript
// 状態管理パターン
const AppState = {
  teams: [],
  matches: {},
  settings: {},
  teamParticipation: {},
  selectedMembers: new Set(),
  // ...
};

// イベント管理クラス
class EventListenerManager {
  static listeners = new Map();
  
  static updateEventListener(element, event, handler) {
    // 既存リスナー削除 → 新規追加
  }
}

// モジュール間通信
export { updateUI, calculateStandings, saveToStorage };
```

---

## 📊 データ構造仕様

### config.json
```json
{
  "teams": [
    {
      "id": 1,
      "members": ["宮田 夢", "伊藤 颯真", "倉科 純太郎"]
    },
    {
      "id": 2,
      "members": ["ルダン", "平林 智花"]
    },
    {
      "id": 3,
      "members": ["笠井 陸", "丸山 美音"]
    },
    {
      "id": 4,
      "members": ["関 ふみ菜", "田中 稜久"]
    },
    {
      "id": 5,
      "members": ["島津 日向太", "栁原 魁人"]
    }
  ],
  "matchSettings": {
    "scoringSystem": "points",
    "winCondition": "highestScore",
    "maxSetsPerMatch": 3,
    "pointsPerSet": 6,
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

### アプリケーション状態
```javascript
const appState = {
  teams: [
    { id: 1, members: [...] },
    { id: 2, members: [...] },
    // ...
  ],
  absentTeam: { id: 6, members: [...] },
  originalTeams: [...],
  matches: {
    "1vs2": {
      team1: 1,
      team2: 2,
      scoreTeam1: 7,
      scoreTeam2: 5,
      winner: 1,
      isDraw: false
    }
  },
  settings: {
    matchPoint: 7
  },
  teamParticipation: {
    1: true,
    2: true,
    3: false,
    4: true,
    5: true
  },
  selectedMembers: new Set(),
  formations: {
    current: "編成1",
    saved: {
      "編成1": {...},
      "編成2": {...}
    }
  }
};
```

---

## 🎮 操作フロー・ユーザー体験

### 基本操作フロー
```
1. アプリ起動 → config.json読み込み → 初期状態表示

2. チーム編成:
   メンバークリック（選択）
   → 選択パレット表示
   → チームヘッダークリック（割り当て）
   → 選択解除・UI更新

3. 参加設定:
   チームヘッダートグルクリック
   → 参加状態変更
   → 対戦表・順位表再生成

4. 試合実施:
   対戦マスクリック
   → スコア入力モーダル表示
   → スコア入力・保存
   → 自動勝敗判定・順位更新

5. データ出力:
   エクスポートボタンクリック
   → CSV生成・ダウンロード
```

### ショートカット操作
- **Ctrl+クリック**: 複数選択モード
- **選択クリア**: 選択パレットのクリアボタン
- **全リセット**: オリジナル構成復元
- **デバッグ**: ランダムデータ生成・一括クリア

---

## 🎯 実装優先順位

### Phase 1: 基本構造
1. **HTML構造**: セマンティックなマークアップ
2. **CSS基盤**: レスポンシブ・コンポーネント設計
3. **JavaScript基盤**: モジュール構造・状態管理

### Phase 2: コア機能
1. **config.json読み込み**: 初期データ取得
2. **チーム表示**: 基本UI構築
3. **LocalStorage**: データ永続化

### Phase 3: インタラクション
1. **メンバー選択**: クリック選択システム
2. **チーム割り当て**: ヘッダークリック機能
3. **参加制御**: トグルボタン実装

### Phase 4: 試合管理
1. **対戦表生成**: 動的テーブル作成
2. **スコア入力**: モーダル実装
3. **勝敗判定**: 自動判定ロジック

### Phase 5: 順位システム
1. **基本統計**: 勝敗・得失点計算
2. **順位決定**: 複合条件による順位付け
3. **直接対戦**: 同率チーム間比較

### Phase 6: 高度機能
1. **CSVエクスポート**: 詳細分析レポート
2. **デバッグ機能**: テスト・管理ツール
3. **編成管理**: 複数編成の保存・切り替え

---

## 🔧 実装時の重要ポイント

### パフォーマンス最適化
```javascript
// イベント委譲による最適化
document.addEventListener('click', (e) => {
  if (e.target.matches('.member-item')) {
    handleMemberClick(e.target);
  }
});

// DOM操作の最小化
const fragment = document.createDocumentFragment();
// 複数要素をfragmentに追加
container.appendChild(fragment); // 一度に挿入
```

### エラーハンドリング
```javascript
// 入力値検証
function validateScore(score, matchPoint) {
  if (!Number.isInteger(score) || score < 0 || score > matchPoint) {
    throw new Error(`スコアは0-${matchPoint}の範囲で入力してください`);
  }
}

// 例外処理
try {
  const data = JSON.parse(localStorage.getItem('tennisMatchData'));
} catch (error) {
  console.error('データ読み込みエラー:', error);
  showToast('データの読み込みに失敗しました', 'error');
}
```

### セキュリティ対策
```javascript
// XSS対策
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// データ検証
function validateTeamData(teams) {
  return Array.isArray(teams) && 
         teams.every(team => 
           team.id && 
           Array.isArray(team.members)
         );
}
```

---

## 📱 UI/UXガイドライン

### デザインシステム
```css
:root {
  /* カラーパレット */
  --color-primary: #1976D2;
  --color-success: #4CAF50;
  --color-danger: #F44336;
  --color-warning: #FF9800;
  --color-info: #2196F3;
  --color-light: #F5F5F5;
  --color-dark: #212121;
  
  /* タイポグラフィ */
  --font-family-base: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
  --font-size-base: 14px;
  --line-height-base: 1.6;
  
  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* ブレークポイント */
  --breakpoint-sm: 768px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1440px;
}
```

### インタラクションパターン
- **クリック**: 即座の視覚フィードバック
- **ホバー**: 0.2s のスムーズなトランジション
- **フォーカス**: 明確なアウトライン表示
- **ローディング**: プログレスバーまたはスピナー

### アクセシビリティ
- **キーボード操作**: Tab・Enterによる操作
- **スクリーンリーダー**: aria-label、role属性
- **コントラスト**: WCAG 2.1 AA準拠
- **フォントサイズ**: 最小14px、拡大対応

---

## 🚀 最終成果物の品質基準

### 機能要件
- [ ] 全ての仕様機能が正常動作
- [ ] レスポンシブデザイン完全対応
- [ ] LocalStorageデータ永続化
- [ ] CSV エクスポート機能
- [ ] デバッグ・テスト機能

### 非機能要件
- [ ] ページ読み込み時間 < 2秒
- [ ] インタラクション応答時間 < 0.3秒
- [ ] メモリリーク無し
- [ ] ブラウザ互換性確保
- [ ] エラーハンドリング完備

### コード品質（TypeScript）
- [ ] TypeScript strict mode使用
- [ ] 全ての型定義を完備
- [ ] 型ガードの適切な実装
- [ ] モジュール化・関心分離
- [ ] 適切なコメント・ドキュメント
- [ ] 一貫したコーディング規約
- [ ] パフォーマンス最適化
- [ ] エラーハンドリングの型安全性

### ユーザビリティ
- [ ] 直感的な操作フロー
- [ ] 分かりやすいエラーメッセージ
- [ ] 操作の取り消し・復元機能
- [ ] ヘルプ・ガイダンス表示
- [ ] 快適な操作体験

---

## 📝 開発完了後の確認事項

### TypeScript品質チェック
1. **型チェック**: `tsc --noEmit` でエラーなし
2. **型定義**: 全ての関数・変数に適切な型
3. **型ガード**: 実行時型チェック機能
4. **strict mode**: 厳密な型チェック設定
5. **インターフェース**: 全データ構造の型定義

### 動作テスト
1. **基本機能**: チーム編成、試合記録、順位計算
2. **エッジケース**: 最小チーム数、最大スコア、同率順位
3. **データ整合性**: LocalStorage、CSV出力、設定変更
4. **レスポンシブ**: モバイル、タブレット、デスクトップ
5. **ブラウザ互換**: Chrome、Firefox、Safari、Edge

### パフォーマンステスト
1. **初期読み込み**: config.json、LocalStorage復元
2. **大量データ**: 多数試合結果での応答性
3. **メモリ使用量**: 長時間操作でのメモリリーク
4. **CSV出力**: 大容量データの処理時間

### ユーザビリティテスト
1. **初回利用**: 説明なしでの操作可能性
2. **エラー回復**: 誤操作からの復旧容易性
3. **操作効率**: 頻繁なタスクの実行速度
4. **視認性**: 各状態の分かりやすさ

---

この仕様書に基づいて、**TypeScript**を使用したプロダクション品質の硬式テニス試合管理アプリケーションを作成してください。特に以下の点を重視してください：

### TypeScript開発の重点項目
1. **型安全性**: 全ての関数・変数・オブジェクトに適切な型注釈
2. **strict mode**: tsconfig.jsonでstrict: trueを有効化
3. **型ガード**: 実行時の型チェック機能を実装
4. **インターフェース**: 全てのデータ構造を型定義
5. **エラーハンドリング**: 型安全なエラー処理システム

### 品質目標
- **直感的な操作性**: クリック中心の分かりやすいUI
- **データの正確性**: 型チェックによる信頼性向上
- **保守性**: TypeScriptによる自己記述的なコード
- **パフォーマンス**: 型最適化とコンパイル時エラー検出
- **実用性**: 実際のテニス大会で使用できる品質

TypeScriptの利点を最大限活用し、堅牢で使いやすいアプリケーションとして完成させてください。
