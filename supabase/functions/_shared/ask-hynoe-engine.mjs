import { rankHelpChunks, classifyRetrieval, buildFallbackAnswer } from './help-retrieval.mjs';
import { buildGroundedPrompt, answerWithProvider } from './help-provider.mjs';
import { validateAskPayload, confidenceNumber } from './ask-hynoe-core.mjs';

const clean=(value,max)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const safePage=(value)=>{const page=String(value??'').trim();return /^\/[A-Za-z0-9_./-]{0,220}$/.test(page)?page:'/';};
const LIVE_STATUS_RE=/\b(?:how many players|players? online|online players?|server status|is (?:the )?(?:minecraft )?server (?:online|up)|(?:minecraft )?server (?:online|up|down|offline))\b/i;
const PLAYER_COUNT_RE=/\b(?:how many players|players? online|online players?)\b/i;

export { confidenceNumber };

export function validateAskInput(payload={}) {
  const checked=validateAskPayload(payload);
  if (!checked.ok) return checked;
  return {ok:true,value:{question:checked.value.question,history:checked.value.history,page_path:checked.value.pagePath}};
}

export function isLiveServerStatusQuestion(question='') {
  return LIVE_STATUS_RE.test(clean(question,600));
}

function liveServerAnswer(question,status) {
  if (!isLiveServerStatusQuestion(question) || !status || typeof status.online!=='boolean') return null;
  const online=Number(status?.players?.online);
  const max=Number(status?.players?.max);
  const hasOnline=Number.isFinite(online) && online>=0;
  const hasMax=Number.isFinite(max) && max>0;
  if (!status.online) return 'Hynoe SMP appears to be offline right now.';
  if (PLAYER_COUNT_RE.test(clean(question,600)) && hasOnline) {
    return `Hynoe SMP is online right now with ${online}${hasMax ? ` / ${max}` : ''} players online.`;
  }
  if (hasOnline) return `Hynoe SMP is online right now. ${online}${hasMax ? ` / ${max}` : ''} players are online.`;
  return 'Hynoe SMP is online right now.';
}

function sourceList(ranked=[], classification={}) {
  if (classification.confidence==='low' || classification.conflict) return [];
  const seen=new Set();
  const sources=[];
  for (const result of ranked) {
    const chunk=result?.chunk;
    if (!chunk?.url || seen.has(chunk.url)) continue;
    seen.add(chunk.url);
    sources.push({
      id:clean(chunk.id,128),
      label:clean(chunk.heading||chunk.title||'Hynoe source',120),
      url:safePage(chunk.url),
    });
    if (sources.length>=4) break;
  }
  return sources;
}

export async function answerAskHynoe({question,history=[],pagePath='/',chunks=[],provider=null,providerTimeoutMs=5000,liveServerStatus=null}={}) {
  const liveAnswer=liveServerAnswer(question,liveServerStatus);
  if (liveAnswer) {
    return {
      answer:liveAnswer,
      sources:[{id:'live-server-status',label:'Join Hynoe SMP',url:'/join.html'}],
      confidence:0.9,
      mode:'live',
      confidence_label:'high',
      conflict:false,
    };
  }

  const ranked=rankHelpChunks(question,chunks,{limit:8});
  const classification=classifyRetrieval(ranked);
  const fallback=buildFallbackAnswer(question,ranked);
  const sources=sourceList(ranked,classification);
  const confidence=confidenceNumber(classification.confidence);

  if (provider && classification.confidence!=='low' && !classification.conflict) {
    const prompt=buildGroundedPrompt({question,history,pagePath,chunks:ranked.slice(0,6).map((result)=>result.chunk)});
    const generated=await answerWithProvider({provider,prompt,timeoutMs:providerTimeoutMs});
    if (generated.ok) {
      return {answer:generated.answer.slice(0,4000),sources,confidence,mode:'model',confidence_label:classification.confidence,conflict:false};
    }
  }

  return {answer:fallback.answer,sources,confidence,mode:'retrieval',confidence_label:classification.confidence,conflict:Boolean(classification.conflict)};
}
