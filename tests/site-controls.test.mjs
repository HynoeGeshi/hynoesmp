import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const commonSource=readFileSync(new URL('../assets/common.js',import.meta.url),'utf8');
const checklistSource=readFileSync(new URL('../assets/start.js',import.meta.url),'utf8');

function element(tag='div',attributes={}){
  const attrs=new Map(Object.entries(attributes)),classes=new Set((attributes.class||'').split(/\s+/).filter(Boolean));
  return {
    tag,children:[],dataset:{},style:{setProperty(){}},textContent:'',innerHTML:'',
    get id(){return attrs.get('id');},set id(value){attrs.set('id',value);},
    get href(){return attrs.get('href');},set href(value){attrs.set('href',value);},
    classList:{add(...names){names.forEach(name=>classes.add(name));},remove(...names){names.forEach(name=>classes.delete(name));},contains(name){return classes.has(name);},toggle(name,force){const on=force??!classes.has(name);if(on)classes.add(name);else classes.delete(name);return on;},[Symbol.iterator](){return classes.values();}},
    getAttribute(name){return attrs.get(name)??null;},setAttribute(name,value){attrs.set(name,String(value));},removeAttribute(name){attrs.delete(name);},
    append(...nodes){this.children.push(...nodes);},appendChild(node){this.append(node);},prepend(node){this.children.unshift(node);},
    insertBefore(node,before){const at=this.children.indexOf(before);this.children.splice(at<0?this.children.length:at,0,node);},
    querySelector(){return null;},querySelectorAll(){return [];},addEventListener(name,callback){this[name]=callback;}
  };
}

function loadCommon({page='home',path='/',links=[]}={}){
  const body=element('body'),hotbar=element('nav'),main=element('main');
  body.dataset.page=page;hotbar.children=links;
  hotbar.querySelector=selector=>hotbar.children.find(link=>(selector.includes('[data-outpost-link]')&&link.dataset.outpostLink)||(selector.includes('href="watch.html"')&&link.href==='watch.html')||(selector.includes('href="/watch.html"')&&link.href==='/watch.html'))||null;
  const document={body,documentElement:element('html'),createElement:tag=>element(tag),getElementById:()=>null,addEventListener(){},
    querySelector(selector){return selector==='.hotbar'?hotbar:selector==='main'?main:null;},
    querySelectorAll(selector){return selector==='.hotbar a'?hotbar.children:[];}};
  vm.runInNewContext(commonSource,{document,location:new URL(path,'https://hynoesmp.com'),URL,window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},clearTimeout(){} });
  return {body,hotbar,mission:main.children.find(node=>node.className==='app-mission')};
}

test('current navigation clears stale states and recognizes an existing root-relative Watch link',()=>{
  const join=element('a',{href:'join.html',class:'hotbar-slot active','aria-current':'page'});
  const watch=element('a',{href:'/watch.html',class:'hotbar-slot'});
  const {hotbar}=loadCommon({page:'watch',path:'/watch.html',links:[join,watch]});
  assert.equal(hotbar.children.length,2,'an existing Watch destination must not be duplicated');
  assert.deepEqual(hotbar.children.filter(link=>link.classList.contains('active')),[watch]);
  assert.equal(watch.getAttribute('aria-current'),'page');
  assert.equal(join.getAttribute('aria-current'),null);
});

test('home path marks one exact destination and an unlisted page marks none',()=>{
  const home=element('a',{href:'index.html',class:'hotbar-slot'});
  const duplicate=element('a',{href:'index.html',class:'hotbar-slot active','aria-current':'page'});
  const join=element('a',{href:'join.html',class:'hotbar-slot active','aria-current':'page'});
  loadCommon({links:[home,duplicate,join]});
  assert.deepEqual([home,duplicate,join].filter(link=>link.classList.contains('active')),[home]);
  assert.equal(duplicate.getAttribute('aria-current'),null);
  loadCommon({page:'discovery',path:'/modded-minecraft-server.html',links:[home,duplicate,join]});
  assert.equal([home,duplicate,join].filter(link=>link.classList.contains('active')).length,0);
  assert.equal([home,duplicate,join].filter(link=>link.getAttribute('aria-current')).length,0);
});

test('the shared shell still supplies Watch when the static navigation lacks it',()=>{
  const {hotbar}=loadCommon({links:[element('a',{href:'index.html'})]});
  assert.equal(hotbar.children.filter(link=>link.href==='watch.html').length,1);
});

test('install and discovery missions use their own context and intended next destinations',()=>{
  const install=loadCommon({page:'modpack',path:'/modpack.html'});
  assert.match(install.mission.innerHTML,/INSTALL MISSION/);
  assert.match(install.mission.innerHTML,/href="#install-steps"/);
  assert.match(install.body.children.find(node=>node.className==='world-context').innerHTML,/CLIENT WORKSHOP/);
  const discovery=loadCommon({page:'discovery',path:'/modded-minecraft-server.html'});
  assert.match(discovery.mission.innerHTML,/DISCOVERY MISSION/);
  assert.match(discovery.mission.innerHTML,/href="start.html"/);
  assert.match(discovery.body.children.find(node=>node.className==='world-context').innerHTML,/DISCOVERY GATE/);
});

test('checklist labels and pressed state describe the task initially and after either toggle',()=>{
  const headings=['Secure the basics.','Use RTP, TPA, and Waystones.'];
  const items=headings.map((text,index)=>{
    const item=element('article'),heading=element('h2'),button=element('button');
    item.dataset.check=String(index);heading.textContent=text;
    item.querySelector=selector=>selector==='.quest-check'?button:selector==='h2'?heading:null;
    return item;
  });
  const storage=new Map([['hynoeFirstDayChecksV3','["0"]']]);
  vm.runInNewContext(checklistSource,{document:{querySelectorAll:()=>items,getElementById:()=>null},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}});
  const first=items[0].querySelector('.quest-check'),second=items[1].querySelector('.quest-check');
  assert.equal(first.getAttribute('aria-pressed'),'true');
  assert.equal(second.getAttribute('aria-pressed'),'false');
  assert.equal(first.getAttribute('aria-label'),'Mark understood: '+headings[0]);
  assert.equal(second.getAttribute('aria-label'),'Mark understood: '+headings[1]);
  first.click();second.click();
  assert.equal(first.getAttribute('aria-pressed'),'false');
  assert.equal(second.getAttribute('aria-pressed'),'true');
  assert.equal(first.getAttribute('aria-label'),'Mark understood: '+headings[0]);
  assert.equal(second.getAttribute('aria-label'),'Mark understood: '+headings[1]);
  assert.equal(first.textContent,'□');assert.equal(second.textContent,'✓');
  assert.equal(storage.get('hynoeFirstDayChecksV3'),'["1"]');
});
