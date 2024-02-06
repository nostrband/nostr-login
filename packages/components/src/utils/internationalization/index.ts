import { I18n } from "i18n-js";
import en from "./en.json";
import ru from "./ru.json";

export const i18n = new I18n({
  en: {
    ...en
  },
  ru: {
    ...ru
  },
});
