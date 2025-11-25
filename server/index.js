import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ===== ① 先にアップロード受け口を定義（ログ強化） =====
const STORAGE_DIR = path.resolve(__dirname, "./storage");
await fs.mkdir(STORAGE_DIR, { recursive: true });

app.use("/api/upload", express.raw({ type: "*/*", limit: "200mb" }));
app.post("/api/upload", async (req, res) => {
  try {
    const q = new URL(req.url, `http://x`).searchParams;
    const sessionId = (q.get('sessionId') || '').replace(/[^a-zA-Z0-9_\-]/g,'');
    const roll      = String(q.get('roll') ?? '0').replace(/[^\d]/g,'');
    const seq       = String(q.get('seq') ?? '0').replace(/[^\d]/g,'');
    const ext       = (q.get('ext') || 'webm').replace(/[^a-z0-9]/g,'');
    const bytes     = req.body?.length || 0;

    console.log(`[UPLOAD] sid=${sessionId} roll=${roll} seq=${seq} bytes=${bytes}`);
    if (!bytes) return res.status(400).json({ ok:false, reason:"empty body" });
    if (!sessionId) return res.status(400).json({ ok:false, reason:"no sessionId" });

    const dir = path.join(STORAGE_DIR, sessionId, `roll_${roll}`);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${String(seq).padStart(6,'0')}.${ext}`;
    const filepath = path.join(dir, filename);

    await fs.writeFile(filepath, Buffer.from(req.body));
    const st = await fs.stat(filepath);
    console.log(`[SAVED]  ${filepath} (${st.size} bytes)`);
    res.json({ ok:true, file:`storage/${sessionId}/roll_${roll}/${filename}`, bytes: st.size });
  } catch (e) {
    console.error("[ERROR]", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

// アップロード関連の定義のあとあたりに追加
app.use("/storage", express.static(STORAGE_DIR, { index: false }));

// ===== 録音ファイル一覧を返すAPI =====
app.get("/api/files", async (req, res) => {
  try {
    const sessions = [];
    const dirs = await fs.readdir(STORAGE_DIR, { withFileTypes: true });

    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const sessionId = d.name;
      const baseDir = path.join(STORAGE_DIR, sessionId);

      const files = await fs.readdir(baseDir, { withFileTypes: true });
      const finals = [];

      for (const f of files) {
        if (!f.isFile()) continue;
        if (!f.name.startsWith("final_")) continue; // final_だけ拾う

        const full = path.join(baseDir, f.name);
        const st = await fs.stat(full);

        finals.push({
          name: f.name,
          bytes: st.size,
          mtime: st.mtimeMs,
          url: `/storage/${sessionId}/${f.name}`,
        });
      }

      // finalファイルがないセッションはスキップでもOK
      if (finals.length) {
        // 日付順に並べておく（新しい順）
        finals.sort((a, b) => b.mtime - a.mtime);
        sessions.push({ sessionId, finals });
      }
    }

    // 全体も新しいセッション順に
    sessions.sort((a, b) => b.finals[0].mtime - a.finals[0].mtime);

    res.json({ ok: true, sessions });
  } catch (e) {
    console.error("[FILES ERROR]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});



// 任意：セッション終了通知（記録用）
app.get("/api/commit", async (req, res) => {
  const q = req.query || {};
  console.log(`[COMMIT] sid=${q.sessionId} last roll=${q.roll} seq=${q.seq}`);
  res.json({ ok:true });
});


// ===== ② その後にフロント配信（app直下） =====
const PUBLIC_DIR = path.resolve(__dirname, "../app");
console.log("PUBLIC_DIR:", PUBLIC_DIR);
app.use(express.static(PUBLIC_DIR, { index: "index.html" }));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

// ===== ③ 起動ログ =====
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Front:  http://localhost:${port}`);
  console.log(`✅ SaveTo: ${STORAGE_DIR}`);
});

// 最終ファイル（1本化）アップロード
app.use("/api/final", express.raw({ type: "*/*", limit: "500mb" }));
app.post("/api/final", async (req, res) => {
  try {
    const q = new URL(req.url, "http://x").searchParams;
    const sessionId = (q.get("sessionId") || "").replace(/[^a-zA-Z0-9_\-]/g,"");
    const ext       = (q.get("ext") || "webm").replace(/[^a-z0-9]/g,"");
    const bytes     = req.body?.length || 0;

    if (!sessionId) return res.status(400).json({ ok:false, reason:"no sessionId" });
    if (!bytes)     return res.status(400).json({ ok:false, reason:"empty body" });

    const dir = path.join(STORAGE_DIR, sessionId);
    await fs.mkdir(dir, { recursive: true });

    const name = (req.headers["x-filename"] || `final_${sessionId}.${ext}`).toString().replace(/[^\w.\-]/g,"");
    const filepath = path.join(dir, name);

    await fs.writeFile(filepath, Buffer.from(req.body));
    const st = await fs.stat(filepath);
    console.log(`[FINAL]  ${filepath} (${st.size} bytes)`);
    res.json({ ok:true, file:`storage/${sessionId}/${name}`, bytes: st.size });
  } catch (e) {
    console.error("[FINAL ERROR]", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

