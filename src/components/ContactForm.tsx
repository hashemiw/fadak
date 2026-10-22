"use client";
import { useState } from "react";
import { projectTypes } from "@/data/site";

const toLatin = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

// Accepts 0912..., +98912..., 0098912..., landlines with area code; Persian/Arabic digits.
export function normalizePhone(raw: string) {
  const s = toLatin(raw).replace(/[\s\-()]/g, "").replace(/^(\+98|0098)/, "0");
  return /^0\d{10}$/.test(s) ? s : null;
}

export default function ContactForm({ endpoint }: { endpoint: string }) {
  const enabled = !!endpoint;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "fail">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enabled) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const phone = normalizePhone(String(f.get("phone") ?? ""));
    const errs: Record<string, string> = {};
    if (!name) errs.name = "نام خود را وارد کنید.";
    if (!phone) errs.phone = "شماره تماس معتبر وارد کنید؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷ یا ۰۲۱۸۸۸۸۸۸۸۸.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      (e.currentTarget.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, projectType: f.get("projectType"), city: f.get("city"), message: f.get("message") }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      e.currentTarget.reset();
    } catch {
      setStatus("fail");
    }
  }

  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <label htmlFor={id}>
      <span>{label} {hint && <small>{hint}</small>}</span>
      <input id={id} name={id} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} {...props} />
      {errors[id] && <span id={`${id}-err`} className="err" role="alert">{errors[id]}</span>}
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      {!enabled && (
        <p className="notice" role="note">
          ارسال آنلاین فرم هنوز فعال نشده است و این فرم فقط پیش‌نمایش است. تا فعال‌سازی، از راه‌های ارتباطی دیگر استفاده کنید.
        </p>
      )}
      <fieldset disabled={!enabled || status === "sending"}>
        {field("name", "نام", { autoComplete: "name", required: true })}
        {field("phone", "شماره تماس", { type: "tel", inputMode: "tel", autoComplete: "tel", required: true, dir: "ltr", style: { textAlign: "right" } })}
        <label htmlFor="projectType">
          <span>نوع پروژه <small>(اختیاری)</small></span>
          <select id="projectType" name="projectType" defaultValue="">
            <option value="">انتخاب کنید</option>
            {projectTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        {field("city", "شهر", { autoComplete: "address-level2" }, "(اختیاری)")}
        <label htmlFor="message">
          <span>توضیح درخواست <small>(اختیاری)</small></span>
          <textarea id="message" name="message" />
        </label>
        <button className="btn" type="submit">{status === "sending" ? "در حال ارسال…" : "ارسال درخواست"}</button>
      </fieldset>
      <div aria-live="polite">
        {status === "done" && <p className="notice ok">درخواست شما ارسال شد.</p>}
        {status === "fail" && <p className="notice">ارسال انجام نشد. لطفاً دوباره تلاش کنید.</p>}
      </div>
    </form>
  );
}
