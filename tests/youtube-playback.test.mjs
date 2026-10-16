import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/watch-video.mjs',import.meta.url),'utf8');
function element(){return {textContent:'',href:'',disabled:false,children:[],classList:{add(){},toggle(){}},addEventListener(name,fn){this[name]=fn;},replaceChildren(...children){this.children=children;}};}
async function load(data){
  const play=element(),host=element(),youtube=element(),status=element(),title=element();
  host.querySelector=()=>play;
  const elements={video:host,youtube,'stream-status':status,'stream-title':title};
  vm.runInNewContext(source,{document:{getElementById:id=>elements[id],createElement:tag=>({...element(),tag})},fetch:async()=>({ok:true,json:async()=>data}),Date,encodeURIComponent});
  await new Promise(resolve=>setImmediate(resolve));
  return {play,host,youtube,status,title};
}

test('watch player rejects malformed video IDs and keeps a usable channel link',async()=>{
  const page=await load({videoId:'invalid-video-id-length'});
  assert.equal(page.play.disabled,true);
  assert.equal(page.youtube.href,'https://www.youtube.com/@Hynoe/streams');
  page.play.click?.();
  assert.equal(page.host.children.length,0);
});

test('direct fallback always opens the same YouTube video instead of trusting a supplied URL',async()=>{
  const page=await load({videoId:'rx5grCZ-3gM',title:'Hynoe',url:'https://other.example/'});
  assert.equal(page.youtube.href,'https://www.youtube.com/watch?v=rx5grCZ-3gM');
  page.play.click();
  assert.match(page.host.children[0].src,/^https:\/\/www\.youtube-nocookie\.com\/embed\/rx5grCZ-3gM\?/);
  assert.equal(page.host.children[0].referrerPolicy,'strict-origin-when-cross-origin');
  assert.equal(page.youtube.href,'https://www.youtube.com/watch?v=rx5grCZ-3gM');
});
