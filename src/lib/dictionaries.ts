const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  tr: () => import('./dictionaries/tr.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  if (locale !== 'en' && locale !== 'tr') {
    return dictionaries.tr();
  }
  return dictionaries[locale as keyof typeof dictionaries]();
};
