/*! Copyright © 2026 Hynoe. All rights reserved. */
export function mergeMessages(current=[],incoming=[],limit=100){
  const byId=new Map();
  for(const item of [...current,...incoming]){
    if(!item||typeof item.id!=='string')continue;
    byId.set(item.id,item);
  }
  return [...byId.values()]
    .sort((a,b)=>(Number(a.createdAt)||0)-(Number(b.createdAt)||0)||a.id.localeCompare(b.id))
    .slice(-Math.max(1,limit));
}
