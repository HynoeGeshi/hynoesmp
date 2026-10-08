import { createHash } from 'node:crypto';
import type { PublicBusiness } from '../../data/public-businesses';

export function escapeHtml(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (c) => entities[c]!);
}

export function upgradePreview(original: string, businesses: readonly PublicBusiness[], now = new Date()): string {
  const cards = businesses.map((b) => {
    const stale = now.getTime() - Date.parse(`${b.checkedAt}T00:00:00Z`) > 90 * 86400000;
    const search = escapeHtml([b.name, b.category, b.city || '', ...b.keywords].join(' ').toLowerCase());
    return `<article class="directory-card" data-business-card data-search="${search}" data-business-category="${escapeHtml(b.category)}">
      <div class="directory-top"><span class="directory-monogram" aria-hidden="true">${escapeHtml(b.name.slice(0, 1))}</span><span class="directory-state">Unclaimed listing</span></div>
      <span class="directory-category">${escapeHtml(b.category)}${b.city ? ' · ' + escapeHtml(b.city) : ''}</span>
      <h3><a href="/p/${escapeHtml(b.slug)}">${escapeHtml(b.name)}</a></h3><p>${escapeHtml(b.summary)}</p>
      <div class="directory-source">${stale ? 'Source needs recheck' : 'Source reviewed'} · <time datetime="${b.checkedAt}">${b.checkedAt}</time></div>
      <div class="directory-actions"><a href="/p/${escapeHtml(b.slug)}">View listing <span aria-hidden="true">↗</span></a><a href="${escapeHtml(b.website)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(b.name)} business website (opens in a new tab)">Business website ↗</a></div>
    </article>`;
  }).join('');
  const section = `<section class="section directory-section" id="businesses" aria-labelledby="businesses-title">
    <div class="section-top"><div><div class="eyebrow">Beyond the Hynoe world</div><h2 id="businesses-title">A useful place to start.</h2><p class="section-desc">Explore real businesses and creative tools, then go straight to the source.</p></div><a class="text-link" href="/search?scope=directory">Explore the directory ↗</a></div>
    <div class="directory-disclosure"><strong>Public information. Not partnerships.</strong> These ${businesses.length} starter listings are independently compiled from business websites. They are unclaimed, unpaid and not endorsements. <a href="/listing-policy">How listings work ↗</a></div>
    <div class="directory-controls"><div class="directory-input"><label for="business-query">Find a business</label><input id="business-query" type="search" maxlength="200" placeholder="Try Chicago, music or design" autocomplete="off"></div><div class="directory-input"><label for="business-category">Category</label><select id="business-category"><option value="">All categories</option><option>Creative software</option><option>Music</option><option>Photo &amp; video</option></select></div><button class="button ghost" id="business-reset" type="button">Reset filters</button></div>
    <p class="directory-count" id="business-count" aria-live="polite">${businesses.length} public listings · no paid ordering</p><noscript><p>All listings appear below. Use the main Search to filter without JavaScript.</p></noscript>
    <div class="directory-grid">${cards}<aside class="directory-invite" id="directory-invite"><div class="eyebrow">Something of your own?</div><h3>Your next chapter<br>belongs here.</h3><p>Create a page for your work, service or community. Keep control of what you publish.</p><a class="button" href="/command-center/pages/new">Create your page ↗</a></aside></div>
    <div class="directory-empty" id="business-empty" hidden><h3>Nothing matches just yet.</h3><p>Try another name or category. No results does not mean a business is closed or unavailable.</p><button class="button ghost" id="business-reset-empty" type="button">Show all businesses</button></div>
    <p class="directory-footnote">Business names identify the businesses; they do not imply affiliation. <a href="/listing-policy#corrections">Correct a listing, request removal or ask about ownership →</a></p>
  </section>`;
  const css = `<style>
.directory-section{padding-bottom:18px}.directory-disclosure{padding:17px 20px;background:#ebe9e0;border:1px solid #d7d4c7;border-radius:12px;font-size:12px;line-height:1.85;color:#565244;margin-bottom:23px}.directory-disclosure strong{color:#332b20}.directory-disclosure a,.directory-footnote a{text-decoration:underline;text-underline-offset:3px}.directory-controls{display:none;gap:14px;align-items:end;margin:22px 0 14px}.js .directory-controls{display:flex}.directory-input{display:flex;flex-direction:column;gap:7px;flex:1;min-width:0}.directory-input:first-child{flex:2}.directory-input label{font-size:12px;font-weight:600}.directory-input input,.directory-input select{width:100%;min-height:48px;border:1px solid #c8c4b6;border-radius:9px;background:#fffefa;padding:11px 14px;color:#312c23}.directory-count{font-size:12px;color:#686256;margin:16px 0}.directory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.directory-card{background:#fffefa;border:1px solid #dbd7ca;border-radius:17px;padding:23px;display:flex;flex-direction:column;transition:transform .18s,box-shadow .18s}.directory-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px #3d2d0c0a}.directory-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:20px}.directory-monogram{width:45px;height:45px;background:#f0e8d7;border:1px solid #e0d0af;border-radius:13px;display:grid;place-items:center;font-family:Georgia,serif;font-size:25px;color:#7e6132}.directory-state{font-size:11px;border:1px solid #dcd8cd;border-radius:30px;padding:5px 9px;color:#645d4d}.directory-category{font-size:11px;color:#706756}.directory-card h3{font-size:22px;line-height:1.2;font-weight:500;letter-spacing:-.65px;margin:10px 0 12px}.directory-card h3 a:hover{text-decoration:underline;text-underline-offset:4px}.directory-card p{font-size:14px;line-height:1.75;color:#625c4f;margin:0 0 17px}.directory-source{font-size:11px;color:#6c6558;margin-top:auto;padding-top:8px}.directory-actions{display:flex;justify-content:space-between;gap:12px;align-items:center;border-top:1px solid #e4e0d5;margin-top:15px;padding-top:8px;flex-wrap:wrap}.directory-actions a{font-size:12px;display:inline-flex;align-items:center;min-height:44px;line-height:1.3}.directory-actions a:first-child{font-weight:600}.directory-actions a:hover{text-decoration:underline}.directory-invite{padding:29px;border:1px solid #d9c89f;border-radius:17px;background:#eadebf;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.directory-invite h3{font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.13;letter-spacing:-1px;margin:20px 0 15px}.directory-invite p{font-size:13px;line-height:1.8;color:#625338;margin:0 0 22px}.directory-footnote{font-size:12px;line-height:1.9;color:#696253;margin:19px 0 0}.directory-empty{padding:32px;border:1px dashed #c9bfaa;border-radius:14px;font-size:14px}.directory-empty h3{font-size:25px;font-weight:500;margin:0}.directory-empty p{color:#655b49}.hero-copy{font-size:17px}.card-body p,.section-desc,.community-card p,.watch-card p{font-size:14px}.card-actions,.footer-links,.credentials,.preview-note,.footer-bottom{font-size:12px}.button{font-size:13px;min-height:44px}.filters .filter{min-height:44px}.quick-search a,.text-link{min-height:32px;display:inline-flex;align-items:center}.footer-bottom{flex-wrap:wrap;line-height:1.7}.directory-section [hidden]{display:none!important}
@media(max-width:1040px){.header-row{flex-wrap:wrap}.js .desktop-nav{display:none}.js .menu-toggle{display:inline-flex;align-items:center;justify-content:center}.account-links{margin-left:auto}.account-links .sign-in{display:none}.header .button,.menu-toggle{min-height:44px}.directory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.directory-grid{grid-template-columns:1fr}.directory-controls{flex-wrap:wrap}.directory-input:first-child{flex-basis:100%}.directory-input select,.directory-input input{font-size:16px}.directory-card{padding:23px}.directory-card h3{font-size:24px}.directory-count{font-size:12px}.directory-disclosure{padding:16px;font-size:12px}.directory-invite{min-height:250px}.directory-invite h3{font-size:35px}.hero-copy{font-size:15px}.footer-top{flex-wrap:wrap}.footer-links{max-width:100%;font-size:12px}.footer-bottom{font-size:11px}.card-body p{font-size:12px}.card-actions{font-size:11px}.card-actions a:last-child{font-size:10px}.preview-note{font-size:12px}.credentials{font-size:11px}.network-strip p{font-size:10px}.network-names a{font-size:12px}.account-links .button{font-size:11px;gap:7px;padding-left:11px;padding-right:11px}.hero h1{font-size:clamp(40px,11vw,56px)}.desktop-nav{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.directory-card{transition:none}.directory-card:hover{transform:none}}
</style>`;
  const script = `<script>
(()=>{'use strict';const q=document.getElementById('business-query'),category=document.getElementById('business-category'),cards=[...document.querySelectorAll('[data-business-card]')],count=document.getElementById('business-count'),empty=document.getElementById('business-empty'),invite=document.getElementById('directory-invite');if(!q||!category)return;const apply=()=>{const terms=q.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);let n=0;cards.forEach(card=>{const visible=terms.every(term=>(card.dataset.search||'').includes(term))&&(!category.value||card.dataset.businessCategory===category.value);card.hidden=!visible;if(visible)n++});count.textContent=n+' of '+cards.length+' public listings · no paid ordering';empty.hidden=n!==0;invite.hidden=Boolean(q.value.trim()||category.value)};const reset=()=>{q.value='';category.value='';apply();q.focus()};q.addEventListener('input',apply);category.addEventListener('change',apply);document.getElementById('business-reset').addEventListener('click',reset);document.getElementById('business-reset-empty').addEventListener('click',reset);document.addEventListener('keydown',event=>{if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey)return;const target=event.target;if(target instanceof Element&&(target.closest('input,textarea,select')||target.closest('[contenteditable="true"]')))return;const field=document.getElementById('search-q');if(field){event.preventDefault();field.focus()}})})();
</script>`;
  return original
    .replaceAll('<a href="#creatorops">CreatorOps</a>', '<a href="#businesses">Businesses</a><a href="#creatorops">CreatorOps</a>')
    .replace('<section class="section" id="originals"', section + '<section class="section" id="originals"')
    .replace('</head>', css + '</head>')
    .replace('</body>', script + '</body>')
    .replace('PREVIEW 01 · PUBLIC FRONTEND ASSEMBLY · NO DOMAIN CUTOVER', 'PREVIEW 02 · DISCOVERY + PUBLIC DIRECTORY · NO DOMAIN CUTOVER')
    .replace('<a href="/">Current Search site</a>', '<a href="/">Current Search site</a><a href="/listing-policy">Listings &amp; privacy</a>')
    .replace('placeholder="What are you looking for?"', 'placeholder="Search names, interests or cities"')
    .replace('<option value="">Everything</option>', '<option value="">Everything</option><option value="local_business">Businesses</option>')
    .replace('A first look at one connected Hynoe.', 'Explore the connected Hynoe preview.');
}

export function previewHeaders(html: string): Record<string, string> {
  const hashes = (tag: string) => [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g'))]
    .map((match) => `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`).join(' ');
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Content-Security-Policy': ["default-src 'none'", "img-src 'self' https://hynoesmp.com", `style-src ${hashes('style') || "'none'"}`, `script-src ${hashes('script') || "'none'"}`, "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'"].join('; '),
  };
}
