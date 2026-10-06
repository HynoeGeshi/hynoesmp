import type { PageModule } from '@/domain/pages/types';

export function ModuleRenderer({ module }: { module: PageModule }) {
  switch (module.type) {
    case 'hero':
      return <section className="page-module"><h2>{module.headline}</h2>{module.subheadline ? <p>{module.subheadline}</p> : null}</section>;
    case 'links':
      if (!module.links.length) return null;
      return <section className="page-module"><h2>Links</h2><div className="link-list">{module.links.map(x => <a key={x.url} href={x.url} rel="noreferrer">{x.label}</a>)}</div></section>;
    case 'features':
      if (!module.items.length) return null;
      return <section className="page-module"><h2>Features</h2><div className="module-grid">{module.items.map(x => <article key={x.title}><h3>{x.title}</h3><p>{x.description}</p></article>)}</div></section>;
    case 'services':
      if (!module.items.length) return null;
      return <section className="page-module"><h2>Services</h2><div className="module-grid">{module.items.map(x => <article key={x.name}><h3>{x.name}</h3>{x.description ? <p>{x.description}</p> : null}{x.priceLabel ? <strong>{x.priceLabel}</strong> : null}</article>)}</div></section>;
    case 'portfolio':
      if (!module.items.length) return null;
      return <section className="page-module"><h2>Portfolio</h2><div className="module-grid">{module.items.map(x => <article key={x.title}><h3>{x.title}</h3>{x.description ? <p>{x.description}</p> : null}</article>)}</div></section>;
    case 'updates':
      if (!module.items.length) return null;
      return <section className="page-module"><h2>Updates</h2>{module.items.map(x => <article key={x.title}><h3>{x.title}</h3><p>{x.summary}</p></article>)}</section>;
    case 'community':
      return <section className="page-module"><h2>Community</h2><p>{module.description}</p>{module.memberLabel ? <strong>{module.memberLabel}</strong> : null}</section>;
    case 'media':
      if (!module.items.length) return null;
      return <section className="page-module"><h2>Media</h2><div className="link-list">{module.items.map(x => <a key={x.url} href={x.url} rel="noreferrer">{x.title}</a>)}</div></section>;
    case 'cta':
      return <section className="page-module cta-module">{module.description ? <p>{module.description}</p> : null}<a className="primary-cta" href={module.url} rel="noreferrer">{module.label}</a></section>;
  }
}
