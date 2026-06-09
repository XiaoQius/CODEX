const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const contentPath = path.join(root, 'public', 'content.json');
const requiredFiles = [
  'public/index.html',
  'public/admin.html',
  'public/app.js',
  'public/admin.js',
  'public/styles.css',
  'server.js'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertString(value, name) {
  assert(typeof value === 'string' && value.trim().length > 0, `${name} must be a non-empty string`);
}

function assertArray(value, name) {
  assert(Array.isArray(value) && value.length > 0, `${name} must be a non-empty array`);
}

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} is missing`);
}

const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

assertString(content.brand.logo, 'brand.logo');
assertString(content.brand.siteName, 'brand.siteName');
assertArray(content.brand.nav, 'brand.nav');
content.brand.nav.forEach((item, index) => {
  assertString(item.label, `brand.nav[${index}].label`);
  assertString(item.target, `brand.nav[${index}].target`);
});

assertString(content.profile.avatar, 'profile.avatar');
assertString(content.profile.nickname, 'profile.nickname');
assertString(content.profile.title, 'profile.title');
assertString(content.profile.bio, 'profile.bio');
assertArray(content.profile.tags, 'profile.tags');

assertString(content.hero.headline, 'hero.headline');
assertString(content.hero.description, 'hero.description');
assertString(content.hero.primaryCta.label, 'hero.primaryCta.label');
assertString(content.hero.primaryCta.target, 'hero.primaryCta.target');
assertString(content.hero.secondaryCta.label, 'hero.secondaryCta.label');
assertString(content.hero.secondaryCta.target, 'hero.secondaryCta.target');

assertArray(content.stats, 'stats');
content.stats.forEach((item, index) => {
  assertString(item.value, `stats[${index}].value`);
  assertString(item.label, `stats[${index}].label`);
});

assertArray(content.skills, 'skills');
assertArray(content.works, 'works');
content.works.forEach((item, index) => {
  assertString(item.title, `works[${index}].title`);
  assertString(item.category, `works[${index}].category`);
  assertString(item.cover, `works[${index}].cover`);
  assertString(item.summary, `works[${index}].summary`);
});

assertArray(content.timeline, 'timeline');
content.timeline.forEach((item, index) => {
  assertString(item.period, `timeline[${index}].period`);
  assertString(item.title, `timeline[${index}].title`);
  assertString(item.description, `timeline[${index}].description`);
});

assertString(content.contact.email, 'contact.email');
assertString(content.contact.phone, 'contact.phone');
assertString(content.contact.wechat, 'contact.wechat');
assertArray(content.contact.socials, 'contact.socials');
assertString(content.seo.title, 'seo.title');
assertString(content.seo.description, 'seo.description');

console.log('Content schema and required files are valid.');
