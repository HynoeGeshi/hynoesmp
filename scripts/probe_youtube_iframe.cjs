#!/usr/bin/env node
// One public video, fresh browser, ordinary IFrame API, no credentials or retries.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const VIDEO = 'QljzCRTJ-mA';
const OUT = path.resolve('test-artifacts');
const result = { expectedVideoId: VIDEO, videoId: '', title: '', states: [], error: null, playing: false, matchesVideoId: false };
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Public Hynoe iframe probe</title></head><body>
<div id="player"></div><script>
window.probe = ${JSON.stringify(result)};
window.probeDone = false;
window.onYouTubeIframeAPIReady = function () {
  new YT.Player('player', {
    width: 640, height: 360, host: 'https://www.youtube.com', videoId: '${VIDEO}',
    playerVars: { autoplay: 1, mute: 1, playsinline: 1, origin: location.origin },
    events: {
      onReady: function (event) { event.target.mute(); event.target.playVideo(); },
      onError: function (event) {
        if (window.probeDone) return;
        window.probe.error = event.data;
        window.probeDone = true;
      },
      onStateChange: function (event) {
        if (window.probeDone) return;
        window.probe.states.push(event.data);
        const data = event.target.getVideoData();
        window.probe.videoId = data.video_id || '';
        window.probe.title = data.title || '';
        if (event.data === YT.PlayerState.PLAYING) {
          window.probe.playing = true;
          window.probe.matchesVideoId = window.probe.videoId === '${VIDEO}';
          if (!window.probe.matchesVideoId) window.probe.error = 'video-id-mismatch';
          window.probeDone = true;
          event.target.pauseVideo();
        }
      }
    }
  });
};
</script><script async src="https://www.youtube.com/iframe_api"></script></body></html>`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = (process.env.PATH || '').split(path.delimiter)
    .flatMap(dir => ['google-chrome', 'google-chrome-stable'].map(name => path.join(dir, name)))
    .find(file => { try { fs.accessSync(file, fs.constants.X_OK); return true; } catch { return false; } });
  let browser, context, page;
  const server = http.createServer((req, res) => {
    if (req.url !== '/') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    res.end(html);
  });
  try {
    if (!chrome) { result.error = 'installed-chrome-not-found'; return; }
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ executablePath: chrome, headless: true, timeout: 10000 });
    context = await browser.newContext();
    page = await context.newPage();
    const deadline = Date.now() + 25000;
    const remaining = () => Math.max(1, deadline - Date.now());
    await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'domcontentloaded', timeout: remaining() });
    try { await page.waitForFunction(() => window.probeDone === true, undefined, { timeout: remaining() }); }
    catch { /* One bounded wait; a missing positive result remains failure. */ }
    Object.assign(result, await page.evaluate(() => window.probe));
    if (!result.error && !(result.playing && result.matchesVideoId)) result.error = 'timeout-before-matching-playing';
  } catch {
    result.error = 'browser-probe-error';
  } finally {
    if (page && (result.error || !result.playing || !result.matchesVideoId)) {
      try { await page.screenshot({ path: path.join(OUT, 'iframe-probe-failure.png'), timeout: 5000 }); } catch {}
    }
    fs.writeFileSync(path.join(OUT, 'iframe-probe.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.playing && result.matchesVideoId && !result.error ? 0 : 1;
    try { if (context) await context.close(); } catch {}
    try { if (browser) await browser.close(); } catch {}
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
}
main();
