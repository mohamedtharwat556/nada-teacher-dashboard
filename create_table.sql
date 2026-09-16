-- تعطيل RLS على جميع الجداول الحالية
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE homework DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE store DISABLE ROW LEVEL SECURITY;

-- حذف جميع الطلاب التجريبية
DELETE FROM students WHERE name LIKE '%تجريبي%' OR name LIKE '%Test%';

-- إضافة طالب تجريبي
INSERT INTO students (name, grade, center) VALUES ('طالب تجريبي', 'الصف الرابع الابتدائي', 'الكاشف');
