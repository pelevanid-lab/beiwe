const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');

const updates = {
  tr: {
    kicker: "Seninle düşünen çalışma alanı",
    btn_download_short: "İndir",
  },
  en: {
    kicker: "The workspace that thinks with you",
    btn_download_short: "Download",
  },
  ru: {
    kicker: "Рабочее пространство, которое думает вместе с вами",
    btn_download_short: "Скачать",
  },
  uk: {
    kicker: "Робоча область, яка думає разом з вами",
    btn_download_short: "Завантажити",
  }
};

for (const [lang, dataToMerge] of Object.entries(updates)) {
  const filePath = path.join(dictDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.landing = { ...data.landing, ...dataToMerge };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
console.log('Kicker strings updated in dictionaries!');
