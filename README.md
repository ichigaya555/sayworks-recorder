# SayWorks Recorder Starter (超初心者向け)

このフォルダは、ブラウザ録音→ローカル保存（IndexedDB）→通信復帰で自動アップロード、までの最小スターターです。

## ✅ 事前準備
- Node.js（v20推奨）をインストール

## 🚀 使い方（まずはローカルで）
1. ターミナルでこのフォルダに移動：
   ```bash
   cd sayworks-recorder-starter
   ```
2. 依存を入れる：
   ```bash
   npm install
   ```
3. サーバを起動：
   ```bash
   npm run dev
   ```
4. ブラウザで開く：
   - http://localhost:3080

## 🧪 テスト方法（最小）
- 「録音開始」→数十秒待つ→「停止」
- 途中でネットを切って（Wi-Fiオフ）、再接続すると自動でアップロードされます
- 画面上部の「同期/未送信」の数字が目安です

## 📱 iPad実機テスト（ローカルHTTPS）
- `server/certs/README.txt` を読んで証明書を作成・配置
- iPadにルートCAをインポートしてフル信頼にする
- iPadで `https://<あなたのLAN IP>:3443` を開く

## 📂 構成
- `app/index.html` … 全画面UI（窓=開始/再開・左タイヤ=停止・右タイヤ=一時停止）
- `app/src/recorder.js` … MediaRecorder・チャンク化・1h上限・15mロール
- `app/src/store.js` … IndexedDB保存ラッパ
- `app/src/sync.js` … オンライン時の送信・復帰時の再送・commit
- `server/index.js` … Expressの受け口（/api/recorder/upload /commit）

## 🧩 ここから発展
- PWA：`app/src/pwa/manifest.webmanifest` と `sw.js` を強化（キャッシュ戦略）
- ストレージ：開発時は `server/storage` に保存。実運用はS3等に切替。

---

### よくある質問
**Q. 録音できない？**  
A. 初回はブラウザのマイク許可を求められます。「許可」を選択してください。

**Q. iPadで録音が止まる？**  
A. 画面ロックが有効だと止まることがあります。テスト時は「自動ロック：しない」に設定してください。

**Q. 形式は？**  
A. Chromiumは `audio/webm;codecs=opus`、Safariは `audio/mp4` を優先します。
