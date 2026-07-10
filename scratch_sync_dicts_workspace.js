const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'src', 'lib', 'dictionaries');

const updates = {
  tr: {
    workspace: {
      no_contacts: "Bu odada henüz hiç kişi yok.",
      docs_title: "Oda Dokümanları",
      tasks_title: "Oda Görevleri",
      no_docs: "Bu rafta/odada henüz bir doküman yok.",
      add_shelf: "Raf Ekle",
      shelf_hall: "Hol",
      no_tasks_room: "Bu odada bekleyen görev yok.",
      no_tasks_shelf: "Bu rafta bekleyen görev yok.",
      task_placeholder: "Bu odaya yeni bir görev ekleyin...",
      btn_add: "Ekle",
      title: "Zihin Odaları",
      btn_new_room: "Yeni Oda",
      soon: "(Yakında)",
      add_room: "Oda Ekle",
      room_name: "İşletme / Oda Adı",
      room_type: "İşletme Türü / Rolünüz",
      room_goals: "Amaçlar ve Hedefler",
      btn_cancel: "Vazgeç",
      btn_create_room: "Zihin Odasını Kur"
    },
    docs: {
      btn_text_doc: "Metin Belgesi",
      btn_sheet: "Tablo (Excel)",
      untitled_sheet: "İsimsiz Tablo",
      sheet_name_placeholder: "Tablo Adı",
      select_room: "Oda Seçin...",
      shelf_hall_option: "Raf (Hol)",
      btn_save: "Kaydet",
      error_saving_sheet: "Tablo kaydedilirken bir hata oluştu.",
      untitled_doc: "İsimsiz Doküman",
      doc_placeholder: "Bir şeyler yazın veya yapay zekaya komut verin...",
      doc_name_placeholder: "Doküman Adı",
      error_saving_doc: "Doküman kaydedilirken bir hata oluştu."
    }
  },
  en: {
    workspace: {
      no_contacts: "There are no contacts in this room yet.",
      docs_title: "Room Documents",
      tasks_title: "Room Tasks",
      no_docs: "There are no documents in this shelf/room yet.",
      add_shelf: "Add Shelf",
      shelf_hall: "Hall",
      no_tasks_room: "There are no pending tasks in this room.",
      no_tasks_shelf: "There are no pending tasks in this shelf.",
      task_placeholder: "Add a new task to this room...",
      btn_add: "Add",
      title: "Mind Rooms",
      btn_new_room: "New Room",
      soon: "(Soon)",
      add_room: "Add Room",
      room_name: "Business / Room Name",
      room_type: "Business Type / Your Role",
      room_goals: "Goals and Objectives",
      btn_cancel: "Cancel",
      btn_create_room: "Create Mind Room"
    },
    docs: {
      btn_text_doc: "Text Document",
      btn_sheet: "Spreadsheet (Excel)",
      untitled_sheet: "Untitled Spreadsheet",
      sheet_name_placeholder: "Spreadsheet Name",
      select_room: "Select Room...",
      shelf_hall_option: "Shelf (Hall)",
      btn_save: "Save",
      error_saving_sheet: "An error occurred while saving the spreadsheet.",
      untitled_doc: "Untitled Document",
      doc_placeholder: "Type something or give AI a command...",
      doc_name_placeholder: "Document Name",
      error_saving_doc: "An error occurred while saving the document."
    }
  },
  ru: {
    workspace: {
      no_contacts: "В этой комнате пока нет контактов.",
      docs_title: "Документы Комнаты",
      tasks_title: "Задачи Комнаты",
      no_docs: "На этой полке/в комнате пока нет документов.",
      add_shelf: "Добавить Полку",
      shelf_hall: "Холл",
      no_tasks_room: "В этой комнате нет ожидающих задач.",
      no_tasks_shelf: "На этой полке нет ожидающих задач.",
      task_placeholder: "Добавить новую задачу в эту комнату...",
      btn_add: "Добавить",
      title: "Комнаты Разума",
      btn_new_room: "Новая Комната",
      soon: "(Скоро)",
      add_room: "Добавить Комнату",
      room_name: "Бизнес / Название Комнаты",
      room_type: "Тип Бизнеса / Ваша Роль",
      room_goals: "Цели и Задачи",
      btn_cancel: "Отмена",
      btn_create_room: "Создать Комнату Разума"
    },
    docs: {
      btn_text_doc: "Текстовый Документ",
      btn_sheet: "Электронная Таблица (Excel)",
      untitled_sheet: "Безымянная Таблица",
      sheet_name_placeholder: "Название Таблицы",
      select_room: "Выберите Комнату...",
      shelf_hall_option: "Полка (Холл)",
      btn_save: "Сохранить",
      error_saving_sheet: "Произошла ошибка при сохранении таблицы.",
      untitled_doc: "Безымянный Документ",
      doc_placeholder: "Напишите что-нибудь или дайте ИИ команду...",
      doc_name_placeholder: "Название Документа",
      error_saving_doc: "Произошла ошибка при сохранении документа."
    }
  },
  uk: {
    workspace: {
      no_contacts: "У цій кімнаті ще немає контактів.",
      docs_title: "Документи Кімнати",
      tasks_title: "Завдання Кімнати",
      no_docs: "На цій полиці/в кімнаті ще немає документів.",
      add_shelf: "Додати Полицю",
      shelf_hall: "Хол",
      no_tasks_room: "У цій кімнаті немає очікуваних завдань.",
      no_tasks_shelf: "На цій полиці немає очікуваних завдань.",
      task_placeholder: "Додати нове завдання в цю кімнату...",
      btn_add: "Додати",
      title: "Кімнати Розуму",
      btn_new_room: "Нова Кімната",
      soon: "(Незабаром)",
      add_room: "Додати Кімнату",
      room_name: "Бізнес / Назва Кімнати",
      room_type: "Тип Бізнесу / Ваша Роль",
      room_goals: "Цілі та Завдання",
      btn_cancel: "Скасувати",
      btn_create_room: "Створити Кімнату Розуму"
    },
    docs: {
      btn_text_doc: "Текстовий Документ",
      btn_sheet: "Електронна Таблиця (Excel)",
      untitled_sheet: "Безіменна Таблиця",
      sheet_name_placeholder: "Назва Таблиці",
      select_room: "Оберіть Кімнату...",
      shelf_hall_option: "Полиця (Хол)",
      btn_save: "Зберегти",
      error_saving_sheet: "Виникла помилка під час збереження таблиці.",
      untitled_doc: "Безіменний Документ",
      doc_placeholder: "Напишіть щось або дайте ШІ команду...",
      doc_name_placeholder: "Назва Документа",
      error_saving_doc: "Виникла помилка під час збереження документа."
    }
  }
};

for (const [lang, dataToMerge] of Object.entries(updates)) {
  const filePath = path.join(dictDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.app = data.app || {};
    data.app.workspace = { ...data.app.workspace, ...dataToMerge.workspace };
    data.app.docs = { ...data.app.docs, ...dataToMerge.docs };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
console.log('Dictionaries updated!');
