const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');

const updates = {
  tr: {
    book: {
      toc_title: "İÇİNDEKİLER",
      nav_home: "Ana Sayfa",
      nav_saule: "Saule Core",
      nav_workspace: "Çalışma Alanı →"
    }
  },
  en: {
    book: {
      toc_title: "TABLE OF CONTENTS",
      nav_home: "Home",
      nav_saule: "Saule Core",
      nav_workspace: "Workspace →"
    }
  },
  ru: {
    book: {
      toc_title: "ОГЛАВЛЕНИЕ",
      nav_home: "Главная",
      nav_saule: "Saule Core",
      nav_workspace: "Рабочая область →"
    }
  },
  uk: {
    book: {
      toc_title: "ЗМІСТ",
      nav_home: "Головна",
      nav_saule: "Saule Core",
      nav_workspace: "Робоча область →"
    }
  }
};

for (const [lang, dataToMerge] of Object.entries(updates)) {
  const filePath = path.join(dictDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.book = dataToMerge.book;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
console.log('Dictionaries updated!');
