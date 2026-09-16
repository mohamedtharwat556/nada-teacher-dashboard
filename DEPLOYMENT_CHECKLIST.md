# ✅ قائمة التحقق للنشر على Vercel

## 📋 قبل البدء:

- [ ] لديك حساب على GitHub
- [ ] لديك حساب على Vercel
- [ ] المشروع مرتبط بـ GitHub repo
- [ ] جميع الملفات جاهزة للنشر

---

## 🔧 الإعداد المحلي:

### 1. تثبيت المكتبات:
```bash
npm install
```
- [ ] تم تثبيت جميع المكتبات بنجاح

### 2. إعداد ملف `.env`:
```bash
# على Windows:
setup-env.bat

# على Mac/Linux:
bash setup-env.sh
```
- [ ] تم إنشاء ملف `.env`
- [ ] يحتوي على جميع المفاتيح الصحيحة

### 3. اختبار محلي:
```bash
npm start
```
- [ ] السيرفر يعمل على http://localhost:3000
- [ ] `/api/health` يعيد `{ "status": "ok", "supabase": "connected" }`
- [ ] `/api/stripe-config` يعيد `{ "publishableKey": "..." }`

---

## 🚀 ربط GitHub:

### 1. تهيئة Git:
```bash
git init
git add .
git commit -m "Initial commit with Supabase and Stripe integration"
```
- [ ] تم تهيئة Git
- [ ] تم commit التغييرات

### 2. ربط بـ GitHub:
```bash
git remote add origin https://github.com/yourusername/nada-teacher-dashboard.git
git branch -M main
git push -u origin main
```
- [ ] تم ربط repo بـ GitHub
- [ ] تم رفع الكود بنجاح

---

## 🌐 النشر على Vercel:

### 1. إنشاء مشروع في Vercel:
- [ ] سجلت دخول في [vercel.com](https://vercel.com)
- [ ] ضغطت "Add New Project"
- [ ] اخترت repo من GitHub
- [ ] حددت الإعدادات:
  - [ ] Framework Preset: Other
  - [ ] Root Directory: ./
  - [ ] Build Command: npm install
  - [ ] Output Directory: ./
  - [ ] Install Command: npm install
  - [ ] Start Command: (فارغ)

### 2. إضافة Environment Variables:
اذهب إلى **Settings > Environment Variables** وأضف:

| Key | Value | Environments |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://xpefuiggipujeclrasfv.supabase.co` | ✅ Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Production, Preview, Development |
| `STRIPE_PUBLISHABLE_KEY` | `sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db` | ✅ Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp` | ✅ Production, Preview, Development |
| `PORT` | `3000` | ✅ Production, Preview, Development |
| `NODE_ENV` | `production` | ✅ Production, Preview, Development |

- [ ] تم إضافة جميع Environment Variables
- [ ] تم تحديد Environments للجميع
- [ ] تم حفظ التغييرات

### 3. النشر:
- [ ] ضغطت "Deploy"
- [ ] انتظرت حتى انتهى النشر
- [ ] حصلت على رابط المشروع

---

## ✅ التحقق بعد النشر:

### 1. اختبار الاتصال:
- [ ] افتح `https://your-project.vercel.app/api/health`
- [ ] يجب أن ترى `{ "status": "ok", "supabase": "connected" }`

### 2. اختبار Stripe:
- [ ] افتح `https://your-project.vercel.app/api/stripe-config`
- [ ] يجب أن ترى `{ "publishableKey": "sb_publishable_..." }`

### 3. اختبار الصفحات:
- [ ] `https://your-project.vercel.app/index.html` - Parent Portal
- [ ] `https://your-project.vercel.app/dashboard.html` - Teacher Dashboard
- [ ] `https://your-project.vercel.app/stripe-example.html` - Stripe Test

### 4. اختبار الوظائف:
- [ ] إضافة طالب يعمل
- [ ] حفظ البيانات يعمل
- [ ] جلب البيانات يعمل
- [ ] الدفع (Stripe) يعمل

---

## 🔧 استكشاف الأخطاء:

### إذا فشل النشر:
- [ ] راجع logs في Vercel
- [ ] تأكد من Environment Variables صحيحة
- [ ] تأكد من package.json صحيح
- [ ] تأكد من npm install يعمل محلياً

### إذا فشل الاتصال بـ Supabase:
- [ ] تحقق من SUPABASE_URL
- [ ] تحقق من SUPABASE_ANON_KEY
- [ ] تأكد من Supabase project نشط
- [ ] راجع Supabase logs

### إذا فشل Stripe:
- [ ] تحقق من مفاتيح Stripe
- [ ] تأكد من أن المفاتيح صحيحة
- [ ] راجع Stripe Dashboard
- [ ] راجع logs في Vercel

---

## 🎯 بعد النشر:

### 1. إعداد Domain (اختياري):
- [ ] اذهب إلى Settings > Domains
- [ ] أضف domain خاص بك
- [ ] اتبع تعليمات DNS

### 2. المراقبة:
- [ ] راجع Analytics في Vercel
- [ ] راجع Logs بشكل دوري
- [ ] راجع Stripe Dashboard للمدفوعات

### 3. التحديثات:
```bash
# للتحديث:
git add .
git commit -m "Update"
git push
# النشر التلقائي سيعمل
```

---

## 📞 الدعم:

إذا واجهت مشاكل:
1. راجع logs في Vercel
2. تحقق من Environment Variables
3. تأكد من أن Supabase و Stripe يعملان
4. راجع الملفات:
   - `FINAL_SETUP.md`
   - `VERCEL_SETUP.md`
   - `STRIPE_INTEGRATION.md`

---

## 🎉 تهانينا!

إذا أكملت جميع الخطوات، مشروعك الآن منشور على Vercel ويعمل بنجاح!

**رابط مشروعك:** `https://your-project.vercel.app`

---

**الإعداد النهائي جاهز! 🚀**