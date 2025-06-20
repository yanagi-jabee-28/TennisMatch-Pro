# AIプロンプト用 - 設定ファイルサンプル（TypeScript版）

## TypeScript + Vanilla JavaScript での開発指示

このプロジェクトは **TypeScript** を使用して開発してください。型安全性とコードの保守性を重視した実装を行ってください。

## config.json のサンプル構成

```json
{
  "teams": [
    {
      "id": 1,
      "members": [
        "宮田 夢",
        "伊藤 颯真",
        "倉科 純太郎"
      ]
    },
    {
      "id": 2,
      "members": [
        "ルダン",
        "平林 智花"
      ]
    },
    {
      "id": 3,
      "members": [
        "笠井 陸",
        "丸山 美音"
      ]
    },
    {
      "id": 4,
      "members": [
        "関 ふみ菜",
        "田中 稜久"
      ]
    },
    {
      "id": 5,
      "members": [
        "島津 日向太",
        "栁原 魁人"
      ]
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

## プロジェクト作成時の重要な追加指示

### 1. TypeScript開発環境構築
1. **TypeScript設定** → tsconfig.json の設定
2. **型定義ファイル** → interfaces と types の定義
3. **ビルドシステム** → TypeScript → JavaScript コンパイル
4. **開発サーバー** → Live Server または Vite
5. **基本UI構造** → チーム表示、対戦表、順位表
6. **状態管理** → LocalStorage連携、データ構造
7. **チーム管理** → メンバー選択、割り当て機能
8. **試合管理** → スコア入力、勝敗判定
9. **順位計算** → 高精度な順位決定ロジック
10. **データ出力** → CSV エクスポート機能
11. **デバッグ機能** → テスト用機能

### 2. TypeScript 型定義

#### 基本型定義
```typescript
// types/index.ts
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
  teams: Team[];
  absentTeam: Team;
  originalTeams: Team[];
  matches: Record<string, Match>;
  settings: AppSettings;
  teamParticipation: Record<number, boolean>;
  selectedMembers: Set<string>;
  formations: FormationData;
}

export interface AppSettings {
  matchPoint: number;
}

export interface TournamentInfo {
  name: string;
  date: string;
  location: string;
  format: string;
}

export interface Config {
  teams: Team[];
  matchSettings: MatchSettings;
  tournamentInfo: TournamentInfo;
}

export interface MatchSettings {
  scoringSystem: string;
  winCondition: string;
  maxSetsPerMatch: number;
  pointsPerSet: number;
  matchPoint: number;
}

export interface TeamStatistics {
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
  points: number;
  pointsAgainst: number;
  pointDifference: number;
  winRate: number;
  rank: number;
}

export interface FormationData {
  current: string;
  saved: Record<string, Team[]>;
}

export interface CSVExportData {
  tournamentInfo: TournamentInfo;
  systemSettings: SystemSettings;
  statistics: TournamentStatistics;
  teams: Team[];
  matches: Match[];
  teamStats: TeamStatistics[];
}

export interface SystemSettings {
  matchPoint: number;
  appVersion: string;
  exportDate: string;
}

