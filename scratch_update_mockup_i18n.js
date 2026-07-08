const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');

const updates = {
  tr: {
    mockup_search: "Ahmet Bey'in Salı randevusunu iptal et",
    mockup_tab_appointments: "Randevular",
    mockup_tab_customers: "Müşteriler",
    mockup_tag_canceling: "İPTAL EDİLMEK ÜZERE",
    mockup_time: "Salı, 14:00",
    mockup_name: "Ahmet Yılmaz",
    mockup_desc: "Proje Sunumu ve Değerlendirme",
    mockup_ai_text_1: "Randevuyu iptal edip, müşteri detay sayfasına ",
    mockup_ai_text_2: "\"fiyat yüksek bulunduğu için 14 Temmuz 2026 Salı günü olan randevumuz iptal edildi\"",
    mockup_ai_text_3: " notu ekleyeyim mi?",
    mockup_btn_yes: "Evet, ekle",
    mockup_btn_cancel_only: "Sadece iptal et",
    mockup_footer: "Arama çubuğuna yazarsınız. Modül açılır, Clarity Engine arkada nedeni bularak size teklif sunar."
  },
  en: {
    mockup_search: "Cancel Ahmet's Tuesday appointment",
    mockup_tab_appointments: "Appointments",
    mockup_tab_customers: "Customers",
    mockup_tag_canceling: "ABOUT TO CANCEL",
    mockup_time: "Tuesday, 14:00",
    mockup_name: "Ahmet Yilmaz",
    mockup_desc: "Project Presentation & Review",
    mockup_ai_text_1: "Should I cancel the appointment and add the note ",
    mockup_ai_text_2: "\"our Tuesday, July 14, 2026 appointment was cancelled due to high pricing\"",
    mockup_ai_text_3: " to the customer detail page?",
    mockup_btn_yes: "Yes, add note",
    mockup_btn_cancel_only: "Just cancel",
    mockup_footer: "You type in the search bar. The module opens, and Clarity Engine finds the context in the background and makes an offer."
  },
  ru: {
    mockup_search: "Отменить встречу с Ахметом во вторник",
    mockup_tab_appointments: "Встречи",
    mockup_tab_customers: "Клиенты",
    mockup_tag_canceling: "ОТМЕНЯЕТСЯ",
    mockup_time: "Вторник, 14:00",
    mockup_name: "Ахмет Йылмаз",
    mockup_desc: "Презентация и оценка проекта",
    mockup_ai_text_1: "Отменить встречу и добавить примечание ",
    mockup_ai_text_2: "\"наша встреча во вторник, 14 июля 2026 года, была отменена из-за высокой цены\"",
    mockup_ai_text_3: " на страницу клиента?",
    mockup_btn_yes: "Да, добавить",
    mockup_btn_cancel_only: "Только отменить",
    mockup_footer: "Вы пишете в строке поиска. Модуль открывается, Clarity Engine находит причину в фоновом режиме и предлагает решение."
  },
  uk: {
    mockup_search: "Скасувати зустріч з Ахметом у вівторок",
    mockup_tab_appointments: "Зустрічі",
    mockup_tab_customers: "Клієнти",
    mockup_tag_canceling: "СКАСОВУЄТЬСЯ",
    mockup_time: "Вівторок, 14:00",
    mockup_name: "Ахмет Їлмаз",
    mockup_desc: "Презентація та оцінка проекту",
    mockup_ai_text_1: "Скасувати зустріч і додати примітку ",
    mockup_ai_text_2: "\"нашу зустріч у вівторок, 14 липня 2026 року, було скасовано через високу ціну\"",
    mockup_ai_text_3: " на сторінку клієнта?",
    mockup_btn_yes: "Так, додати",
    mockup_btn_cancel_only: "Тільки скасувати",
    mockup_footer: "Ви пишете в рядку пошуку. Модуль відкривається, Clarity Engine знаходить причину у фоновому режимі і пропонує рішення."
  }
};

for (const [lang, dataToMerge] of Object.entries(updates)) {
  const filePath = path.join(dictDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Merge into data.landing
    data.landing = { ...data.landing, ...dataToMerge };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
console.log('Mockup Dictionaries updated!');
