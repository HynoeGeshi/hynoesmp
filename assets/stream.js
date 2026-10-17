import {playYouTube} from './youtube-player.mjs?v=20261017-recovery';
(()=>{
  const root=document.querySelector('[data-broadcast]');
  if(!root)return;

  const statusEl=root.querySelector('[data-stream-status]');
  const metaStatus=root.querySelector('[data-stream-meta-status]');
  const titleEl=root.querySelector('[data-stream-title]');
  const headingEl=root.querySelector('[data-stream-heading]');
  const watchEl=root.querySelector('[data-stream-watch]');
  const videoEl=root.querySelector('[data-stream-video]');
  const youtubeEl=root.querySelector('[data-stream-youtube]');

  const labels={
    live:{short:'LIVE NOW',heading:'Live from Hynoe SMP'},
    upcoming:{short:'UPCOMING',heading:'Next Hynoe broadcast'},
    latest:{short:'LATEST STREAM',heading:'Latest Hynoe SMP stream'},
    syncing:{short:'SYNCING',heading:'Latest Hynoe SMP stream'}
  };

  watchEl.href='watch.html#video';
  watchEl.textContent='WATCH HERE ON HYNOE';
  watchEl.removeAttribute('target');
  watchEl.removeAttribute('rel');

  function setStatus(status){
    const clean=labels[status]?status:'latest';
    root.dataset.status=clean;
    statusEl.textContent=labels[clean].short;
    metaStatus.textContent=labels[clean].short;
    headingEl.textContent=labels[clean].heading;
  }

  function render(data){
    if(!/^[A-Za-z0-9_-]{11}$/.test(data?.videoId||'')){
      setStatus('syncing');
      titleEl.textContent='The broadcast beacon is waiting for its first YouTube sync.';
      return;
    }

    setStatus(data.status||'latest');
    titleEl.textContent=data.title||'Hynoe SMP livestream';
    if(youtubeEl)youtubeEl.href='https://www.youtube.com/watch?v='+encodeURIComponent(data.videoId);

    const placeholder=document.createElement('div');
    placeholder.className='broadcast-placeholder';
    const play=document.createElement('button');
    play.type='button';
    play.className='mc-button red';
    play.textContent=data.status==='live'?'▶ PLAY LIVE STREAM HERE':'▶ PLAY LATEST STREAM HERE';
    play.addEventListener('click',()=>playYouTube(videoEl,data));
    placeholder.append(play);
    videoEl.replaceChildren(placeholder);
  }

  fetch('data/stream.json?ts='+Date.now(),{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('stream data unavailable');return r.json();})
    .then(render)
    .catch(()=>render(null));
})();
