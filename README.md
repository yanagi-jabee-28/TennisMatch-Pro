# 硬式テニス 試合管理アプリ

このアプリは、硬式テニスのチーム戦における試合スケジュール管理・結果記録を行うWebアプリです。

## 主な機能
- **対戦管理**: チームごとの対戦スケジュール表示と結果記録
- **チーム管理**: チームメンバーの表示・編集・動的な組み合わせ
- **スコア記録**: 直感的なクリック操作による試合スコア入力
- **順位表**: 勝率・得失点差による自動順位計算と表示
- **データエクスポート**: 詳細分析データのCSV形式エクスポート（順位付き）
- **デバッグ機能**: ランダムスコア生成と一括データクリア
- **レスポンシブデザイン**: PC・タブレット・スマホ完全対応
- **データ永続化**: ローカルストレージによる自動保存

## 使い方

### 基本操作
1. **初期設定**: `config.json` でチーム構成とメンバーを編集
2. **サーバー起動**: ローカルサーバーを起動して `index.html` をブラウザで開く
3. **マッチポイント設定**: 画面上部の設定パネルでマッチポイント（通常7点）を設定
4. **試合記録**: 対戦表のマスをクリックして各試合のスコアを入力
5. **順位確認**: 試合結果から自動計算される順位表を確認

### 高度な機能
- **チーム編集**: チーム名横の編集ボタンでメンバー構成を変更可能
- **データエクスポート**: 「📊 試合分析データをダウンロード」ボタンで詳細データをCSV出力
- **デバッグ機能**: 
  - 🎲 ランダムスコア生成（テスト用の自動データ生成）
  - 🗑️ 全試合結果クリア（データの一括削除）

### エクスポートデータ内容
CSVファイルには以下の情報が含まれます：
- **チームメンバー情報**: 各チームの構成メンバー一覧
- **対戦表データ**: 全試合の結果とスコア詳細
- **順位表データ**: 最終順位と勝敗記録（順位付き）
- **勝敗表データ**: チーム別統計（チームID順）
- **得点詳細**: チーム間の対戦スコア履歴
- **設定情報**: マッチポイント等の競技設定
- **大会情報**: 名称、日付、場所など（config.jsonから取得）

## セットアップ方法

### 必要な環境
- **Webブラウザ**: Chrome、Firefox、Safari、Edge等のモダンブラウザ
- **ローカルサーバー**: Python 3.x、Node.js、またはその他のHTTPサーバー
- **推奨環境**: Windows 10/11、macOS 10.15+、Linux（Ubuntu 20.04+）

### インストールと起動
1. **リポジトリの取得**
   ```bash
   git clone https://github.com/yanagi-jabee-28/TennisMatch-Pro-2.git
   cd TennisMatch-Pro-2
   ```

2. **ローカルサーバーの起動**
   ```powershell
   # Python使用の場合
   python -m http.server 8080
   
   # Node.js使用の場合（npx）
   npx http-server -p 8080
   
   # Live Server (VSCode拡張機能) 使用の場合
   # index.htmlを右クリック → "Open with Live Server"
   ```

3. **アプリケーションの起動**
   - ブラウザで `http://localhost:8080` を開く
   - または `http://localhost:8080/index.html` を直接開く

### 設定ファイルの編集
`config.json` を編集してチーム構成をカスタマイズ：
```json
{
  "teams": [
    {
      "id": 1,
      "members": ["メンバー1", "メンバー2"]
    }
  ],
  "tournamentInfo": {
    "name": "大会名",
    "date": "2025-06-05",
    "location": "開催場所"
  }
}
```

## プロジェクト構成

```
TennisMatch-Pro-2/
├── index.html              # メインHTMLファイル
├── config.json             # チーム設定・大会情報
├── README.md               # プロジェクト説明書
├── 名簿.md                 # メンバー名簿
├── app/                    # アプリケーションロジック
│   ├── main.js             # メインエントリーポイント
│   ├── state.js            # アプリケーション状態管理
│   ├── dom.js              # DOM要素キャッシュ
│   ├── matches.js          # 試合管理機能
│   ├── standings.js        # 順位表計算
│   ├── export.js           # データエクスポート
│   ├── debug.js            # デバッグ機能
│   ├── config.js           # 設定読み込み
│   ├── utils.js            # ユーティリティ関数
│   └── components/         # UIコンポーネント
│       ├── scoreModal.js   # スコア入力モーダル
│       ├── teamEditor.js   # チーム編集機能
│       ├── customConfirm.js# 確認ダイアログ
│       └── toast.js        # 通知システム
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
```

## 技術仕様
- **フロントエンド**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **データ管理**: LocalStorage API
- **モジュール**: ES6 Modules
- **レスポンシブ**: CSS Grid & Flexbox
- **互換性**: モダンブラウザ対応（IE非対応）

## 開発者向け情報

### 主要なファイルの役割
- `app/main.js`: アプリケーションの初期化とメインロジック
- `app/state.js`: アプリケーション状態の管理とLocalStorage連携
- `app/matches.js`: 対戦表の生成と試合結果管理
- `app/standings.js`: 順位表の計算とレンダリング
- `app/export.js`: CSV形式でのデータエクスポート機能
- `app/debug.js`: 開発・テスト用のデバッグ機能

### アーキテクチャ
- **モジュール化**: ES6 Modulesによる機能分離
- **状態管理**: 中央集権的な状態管理パターン
- **データ永続化**: LocalStorage APIによる自動保存
- **レスポンシブデザイン**: CSS Grid & Flexboxによる柔軟なレイアウト

### 開発環境のセットアップ
1. **必要な拡張機能** (VSCode推奨)
   - Live Server: リアルタイムプレビュー
   - Prettier: コードフォーマッター
   - ESLint: JavaScript品質チェック

2. **デバッグ方法**
   - ブラウザの開発者ツール（F12）を使用
   - アプリ内のデバッグ機能（🎲、🗑️ボタン）を活用
   - LocalStorageの確認: `localStorage.getItem('tennisMatchData')`

### トラブルシューティング
- **CORSエラー**: ローカルサーバーを必ず使用してください（file://では動作しません）
- **設定が反映されない**: ブラウザのキャッシュをクリアしてください
- **データが消える**: LocalStorageが無効化されていないか確認してください
- **レイアウト崩れ**: ブラウザの互換性を確認してください（IE非対応）

## ライセンス
MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 更新履歴
- **v2.1.0** (2025-06-05): プロジェクト構成の見直し、READMEの大幅アップデート、開発者向け情報充実
- **v2.0.0** (2025-06-05): デバッグ機能追加、順位付きCSVエクスポート、モジュール化完了
- **v1.0.0**: 基本的な試合管理機能、順位表、データエクスポート

## 貢献・サポート
- **問題報告**: [GitHub Issues](https://github.com/yanagi-jabee-28/TennisMatch-Pro-2/issues)
- **機能要望**: Pull Requestをお送りください
- **ディスカッション**: [GitHub Discussions](https://github.com/yanagi-jabee-28/TennisMatch-Pro-2/discussions)

### コントリビューション方法
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成
