const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'content', 'books');

const translations = {
  en: {
    "Beiwe Kitabı": "Beiwe Book",
    "Çok Katmanlı Akıllı Çalışma Alanı Anayasası": "Multi-Layered Smart Workspace Constitution",
    "Versiyon 2.0": "Version 2.0",
    "Bölüm 1 — Beiwe Neden Var?": "Chapter 1 — Why does Beiwe exist?",
    "Günümüz iş dünyasının problemi: Yazılım Yorgunluğu": "The problem of today's business world: Software Fatigue",
    "Statik Menü paradigmasının sınırları": "The limits of the Static Menu paradigm",
    "AI neden tek başına çözüm değil": "Why AI is not a solution alone",
    "Context neden kayboluyor": "Why context is getting lost",
    "Workspace neden yeniden tasarlanmalı": "Why workspace should be redesigned",
    "Clarity Engine (Netlik Motoru) Neden Kalbimizdir?": "Why Clarity Engine is our heart?",
    "Bölüm 2 — Manifesto": "Chapter 2 — Manifesto",
    "Bölüm 3 — Netlik Modeli": "Chapter 3 — Clarity Model",
    "1. Intent (Niyet)": "1. Intent",
    "2. System Awareness (Sıfır Sürtünme)": "2. System Awareness (Zero Friction)",
    "3. Progressive Clarification (Kademeli Netleştirme)": "3. Progressive Clarification",
    "4. Decision & Action (Eylem)": "4. Decision & Action",
    "5. Memory (Hafıza)": "5. Memory",
    "Bölüm 4 — Workspace İlkeleri": "Chapter 4 — Workspace Principles",
    "Bölüm 5 — Ürün İlkeleri": "Chapter 5 — Product Principles",
    "Bölüm 6 — Tasarım Dili": "Chapter 6 — Design Language",
    "Bölüm 7 — Etkileşim Dili": "Chapter 7 — Interaction Language",
    "Bölüm 8 — Hareket Dili": "Chapter 8 — Motion Language",
    "Bölüm 9 — Saule Entegrasyonu": "Chapter 9 — Saule Integration",
    "Teknik Doğru ve Kurumsal Algı": "Technical Truth and Corporate Perception",
    "Soğuk Başlangıç (Cold Start) ve Tanışma": "Cold Start and Onboarding"
  },
  ru: {
    "Beiwe Kitabı": "Книга Beiwe",
    "Çok Katmanlı Akıllı Çalışma Alanı Anayasası": "Многоуровневая конституция умной рабочей области",
    "Versiyon 2.0": "Версия 2.0",
    "Bölüm 1 — Beiwe Neden Var?": "Глава 1 — Почему существует Beiwe?",
    "Bölüm 2 — Manifesto": "Глава 2 — Манифест",
    "Bölüm 3 — Netlik Modeli": "Глава 3 — Модель ясности",
    "Bölüm 4 — Workspace İlkeleri": "Глава 4 — Принципы рабочей области",
    "Bölüm 5 — Ürün İlkeleri": "Глава 5 — Принципы продукта",
    "Bölüm 6 — Tasarım Dili": "Глава 6 — Язык дизайна",
    "Bölüm 7 — Etkileşim Dili": "Глава 7 — Язык взаимодействия",
    "Bölüm 8 — Hareket Dili": "Глава 8 — Язык движений",
    "Bölüm 9 — Saule Entegrasyonu": "Глава 9 — Интеграция Saule"
  },
  uk: {
    "Beiwe Kitabı": "Книга Beiwe",
    "Çok Katmanlı Akıllı Çalışma Alanı Anayasası": "Багаторівнева конституція розумної робочої області",
    "Versiyon 2.0": "Версія 2.0",
    "Bölüm 1 — Beiwe Neden Var?": "Розділ 1 — Чому існує Beiwe?",
    "Bölüm 2 — Manifesto": "Розділ 2 — Маніфест",
    "Bölüm 3 — Netlik Modeli": "Розділ 3 — Модель ясності",
    "Bölüm 4 — Workspace İlkeleri": "Розділ 4 — Принципи робочої області",
    "Bölüm 5 — Ürün İlkeleri": "Розділ 5 — Принципи продукту",
    "Bölüm 6 — Tasarım Dili": "Розділ 6 — Мова дизайну",
    "Bölüm 7 — Etkileşim Dili": "Розділ 7 — Мова взаємодії",
    "Bölüm 8 — Hareket Dili": "Розділ 8 — Мова рухів",
    "Bölüm 9 — Saule Entegrasyonu": "Розділ 9 — Інтеграція Saule"
  }
};

for (const [lang, map] of Object.entries(translations)) {
  const filePath = path.join(dictDir, `${lang}.md`);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [trString, targetString] of Object.entries(map)) {
      // Escape for regex to handle parentheses
      const safeTrString = trString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(safeTrString, 'g'), targetString);
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Markdown files translated (headers at least)!');
