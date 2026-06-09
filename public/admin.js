const STORAGE_KEY = 'managed-homepage-content';
const META_STORAGE_KEY = 'managed-homepage-admin-meta';
const VIEW_STATS_KEY = 'managed-homepage-view-stats';
const THEME_STORAGE_KEY = 'managed-homepage-admin-theme';


const statusEl = document.querySelector('[data-status]');
const form = document.querySelector('[data-admin-form]');
let content = null;

const schemas = {
  nav: [
    ['label', '导航文字'],
    ['target', '跳转地址']
  ],
  stats: [
    ['value', '数字'],
    ['label', '说明']
  ],
  works: [
    ['title', '作品标题'],
    ['category', '分类'],
    ['cover', '封面 CSS / 图片地址'],
    ['summary', '简介', 'textarea'],
    ['link', '作品链接']
  ],
  timeline: [
    ['period', '时间'],
    ['title', '标题'],
    ['description', '描述', 'textarea']
  ],
  socials: [
    ['label', '平台名称'],
    ['url', '链接地址']
  ]
};

async function loadDefaultContent() {
  const response = await fetch('content.json');
  if (!response.ok) throw new Error('无法加载默认内容');
  return response.json();
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#dc2626' : '#059669';
  if (message) setTimeout(() => { statusEl.textContent = ''; }, 3600);
}

function getByPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function setByPath(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((current, key) => {
    if (current && typeof current === 'object') return current[key];
    return undefined;
  }, object);
  if (target && typeof target === 'object') target[last] = value;
}


function readStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    console.warn(`${key} 格式错误，已使用默认值。`, error);
    return fallback;
  }
}



function readAdminTheme() {
  return readStoredJson(THEME_STORAGE_KEY, { theme: 'blue', mode: 'light' });
}

function applyAdminTheme(settings) {
  const theme = settings.theme || 'blue';
  const mode = settings.mode === 'dark' ? 'dark' : 'light';
  document.body.classList.remove('theme-blue', 'theme-purple', 'theme-cyan', 'theme-green', 'theme-orange', 'theme-pink', 'theme-red', 'dark-mode');
  document.body.classList.add(`theme-${theme}`);
  document.body.classList.toggle('dark-mode', mode === 'dark');
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.classList.toggle('active', button.dataset.theme === theme);
  });
  const modeToggle = document.querySelector('[data-mode-toggle]');
  if (modeToggle) modeToggle.textContent = mode === 'dark' ? '亮色模式' : '暗色模式';
}

function saveAdminTheme(settings) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
  applyAdminTheme(settings);
}

function initAdminTheme() {
  let settings = readAdminTheme();
  applyAdminTheme(settings);
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.addEventListener('click', () => {
      settings = { ...settings, theme: button.dataset.theme };
      saveAdminTheme(settings);
    });
  });
  document.querySelector('[data-mode-toggle]')?.addEventListener('click', () => {
    settings = { ...settings, mode: settings.mode === 'dark' ? 'light' : 'dark' };
    saveAdminTheme(settings);
  });
}



