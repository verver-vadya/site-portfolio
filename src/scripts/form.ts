// Форма заявки (data-form): проверка ввода на русском и честная отправка.
// «Спасибо» показываем только после ответа сервера; при ошибке данные остаются в полях.
// Без JS форма отправляется обычным POST, а браузер сам проверяет обязательные поля.
// Перенесено из site-template (assets/js/form.js), добавлены группы переключателей и поле «контакт».

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const TIMEOUT_MS = 15000;

const pluralRules = new Intl.PluralRules("ru");
const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const form = pluralRules.select(n);
  return form === "one" ? one : form === "few" ? few : many;
};

const TEXT = {
  required: "Заполните это поле",
  checkbox: "Отметьте этот пункт",
  choice: "Выберите один из вариантов",
  contact: "Напишите ник в Telegram (например, @name), телефон из 10 цифр после +7 или почту",
  tooShort: (n: number) => `Нужно хотя бы ${n} ${plural(n, ["символ", "символа", "символов"])}`,
  invalidSummary: "Проверьте выделенные поля",
  sending: "Отправляю…",
  success: "Заявка отправлена. Отвечу в течение дня туда, куда вы указали.",
  offline: "Нет подключения к интернету. Данные сохранены: проверьте сеть и нажмите «Отправить» ещё раз.",
  timeout: "Сервер не ответил вовремя. Данные сохранены, попробуйте отправить ещё раз.",
  network: "Не удалось связаться с сервером. Данные сохранены, попробуйте ещё раз через минуту.",
  server: "Сервер не принял заявку. Данные сохранены, попробуйте ещё раз через минуту.",
  notConfigured: "Форма ещё не подключена к приёму заявок. Напишите мне в Telegram или на почту, ссылки ниже.",
};

function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
  return digits;
}

// Telegram (@name или t.me/name), телефон или почта
function isContact(value: string) {
  if (/^(@|https?:\/\/t\.me\/|t\.me\/)?[a-z0-9_]{5,32}$/i.test(value) && /[a-z]/i.test(value)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  return /^[\d\s()+-]+$/.test(value) && phoneDigits(value).length === 10;
}

function validateField(input: Field, form: HTMLFormElement) {
  if (input instanceof HTMLInputElement && input.type === "radio") {
    const group = form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${input.name}"]`);
    const required = [...group].some((r) => r.required);
    return required && ![...group].some((r) => r.checked) ? input.dataset.errorRequired || TEXT.choice : "";
  }
  if (input instanceof HTMLInputElement && input.type === "checkbox") {
    return input.required && !input.checked ? input.dataset.errorRequired || TEXT.checkbox : "";
  }
  const value = input.value.trim();
  if (input.required && value === "") return input.dataset.errorRequired || TEXT.required;
  if (value === "") return "";
  if (input.dataset.validate === "contact" && !isContact(value)) return TEXT.contact;
  if ("minLength" in input && input.minLength > 0 && value.length < input.minLength) return TEXT.tooShort(input.minLength);
  return "";
}

// у группы переключателей ошибка одна на всю группу, у остальных — под полем
function errorElement(input: Field) {
  const box = input.closest<HTMLElement>(".field")!;
  const id = `${box.dataset.name || input.id}-error`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("p");
    el.className = "field__error";
    el.id = id;
    el.hidden = true;
    box.append(el);
  }
  return el;
}

function showError(input: Field, message: string, form: HTMLFormElement) {
  const el = errorElement(input);
  const targets: Field[] =
    input instanceof HTMLInputElement && input.type === "radio"
      ? [...form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${input.name}"]`)]
      : [input];
  el.textContent = message;
  el.hidden = !message;
  for (const t of targets) {
    const describedBy = (t.getAttribute("aria-describedby") || "").split(" ").filter((id) => id && id !== el.id);
    if (message) {
      t.setAttribute("aria-invalid", "true");
      describedBy.unshift(el.id);
    } else t.removeAttribute("aria-invalid");
    if (describedBy.length) t.setAttribute("aria-describedby", describedBy.join(" "));
    else t.removeAttribute("aria-describedby");
  }
}

function initForm(form: HTMLFormElement) {
  form.noValidate = true; // проверяем сами, с понятными сообщениями
  const all = [...form.querySelectorAll<Field>("input, textarea, select")].filter(
    (el) => el.type !== "hidden" && !el.classList.contains("form__trap") && (el.id || el.type === "radio")
  );
  // у группы переключателей проверяем первый, он отвечает за всю группу
  const seen = new Set<string>();
  const fields = all.filter((el) => {
    if (el.type !== "radio") return true;
    if (seen.has(el.name)) return false;
    seen.add(el.name);
    return true;
  });
  const firstOf = (el: Field) => fields.find((f) => f.type === "radio" && f.name === el.name) ?? el;

  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const buttonText = button.textContent;
  const status = form.querySelector<HTMLElement>(".form__status");
  let sending = false;
  // Пока кнопку отправки нажимают, ошибку при уходе из поля не показываем: она сдвинула бы кнопку
  // из-под курсора, и нажатие потерялось бы. Поля всё равно проверит отправка.
  let pressingSubmit = false;
  button.addEventListener("pointerdown", () => {
    pressingSubmit = true;
    document.addEventListener("pointerup", () => setTimeout(() => (pressingSubmit = false)), { once: true });
  });

  const setStatus = (state: string, message: string) => {
    if (!status) return;
    status.dataset.state = state;
    status.textContent = message;
    status.hidden = !message;
  };

  const setBusy = (busy: boolean) => {
    sending = busy;
    button.disabled = busy;
    button.setAttribute("aria-busy", String(busy));
    button.textContent = busy ? TEXT.sending : buttonText;
  };

  all.forEach((input) => {
    const toggle = input.type === "checkbox" || input.type === "radio";
    // Ошибку показываем, когда человек ушёл из поля, а убираем сразу, как только он её исправил
    if (!toggle) {
      input.addEventListener("blur", () => {
        if (pressingSubmit) return;
        if (!input.hasAttribute("aria-invalid") && input.value.trim() === "") return;
        showError(input, validateField(input, form), form);
      });
    }
    input.addEventListener(toggle || input.tagName === "SELECT" ? "change" : "input", () => {
      if (input.hasAttribute("aria-invalid")) showError(firstOf(input), validateField(firstOf(input), form), form);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return; // защита от двойного клика

    let firstInvalid: Field | null = null;
    fields.forEach((input) => {
      const message = validateField(input, form);
      showError(input, message, form);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      setStatus("error", TEXT.invalidSummary);
      (firstInvalid as Field).focus();
      return;
    }

    if (/YOUR_FORM_ID/.test(form.action)) {
      setStatus("error", TEXT.notConfigured);
      return;
    }
    if (!navigator.onLine) {
      setStatus("error", TEXT.offline);
      return;
    }

    setBusy(true);
    setStatus("", "");
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setStatus("success", TEXT.success);
    } catch (error) {
      const err = error as Error;
      const message =
        err.name === "TimeoutError"
          ? TEXT.timeout
          : !navigator.onLine
            ? TEXT.offline
            : err instanceof TypeError
              ? TEXT.network
              : TEXT.server;
      setStatus("error", message);
    } finally {
      setBusy(false);
      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      status?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }
  });
}

document.querySelectorAll<HTMLFormElement>("form[data-form]").forEach(initForm);

// «Обсудить» у цены: выбирает тип сайта в форме
// «Обсудить» в ценах открывает заявку с ?type=…: сразу отмечаем этот тип сайта
const picked = new URLSearchParams(location.search).get("type");
if (picked) {
  const radio = document.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(picked)}"]`);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
