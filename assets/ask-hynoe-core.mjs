export const ASK_HYNOE_HISTORY_KEY='hynoeAskHistory';
export const ASK_HYNOE_HISTORY_MAX=6;
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const clean=(value,max)=>String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim().slice(0,max);
const safePage=(value)=>{const page=String(value??'').trim();return /^\/[A-Za-z0-9_./-]{0,220}$/.test(page)?page:'/';};

function normalizeTurn(turn){
 if(!turn||!['user','assistant'].includes(turn.role)) throw new Error('History role must be user or assistant.');
 const raw=String(turn.content??'');
 const content=clean(raw,501);
 if(!content||content.length>500||CONTROL.test(raw)) throw new Error('History content must be 1–500 readable characters.');
 return {role:turn.role,content};
}

export function appendTurn(history=[],turn,maxTurns=ASK_HYNOE_HISTORY_MAX){
 const next=[...(Array.isArray(history)?history:[]).map(normalizeTurn),normalizeTurn(turn)];
 return next.slice(-Math.max(1,Math.min(ASK_HYNOE_HISTORY_MAX,Number(maxTurns)||ASK_HYNOE_HISTORY_MAX)));
}

export function buildAskRequest(question,history=[],pagePath='/'){
 const raw=String(question??'');
 const value=clean(raw,601);
 if(!value||value.length>600||CONTROL.test(raw)) throw new Error('Question must be 1–600 readable characters.');
 const bounded=(Array.isArray(history)?history:[]).slice(-ASK_HYNOE_HISTORY_MAX).map(normalizeTurn);
 return {question:value,history:bounded,page_path:safePage(pagePath)};
}

export function formatHelpSources(sources=[]){
 const result=[];const seen=new Set();
 for(const source of Array.isArray(sources)?sources:[]){
  const url=String(source?.url??'').trim();
  if(!/^\/[A-Za-z0-9_./-]{0,220}$/.test(url)||seen.has(url)) continue;
  seen.add(url);
  const label=clean(source?.label||'Hynoe source',120);
  result.push({label:label||'Hynoe source',url});
  if(result.length>=4) break;
 }
 return result;
}

export function shouldShowUncertainState(confidence){
 const value=Number(confidence);
 return !Number.isFinite(value)||value<0.5;
}

export function loadAskHistory(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem?.(ASK_HYNOE_HISTORY_KEY);
  if(!raw)return[];
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed))return[];
  return parsed.slice(-ASK_HYNOE_HISTORY_MAX).map(normalizeTurn);
 }catch{return[];}
}
export function saveAskHistory(storage=globalThis.localStorage,history=[]){
 const safe=(Array.isArray(history)?history:[]).slice(-ASK_HYNOE_HISTORY_MAX).map(normalizeTurn);
 storage?.setItem?.(ASK_HYNOE_HISTORY_KEY,JSON.stringify(safe));
 return safe;
}
export function clearAskHistory(storage=globalThis.localStorage){storage?.removeItem?.(ASK_HYNOE_HISTORY_KEY);return[];}
