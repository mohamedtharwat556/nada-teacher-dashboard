-- حذف جميع البيانات من جداول المشروع
-- نفذ هذا الملف في Supabase SQL Editor

-- حذف البيانات من جميع الجداول (بترتيب صحيح للعلاقات)
DELETE FROM activities;
DELETE FROM notes;
DELETE FROM payments;
DELETE FROM attendance;
DELETE FROM exams;
DELETE FROM homework;
DELETE FROM students;

-- إعادة تعيين التسلسل إذا وجد
-- ALTER SEQUENCE students_id_seq RESTART WITH 1;

-- رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE '✅ تم حذف جميع البيانات بنجاح!';
    RAISE NOTICE '🗑️ تم حذف البيانات من: activities, notes, payments, attendance, exams, homework, students';
END $$;
