-- =====================================================
-- إعداد كامل لقاعدة بيانات Supabase لمشروع أستاذة ندى
-- =====================================================
-- هذا الملف يحتوي على كل الجداول المطلوبة للنظام
-- شغله بالكامل في Supabase SQL Editor لإعداد قاعدة البيانات
-- =====================================================

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    center TEXT NOT NULL,
    status TEXT DEFAULT 'منتظم',
    att_rate INTEGER DEFAULT 100,
    hw_completed TEXT DEFAULT '0/0',
    exam_avg INTEGER DEFAULT 0,
    pay_status TEXT DEFAULT 'لم يتم الدفع',
    general_notes TEXT,
    current_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()) - 1,
    current_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الواجبات
CREATE TABLE IF NOT EXISTS homework (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    max_score INTEGER DEFAULT 10,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'لم يتم التسليم',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الامتحانات
CREATE TABLE IF NOT EXISTS exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    max_score INTEGER DEFAULT 20,
    score INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الحضور
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    total INTEGER DEFAULT 300,
    paid INTEGER DEFAULT 0,
    remaining INTEGER DEFAULT 300,
    date DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الملاحظات
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأنشطة
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول البيانات الشهرية للطلاب (الجديد)
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

-- جدول التخزين القديم (للتوافق مع البيانات القديمة)
CREATE TABLE IF NOT EXISTS store (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- إنشاء فهارس لتحسين الأداء
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_center ON students(center);
CREATE INDEX IF NOT EXISTS idx_homework_student_id ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON exams(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_student_id ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_student_monthly_data_student_id ON student_monthly_data(student_id);
CREATE INDEX IF NOT EXISTS idx_student_monthly_data_month_year ON student_monthly_data(month_index, year);

-- =====================================================
-- تمكين Row Level Security (أمان البيانات)
-- =====================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE store ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- سياسات الوصول (سماح عام للقراءة والكتابة)
-- =====================================================
CREATE POLICY "Public Access Students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Homework" ON homework FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Exams" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Student Monthly Data" ON student_monthly_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Store" ON store FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- رسالة نجاح
-- =====================================================
SELECT 'تم إعداد قاعدة بيانات Supabase بنجاح!' as status,
       'تم إنشاء جميع الجداول المطلوبة' as message;