function formatDateTime(value) {
  if (!value) return '暂无记录';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function filled(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function calculateCompletion() {
  const checks = [
    content.brand.logo,
    content.brand.siteName,
    content.profile.avatar,
    content.profile.nickname,
    content.profile.title,
    content.profile.bio,
    content.hero.headline,
    content.hero.description,
    content.contact.email,
    content.contact.phone,
    content.contact.wechat,
    content.seo.title,
    content.seo.description
  ];
  const completed = checks.filter(filled).length;
  return Math.round((completed / checks.length) * 100);
}

function metricCard(label, value, helper) {
  const card = document.createElement('article');
  card.className = 'metric-card';
  card.innerHTML = `<span>${label}</span><strong>${value}</strong><small>${helper}</small>`;
  return card;
}



function scoreDesignReview(completion, works, activeContacts) {
  return [
    ['内容完整度', completion, '核心资料与 SEO 字段覆盖率'],
    ['视觉层级', Math.min(100, 58 + (content.brand.nav || []).length * 7 + (content.stats || []).length * 5), '导航、数据与章节结构'],
    ['功能性', Math.min(100, 52 + activeContacts * 8 + works.length * 3), '联系方式、作品链接与发布动作'],
    ['一致性', Math.min(100, 64 + (content.profile.tags || []).length * 4 + (content.skills || []).length * 2), '标签、技能和品牌叙事统一度'],
    ['创新性', Math.min(100, 62 + works.filter((work) => filled(work.cover)).length * 6), '封面表达与作品差异化']
  ];
}

function updateDesignReview(completion, works, activeContacts) {
  const review = document.querySelector('[data-design-review]');
  if (!review) return;
  review.innerHTML = '';
  scoreDesignReview(completion, works, activeContacts).forEach(([label, score, helper]) => {
    const item = document.createElement('div');
    item.className = 'review-row';
    item.innerHTML = `
      <div><strong>${label}</strong><small>${helper}</small></div>
      <span>${score}</span>
      <i style="--score:${score}%"></i>
    `;
    review.appendChild(item);
  });
}



function updateDashboardStats() {
  const metrics = document.querySelector('[data-dashboard-metrics]');
  const insights = document.querySelector('[data-dashboard-insights]');
  if (!metrics || !insights || !content) return;

  const viewStats = readStoredJson(VIEW_STATS_KEY, { totalViews: 0 });
  const meta = readStoredJson(META_STORAGE_KEY, {});
  const completion = calculateCompletion();
  const works = content.works || [];
  const contacts = [content.contact.email, content.contact.phone, content.contact.wechat, ...(content.contact.socials || []).map((item) => item.url)];
  const activeContacts = contacts.filter(filled).length;

  metrics.innerHTML = '';
  [
    ['访问次数', Number(viewStats.totalViews || 0), '仅统计本浏览器前台访问'],
    ['资料完整度', `${completion}%`, 'LOGO、头像、昵称、SEO 等关键项'],
    ['作品数量', works.length, '前台作品集卡片数量'],
    ['技能标签', (content.skills || []).length, '能力矩阵展示项'],
    ['导航菜单', (content.brand.nav || []).length, '前台顶部导航项'],
    ['联系方式', activeContacts, '邮箱、电话、微信与社交链接']
  ].forEach(([label, value, helper]) => metrics.appendChild(metricCard(label, value, helper)));


  updateDesignReview(completion, works, activeContacts);



  const linkedWorks = works.filter((work) => filled(work.link) && work.link !== '#').length;
  insights.innerHTML = '';
  [
    `最近保存：${formatDateTime(meta.lastSavedAt)}`,
    `最近前台访问：${formatDateTime(viewStats.lastViewedAt)}`,
    `带外链作品：${linkedWorks}/${works.length}`,
    completion < 100 ? '建议补全资料与 SEO 字段，以便前台展示更完整。' : '资料已完整，可直接发布展示。'
  ].forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    insights.appendChild(item);
  });
}

function bindInputs() {
  document.querySelectorAll('[data-path]').forEach((field) => {
    field.value = getByPath(content, field.dataset.path) || '';
    field.addEventListener('input', () => {
      setByPath(content, field.dataset.path, field.value.trim());
      refreshPreview();
      updateDashboardStats();
    });
  });
}

function createField(path, label, value, type = 'input') {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
  input.value = value || '';
  input.addEventListener('input', () => {
    setByPath(content, path, input.value.trim());
    refreshPreview();
    updateDashboardStats();
  });
  wrapper.append(labelEl, input);
  return wrapper;
}

