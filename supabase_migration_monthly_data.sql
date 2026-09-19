-- =====================================================
-- Migration Script: إضافة جدول البيانات الشهرية للطلاب
-- =====================================================
-- هذا الملف لإضافته في قواعد البيانات الموجودة فقط
-- شغله في Supabase SQL Editor لإضافة الميزات الجديدة
-- =====================================================

-- 1. إضافة أعمدة جديدة لجدول الطلاب
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()) - 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());

-- 2. إنشاء جدول البيانات الشهرية للطلاب
CREATE TABLE IF NOT EXISTS student_monthly_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    month_index INTEGER NOT NULL,
    year INTEGER NOT NULL,
    attendance_rate INTEGER DEFAULT 0,
    homework_completed TEXT DEFAULT '0/0',
    exam_avg INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'غير مسجل',
    status TEXT DEFAULT 'منتظم',
    general_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, month_index, year)
);

-- 3. إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_student_monthly_data_student_id ON student_monthly_data(student_id);
CREATE INDEX IF NOT EXISTS idx_student_monthly_data_month_year ON student_monthly_data(month_index, year);

-- 4. تفعيل Row Level Security
ALTER TABLE student_monthly_data ENABLE ROW LEVEL SECURITY;

-- 5. إضافة سياسة الوصول (فقط إذا لم تكن موجودة)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Public Access Student Monthly Data' 
        AND tablename = 'student_monthly_data'
    ) THEN
        CREATE POLICY "Public Access Student Monthly Data" ON student_monthly_data FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =====================================================
-- رسالة نجاح
-- =====================================================
SELECT 'تم إضافة جدول البيانات الشهرية بنجاح!' as status,
       'يمكنك الآن استخدام نظام البيانات الشهرية' as message;