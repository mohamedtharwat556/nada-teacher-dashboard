# إعداد Environment Variables في Vercel

## الخطوات:

### 1. اذهب إلى مشروعك في Vercel
- افتح [vercel.com](https://vercel.com)
- اختر مشروعك

### 2. أضف Environment Variables
اذهب إلى:
**Settings > Environment Variables**

أضف المتغيرات التالية:

#### Key: `SUPABASE_URL`
**Value:** ضع رابط Supabase الخاص بك
مثال: `https://xxxxxxxxxxxxx.supabase.co`

#### Key: `SUPABASE_ANON_KEY`  
**Value:** ضع الـ Anon Key من Supabase
مثال: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Key: `STRIPE_PUBLISHABLE_KEY`
**Value:** ضع الـ Publishable Key من Stripe
مثال: `sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db`

#### Key: `STRIPE_SECRET_KEY`
**Value:** ضع الـ Secret Key من Stripe
مثال: `sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp`

#### Key: `STRIPE_WEBHOOK_SECRET` (اختياري)
**Value:** ضع الـ Webhook Secret من Stripe (إذا استخدمت webhooks)
مثال: `whsec_...`

#### Key: `PORT`
**Value:** `3000`

#### Key: `NODE_ENV`
**Value:** `production`

### 3. حدد البيئة
لكل متغير، حدد:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. احفظ التغييرات
اضغط "Save"

### 5. أعد النشر
بعد إضافة المتغيرات، أعد نشر المشروع:
- اذهب إلى **Deployments**
- اضغط على أحدث deployment
- اضغط **Redeploy**

---

## أين تجد بيانات Supabase؟

1. اذهب إلى [supabase.com](https://supabase.com)
2. اختر مشروعك
3. اذهب إلى **Settings > API**
4. ستجد:
   - **Project URL** → استخدمه كـ `SUPABASE_URL`
   - **anon public** key → استخدمه كـ `SUPABASE_ANON_KEY`

---

## أين تجد بيانات Stripe؟

1. اذهب إلى [dashboard.stripe.com](https://dashboard.stripe.com)
2. اذهب إلى **Developers > API keys**
3. ستجد:
   - **Publishable key** → استخدمه كـ `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → استخدمه كـ `STRIPE_SECRET_KEY`

### للـ Webhook Secret (اختياري):
1. في Stripe Dashboard، اذهب إلى **Developers > Webhooks**
2. أنشئ webhook endpoint (مثال: `https://your-project.vercel.app/api/webhook`)
3. انسخ الـ **Signing secret** → استخدمه كـ `STRIPE_WEBHOOK_SECRET`

---

## التحقق من العمل

بعد النشر، اختبر:

### 1. فحص الاتصال:
```
https://your-project.vercel.app/api/health
```

يجب أن ترى:
```json
{
  "status": "ok",
  "supabase": "connected",
  "timestamp": "..."
}
```

### 2. فحص Stripe:
```
https://your-project.vercel.app/api/stripe-config
```

يجب أن ترى:
```json
{
  "publishableKey": "sb_publishable_..."
}
```