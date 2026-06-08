const STORAGE_KEY = 'managed-homepage-content';
const VIEW_STATS_KEY = 'managed-homepage-view-stats';


function recordPageView() {
  if (window.top !== window.self) return;
  const now = new Date().toISOString();
  let stats = { totalViews: 0, firstViewedAt: now, lastViewedAt: now };
  try {
    stats = { ...stats, ...(JSON.parse(localStorage.getItem(VIEW_STATS_KEY)) || {}) };
  } catch (error) {
    console.warn('访问统计格式错误，已重新初始化。', error);
  }
  stats.totalViews = Number(stats.totalViews || 0) + 1;
  stats.firstViewedAt = stats.firstViewedAt || now;
  stats.lastViewedAt = now;
  localStorage.setItem(VIEW_STATS_KEY, JSON.stringify(stats));
}

async function loadDefaultContent() {
  const response = await fetch('content.json');
  if (!response.ok) throw new Error('无法加载默认内容');
  return response.json();
}

function deepMerge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (base && typeof base === 'object') {
    const merged = { ...base };
    Object.keys(override || {}).forEach((key) => {
      merged[key] = deepMerge(base[key], override[key]);
    });
    return merged;
  }
  return override ?? base;
}

async function getContent() {
  const defaults = await loadDefaultContent();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaults;
  try {
    return deepMerge(defaults, JSON.parse(saved));
  } catch (error) {
    console.warn('已保存内容格式错误，回退到默认内容。', error);
    return defaults;
  }
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value || '';
  });
}

function renderList(target, items, renderer) {
  const element = document.querySelector(target);
  if (!element) return;
  element.innerHTML = '';
  (items || []).forEach((item, index) => element.appendChild(renderer(item, index)));
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function setImage(selector, src, alt) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.src = src;
  element.alt = alt;
}

function applySeo(seo) {
  if (seo?.title) document.title = seo.title;
  let description = document.querySelector('meta[name="description"]');
  if (!description) {
    description = document.createElement('meta');
    description.name = 'description';
    document.head.appendChild(description);
  }
  description.content = seo?.description || '';
}

function renderHomepage(content) {
  applySeo(content.seo);
  setImage('[data-logo]', content.brand.logo, `${content.brand.siteName} LOGO`);
  setText('[data-site-name]', content.brand.siteName);
  renderList('[data-nav]', content.brand.nav, (item) => {
    const link = createElement('a', '', item.label);
    link.href = item.target;
    return link;
  });

  setText('[data-eyebrow]', content.hero.eyebrow);
  setText('[data-headline]', content.hero.headline);
  setText('[data-description]', content.hero.description);
  const primaryCta = document.querySelector('[data-primary-cta]');
  const secondaryCta = document.querySelector('[data-secondary-cta]');
  if (primaryCta) { primaryCta.textContent = content.hero.primaryCta.label; primaryCta.href = content.hero.primaryCta.target; }
  if (secondaryCta) { secondaryCta.textContent = content.hero.secondaryCta.label; secondaryCta.href = content.hero.secondaryCta.target; }

  setImage('[data-avatar]', content.profile.avatar, `${content.profile.nickname} 头像`);
  setText('[data-nickname]', content.profile.nickname);
  setText('[data-title]', content.profile.title);
  setText('[data-location]', content.profile.location);
  setText('[data-bio]', content.profile.bio);
  renderList('[data-tags]', content.profile.tags, (tag) => createElement('li', '', tag));

  renderList('[data-stats]', content.stats, (stat) => {
    const card = createElement('div', 'stat');
    card.appendChild(createElement('strong', '', stat.value));
    card.appendChild(createElement('span', '', stat.label));
    return card;
  });
  renderList('[data-skills]', content.skills, (skill) => createElement('li', '', skill));

  renderList('[data-works]', content.works, (work) => {
    const card = createElement('article', 'work-card');
    const cover = createElement('div', 'work-cover', work.category);
    cover.style.background = work.cover;
    const body = createElement('div', 'work-body');
    body.appendChild(createElement('small', '', work.category));
    body.appendChild(createElement('h3', '', work.title));
    body.appendChild(createElement('p', '', work.summary));
    const link = createElement('a', 'text-link', '查看详情 →');
    link.href = work.link || '#';
    body.appendChild(link);
    card.appendChild(cover);
    card.appendChild(body);
    return card;
  });

  renderList('[data-timeline]', content.timeline, (item) => {
    const row = createElement('div', 'timeline-item');
    row.appendChild(createElement('strong', '', item.period));
    row.appendChild(createElement('h3', '', item.title));
    row.appendChild(createElement('p', '', item.description));
    return row;
  });

  setText('[data-email]', content.contact.email);
  setText('[data-phone]', content.contact.phone);
  setText('[data-wechat]', content.contact.wechat);
  const emailLink = document.querySelector('[data-email-link]');
  if (emailLink) emailLink.href = `mailto:${content.contact.email}`;
  renderList('[data-socials]', content.contact.socials, (social) => {
    const link = createElement('a', 'text-link', social.label);
    link.href = social.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  recordPageView();
  const content = await getContent();
  renderHomepage(content);
});
