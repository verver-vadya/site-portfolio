// Проверка полей заявки и тексты сообщений (перенесено из scripts/form.ts старого сайта)

export type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export const TIMEOUT_MS = 15000;

const pluralRules = new Intl.PluralRules("ru");
const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const form = pluralRules.select(n);
  return form === "one" ? one : form === "few" ? few : many;
};

const ru = {
  required: "Заполните это поле",
  checkbox: "Отметьте этот пункт",
  choice: "Выберите один из вариантов",
  contact: "Напишите ник в Telegram (например, @name), телефон из 10 цифр после +7 или почту",
  tooShort: (n: number) => `Нужно хотя бы ${n} ${plural(n, ["символ", "символа", "символов"])}`,
  invalidSummary: "Проверьте выделенные поля",
  sending: "Отправляю…",
  success: "Заявка отправлена. Отвечу в течение дня туда, куда вы указали.",
  offline: "Нет подключения к интернету. Данные сохранены: проверьте сеть и нажмите «Отправить» ещё раз.",
  timeout: "Сервер не ответил вовремя. Данные сохранены, попробуйте отправить ещё раз.",
  network: "Не удалось связаться с сервером. Данные сохранены, попробуйте ещё раз через минуту.",
  server: "Сервер не принял заявку. Данные сохранены, попробуйте ещё раз через минуту.",
  notConfigured: "Форма ещё не подключена к приёму заявок. Напишите мне в Telegram или на почту, ссылки рядом.",
};

const en: typeof ru = {
  required: "Please fill in this field",
  checkbox: "Please tick this box",
  choice: "Please choose one of the options",
  contact: "Enter a Telegram handle (for example, @name), a phone number with country code or an email",
  tooShort: (n: number) => `At least ${n} ${n === 1 ? "character" : "characters"}, please`,
  invalidSummary: "Please check the highlighted fields",
  sending: "Sending…",
  success: "Request sent. I’ll reply within a day wherever you said.",
  offline: "No internet connection. Your answers are kept: check the network and press “Send” again.",
  timeout: "The server didn’t answer in time. Your answers are kept, please try again.",
  network: "Couldn’t reach the server. Your answers are kept, please try again in a minute.",
  server: "The server didn’t accept the request. Your answers are kept, please try again in a minute.",
  notConfigured: "The form isn’t connected yet. Please message me on Telegram or by email, the links are next to it.",
};

export const TEXTS = { ru, en };
export type Text = typeof ru;

function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
  return digits;
}

// Telegram (@name или t.me/name), телефон или почта.
// Русская форма ждёт российский номер (10 цифр после +7), английская — любой номер с кодом страны.
export function isContact(value: string, anyPhone = false) {
  if (/^(@|https?:\/\/t\.me\/|t\.me\/)?[a-z0-9_]{5,32}$/i.test(value) && /[a-z]/i.test(value)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  if (!/^[\d\s()+.-]+$/.test(value)) return false;
  if (anyPhone) {
    const n = value.replace(/\D/g, "").length;
    return n >= 7 && n <= 15;
  }
  return phoneDigits(value).length === 10;
}

// Пустая строка — поле в порядке. У группы переключателей проверяется вся группа.
export function validateField(input: Field, form: HTMLFormElement, TEXT: Text = ru) {
  if (input instanceof HTMLInputElement && input.type === "radio") {
    const group = [...form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(input.name)}"]`)];
    const required = group.some((r) => r.required);
    return required && !group.some((r) => r.checked) ? input.dataset.errorRequired || TEXT.choice : "";
  }
  if (input instanceof HTMLInputElement && input.type === "checkbox") {
    return input.required && !input.checked ? input.dataset.errorRequired || TEXT.checkbox : "";
  }
  const value = input.value.trim();
  if (input.required && value === "") return input.dataset.errorRequired || TEXT.required;
  if (value === "") return "";
  if (input.dataset.validate === "contact" && !isContact(value, TEXT !== ru)) return TEXT.contact;
  if ("minLength" in input && input.minLength > 0 && value.length < input.minLength) return TEXT.tooShort(input.minLength);
  return "";
}
