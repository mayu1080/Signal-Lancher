/** UI display labels only — config keys, log messages, and data values stay unchanged. */
export const ui = {
  appTitle: 'Signal Launcher',
  loading: '読み込み中…',

  header: {
    workModeLabel: '画面モード',
    showMode: 'ショー',
    setupMode: 'セットアップ',
    profileLabel: '表示プロファイル',
    fieldProfile: '現場',
    developerProfile: '開発者',
    setupWizard: 'セットアップウィザード'
  },

  displaySettings: {
    menuButton: '表示設定',
    menuHint: '画面の見え方のみ変更します。信号の送信は発火タブの本番/ドライランで切り替えます。',
    setupBanner: '初回セットアップ',
    screenSection: '画面',
    detailSection: '詳細'
  },

  liveConfirm: '本番モードに切り替えます。実際に信号が送信されます。よろしいですか？',

  midiStatus: {
    noDevices: 'MIDI 入力デバイスが見つかりません。USB 接続と MIDI タブを確認してください。',
    notConnected: '自動認識 MIDI 入力が未接続です',
    checkTab: 'MIDI タブで再読み込みしてください',
    connected: '接続中',
    disconnected: '未接続'
  },

  liveLock: {
    title: '本番モード中',
    hint: '設定の変更・削除はドライランに切り替えてから行ってください'
  },

  keyboard: {
    hint: 'キー 1〜9 で先頭 Cue を発火'
  },

  wizard: {
    title: 'セットアップウィザード',
    step1: '1. 送信先',
    step2: '2. Cue',
    step3: '3. テスト',
    step1Desc: 'OSC / UDP / MIDI の送信先を確認・追加してください。',
    step2Desc: 'Cue（トリガー）とアクションを設定してください。',
    step3Desc: 'ドライランで Cue を 1 回発火し、モニターを確認してください。',
    next: '次へ',
    back: '戻る',
    finish: '完了',
    skip: 'スキップ',
    goTargets: '送信先タブを開く',
    goCues: 'Cue タブを開く',
    testHint: '操作タブで任意の Cue をクリックしてテストしてください。'
  },

  dashboard: {
    title: 'ダッシュボード',
    project: 'プロジェクト',
    mode: 'モード',
    live: '本番',
    dryRun: 'ドライラン',
    liveBanner: 'LIVE — 実送信しています',
    dryRunBanner: 'DRY RUN — 送信しません',
    autoDetectedInput: 'MIDI 入力',
    none: '（なし）',
    lastTrigger: '最終 Cue'
  },

  devices: {
    title: 'MIDI 接続',
    refresh: '再読み込み',
    inputs: '入力',
    outputs: '出力',
    none: '（なし）',
    activeInput: '使用中の入力',
    selectHint: '使用する MIDI 入力を一覧から選んでください',
    useButton: '使用する',
    usingBadge: '使用中',
    selecting: '接続中…',
    selectSuccess: 'MIDI 入力を接続しました',
    selectFailed: 'MIDI 入力の接続に失敗しました',
    selectUnavailable: 'MIDI 接続 API が利用できません。アプリを再起動してください',
    statusOk: '接続 OK',
    statusNg: '未接続'
  },

  triggers: {
    title: 'Cue 発火',
    defaultGroup: 'その他',
    midiNote: 'MIDI ノート',
    midiCc: 'MIDI CC',
    shortcut: 'ショートカット'
  },

  triggersManage: {
    title: 'Cue 設定',
    add: '追加',
    edit: '編集',
    delete: '削除',
    addTitle: 'Cue を追加',
    editTitle: 'Cue を編集',
    apply: '適用',
    cancel: 'キャンセル',
    empty: '（Cue なし）',
    duplicateId: 'ID が既に存在します',
    deleteConfirm: 'この Cue を削除しますか？',
    deleteBlocked: '削除できません',
    deleteBlockedDetail: 'スケジュールから参照されています',
    noTargetsHint: '先に送信先を設定してください',
    actionsRequiredHint: 'アクションを 1 件以上追加してください',
    inputsReadOnly: '入力マッピング',
    inputsHint: 'MIDI ノートは下の Learn または数値入力で設定できます',
    midiNoteLabel: 'MIDI ノート',
    midiChannelLabel: 'MIDI チャンネル',
    midiLearn: 'Learn（パッドを押す）',
    midiLearnWaiting: 'パッドまたはキーを押してください…',
    midiLearnCancel: 'キャンセル',
    actionsTitle: 'アクション',
    addAction: 'アクション追加',
    removeAction: '削除',
    actionTarget: '送信先',
    oscAddress: 'OSC アドレス',
    oscArgs: 'OSC 引数',
    oscArgsEmpty: '（引数なし）',
    addOscArg: '引数を追加',
    argTypeNumber: '数値',
    argTypeString: '文字列',
    argTypeBoolean: '真偽値',
    udpMessage: 'UDP メッセージ',
    midiType: 'MIDI 種別',
    midiNoteOn: 'ノート ON',
    midiNoteOff: 'ノート OFF',
    midiCc: 'コントローラ (CC)',
    midiNote: 'ノート番号',
    midiVelocity: 'ベロシティ',
    midiController: 'コントローラ番号',
    midiValue: '値',
    midiDuration: 'ノート長 (ms)',
    moveUp: '上へ',
    moveDown: '下へ',
    reorderHint: '行をドラッグして並び替え',
    columns: {
      id: 'ID',
      label: 'ラベル',
      group: 'グループ',
      color: '色',
      actions: 'アクション',
      edit: '操作',
      order: '順序'
    }
  },

  schedule: {
    title: 'スケジュール',
    optionalHint: 'スケジュールは任意です。オンタイム運用のみの場合は空のままで問題ありません。',
    add: '追加',
    edit: '編集',
    delete: '削除',
    addTitle: 'スケジュールを追加',
    editTitle: 'スケジュールを編集',
    apply: '適用',
    cancel: 'キャンセル',
    duplicateId: 'ID が既に存在します',
    invalidTrigger: 'トリガーが存在しません',
    noTriggersHint: '先にトリガーを設定してください',
    deleteConfirm: 'このスケジュールを削除しますか？',
    modeDaily: '毎日',
    modeOneShot: '1回のみ',
    pcTime: 'PC ローカル時刻',
    noSchedules: '（スケジュールなし）',
    enabled: '有効',
    disabled: '無効',
    testFire: 'テスト発火',
    columns: {
      id: 'ID',
      label: 'ラベル',
      enabled: '有効',
      mode: 'モード',
      date: '日付',
      time: '時刻',
      trigger: 'トリガー',
      lastFired: '最終実行',
      nextFire: '次回実行',
      test: 'テスト',
      actions: '操作'
    }
  },

  targets: {
    title: '送信先',
    add: '追加',
    edit: '編集',
    delete: '削除',
    addTitle: '送信先を追加',
    editTitle: '送信先を編集',
    apply: '適用',
    cancel: 'キャンセル',
    empty: '（送信先なし）',
    duplicateId: 'ID が既に存在します',
    deleteConfirm: 'この送信先を削除しますか？',
    deleteBlocked: '削除できません',
    deleteBlockedDetail: 'トリガーの action から参照されています',
    testDry: 'テスト（ドライラン）',
    testLive: 'テスト（本番）',
    columns: {
      id: 'ID',
      label: 'ラベル',
      type: '種別',
      endpoint: '接続先',
      test: 'テスト',
      actions: '操作'
    }
  },

  monitor: {
    title: 'モニター',
    empty: 'ログはまだありません',
    fullscreen: '全画面',
    closeFullscreen: '閉じる'
  },

  tabs: {
    ariaLabel: 'メインナビゲーション',
    operate: '発火',
    cues: 'Cue',
    targets: '送信先',
    schedule: 'スケジュール',
    settings: '設定',
    midi: 'MIDI'
  },

  settings: {
    title: '設定',
    configPath: '設定ファイル',
    projectName: '案件名',
    startupMode: '起動時モード',
    save: '保存',
    reload: 'ファイルから再読込',
    export: 'エクスポート',
    import: 'インポート',
    unsavedHint: '未保存の変更があります',
    saveSuccess: '保存しました',
    saveFailed: '保存に失敗しました',
    reloadSuccess: '再読込しました',
    reloadFailed: '再読込に失敗しました',
    exportSuccess: 'エクスポートしました',
    exportFailed: 'エクスポートに失敗しました',
    importSuccess: 'インポートしました',
    importFailed: 'インポートに失敗しました',
    unsavedDiscardConfirm: '未保存の変更があります。破棄して続行しますか？',
    unsavedTabSwitchConfirm: '設定タブに未保存の変更があります。タブを切り替えますか？',
    jsonPreviewTitle: '設定 JSON（参照のみ）',
    jsonPreviewHint: '編集は各タブの CRUD または JSON ファイルで行ってください。',
    jsonRefresh: '更新',
    jsonCopy: 'コピー',
    jsonCopySuccess: 'クリップボードにコピーしました',
    jsonCopyFailed: 'コピーに失敗しました',
    jsonPreviewFailed: '設定の読み込みに失敗しました',
    portableSidecarHint:
      '配布用: portable.exe と同じフォルダに show.json を置くと、起動時に自動で読み込みます（show.json の方が新しい場合は上書き更新）。'
  }
} as const

export function formatSource(source: string): string {
  const map: Record<string, string> = {
    midi: 'MIDI',
    screen: '画面',
    schedule: 'スケジュール',
    test: 'テスト'
  }
  return map[source] ?? source
}

export function formatScheduleMode(mode: string): string {
  const map: Record<string, string> = {
    daily: '毎日',
    oneShot: '1回のみ'
  }
  return map[mode] ?? mode
}
