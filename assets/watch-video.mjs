/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */

const host=document.getElementById('video');
const playButton=host?.querySelector('.play-broadcast');
const titleEl=document.getElementById('stream-title');
const statusEl=document.getElementById('stream-status');
const youtubeEl=document.getElementById('youtube');
let stream=null;

function setStatus(data){
  if(!data?.videoId){
    if(statusEl)statusEl.textContent='STREAM UNAVAILABLE';
    if(titleEl)titleEl.textContent='Hynoe broadcasts';
    if(playButton){
      playButton.disabled=true;
      playButton.textContent='▶ Stream unavailable right now';
    }
    if(youtubeEl){
      youtubeEl.href='https://www.youtube.com/@Hynoe/streams';
      youtubeEl.textContent='OPEN HYNOE ON YOUTUBE ↗';
    }
    return;
  }
  stream=data;
  if(statusEl)statusEl.textContent=data.status==='live'?'LIVE NOW':data.status==='upcoming'?'UPCOMING':'LATEST STREAM';
  if(titleEl)titleEl.textContent=data.title||'Hynoe livestream';
  if(playButton){
    playButton.disabled=false;
    playButton.textContent=data.status==='live'?'▶ Watch live here on Hynoe':'▶ Play latest stream here';
  }
  if(youtubeEl){
    youtubeEl.href=data.url||`https://www.youtube.com/watch?v=${encodeURIComponent(data.videoId)}`;
    youtubeEl.textContent='OPEN ON YOUTUBE ↗';
  }
}

function playOnSite(){
  if(!host||!stream?.videoId)return;
  const iframe=document.createElement('iframe');
  iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(stream.videoId)+'?rel=0&autoplay=1&playsinline=1';
  iframe.title=stream.title||'Hynoe livestream';
  iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.allowFullscreen=true;
  host.replaceChildren(iframe);
  host.classList.add('playing');
}

playButton?.addEventListener('click',playOnSite);

fetch('data/stream.json?ts='+Date.now(),{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('stream data unavailable');return response.json();})
  .then(setStatus)
  .catch(()=>setStatus(null));
