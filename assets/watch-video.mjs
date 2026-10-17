/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
import {playYouTube} from './youtube-player.mjs?v=20261017-recovery';

const host=document.getElementById('video');
const playButton=host?.querySelector('.play-broadcast');
const titleEl=document.getElementById('stream-title');
const statusEl=document.getElementById('stream-status');
const youtubeEl=document.getElementById('youtube');
let stream=null;

if(playButton){
  playButton.disabled=true;
  playButton.textContent='▶ Loading stream…';
}

function setStatus(data){
  statusEl?.classList.toggle('live',data?.status==='live');
  if(!/^[A-Za-z0-9_-]{11}$/.test(data?.videoId||'')){
    stream=null;
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
    youtubeEl.href=`https://www.youtube.com/watch?v=${encodeURIComponent(data.videoId)}`;
    youtubeEl.textContent='OPEN ON YOUTUBE ↗';
  }
}

function playOnSite(){
  if(!host||!stream?.videoId)return;
  playYouTube(host,stream);
}

playButton?.addEventListener('click',playOnSite);

fetch('data/stream.json?ts='+Date.now(),{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('stream data unavailable');return response.json();})
  .then(setStatus)
  .catch(()=>setStatus(null));
