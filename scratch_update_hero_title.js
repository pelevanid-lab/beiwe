const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');

const updates = {
  tr: {
    hero_title: [
      { t: "Beiwe ", c: "ink" },
      { t: "ile ", c: "orange" },
      { t: "her işin ", c: "ink" },
      { t: "kolayı var.", c: "orange" }
    ]
  },
  en: {
    hero_title: [
      { t: "With ", c: "orange" },
      { t: "Beiwe, ", c: "ink" },
      { t: "everything ", c: "ink" },
      { t: "is easier.", c: "orange" }
    ]
  },
  ru: {
    hero_title: [
      { t: "С ", c: "orange" },
      { t: "Beiwe ", c: "ink" },
      { t: "всё ", c: "ink" },
      { t: "проще.", c: "orange" }
    ]
  },
  uk: {
    hero_title: [
      { t: "З ", c: "orange" },
      { t: "Beiwe ", c: "ink" },
      { t: "все ", c: "ink" },
      { t: "простіше.", c: "orange" }
    ]
  }
};

for (const [lang, dataToMerge] of Object.entries(updates)) {
  const filePath = path.join(dictDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.landing = { ...data.landing, hero_title: dataToMerge.hero_title };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
console.log('Hero titles updated in dictionaries!');
