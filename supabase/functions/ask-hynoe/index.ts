import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import helpIndex from "../_shared/hynoe-help-index.mjs";
import { isAllowedSiteOrigin } from "../_shared/site-chat-core.mjs";
import { validateAskInput, confidenceNumber } from "../_shared/ask-hynoe-engine.mjs";
import { rankHelpChunks, classifyRetrieval, buildFallbackAnswer } from "../_shared/help-retrieval.mjs";
import { buildGroundedPrompt, answerWithProvider } from "../_shared/help-provider.mjs";

const headers = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});
const fail = (origin:string,status:number,code:string,error:string) => new Response(JSON.stringify({error,code}),{status,headers:headers(origin)});
const sourceList = (sources:Array<{heading?:string,title?:string,url:string}>) => sources.slice(0,3).map((source) => ({ label:String(source.heading || source.title || "Hynoe source").slice(0,120), url:source.url }));

const userHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin=req.headers.get("origin") ?? "";
  if (!isAllowedSiteOrigin(origin)) return fail(origin,403,"origin_denied","Request origin is not allowed.");
  if (req.method !== "POST") return fail(origin,405,"method_not_allowed","POST is required.");
  let payload: unknown;
  try { payload=await req.json(); } catch { return fail(origin,400,"invalid_json","Request body must be valid JSON."); }
  const checked=validateAskInput(payload as Record<string,unknown>);
  if (!checked.ok) return fail(origin,checked.status,checked.code,checked.error);
  const userId=String(ctx.userClaims?.sub ?? ctx.userClaims?.id ?? "");
  if (!userId) return fail(origin,401,"unauthorized","Sign in is required.");

  const admin=ctx.supabaseAdmin;
  const requestId=crypto.randomUUID();
  const started=Date.now();
  const { data:claimed, error:rateError }=await admin.rpc("claim_site_help_request_slot",{p_user_id:userId,p_request_id:requestId,p_now:new Date(started).toISOString(),p_max_requests:8,p_window:"1 minute"});
  if (rateError) return fail(origin,500,"rate_limit_failed","Could not verify request limits.");
  if (!claimed) return fail(origin,429,"rate_limited","Ask Hynoe is getting too many questions from this session. Try again shortly.");
  const ranked=rankHelpChunks(checked.value.question,helpIndex.chunks,{limit:8});
  const classification=classifyRetrieval(ranked);
  const fallback=buildFallbackAnswer(checked.value.question,ranked);
  let answer=fallback.answer;
  let mode:"model"|"retrieval"="retrieval";

  // No provider is required for launch. When a server-side provider is configured, this path
  // can enhance a sufficiently grounded retrieval result without changing the browser contract.
  const provider:null=null;
  if (provider && classification.confidence !== "low" && !classification.conflict) {
    const prompt=buildGroundedPrompt({question:checked.value.question,history:checked.value.history,pagePath:checked.value.page_path,chunks:ranked.slice(0,5).map((item)=>item.chunk)});
    const generated=await answerWithProvider({provider,prompt,timeoutMs:5000});
    if (generated.ok) { answer=generated.answer.slice(0,4000); mode="model"; }
  }

  const confidence=confidenceNumber(classification.confidence);
  const sources=sourceList(fallback.sources);
  const latency=Date.now()-started;
  const sourceIds=ranked.slice(0,12).map((item)=>item.chunk.id);
  const unanswered=confidence <= .34;
  const [metricWrite,feedbackWrite]=await Promise.all([
    admin.from("site_help_request_metrics").update({mode,confidence:classification.confidence,source_count:sources.length,latency_ms:latency}).eq("request_id",requestId).eq("user_id",userId),
    admin.from("site_help_feedback").insert({request_id:requestId,user_id:userId,question:checked.value.question,answer_summary:answer.slice(0,1200),helpful:null,unanswered,source_ids:sourceIds,mode:mode === "model" ? "provider" : "retrieval",confidence:classification.confidence,page_path:checked.value.page_path,created_at:new Date(started).toISOString()}),
  ]);
  if (metricWrite.error) console.error("ask-hynoe metric write failed",metricWrite.error.code);
  if (feedbackWrite.error) console.error("ask-hynoe feedback write failed",feedbackWrite.error.code);
  return new Response(JSON.stringify({answer,sources,confidence,mode,request_id:requestId}),{status:200,headers:headers(origin)});
});

export default {
  async fetch(req:Request) {
    const origin=req.headers.get("origin") ?? "";
    if (req.method === "OPTIONS") {
      if (!isAllowedSiteOrigin(origin)) return fail(origin,403,"origin_denied","Request origin is not allowed.");
      return new Response(null,{status:204,headers:headers(origin)});
    }
    return userHandler(req);
  },
};
