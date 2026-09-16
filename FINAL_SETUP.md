# 🚀 دليل الإعداد النهائي - Environment Variables

## 🔑 البيانات النهائية:

### Supabase:
- **URL:** `https://xpefuiggipujeclrasfv.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZ1aWdnaXB1amVjbHJhc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzczMzcsImV4cCI6MjEwNTE1MzMzN30.ME4a70pBlpfJYCUp5_6bU5RuoqoV5sNnsMKuzDgk5X0`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZ1aWdnaXB1amVjbHJhc2Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3NzMzNywiZXhwIjoyMTA1MTUzMzM3fQ.l_kzf8-zdnLN_k26gdBBWyB_NWHhZ9eUWwhjOn0pz8Q`

### Stripe:
- **Publishable Key:** `sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db`
- **Secret Key:** `sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp`

---

## 📝 كيفية الإعداد:

### 1. تحديث ملف `.env` محلياً:

```bash
# انسخ هذا المحتوى إلى ملف .env
SUPABASE_URL=https://xpefuiggipujeclrasfv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZ1aWdnaXB1amVjbHJhc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzczMzcsImV4cCI6MjEwNTE1MzMzN30.ME4a70pBlpfJYCUp5_6bU5RuoqoV5sNnsMKuzDgk5X0
STRIPE_PUBLISHABLE_KEY=sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db
STRIPE_SECRET_KEY=sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp
PORT=3000
NODE_ENV=development
```

### 2. إضافة Environment Variables في Vercel:

اذهب إلى **Settings > Environment Variables** وأضف:

| Key | Value | Environments |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://xpefuiggipujeclrasfv.supabase.co` | ✅ Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZ1aWdnaXB1amVjbHJhc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzczMzcsImV4cCI6MjEwNTE1MzMzN30.ME4a70pBlpfJYCUp5_6bU5RuoqoV5sNnsMKuzDgk5X0` | ✅ Production, Preview, Development |
| `STRIPE_PUBLISHABLE_KEY` | `sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db` | ✅ Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp` | ✅ Production, Preview, Development |
| `PORT` | `3000` | ✅ Production, Preview, Development |
| `NODE_ENV` | `production` | ✅ Production, Preview, Development |

---

## 🧪 الاختبار:

### اختبار محلي:
```bash
# 1. تأكد من تثبيت المكتبات
npm install

# 2. شغل السيرفر
npm start

# 3. افتح المتصفح على:
# http://localhost:3000/api/health
# http://localhost:3000/api/stripe-config
```

### اختبار على Vercel:
```bash
# بعد النشر، اختبر:
https://your-project.vercel.app/api/health
https://your-project.vercel.app/api/stripe-config
```

---

## ✅ التحقق من النجاح:

### `/api/health` يجب أن يعيد:
```json
{
  "status": "ok",
  "supabase": "connected",
  "timestamp": "..."
}
```

### `/api/stripe-config` يجب أن يعيد:
```json
{
  "publishableKey": "sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db"
}
```

---

## 🎯 الخطوات التالية:

1. ✅ تحديث ملف `.env` محلياً
2. ✅ إضافة Environment Variables في Vercel
3. ✅ أعد نشر المشروع في Vercel
4. ✅ اختبر الـ endpoints
5. ✅ دمج الدفع في صفحاتك الحالية

---

## ⚠️ ملاحظات أمنية:

- ❌ **لا ترفع ملف `.env` إلى GitHub**
- ✅ استخدم `.env.example` كمرجع فقط
- ✅ الـ Service Role Key لا تستخدمه في الواجهة الأمامية
- ✅ الـ Secret Keys يجب أن تبقى في الخادم فقط
- ✅ الـ Publishable Key فقط يستخدم في الواجهة الأمامية

---

## 📞 إذا واجهت مشاكل:

### المشكلة: "Supabase not configured"
- تأكد من إضافة `SUPABASE_URL` و `SUPABASE_ANON_KEY`
- تحقق من صحة القيم
- أعد النشر بعد إضافة المتغيرات

### المشكلة: "Stripe error"
- تأكد من إضافة مفاتيح Stripe الصحيحة
- تحقق من أن المفاتيح من نفس البيئة (test/live)
- راجع logs في Vercel

### المشكلة: "Database connection failed"
- تأكد من أن Supabase project نشط
- تحقق من أن جدول `store` موجود
- راجع Supabase logs

---

**الإعداد جاهز! 🎉**