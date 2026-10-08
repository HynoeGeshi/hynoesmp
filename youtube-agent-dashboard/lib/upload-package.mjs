export function uploadPackage(clip,mediaSha256){
 const tags=(clip.hashtags||[]).filter(x=>typeof x==='string').map(x=>x.replace(/^#/,'')).filter(Boolean).slice(0,25);
 const cut=(s,n)=>[...s].slice(0,n).join('');
 return {clip_candidate_id:clip.id,video_source_id:clip.video_source_id,start_ms:clip.start_ms,end_ms:clip.end_ms,render_uri:clip.render_uri,media_sha256:mediaSha256,
  metadata:{snippet:{title:cut(clip.title||'Hynoe Short',100),description:cut([clip.description||'',tags.map(x=>'#'+x).join(' ')].filter(Boolean).join('\n\n'),5000),tags,categoryId:'20'},status:{privacyStatus:'private',selfDeclaredMadeForKids:false}}};
}