function renderRepeatList(name, path, emptyItem) {
  const container = document.querySelector(`[data-repeat="${name}"]`);
  const list = getByPath(content, path);
  container.innerHTML = '';
  list.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'repeat-card';
    const header = document.createElement('div');
    header.className = 'repeat-card-header';
    const title = document.createElement('strong');
    title.textContent = `${container.dataset.title || '项目'} ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = '删除';
    remove.addEventListener('click', () => {
      list.splice(index, 1);
      renderAllRepeatLists();
      refreshPreview();
      updateDashboardStats();
    });
    header.append(title, remove);
    card.appendChild(header);
    schemas[name].forEach(([key, label, type]) => {
      card.appendChild(createField(`${path}.${index}.${key}`, label, item[key], type));
    });
    container.appendChild(card);
  });

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn secondary add-row';
  add.textContent = `新增${container.dataset.title || '项目'}`;
  add.addEventListener('click', () => {
    list.push({ ...emptyItem });
    renderAllRepeatLists();
    refreshPreview();
    updateDashboardStats();
  });
  container.appendChild(add);
}

function renderChipEditor(name, path) {
  const container = document.querySelector(`[data-chips="${name}"]`);
  const list = getByPath(content, path);
  container.innerHTML = '';
  const textarea = document.createElement('textarea');
  textarea.value = list.join('，');
  textarea.placeholder = '使用逗号分隔，例如：品牌设计，Web 开发，作品集';
  textarea.addEventListener('input', () => {
    setByPath(content, path, textarea.value.split(/[,，]/).map((item) => item.trim()).filter(Boolean));
    refreshPreview();
    updateDashboardStats();
  });
  container.appendChild(textarea);
}

function renderAllRepeatLists() {
  renderRepeatList('nav', 'brand.nav', { label: '新导航', target: '#' });
  renderRepeatList('stats', 'stats', { value: '0', label: '新数据' });
  renderRepeatList('works', 'works', { title: '新作品', category: 'Category', cover: 'linear-gradient(135deg, #2563eb, #7c3aed)', summary: '作品简介', link: '#' });
  renderRepeatList('timeline', 'timeline', { period: '2026', title: '新经历', description: '经历描述' });
  renderRepeatList('socials', 'contact.socials', { label: '平台', url: 'https://' });
  renderChipEditor('tags', 'profile.tags');
  renderChipEditor('skills', 'skills');
}

function refreshPreview() {
  const preview = document.querySelector('[data-preview]');
  if (preview?.contentWindow) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    preview.contentWindow.location.reload();
  }
}

function saveContent() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify({ lastSavedAt: new Date().toISOString() }));
  refreshPreview();
  updateDashboardStats();
  setStatus('已保存，前台内容已更新。');
}

async function resetContent() {
  content = await loadDefaultContent();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify({ lastSavedAt: new Date().toISOString() }));
  bindInputs();
  renderAllRepeatLists();
  refreshPreview();
  updateDashboardStats();
  setStatus('已恢复默认内容。');
}

function exportContent() {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'homepage-content.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('已导出内容 JSON。');
}

function importContent(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      content = JSON.parse(reader.result);
      bindInputs();
      renderAllRepeatLists();
      saveContent();
      setStatus('导入成功。');
    } catch (error) {
      setStatus('导入失败：JSON 格式不正确。', true);
    }
  };
  reader.readAsText(file);
}

async function init() {

  initAdminTheme();


  const defaults = await loadDefaultContent();
  const saved = localStorage.getItem(STORAGE_KEY);
  try {
    content = saved ? JSON.parse(saved) : defaults;
  } catch (error) {
    console.warn('已保存内容格式错误，回退到默认内容。', error);
    content = defaults;
    localStorage.removeItem(STORAGE_KEY);
  }
  bindInputs();
  renderAllRepeatLists();
  updateDashboardStats();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveContent();
  });
  document.querySelector('[data-reset]').addEventListener('click', resetContent);
  document.querySelector('[data-export]').addEventListener('click', exportContent);
  document.querySelector('[data-import]').addEventListener('change', (event) => {
    if (event.target.files?.[0]) importContent(event.target.files[0]);
  });
}

init().catch((error) => setStatus(error.message, true));
