import type { Locale } from "@/lib/i18n";

const fa = {
  title: "حساب کاربری", intro: "پرونده پروژه، پیام‌ها و فایل‌های خود را اینجا پیگیری کنید.",
  login: "ورود", register: "ساخت حساب", logout: "خروج", name: "نام", phone: "شماره تماس", password: "رمز عبور",
  passwordHint: "حداقل ۸ نویسه", haveAccount: "حساب دارید؟ وارد شوید", noAccount: "حساب ندارید؟ ساخت حساب",
  loading: "در حال بارگذاری…", hello: "سلام", myCases: "پرونده‌های من", allCases: "همه پرونده‌ها", inquiries: "درخواست‌های بدون حساب",
  noCases: "هنوز پرونده‌ای ندارید.", newCase: "پرونده جدید", caseTitle: "عنوان پروژه", projectType: "نوع پروژه", city: "شهر",
  description: "توضیح", optional: "(اختیاری)", select: "انتخاب کنید", create: "ایجاد پرونده", creating: "در حال ایجاد…",
  attachSaved: "افزودن تصاویر ذخیره‌شده به‌عنوان مرجع", updated: "آخرین به‌روزرسانی", owner: "مشتری",
  status: "وضعیت", messages: "پیام‌ها", noMessages: "هنوز پیامی نیست.", write: "پیام شما", send: "ارسال", sending: "در حال ارسال…",
  files: "فایل‌ها", noFiles: "فایلی بارگذاری نشده است.", upload: "بارگذاری فایل", fileHint: "تصویر (JPG، PNG، WebP) یا PDF، تا ۱۰ مگابایت. فقط شما و تیم آتلیه فدک آن را می‌بینید.",
  download: "دانلود", remove: "حذف", back: "بازگشت به پرونده‌ها", refs: "تصاویر مرجع", staff: "تیم آتلیه فدک", you: "شما",
  deleteAccount: "حذف حساب و تمام اطلاعات", deleteConfirm: "حساب، پرونده‌ها، پیام‌ها و فایل‌های شما برای همیشه حذف می‌شود. ادامه می‌دهید؟",
  privacy: "پیام‌ها و فایل‌های شما ترجمه نمی‌شوند و به هیچ سرویس خارجی ارسال نمی‌شوند.",
  notFound: "این پرونده پیدا نشد.", loginNeeded: "برای دیدن این صفحه وارد شوید.",
  statuses: { new: "ثبت‌شده", reviewing: "در حال بررسی", design: "طراحی و برآورد", production: "ساخت", installation: "نصب و تحویل", done: "تکمیل‌شده", closed: "بسته‌شده" },
  errors: {
    invalid_name: "نام را وارد کنید.", invalid_phone: "شماره تماس معتبر وارد کنید؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷.",
    invalid_password: "رمز عبور باید حداقل ۸ نویسه باشد.", phone_taken: "با این شماره قبلاً حساب ساخته شده است.",
    invalid_credentials: "شماره یا رمز عبور درست نیست.", rate_limited: "تلاش‌های زیاد؛ کمی بعد دوباره امتحان کنید.",
    invalid: "اطلاعات واردشده معتبر نیست.", unsupported_type: "این نوع فایل پذیرفته نمی‌شود.", too_large: "حجم فایل بیش از ۱۰ مگابایت است.",
    too_many_files: "حداکثر ۲۰ فایل برای هر پرونده.", network: "ارتباط با سرور برقرار نشد.", default: "خطایی رخ داد. دوباره تلاش کنید.",
  },
};

const en: typeof fa = {
  title: "Account", intro: "Follow your project file, messages and documents in one place.",
  login: "Sign in", register: "Create account", logout: "Sign out", name: "Name", phone: "Phone number", password: "Password",
  passwordHint: "At least 8 characters", haveAccount: "Have an account? Sign in", noAccount: "No account? Create one",
  loading: "Loading…", hello: "Hello", myCases: "My projects", allCases: "All projects", inquiries: "Enquiries without an account",
  noCases: "You have no projects yet.", newCase: "New project", caseTitle: "Project title", projectType: "Project type", city: "City",
  description: "Description", optional: "(optional)", select: "Select an option", create: "Create project", creating: "Creating…",
  attachSaved: "Attach my saved references", updated: "Last updated", owner: "Client",
  status: "Status", messages: "Messages", noMessages: "No messages yet.", write: "Your message", send: "Send", sending: "Sending…",
  files: "Files", noFiles: "No files uploaded.", upload: "Upload a file", fileHint: "Image (JPG, PNG, WebP) or PDF, up to 10 MB. Only you and the Fadak Atelier team can see it.",
  download: "Download", remove: "Remove", back: "Back to projects", refs: "Reference images", staff: "Fadak Atelier team", you: "You",
  deleteAccount: "Delete my account and all data", deleteConfirm: "Your account, projects, messages and files will be permanently deleted. Continue?",
  privacy: "Your messages and files are never translated or sent to external services.",
  notFound: "This project could not be found.", loginNeeded: "Sign in to view this page.",
  statuses: { new: "Received", reviewing: "Under review", design: "Design & estimate", production: "Production", installation: "Installation & handover", done: "Completed", closed: "Closed" },
  errors: {
    invalid_name: "Please enter your name.", invalid_phone: "Enter a valid Iranian phone number, such as 09121234567.",
    invalid_password: "Your password must have at least 8 characters.", phone_taken: "An account with this number already exists.",
    invalid_credentials: "The phone number or password is incorrect.", rate_limited: "Too many attempts. Please try again shortly.",
    invalid: "Some of the information is not valid.", unsupported_type: "This file type is not accepted.", too_large: "The file is larger than 10 MB.",
    too_many_files: "A project can hold up to 20 files.", network: "Could not reach the server.", default: "Something went wrong. Please try again.",
  },
};

export const account = (locale: Locale) => (locale === "fa" ? fa : en);
export type AccountText = typeof fa;
export const errorText = (t: AccountText, code?: string) => (t.errors as Record<string, string>)[code ?? ""] ?? t.errors.default;
export const fmtDate = (locale: Locale, unix: number) => new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium" }).format(unix * 1000);
