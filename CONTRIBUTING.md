# 🤝 المساهمة في المشروع

شكراً لاهتمامك بالمساهمة في مشروع أستاذة ندى! نرحب بجميع المساهمات.

---

## 📋 كيفية المساهمة

### 1. Fork المشروع

اذهب إلى صفحة المشروع على GitHub واضغط على زر "Fork".

### 2. Clone نسختك

```bash
git clone https://github.com/yourusername/nada-teacher-dashboard.git
cd nada-teacher-dashboard
```

### 3. أنشئ Branch جديد

```bash
git checkout -b feature/your-feature-name
```

### 4. قم بالتغييرات

- عدّل الكود
- أضف الميزات الجديدة
- أصلح الأخطاء
- حسّن التوثيق

### 5. Commit التغييرات

```bash
git add .
git commit -m "Add your feature description"
```

### 6. Push إلى Branch

```bash
git push origin feature/your-feature-name
```

### 7. افتح Pull Request

اذهب إلى صفحة المشروع الأصلية وافتح Pull Request.

---

## 📝 معايير الكود

### JavaScript:
- استخدم `'use strict'` في الملفات
- استخدم `const` و `let` بدلاً من `var`
- استخدم أسلوب camelCase للمتغيرات
- أضف تعليقات للكود المعقد

### CSS:
- استخدم BEM naming convention
- نظم الكود منطقياً
- استخدم متغيرات CSS للألوان

### HTML:
- استخدم semantic HTML
- تأكد من accessibility
- استخدم Arabic lang attribute

---

## 🐛 الإبلاغ عن الأخطاء

عند الإبلاغ عن خطأ:
1. وصف المشكلة بوضوح
2. أضف خطوات التكرار
3. أضف لقطات شاشة إذا أمكن
4. حدد البيئة (المتصفح، نظام التشغيل)

---

## 💡 اقتراحات الميزات

عند اقتراح ميزة جديدة:
1. وصف الميزة بوضوح
2. اشرح الفائدة المتوقعة
3. قترح طريقة التنفيذ
4. وضح أولويتها (عالية/متوسطة/منخفضة)

---

## 📖 التوثيق

- احرص على تحديث التوثيق مع كل تغيير
- أضف أمثلة للكود الجديد
- حدّث README إذا لزم الأمر

---

## 🧪 الاختبار

قبل إرسال Pull Request:
- اختبر الكود محلياً
- تأكد من عدم وجود أخطاء في console
- اختبر على متصفحات مختلفة
- اختبر على أجهزة مختلفة (موبيل/ديسكتوب)

---

## 🎨 نمط الكود

### مثال جيد:
```javascript
'use strict';

const TEACHER_CONFIG = {
  name: 'أستاذة ندى',
  subject: 'العلوم',
  grades: ['الصف الأول', 'الصف الثاني']
};

function getStudentInfo(id) {
  const student = students.find(s => s.id === id);
  return student || null;
}
```

### مثال سيء:
```javascript
var t = {n:'ندى',s:'علوم'};
function getS(i){return students.find(x=>x.id==i)}
```

---

## 📧 التواصل

للاستفسارات:
- افتح Issue على GitHub
- استخدم Discussions للأسئلة العامة
- راجع Issues الموجودة أولاً

---

## 📜 الترخيص

بالمساهمة، توافق على أن مساهماتك ستنشر تحت رخصة MIT.

---

شكراً لمساهمتك! 🎉
