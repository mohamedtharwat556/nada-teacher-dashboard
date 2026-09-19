# 🎓 أستاذة ندى - نظام متابعة تعليمية

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

نظام متابعة تعليمية متكامل لأستاذة ندى - مدرسة العلوم، يتيح للمعلم إدارة الطلاب والواجبات والامتحانات والحضور والمصروفات، وولي الأمر متابعة مستوى ابنه.

[المميزات](#-المميزات) • [التثبيت](#-التثبيت-والتشغيل) • [الاستخدام](#-الاستخدام) • [النشر](#-النشر) • [المساهمة](#-المساهمة)

</div>

---

## 🌟 المميزات

### للمعلم (لوحة التحكم)
- ✅ إدارة الطلاب (إضافة/تعديل/حذف)
- ✅ إدارة الواجبات المنزلية
- ✅ إدارة الامتحانات والنتائج
- ✅ نظام الحضور والغياب
- ✅ متابعة المصروفات والدفعات
- ✅ إضافة ملاحظات على الطلاب
- ✅ تقارير الأداء الشاملة
- ✅ إشعارات للتنبيهات المهمة
- ✅ بحث سريع في البيانات

### لولي الأمر (الصفحة الرئيسية)
- ✅ البحث عن الطالب بالاسم
- ✅ عرض ملخص شامل للمستوى
- ✅ متابعة الواجبات والامتحانات
- ✅ معرفة حالة الحضور والغياب
- ✅ متابعة حالة المصروفات
- ✅ قراءة ملاحظات المعلم

---

## 🏗️ البنية التقنية

### Backend
- **Node.js** - خادم JavaScript
- **Express** - إطار عمل الويب
- **Supabase** - قاعدة بيانات PostgreSQL كخدمة

### Frontend
- **HTML5** - هيكل الصفحات
- **CSS3** - التنسيقات والتصميم
- **Vanilla JavaScript** - المنطق والتفاعل

### قاعدة البيانات
- **PostgreSQL** عبر Supabase
- جداول منفصلة لكل نوع بيانات
- علاقات واضحة (Foreign Keys)
- فهارس لتحسين الأداء

---

## 📋 المتطلبات

- [Node.js](https://nodejs.org/) (الإصدار 14 أو أحدث)
- [npm](https://www.npmjs.com/) (يأتي مع Node.js)
- حساب [Supabase](https://supabase.com) (مجاني أو مدفوع)
- متصفح حديث (Chrome, Firefox, Edge, Safari)

---

## 🚀 التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone https://github.com/yourusername/nada-teacher-dashboard.git
cd nada-teacher-dashboard
```

أو إذا كان المشروع محلياً:
```bash
cd "C:\Users\yas\Downloads\nada th"
```

### 2. تثبيت المكتبات

```bash
npm install
```

### 3. إعداد قاعدة البيانات (Supabase)

#### إنشاء مشروع جديد:
1. سجل في [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. انتظر حتى يجهز المشروع (عادة دقيقة واحدة)

#### تنفيذ سكريبت قاعدة البيانات:
1. اذهب إلى **SQL Editor** في لوحة تحكم Supabase
2. انسخ محتوى `supabase_setup.sql`
3. الصقه في المحرر واضغط **Run**

#### الحصول على بيانات الاتصال:
1. اذهب إلى **Project Settings** > **API**
2. انسخ:
   - **Project URL**
   - **anon/public key**

### 4. إعداد ملف البيئة

```bash
# انسخ ملف المثال
cp .env.example .env

# عدّل .env ببياناتك الحقيقية
```

محتوى `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
NODE_ENV=development
```

### 5. تشغيل المشروع

```bash
# للتطوير (مع إعادة التحميل التلقائي)
npm run dev

# للإنتاج
npm start
```

### 6. فتح التطبيق

- **للمعلم:** http://localhost:3000/dashboard.html
- **لولي الأمر:** http://localhost:3000/index.html
- **فحص الصحة:** http://localhost:3000/api/health

> **ملاحظة:** إذا كان البورت 3000 مستخدم، يمكنك تغييره في ملف `.env` بتعديل `PORT=3000` إلى رقم بورت آخر مثل `PORT=3002`

---

## 📁 هيكل المشروع

```
nada-teacher-dashboard/
├── index.html                # الصفحة الرئيسية (ولي الأمر)
├── dashboard.html            # لوحة تحكم المعلم
├── style.css                 # تنسيقات الصفحة الرئيسية
├── dashboard.css             # تنسيقات لوحة التحكم
├── script.js                 # منطق الصفحة الرئيسية
├── dashboard.js              # منطق لوحة التحكم
├── server_improved.js        # الخادم الرئيسي (محسّن)
├── server.js                 # الخادم القديم (للرجوع)
├── supabase_setup.sql        # هيكل قاعدة البيانات
├── api/
│   ├── index.js             # API handler لـ Vercel
│   └── stripe.js            # تكامل Stripe
├── data/
│   └── db.json              # بيانات محلية (قديم)
├── .env.example              # مثال لملف البيئة
├── .gitignore               # الملفات المستثناة من Git
├── package.json             # تبعيات المشروع
├── vercel.json              # إعدادات Vercel
├── README.md                # هذا الملف
├── DEPLOYMENT.md            # دليل النشر
├── VERCEL_SETUP.md         # إعداد Vercel
├── VERCEL_DEPLOY.md         # نشر Vercel
├── STRIPE_INTEGRATION.md    # تكامل Stripe
└── TEST_REPORT.md           # تقرير الاختبار
```

---

## 🔧 الاستخدام

### للمعلم

#### إضافة طالب جديد:
1. اذهب إلى قسم "الطلاب"
2. اضغط على "+ إضافة طالب"
3. املأ البيانات المطلوبة
4. اضغط "حفظ الطالب"

#### تسجيل واجب:
1. اذهب إلى قسم "الواجبات"
2. اضغط "+ إضافة واجب"
3. اختر الطالب والبيانات المطلوبة
4. اضغط "حفظ الواجب"

#### تسجيل نتيجة امتحان:
1. اذهب إلى قسم "الامتحانات"
2. اضغط "+ إضافة نتيجة"
3. أدخل درجة الطالب
4. اضغط "حفظ النتيجة"

#### تسجيل الحضور:
1. اذهب إلى قسم "الحضور والغياب"
2. اختر التاريخ والصف
3. حدد حالة كل طالب (حاضر/غائب/متأخر)
4. اضغط "حفظ الحضور"

### لولي الأمر

#### البحث عن الطالب:
1. اختر المدرس (الكاشف أو سيف الدين)
2. اكتب اسم الطالب
3. اختر الصف الدراسي (اختياري)
4. اضغط "ابحث عن الطالب"

#### عرض التفاصيل:
1. اضغط على بطاقة الطالب في النتائج
2. شاهد ملخص شامل للمستوى

---

## 🌐 النشر (Deployment)

### خيارات النشر:

#### 1. Vercel (موصى به)
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel
```

#### 2. Render
```bash
# اتبع تعليمات Render.com
# استخدم build command: npm start
```

#### 3. Railway
```bash
# تثبيت Railway CLI
npm i -g @railway/cli

# النشر
railway login
railway init
railway up
```

#### 4. Heroku
```bash
# تثبيت Heroku CLI
# إنشاء app جديد
heroku create your-app-name

# إضافة متغيرات البيئة
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key

# النشر
git push heroku main
```

### قبل النشر:
- ✅ تأكد من إعداد `.env` بشكل صحيح
- ✅ نفذ `supabase_setup.sql` في Supabase
- ✅ اختبر المشروع محلياً
- ✅ تأكد من أن جميع الملفات الضرورية موجودة

---

## 🔒 الأمان

### أمور مهمة:
- ⚠️ **لا تشارك ملف `.env` أبداً** - يحتوي على بيانات حساسة
- ⚠️ استخدم **Service Role Key** للعمليات الحساسة فقط
- ⚠️ فعل **Row Level Security (RLS)** في Supabase للإنتاج
- ⚠️ استخدم **HTTPS** فقط في الإنتاج

### تحسينات الأمان المقترحة:
- [ ] نظام مصادقة (JWT)
- [ ] تقييد الوصول بالـ IP
- [ ] تشفير البيانات الحساسة
- [ ] سياسات RLS محددة

---

## 🐛 حل المشاكل

### الخادم لا يعمل:
```bash
# تأكد من تثبيت المكتبات
npm install

# تأكد من صحة .env
cat .env

# شغل مع debug
DEBUG=* npm start
```

### قاعدة البيانات لا تعمل:
- تأكد من صحة بيانات Supabase في `.env`
- تأكد من تنفيذ `supabase_setup.sql`
- تحقق من اتصال الإنترنت
- راجع logs في Supabase

### النصوص العربية مشوّهة:
- تأكد من حفظ الملفات بترميز UTF-8
- استخدم محرر نصوص يدعم العربية (VS Code)

### API ترجع خطأ 500:
- تحقق من console.log في server
- راجع Supabase logs
- تأكد من صحة البيانات المرسلة

---

## 📊 التطوير المستقبلي

### الميزات القادمة:
- [ ] نظام تسجيل دخول/خروج
- [ ] تقارير PDF للآباء
- [ ] تصدير البيانات (Excel/CSV)
- [ ] إرسال إشعارات للآباء
- [ ] تطبيق موبايل
- [ ] رسوم بيانية متقدمة
- [ ] الوضع الليلي

---

## 🤝 المساهمة

نرحب بالمساهمات! اتبع الخطوات:

1. Fork المشروع
2. أنشئ branch للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف LICENSE للتفاصيل.

---

## 👨‍💻 المطور

تم التطوير بواسطة فريق التطوير

**للمساعدة والدعم:**
- [فتح Issue](https://github.com/yourusername/nada-teacher-dashboard/issues)
- [Discussions](https://github.com/yourusername/nada-teacher-dashboard/discussions)

---

## 🙏 شكر وتقدير

- [Supabase](https://supabase.com) - قاعدة البيانات
- [Express](https://expressjs.com) - إطار العمل
- [Node.js](https://nodejs.org) - بيئة التشغيل

---

<div align="center">

**إذا أعجبك المشروع، لا تنسَ إعطائه ⭐ Star على GitHub!**

صُنع بـ ❤️ للتعليم العربي 🇪🇬

</div>
