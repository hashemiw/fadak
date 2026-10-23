"use client";
import { useEffect, useRef, useState } from "react";
import { projectTypes } from "@/data/site";
import { projectTypes as englishTypes } from "@/data/site-en";
import type { Locale } from "@/lib/i18n";

const toLatin = (s: string) => s.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
export function normalizePhone(raw: string) {
  const s = toLatin(raw).replace(/[\s\-()]/g, "").replace(/^(\+98|0098)/, "0");
  return /^0\d{10}$/.test(s) ? s : null;
}
const draftKey = "fadak:consultation-language-transfer:v1";
const ids = ["name", "phone", "projectType", "city", "message"] as const;
type Draft = Record<typeof ids[number], string>;
const empty: Draft = { name: "", phone: "", projectType: "", city: "", message: "" };

export default function ContactForm({ endpoint, locale = "fa" }: { endpoint: string; locale?: Locale }) {
  const fa = locale === "fa";
  const t = (persian: string, english: string) => fa ? persian : english;
  const enabled = !!endpoint;
  const [values, setValues] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "fail">("idle");
  const [storageError, setStorageError] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const current = useRef({ values, status });
  current.current = { values, status };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      sessionStorage.removeItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (Date.now() - draft.savedAt < 10 * 60 * 1000 && draft.values) {
          setValues(Object.fromEntries(ids.map(id => [id, typeof draft.values[id] === "string" ? draft.values[id] : ""])) as Draft);
        }
      }
    } catch { /* The form remains usable when browser storage is unavailable. */ }
    const transfer = (event: Event) => {
      if (current.current.status === "sending") { event.preventDefault(); return; }
      if (!Object.values(current.current.values).some(Boolean)) return;
      try {
        // Same-origin, per-tab transfer only; removed on arrival. No translation or network request.
        sessionStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), values: current.current.values }));
      } catch { event.preventDefault(); setStorageError(true); }
    };
    window.addEventListener("fadak:language-change", transfer);
    return () => window.removeEventListener("fadak:language-change", transfer);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enabled || status === "sending") return;
    const name = values.name.trim();
    const phone = normalizePhone(values.phone);
    const errs: Record<string, string> = {};
    if (!name) errs.name = t("نام خود را وارد کنید.", "Please enter your name.");
    if (!phone) errs.phone = t("شماره تماس معتبر وارد کنید؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷ یا ۰۲۱۸۸۸۸۸۸۸۸.", "Enter a valid Iranian phone number, such as 09121234567 or 02188888888.");
    setErrors(errs);
    if (Object.keys(errs).length) { form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus(); return; }
    setStatus("sending");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, name, phone }) });
      if (!response.ok) throw new Error("Request failed");
      setStatus("done"); setValues(empty);
      try { sessionStorage.removeItem(draftKey); } catch { /* No stored transfer. */ }
    } catch { setStatus("fail"); }
  }
  const change = (id: keyof Draft, value: string) => { setValues(v => ({ ...v, [id]: value })); setStatus("idle"); };
  const optional = t("(اختیاری)", "(optional)");
  const field = (id: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <label htmlFor={id}><span>{label} {hint && <small>{hint}</small>}</span>
      <input id={id} name={id} value={values[id]} onChange={e => change(id, e.target.value)} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} {...props} />
      {errors[id] && <span id={`${id}-err`} className="err" role="alert">{errors[id]}</span>}
    </label>
  );
  return <form ref={form} onSubmit={onSubmit} noValidate>
    {!enabled && <p className="notice" role="note">{t("ارسال آنلاین فرم هنوز فعال نشده است و این فرم فقط پیش‌نمایش است. تا فعال‌سازی، از راه‌های ارتباطی دیگر استفاده کنید.", "Online enquiries are not available yet. This form is a disabled preview and does not send information.")}</p>}
    {storageError && <p className="notice" role="alert">{t("مرورگر امکان حفظ متن هنگام تغییر زبان را نمی‌دهد. متن فرم حفظ شد؛ پیش از تغییر زبان از آن کپی بگیرید.", "Your browser cannot retain this draft while switching languages. Your text is still here; copy it before changing language.")}</p>}
    <fieldset disabled={!enabled || status === "sending"}>
      {field("name", t("نام", "Name"), { autoComplete: "name", required: true })}
      {field("phone", t("شماره تماس", "Phone number"), { type: "tel", inputMode: "tel", autoComplete: "tel", required: true, dir: "ltr", style: { textAlign: fa ? "right" : "left" } })}
      <label htmlFor="projectType"><span>{t("نوع پروژه", "Project type")} <small>{optional}</small></span>
        <select id="projectType" name="projectType" value={values.projectType} onChange={e => change("projectType", e.target.value)}>
          <option value="">{t("انتخاب کنید", "Select an option")}</option>
          {projectTypes.map((value, index) => <option key={value} value={value}>{fa ? value : englishTypes[index]}</option>)}
        </select>
      </label>
      {field("city", t("شهر", "City"), { autoComplete: "address-level2" }, optional)}
      <label htmlFor="message"><span>{t("توضیح درخواست", "Your enquiry")} <small>{optional}</small></span>
        <textarea id="message" name="message" value={values.message} onChange={e => change("message", e.target.value)} />
      </label>
      <button className="btn" type="submit">{status === "sending" ? t("در حال ارسال…", "Sending…") : t("ارسال درخواست", "Send enquiry")}</button>
    </fieldset>
    <div aria-live="polite">
      {status === "done" && <p className="notice ok">{t("درخواست شما ارسال شد.", "Your enquiry has been sent.")}</p>}
      {status === "fail" && <p className="notice">{t("ارسال انجام نشد. لطفاً دوباره تلاش کنید.", "Your enquiry could not be sent. Please try again.")}</p>}
    </div>
  </form>;
}
