/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */

let youtubeAPI;
function loadYouTubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(youtubeAPI)return youtubeAPI;
  youtubeAPI=new Promise((resolve,reject)=>{
    const previous=window.onYouTubeIframeAPIReady;
    const script=document.createElement('script');
    let settled=false;
    const finish=error=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      if(window.onYouTubeIframeAPIReady===ready)window.onYouTubeIframeAPIReady=previous;
      if(error){youtubeAPI=null;reject(error);}else resolve(window.YT);
    };
    const ready=()=>{
      try{if(typeof previous==='function')previous();}
      finally{finish(window.YT?.Player?null:new Error('YouTube player API unavailable'));}
    };
    const timer=setTimeout(()=>finish(new Error('YouTube player API timed out')),10000);
    window.onYouTubeIframeAPIReady=ready;
    script.src='https://www.youtube.com/iframe_api';
    script.async=true;
    script.onerror=()=>finish(new Error('YouTube player API could not load'));
    document.head.append(script);
  });
  return youtubeAPI;
}

export function playYouTube(host,data){
  if(!host||!/^[A-Za-z0-9_-]{11}$/.test(data?.videoId||''))return;
  const iframe=document.createElement('iframe');
  iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(data.videoId)+'?rel=0&autoplay=0&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(window.location.origin);
  iframe.title=data.title||'Hynoe livestream';
  iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.allowFullscreen=true;
  host.replaceChildren(iframe);
  host.classList.add('playing');

  let readyTimer,recovery;
  const current=()=>host.contains(iframe);
  function recover(replace){
    if(!current())return;
    clearTimeout(readyTimer);
    recovery?.remove();
    recovery=document.createElement('div');
    recovery.className='youtube-recovery';
    recovery.setAttribute('role','status');
    const message=document.createElement('p');
    message.textContent=replace?'This stream cannot play here.':'Trouble with the player?';
    const link=document.createElement('a');
    link.href='https://www.youtube.com/watch?v='+encodeURIComponent(data.videoId);
    link.target='_blank';
    link.rel='noreferrer noopener';
    link.textContent='WATCH THIS STREAM ON YOUTUBE ↗';
    recovery.append(message,link);
    if(replace){host.replaceChildren(recovery);host.classList.remove('playing','docked');}
    else host.after(recovery);
  }

  // Attach through the official API. Reload after ready so an error emitted
  // before API attachment is retried with onError already registered.
  loadYouTubeAPI().then(api=>{
    if(!current())return;
    readyTimer=setTimeout(()=>recover(false),10000);
    new api.Player(iframe,{
      host:'https://www.youtube-nocookie.com',
      events:{
        onReady:event=>{
          clearTimeout(readyTimer);
          if(current())event.target.loadVideoById(data.videoId);
        },
        onError:()=>recover(true)
      }
    });
  }).catch(()=>recover(false));
  return iframe;
}
