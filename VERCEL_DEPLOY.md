# 🚀 كيفية النشر على Vercel

## الخطوات:

### 1. ربط المشروع بـ GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/nada-teacher-dashboard.git
git push -u origin main
```

### 2. النشر على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اضغط "Add New Project"
4. اختر repo الخاص بك من GitHub
5. إعدادات Project:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** npm install
   - **Output Directory:** ./
   - **Install Command:** npm install
   - **Start Command:** (اتركه فارغاً - نستخدم serverless functions)

### 3. إضافة Environment Variables
اذهب إلى **Settings > Environment Variables** وأضف:

| Key | Value | Environments |
|-----|-------|-------------|
| `SUPABASE_URL` | رابط Supabase الخاص بك | ✅ Production, Preview, Development |
| `SUPABASE_ANON_KEY` | الـ Anon Key من Supabase | ✅ Production, Preview, Development |
| `STRIPE_PUBLISHABLE_KEY` | الـ Publishable Key من Stripe | ✅ Production, Preview, Development |
| `STRIPE_SECRET_KEY` | الـ Secret Key من Stripe | ✅ Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | الـ Webhook Secret من Stripe (اختياري) | ✅ Production, Preview, Development |
| `PORT` | `3000` | ✅ Production, Preview, Development |
| `NODE_ENV` | `production` | ✅ Production, Preview, Development |

### 4. النشر
اضغط "Deploy" وانتظر حتى ينتهي النشر

### 5. التحقق
افتح الرابط المعطى واختبر:
- `/api/health` - للتحقق من الاتصال
- `/api/data` - لجلب البيانات

---

## ملاحظات مهمة:

✅ الملف `.env` لا يجب أن يرفع إلى GitHub
✅ استخدم `.env.example` كمرجع فقط
✅ البيانات الحساسة يجب أن تكون في Environment Variables فقط
✅ بعد أي تغيير في Environment Variables، أعد النشر (Redeploy)

---

## استكشاف الأخطاء:

### المشكلة: "Application Error"
- تحقق من Environment Variables
- راجع logs في Vercel
- تأكد من أن Supabase يعمل

### المشكلة: "Supabase not configured"
- تأكد من إضافة `SUPABASE_URL` و `SUPABASE_ANON_KEY`
- تحقق من صحة القيم
- أعد النشر بعد إضافة المتغيرات