(()=>{
  const root=document.querySelector('[data-broadcast]');
  if(!root)return;

  const statusEl=root.querySelector('[data-stream-status]');
  const metaStatus=root.querySelector('[data-stream-meta-status]');
  const titleEl=root.querySelector('[data-stream-title]');
  const headingEl=root.querySelector('[data-stream-heading]');
  const watchEl=root.querySelector('[data-stream-watch]');
  const videoEl=root.querySelector('[data-stream-video]');

  const labels={
    live:{short:'LIVE NOW',heading:'Live from Hynoe SMP'},
    upcoming:{short:'UPCOMING',heading:'Next Hynoe broadcast'},
    latest:{short:'LATEST STREAM',heading:'Latest Hynoe SMP stream'},
    syncing:{short:'SYNCING',heading:'Latest Hynoe SMP stream'}
  };

  function setStatus(status){
    const clean=labels[status]?status:'latest';
    root.dataset.status=clean;
    statusEl.textContent=labels[clean].short;
    metaStatus.textContent=labels[clean].short;
    headingEl.textContent=labels[clean].heading;
  }

  function render(data){
    if(!data||!data.videoId){
      setStatus('syncing');
      titleEl.textContent='The broadcast beacon is waiting for its first YouTube sync.';
      watchEl.href='https://www.youtube.com/@Hynoe/streams';
      return;
    }

    setStatus(data.status||'latest');
    titleEl.textContent=data.title||'Hynoe SMP livestream';
    watchEl.href=data.url||('https://www.youtube.com/watch?v='+data.videoId);

    const iframe=document.createElement('iframe');
    iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(data.videoId)+'?rel=0';
    iframe.title=data.title||'Hynoe livestream';
    iframe.loading='lazy';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allowFullscreen=true;
    videoEl.replaceChildren(iframe);
  }

  fetch('data/stream.json?ts='+Date.now(),{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('stream data unavailable');return r.json();})
    .then(render)
    .catch(()=>render(null));
})();