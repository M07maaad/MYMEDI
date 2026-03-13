# 💊 MediGuard — صديقك الدوائي الذكي

منصة صحية ذكية تربط المريض بصيدلانيه

---

## 🚀 خطوات التشغيل

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. إعداد Supabase
1. روح [supabase.com](https://supabase.com) وعمل project جديد
2. من SQL Editor، شغّل ملف `supabase/schema.sql` كامل
3. من Storage، عمل bucket اسمه `lab-files`

### 3. إعداد Gemini AI
1. روح [aistudio.google.com](https://aistudio.google.com)
2. عمل API Key جديد (مجاني ✅)

### 4. ملف البيئة
```bash
cp .env.example .env
```
افتح `.env` وحط:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GEMINI_API_KEY=AIzaSy...
```

### 5. تشغيل المشروع
```bash
npm run dev
```
افتح http://localhost:5173

---

## 📁 هيكل المشروع

```
mediguard/
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx      ← شريط التنقل
│   │   ├── LoadingScreen.jsx  ← شاشة التحميل
│   │   └── UI.jsx             ← مكونات مشتركة
│   ├── hooks/
│   │   ├── useAuth.jsx        ← Auth + Profile
│   │   ├── useMedications.js  ← CRUD + تفاعلات
│   │   └── useLabResults.js   ← التحاليل
│   ├── lib/
│   │   ├── supabase.js        ← Supabase client
│   │   └── gemini.js          ← Gemini Vision AI
│   ├── pages/
│   │   ├── AuthPage.jsx       ← تسجيل دخول / حساب جديد
│   │   ├── DashboardPage.jsx  ← الرئيسية
│   │   ├── AddMedPage.jsx     ← إضافة دواء (AI + يدوي)
│   │   └── Pages.jsx          ← باقي الصفحات
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   └── schema.sql             ← قاعدة البيانات كاملة
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## 🗺️ Roadmap

### Phase 1 ✅ (دلوقتي)
- [x] Auth (تسجيل دخول / حساب جديد)
- [x] بروفايل المريض
- [x] إضافة أدوية (AI + يدوي)
- [x] جدول يومي
- [x] تسجيل الجرعات
- [x] كشف التفاعلات
- [x] تحاليل ونتائج

### Phase 2 (قريباً)
- [ ] Push Notifications
- [ ] ربط التحاليل بالأدوية
- [ ] تنبيه المخزون المنخفض

### Phase 3
- [ ] بوابة الصيدلاني
- [ ] QR Code للتاريخ الطبي
- [ ] داشبورد المرضى للصيدلاني

### Phase 4
- [ ] بوابة المستشفى
- [ ] تقارير للأطباء

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | Gemini 1.5 Flash (مجاني 1500 req/يوم) |
| Hosting | Vercel |

---

## 📦 Deploy على Vercel

```bash
npm run build
```
ارفع الـ repo على GitHub وربطه بـ Vercel.
حط الـ Environment Variables في Vercel Dashboard.
