export const languages = [
  { code: "en", name: "English" }
];

export const getLanguageName = (code) => {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : "English";
};
