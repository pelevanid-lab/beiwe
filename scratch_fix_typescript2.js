const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');

const enFile = JSON.parse(fs.readFileSync(path.join(dictDir, 'en.json'), 'utf8'));

['tr'].forEach(lang => {
  const filePath = path.join(dictDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Copy all missing keys from en.landing to data.landing
    for (const [key, value] of Object.entries(enFile.landing)) {
      if (!(key in data.landing)) {
        data.landing[key] = value;
      }
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
});
console.log('Fixed TypeScript missing keys in tr.');