export interface TournamentStatistics {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  winLossMatches: number;
  drawMatches: number;
  progressRate: number;
  totalPoints: number;
  averagePointsPerMatch: number;
}
```

### 3. 特に重要な技術ポイント

#### TypeScript設定ファイル
```json
// tsconfig.json
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
      "@/components/*": ["src/components/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

#### 順位計算ロジック（最重要）
```typescript
// 直接対戦結果を考慮した順位決定
function calculateDetailedStandings(
  teams: Team[], 
  matches: Record<string, Match>
): TeamStatistics[] {
  // 1. 基本統計計算
  // 2. 勝率計算（引き分け = 0.5勝）
  // 3. 得失点差計算
  // 4. 同率チーム間の直接対戦結果比較
  // 5. 最終順位決定
}
```

#### チーム参加制御
```typescript
// 参加チームフィルタリング
const activeTeams: Team[] = teams.filter(team => teamParticipation[team.id]);
// 対戦表・順位表は参加チームのみで生成
```

#### イベント管理
```typescript
// 効率的なイベントリスナー管理
class EventListenerManager {
  private static listeners = new Map<Element, Map<string, EventListener>>();
  
  static updateEventListener(
    element: Element, 
    event: string, 
    handler: EventListener
  ): void {
    // 既存リスナー削除 → 新規リスナー追加
  }
}
```

#### 状態管理クラス
```typescript
// アプリケーション状態管理
class AppStateManager {
  private state: AppState;
  
  constructor(initialState: AppState) {
    this.state = initialState;
  }
  
  getState(): AppState {
    return { ...this.state };
  }
  
  updateTeams(teams: Team[]): void {
    this.state.teams = teams;
    this.saveToStorage();
  }
  
  updateMatches(matches: Record<string, Match>): void {
    this.state.matches = matches;
    this.saveToStorage();
  }
  
  private saveToStorage(): void {
    localStorage.setItem('tennisMatchData', JSON.stringify(this.state));
  }
}
```

### 4. プロジェクト構造（TypeScript版）

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
│   │   └── storage.ts      # LocalStorage管理
│   ├── components/         # UIコンポーネント
│   │   ├── ScoreModal.ts   # スコア入力
│   │   ├── TeamEditor.ts   # チーム編集
│   │   ├── Toast.ts        # 通知システム
│   │   └── ConfirmDialog.ts# 確認ダイアログ
│   ├── utils/              # ユーティリティ
│   │   ├── dom.ts          # DOM操作
│   │   ├── validation.ts   # 入力検証
│   │   └── helpers.ts      # ヘルパー関数
│   └── debug/              # デバッグ機能
│       ├── randomData.ts   # テストデータ生成
│       └── devTools.ts     # 開発ツール
├── dist/                   # ビルド出力
├── css/                    # スタイルシート
│   ├── styles.css          # メインCSS
│   ├── base.css            # 基本スタイル
│   ├── layout.css          # レイアウト
│   ├── responsive.css      # レスポンシブ
│   └── components/         # コンポーネント別CSS
└── public/                 # 静的ファイル
    └── favicon.ico
```

### 5. ビルド設定（Vite推奨）

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/utils': resolve(__dirname, 'src/utils')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

```json
// package.json
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

### 6. UI/UX の具体的な要件

#### メンバー選択システム
- クリックで選択状態切り替え
- 選択されたメンバーは背景色変更
- 選択パレットに一覧表示
- チームヘッダークリックで割り当て

#### 参加制御トグル
- チームヘッダーに ✓/✗ ボタン
- 非参加チームは半透明表示
- 最小2チーム参加必要（警告表示）

#### レスポンシブデザイン
- モバイル: タッチ操作最適化
- タブレット: 中間サイズ対応
- デスクトップ: 大画面効率活用

### 4. データ形式の詳細

#### CSVエクスポート構成
1. **大会情報** - 名称、日付、場所、形式
2. **システム設定** - マッチポイント、バージョン、出力日時
3. **統計サマリー** - チーム数、試合数、進行率、平均得点
4. **チーム構成** - 各チームのメンバー一覧
5. **全試合結果** - 対戦組み合わせと結果詳細
6. **チーム別統計** - 勝敗、得失点、順位
7. **順位表** - 最終順位と詳細統計
8. **進行状況** - 未実施試合一覧

#### LocalStorage保存項目
- `tennisMatchData`: 全アプリケーション状態
- `teamParticipation`: チーム参加状態
- `appSettings`: マッチポイント等の設定

### 5. エラーハンドリング要件

#### 入力検証
- スコア: 0 ≤ score ≤ matchPoint
- チーム割り当て: 重複防止
- 参加チーム: 最小2チーム

#### 例外処理
- LocalStorage アクセス失敗
- JSON パース エラー
- DOM要素 未発見

### 7. TypeScript開発のベストプラクティス

#### 型安全性の確保
```typescript
// 厳密な型チェック
interface StrictConfig {
  strict: true;
  noImplicitAny: true;
  strictNullChecks: true;
  strictFunctionTypes: true;
}

// ユーザー定義型ガード
function isValidTeam(obj: unknown): obj is Team {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'members' in obj &&
         typeof (obj as Team).id === 'number' &&
         Array.isArray((obj as Team).members);
}

// エラーハンドリング
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function saveTeamData(team: Team): Result<void> {
  try {
    localStorage.setItem(`team_${team.id}`, JSON.stringify(team));
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

#### 型定義の分離
```typescript
// src/types/events.ts
export interface TeamClickEvent extends CustomEvent {
  detail: {
    teamId: number;
    action: 'assign' | 'edit' | 'toggle';
  };
}

export interface ScoreInputEvent extends CustomEvent {
  detail: {
    matchId: string;
    team1Score: number;
    team2Score: number;
  };
}

// src/types/components.ts
export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSave: (data: unknown) => void;
}

export interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
}
```

### 8. パフォーマンス要件（TypeScript）

#### 最適化ポイント
```typescript
// 型安全なDOM操作
class DOMHelper {
  static querySelector<T extends Element>(
    selector: string, 
    parent: Document | Element = document
  ): T | null {
    return parent.querySelector<T>(selector);
  }
  
  static querySelectorAll<T extends Element>(
    selector: string, 
    parent: Document | Element = document
  ): NodeListOf<T> {
    return parent.querySelectorAll<T>(selector);
  }
}

// メモ化による最適化
class MemoizedCalculations {
  private cache = new Map<string, TeamStatistics[]>();
  
  calculateStandings(
    teams: Team[], 
    matches: Record<string, Match>
  ): TeamStatistics[] {
    const key = this.generateCacheKey(teams, matches);
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const result = this.performCalculation(teams, matches);
    this.cache.set(key, result);
    return result;
  }
  
  private generateCacheKey(teams: Team[], matches: Record<string, Match>): string {
    return JSON.stringify({ teams, matches });
  }
  
  private performCalculation(teams: Team[], matches: Record<string, Match>): TeamStatistics[] {
    // 実際の計算ロジック
    return [];
  }
}
```

### 9. エラーハンドリング（TypeScript）

#### 型安全なエラー処理
```typescript
// カスタムエラー型
export class ValidationError extends Error {
  constructor(
    message: string, 
    public field: string, 
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public operation: 'read' | 'write') {
    super(message);
    this.name = 'StorageError';
  }
}

// エラーハンドリングサービス
class ErrorHandler {
  static handle(error: Error): void {
    if (error instanceof ValidationError) {
      this.showValidationError(error);
    } else if (error instanceof StorageError) {
      this.showStorageError(error);
    } else {
      this.showGenericError(error);
    }
  }
  
  private static showValidationError(error: ValidationError): void {
    // バリデーションエラーの表示
  }
  
  private static showStorageError(error: StorageError): void {
    // ストレージエラーの表示
  }
  
  private static showGenericError(error: Error): void {
    // 一般的なエラーの表示
  }
}
```

## AIへの追加指示（TypeScript版）

この仕様書の内容を **TypeScript** で忠実に実装し、特に以下の点に注意してください：

### 必須要件
1. **型安全性**: 全ての関数、変数、オブジェクトに適切な型注釈
2. **厳密設定**: tsconfig.jsonでstrict: trueを有効化
3. **型ガード**: 実行時の型チェック機能を実装
4. **エラーハンドリング**: 型安全なエラー処理システム
5. **インターフェース定義**: 全てのデータ構造を型定義

### 開発品質
1. **順位計算の正確性**: 直接対戦結果を含む複雑な順位決定ロジック
2. **UIの直感性**: クリック中心の分かりやすい操作
3. **データの整合性**: LocalStorageとUIの同期
4. **レスポンシブ対応**: 全デバイスでの快適な操作
5. **拡張性**: 将来的な機能追加への対応

### TypeScript特有の考慮事項
1. **コンパイル時チェック**: 実行前のエラー検出
2. **IDEサポート**: 自動補完・リファクタリング支援
3. **ドキュメント**: JSDocコメントと型情報の併用
4. **パフォーマンス**: 型チェックによるオーバーヘッド最小化
5. **保守性**: 型による自己記述的なコード

完成したアプリケーションは、TypeScriptの利点を最大限活用し、硬式テニス部やテニスサークルで実際に使用できる高品質なものを目指してください。
