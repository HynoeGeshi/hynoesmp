import { describe, expect, it } from 'vitest';
import { renderSearchHome, renderIndexEntry } from '@/lib/preview/search-home';
import { flagshipPages } from '@/data/flagship-pages';
import { publicBusinessPages } from '@/data/public-businesses';
import { previewHeaders } from '@/lib/preview/upgrade';
import { createHash } from 'node:crypto';

describe('same listing format for Hynoe projects and clients',()=>{
  it('renders only published pages with neutral alphabetic ordering',()=>{
    const pages=[...flagshipPages,...publicBusinessPages];
    const html=renderSearchHome([...pages,{...pages[0],slug:'secret-draft',status:'draft'}]);
    expect(html).not.toContain('/p/secret-draft');
    expect(html.match(/data-index-entry /g)).toHaveLength(10);
    expect(html.indexOf('/p/directory-adobe')).toBeLessThan(html.indexOf('/p/hynoe-flicks'));
    expect(html).not.toContain('class="ops-feature"');
  });
  it('uses exactly the same card structure for a client and an owner',()=>{
    const sample=flagshipPages[0];
    const client={...sample,id:'client',slug:'client',name:'Client Game'};
    const owner=renderIndexEntry(sample),external=renderIndexEntry(client);
    for(const marker of ['class="index-entry"','class="entry-meta"','class="entry-bottom"','View page']){expect(owner).toContain(marker);expect(external).toContain(marker);}
    expect(owner).toContain('Hynoe-owned page');expect(external).toContain('Published page');
  });
  it('escapes published text and keeps inline blocks covered by strict CSP',()=>{
    const html=renderSearchHome([{...flagshipPages[0],name:'<script>alert(1)</script>'}]);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    const csp=previewHeaders(html)['Content-Security-Policy'];
    for(const tag of ['style','script'])for(const match of html.matchAll(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag+'>','g')))expect(csp).toContain(createHash('sha256').update(match[1]).digest('base64'));
    expect(csp).not.toContain('unsafe-inline');
  });
});
