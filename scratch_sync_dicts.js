const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');
const langs = ['en', 'tr', 'ru', 'uk'];

const dicts = {};
langs.forEach(l => {
  dicts[l] = JSON.parse(fs.readFileSync(path.join(dictDir, `${l}.json`), 'utf8'));
});

// Collect all keys in landing
const allLandingKeys = new Set();
langs.forEach(l => {
  Object.keys(dicts[l].landing).forEach(k => allLandingKeys.add(k));
});

// Sync
langs.forEach(l => {
  allLandingKeys.forEach(k => {
    if (dicts[l].landing[k] === undefined) {
      dicts[l].landing[k] = dicts['en'].landing[k] || dicts['tr'].landing[k] || "";
    }
  });
  fs.writeFileSync(path.join(dictDir, `${l}.json`), JSON.stringify(dicts[l], null, 2), 'utf8');
});

console.log('Synced all dictionary keys');
