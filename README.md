# Signal Launcher

Windows 向けの現場用シグナル送信デスクトップアプリです。  
Akai APC mini などの MIDI コントローラー、画面上のボタン、または PC ローカル時刻による Scheduled Trigger から、OSC / UDP / MIDI Out の信号を送信できます。

## 技術スタック

- Electron + TypeScript + React
- UI: Radix UI、react-hook-form、Zod
- MIDI: [easymidi](https://www.npmjs.com/package/easymidi)
- OSC: [osc-js](https://www.npmjs.com/package/osc-js)
- UDP: Node.js 標準 `dgram`

## アーキテクチャ

```
MIDI Input / Screen Button / PC Clock (Schedule)
        ↓
   Input Router
        ↓
  Mapping Engine  (triggerId 解決 → actions 実行)
        ↓
   Signal Router
   ├─ OSC Sender
   ├─ UDP Sender
   └─ MIDI Out Sender
```

すべての入力源（MIDI、画面ボタン、スケジュール）は同じ Mapping Engine を通ります。

## 必要環境

- Windows 10/11
- Node.js 18 以上
- npm

### オプション（MIDI Out テスト用）

- [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) 等の仮想 MIDI ポート

## セットアップ

```powershell
cd "signal lancher"
npm install
```

## 起動（開発）

```powershell
npm run dev
```

Electron ウィンドウが開き、`config/show.default.json` が読み込まれます。

開発時の DevTools: ウィンドウ内で `F12` または `Ctrl+Shift+I`（ブラウザの localhost ではありません）。

## ビルド

```powershell
npm run build
npm run preview   # ビルド成果物のプレビュー
```

## UI 概要

タブベースの日本語 UI です。ログ本文・設定値・ID は英語/そのまま表示されます。

### ヘッダー（常時表示）

| コントロール | 説明 |
|-------------|------|
| **ショー / セットアップ** | 画面モード切替（下表参照） |
| **現場 / 開発者** | 表示プロファイル切替 |
| **セットアップウィザード** | 初回設定のガイド（送信先 → Cue → テスト） |

### 画面モード

| モード | 表示タブ | 用途 |
|--------|---------|------|
| **ショー** | **発火**、**MIDI** | 現場本番・リハーサル。Cue 発火と接続確認のみ |
| **セットアップ** | 発火、**Cue**、送信先、スケジュール、設定、MIDI | 設定の作成・編集 |

起動時は **ショー** モードです。設定変更時は **セットアップ** に切り替えてください。

### 表示プロファイル

| プロファイル | 説明 |
|-------------|------|
| **現場** | Cue ラベルのみ表示、技術 ID 非表示、JSON プレビュー非表示 |
| **開発者** | triggerId・JSON プレビュー等を表示 |

### タブ構成（セットアップモード時）

| タブ | 内容 |
|------|------|
| **発火** | ダッシュボード（本番/ドライラン）、Cue 発火ボタン、モニター（2 カラム） |
| **Cue** | Cue（トリガー）の追加・編集・削除、並び替え、MIDI Learn |
| **送信先** | target 一覧・CRUD、単体テスト |
| **スケジュール** | schedule 一覧・CRUD、PC 時刻、テスト発火 |
| **設定** | 案件名・起動モード、保存/再読込、エクスポート/インポート |
| **MIDI** | 接続状態（OK/NG）、入力・出力デバイス一覧 |

**発火** タブのレイアウト: 左に Cue ボタン、右にモニター（**全画面** ボタンあり）。

### 本番 / ドライラン

- 画面上部に **LIVE** / **DRY RUN** バナーで現在モードを表示
- **本番** への切替時は確認ダイアログが表示される
- **本番モード中**は送信先・Cue・スケジュールの追加・編集・削除がロックされる（ドライランに切り替えてから変更）

### キーボードショートカット（ショーモード）

- 数字キー `1`〜`9` — 先頭 9 件の Cue を順に発火

## 設定ファイル

アクティブな設定ファイルは `config/show.default.json` です。  
JSON Schema は `config/show.schema.json` に定義されています。

起動時および保存時にバリデーションが走り、不正な target 参照などは Monitor に `[CONFIG]` / `[ERROR]` として表示されます。

### 編集方法

| 方法 | 用途 |
|------|------|
| **アプリ内 UI**（セットアップモード） | 送信先・Cue・アクション・スケジュール・案件名・MIDI マッピング |
| **JSON 直接編集** | 一括編集、`midiInput` 設定 |
| **エクスポート / インポート** | バックアップ、別 PC への設定移行 |
| **portable 横の `show.json`** | exe と同じフォルダに置くと起動時に自動読込（v1.1+） |

UI からの保存・インポートは `show.default.json` に書き込み、**即座にランタイムへ反映**されます（再起動不要）。  
保存時は自動で `show.default.json.bak` が作成されます。外部エディタで JSON を編集した場合は **設定** タブの **ファイルから再読込** を使用してください。

### portable 配布（v1.1+）

別 PC へ USB 等で渡す場合:

1. `Signal-Launcher-x.x.x-portable.exe` をフォルダに置く
2. 同じフォルダに **`show.json`** を置く（**設定** → **エクスポート** で保存したファイルをリネーム可）
3. exe を起動 → `show.json` が自動で読み込まれる

`show.json` の更新日時がアプリ内に保存済みの設定より新しい場合、次回起動時に上書き更新されます。  
パッケージ版の保存先は `%APPDATA%\signal-launcher\config\show.default.json` です。

### アプリ内で編集できる項目

| 項目 | タブ | 備考 |
|------|------|------|
| 案件名・起動モード | 設定 | 保存ボタンで書き込み |
| 送信先（targets） | 送信先 | CRUD、単体テスト |
| Cue・アクション | Cue | CRUD、並び替え。新規は `screen` 入力を自動付与 |
| MIDI ノートマッピング | Cue → 編集 | **Learn** ボタンまたは数値入力 |
| OSC 引数 | Cue → 編集 | 数値/文字列/真偽値の行追加 UI（JSON 不要） |
| スケジュール | スケジュール | CRUD、テスト発火 |
| 設定 JSON 確認 | 設定 | **開発者** プロファイルのみ（参照・コピー） |

### JSON のみ編集（UI 未対応）

- `triggers[].inputs.keyboard`
- `midiInput.autoDetect` / `preferredDevices`

編集後は **ファイルから再読込** で反映します。

### ルート

| フィールド | 説明 |
|-----------|------|
| `projectName` | プロジェクト表示名（必須） |
| `appMode` | 起動時モード: `live` / `dryRun` |
| `midiInput.autoDetect` | MIDI 入力デバイス名の部分一致文字列 |
| `midiInput.preferredDevices` | autoDetect 失敗時のフォールバック候補 |

### targets

| type | フィールド |
|------|-----------|
| `osc` | `id`, `label`, `host`, `port` |
| `udp` | `id`, `label`, `host`, `port`, `encoding` (`utf-8` / `ascii` / `hex`) |
| `midi` | `id`, `label`, `outputDevice`, `channel` (1–16) |

### triggers（Cue）

| フィールド | 説明 |
|-----------|------|
| `triggerId` | Cue ID（必須） |
| `label` | 表示名 |
| `group` | UI グループ名 |
| `color` | ボタン枠色（CSS カラー） |
| `inputs.midi` | `{ type: "note"\|"cc", note?, cc?, channel? }` |
| `inputs.screen` | `{ buttonId }` — 画面ボタン発火用 |
| `inputs.keyboard` | `{ key }` |
| `actions` | 実行アクション配列（必須、1 件以上） |

配列の順序が Cue 発火ボタン・キーボードショートカット（1〜9）の順序になります。

### actions（target の type に応じたフィールド）

| target type | フィールド |
|------------|-----------|
| `osc` | `target`, `address`, `args` |
| `udp` | `target`, `message` |
| `midi` | `target`, `message` (`noteOn`/`noteOff`/`cc`), `note`, `velocity`, `controller`, `value`, `durationMs` |

### schedules

| フィールド | 説明 |
|-----------|------|
| `scheduleId` | スケジュール ID |
| `enabled` | 有効/無効 |
| `label` | 表示名 |
| `mode` | `daily`（毎日） / `oneShot`（1回のみ） |
| `time` | `HH:mm:ss`（PC ローカル時刻） |
| `date` | `YYYY-MM-DD`（oneShot のみ必須） |
| `triggerId` | 発火する Cue ID |

スケジュールは任意です（空配列でも可）。

## モード

- **Dry Run（ドライラン）**: 実送信せず Monitor に `[DRY_RUN]` として表示
- **Live（本番）**: OSC / UDP / MIDI Out を実際に送信

**発火** タブ上部のダッシュボードから切り替えます。

## Scheduled Trigger について

- PC ローカル時刻を参照します
- **アプリが起動している間のみ** 動作します
- 本番前に PC 時刻とタイムゾーンを確認してください
- SMPTE / MTC / LTC のような厳密なタイムコード同期ではありません
- アプリ起動前に過ぎた oneShot は実行しません
- 同じ scheduleId は同じ日付・時刻で二重実行しません
- `enabled: false` のスケジュールは実行しません

## ログ

- **発火** タブのモニターにリアルタイム表示（**全画面** 表示可）
- `logs/YYYY-MM-DD.log` にファイル保存

## 削除時の制約

- 送信先: Cue の action から参照されている場合は削除不可
- Cue: スケジュールから参照されている場合は削除不可
- 本番モード中: 上記 CRUD 操作自体が UI でロックされる

## プロジェクト構成（主要ファイル）

```
config/
  show.default.json    # アクティブ設定
  show.schema.json     # JSON Schema
src/main/
  config/              # 読込・検証・保存・インポート
  input/               # MIDI 入力（Learn 含む）、Input Router
  mapping/             # Mapping Engine
  output/              # Signal Router、各 Sender
  schedule/            # ScheduleManager
src/renderer/src/
  components/          # タブ UI、SetupWizard、OscArgsEditor 等
  hooks/               # useUiPreferences（画面モード・プロファイル）
logs/                  # 日次ログ（自動生成）
```

## 現場運用・テスト

現場での運用手順とテスト確認方法は [Operation.md](./Operation.md) を参照してください。

## MIDI 入力

### UI（推奨）

1. **セットアップ** モード → **Cue** タブ → Cue を編集
2. **Learn（パッドを押す）** をクリック → APC mini 等のパッドを押す
3. ノート番号・チャンネルが自動入力される → **適用**

### JSON（上級者向け）

```json
{ "type": "note", "note": 36, "channel": 1 }
```

## 将来拡張

Input Provider パターンにより、Stream Deck 等の入力源を追加できる構造になっています（今回は未実装）。
