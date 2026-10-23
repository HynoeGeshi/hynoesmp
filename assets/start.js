
(()=>{
 const items=[...document.querySelectorAll('.quest-step[data-check]')], key='hynoeFirstDayChecksV3';
 let done=[];try{done=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(done))done=[];}catch{done=[];}
 const fill=document.getElementById('firstday-fill'),count=document.getElementById('firstday-count');
 function sync(){items.forEach(it=>{const yes=done.includes(it.dataset.check);it.classList.toggle('complete',yes);const b=it.querySelector('.quest-check');if(b){b.textContent=yes?'✓':'□';b.setAttribute('aria-pressed',String(yes));b.setAttribute('aria-label','Mark understood: '+(it.querySelector('h2')?.textContent.trim()||'this step'));}});const n=items.filter(it=>done.includes(it.dataset.check)).length;if(fill)fill.style.width=Math.round(n/items.length*100)+'%';if(count)count.textContent=n+' / '+items.length+' understood';localStorage.setItem(key,JSON.stringify(done));}
 items.forEach(it=>it.querySelector('.quest-check')?.addEventListener('click',()=>{const id=it.dataset.check;done=done.includes(id)?done.filter(x=>x!==id):[...done,id];sync();}));
 sync();
})();
