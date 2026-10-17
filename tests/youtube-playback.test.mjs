import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const helperPath=new URL('../assets/youtube-player.mjs',import.meta.url);
const helper=existsSync(helperPath)?readFileSync(helperPath,'utf8').replace(/^export /gm,''):'';
const source=readFileSync(new URL('../assets/watch-video.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function element(){return {textContent:'',href:'',disabled:false,children:[],siblings:[],classList:{add(){},remove(){},toggle(){}},setAttribute(name,value){this[name]=value;},addEventListener(name,fn){this[name]=fn;},replaceChildren(...children){this.children=children;},append(...children){this.children.push(...children);},contains(node){return this.children.includes(node);},after(node){this.siblings.push(node);},remove(){}};}
async function load(data){
  const play=element(),host=element(),youtube=element(),status=element(),title=element();
  const scripts=[],players=[],timers=new Map();let timerId=0;
  const window={location:{origin:'https://hynoesmp.com',href:'https://hynoesmp.com/watch.html'}};
  host.querySelector=()=>play;
  const elements={video:host,youtube,'stream-status':status,'stream-title':title};
  const context={window,document:{head:{append:script=>scripts.push(script)},getElementById:id=>elements[id],createElement:tag=>({...element(),tag})},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:async()=>({ok:true,json:async()=>data}),Date,encodeURIComponent};
  vm.runInNewContext(helper+'\n'+source,context);
  await new Promise(resolve=>setImmediate(resolve));
  return {play,host,youtube,status,title,scripts,players,window,
    async ready(){window.YT={Player:function(iframe,options){players.push({iframe,options});}};window.onYouTubeIframeAPIReady?.();await new Promise(resolve=>setImmediate(resolve));},
    expire(){for(const [id,callback] of [...timers]){timers.delete(id);callback();}}
  };
}

test('watch player rejects malformed video IDs and keeps a usable channel link',async()=>{
  const page=await load({videoId:'invalid-video-id-length'});
  assert.equal(page.play.disabled,true);
  assert.equal(page.youtube.href,'https://www.youtube.com/@Hynoe/streams');
  page.play.click?.();
  assert.equal(page.host.children.length,0);
});

test('official player API loads only after the on-site Play action',async()=>{
  const page=await load({videoId:'4Zzh8igpifQ'});
  assert.equal(page.scripts.length,0);
  assert.equal(page.host.children.length,0);
  page.play.click();
  assert.equal(page.scripts.length,1);
  assert.equal(page.scripts[0].src,'https://www.youtube.com/iframe_api');
  assert.match(page.host.children[0].src,/enablejsapi=1/);
});

test('official playback errors replace the failed iframe with a same-video direct watch action',async()=>{
  for(const code of [5,100,101,150,153]){
    const page=await load({videoId:'4Zzh8igpifQ',title:'Hynoe stream'});
    page.play.click();
    await page.ready();
    assert.equal(page.players.length,1,'official YT.Player must own error events');
    page.players[0].options.events.onError({data:code});
    const recovery=page.host.children[0];
    assert.equal(recovery.tag,'div');
    assert.equal(recovery.children.find(child=>child.tag==='a')?.href,'https://www.youtube.com/watch?v=4Zzh8igpifQ');
    assert.equal(page.window.location.href,'https://hynoesmp.com/watch.html');
  }
});

test('ready player reloads its requested video with listeners installed and stays available while paused or playing',async()=>{
  const page=await load({videoId:'4Zzh8igpifQ'});
  page.play.click();const iframe=page.host.children[0];
  await page.ready();
  assert.equal(page.players.length,1);
  const loads=[];
  page.players[0].options.events.onReady({target:{loadVideoById:id=>loads.push(id)}});
  assert.deepEqual(loads,['4Zzh8igpifQ']);
  page.expire();
  assert.equal(page.host.children[0],iframe);
  assert.equal(page.host.siblings.length,0);
});

test('blocked monitoring API keeps native player and adds a direct watch recovery action',async()=>{
  const page=await load({videoId:'4Zzh8igpifQ'});
  page.play.click();const iframe=page.host.children[0];
  assert.equal(page.scripts.length,1);
  page.scripts[0].onerror();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(page.host.children[0],iframe);
  assert.equal(page.host.siblings[0]?.children.find(child=>child.tag==='a')?.href,'https://www.youtube.com/watch?v=4Zzh8igpifQ');
});

test('missing player-ready handshake offers recovery without mistaking a paused video for an error',async()=>{
  const page=await load({videoId:'4Zzh8igpifQ'});
  page.play.click();const iframe=page.host.children[0];
  await page.ready();
  page.expire();
  assert.equal(page.host.children[0],iframe);
  assert.equal(page.host.siblings[0]?.children.find(child=>child.tag==='a')?.href,'https://www.youtube.com/watch?v=4Zzh8igpifQ');
});

test('direct fallback always opens the same YouTube video instead of trusting a supplied URL',async()=>{
  const page=await load({videoId:'rx5grCZ-3gM',title:'Hynoe',url:'https://other.example/'});
  assert.equal(page.youtube.href,'https://www.youtube.com/watch?v=rx5grCZ-3gM');
  page.play.click();
  assert.match(page.host.children[0].src,/^https:\/\/www\.youtube-nocookie\.com\/embed\/rx5grCZ-3gM\?/);
  assert.equal(page.host.children[0].referrerPolicy,'strict-origin-when-cross-origin');
  assert.equal(page.youtube.href,'https://www.youtube.com/watch?v=rx5grCZ-3gM');
});
