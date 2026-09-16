# 💳 دمج Stripe في المشروع

تم إضافة نظام الدفع الإلكتروني Stripe بنجاح!

---

## ✅ ما تم إضافته:

### 1. مكتبة Stripe
- تم إضافة `stripe` إلى `package.json`

### 2. ملفات جديدة:
- `api/stripe.js` - نقاط نهاية API للدفع
- `stripe-example.html` - مثال عملي للاستخدام

### 3. تحديثات:
- `.env.example` - إضافة مفاتيح Stripe
- `vercel.json` - إضافة routing لـ Stripe endpoints
- `VERCEL_SETUP.md` - تحديث التعليمات
- `VERCEL_DEPLOY.md` - تحديث التعليمات

---

## 🔑 مفاتيح Stripe:

### المفاتيح التي لديك:
- **Publishable Key:** `sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db`
- **Secret Key:** `sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp`

### أين تضعها في Vercel:

اذهب إلى **Settings > Environment Variables** وأضف:

| Key | Value |
|-----|-------|
| `STRIPE_PUBLISHABLE_KEY` | `sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db` |
| `STRIPE_SECRET_KEY` | `sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp` |

حدد: ✅ Production, ✅ Preview, ✅ Development

---

## 🚀 نقاط النهاية المتاحة:

### 1. إنشاء Payment Intent
```javascript
POST /api/create-payment-intent
{
  "amount": 10.00,
  "currency": "usd",
  "metadata": {}
}
```

**الرد:**
```json
{
  "clientSecret": "pi_123...",
  "paymentIntentId": "pi_123..."
}
```

### 2. فحص حالة Payment Intent
```javascript
GET /api/payment-intent/:id
```

### 3. إنشاء Checkout Session
```javascript
POST /api/create-checkout-session
{
  "success_url": "https://your-site.com/success",
  "cancel_url": "https://your-site.com/cancel",
  "line_items": [
    {
      "price_data": {
        "currency": "usd",
        "product_data": {
          "name": "Product Name"
        },
        "unit_amount": 1000
      },
      "quantity": 1
    }
  ]
}
```

### 4. Webhook (اختياري)
```javascript
POST /api/webhook
```

### 5. الحصول على Publishable Key
```javascript
GET /api/stripe-config
```

---

## 📝 كيفية الاستخدام:

### الطريقة 1: Payment Intent (مخصص)
```javascript
// 1. إنشاء Payment Intent
const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        amount: 10.00,
        currency: 'usd'
    })
});

const { clientSecret } = await response.json();

// 2. استخدام Stripe.js لمعالجة الدفع
const stripe = Stripe('YOUR_PUBLISHABLE_KEY');
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
        card: cardElement,
        billing_details: { name: 'Customer Name' }
    }
});
```

### الطريقة 2: Checkout Session (سهل)
```javascript
// 1. إنشاء Checkout Session
const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        success_url: window.location.href + '?success=true',
        cancel_url: window.location.href + '?canceled=true',
        line_items: [...]
    })
});

const { url } = await response.json();

// 2. توجيه المستخدم إلى صفحة الدفع
window.location.href = url;
```

---

## 🧪 الاختبار:

### 1. اختبار محلي:
```bash
# 1. أضف المفاتيح إلى .env
STRIPE_PUBLISHABLE_KEY=sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db
STRIPE_SECRET_KEY=sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp

# 2. شغل السيرفر
npm start

# 3. افتح stripe-example.html
```

### 2. اختبار على Vercel:
1. أضف المفاتيح إلى Environment Variables
2. أعد النشر
3. افتح `https://your-project.vercel.app/stripe-example.html`

---

## 💡 ملاحظات مهمة:

✅ المفاتيح الحالية تبدو كـ **Test keys** (تبدأ بـ `sb_`)
✅ للاستخدام في الإنتاج، ستحتاج إلى مفاتيح حقيقية من Stripe
✅ لا تشارك الـ Secret Key أبداً
✅ استخدم الـ Publishable Key فقط في الواجهة الأمامية
✅ الـ Webhook Secret اختياري (مفيد لمعالجة الأحداث)

---

## 🔗 روابط مفيدة:

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)

---

## 🎯 الخطوات التالية:

1. ✅ أضف المفاتيح إلى Vercel Environment Variables
2. ✅ أعد نشر المشروع
3. ✅ اختبر باستخدام `stripe-example.html`
4. ✅ دمج الدفع في صفحاتك الحالية (dashboard.html, index.html)
5. ✅ أضف Webhook إذا احتجت معالجة الأحداث

---

**تم إعداد Stripe بنجاح! 🎉**