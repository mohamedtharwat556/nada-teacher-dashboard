-- ============================================
-- هيكل قاعدة بيانات محسّن لأستاذة ندى
-- ============================================

-- جدول الطلاب
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(100) NOT NULL,
  center VARCHAR(100) NOT NULL, -- الكاشف أو سيف الدين
  status VARCHAR(50) DEFAULT 'منتظم', -- منتظم، يحتاج متابعة
  att_rate INTEGER DEFAULT 100, -- نسبة الحضور
  hw_completed VARCHAR(20), -- الواجبات المكتملة (مثال: 4/5)
  exam_avg INTEGER, -- متوسط الامتحانات
  pay_status VARCHAR(50) DEFAULT 'لم يتم الدفع', -- خالص، متبقي، لم يتم الدفع
  general_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الواجبات
CREATE TABLE homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  max_score INTEGER DEFAULT 10,
  score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'لم يتم التسليم', -- مكتمل، متأخر، لم يتم التسليم
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الامتحانات
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  max_score INTEGER DEFAULT 20,
  score INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الحضور
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL, -- حاضر، غائب، متأخر
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date) -- منع تسجيل حضور مزدود لنفس الطالب في نفس اليوم
);

-- جدول الدفعات
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  month VARCHAR(100) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  paid DECIMAL(10,2) DEFAULT 0,
  remaining DECIMAL(10,2) GENERATED ALWAYS AS (total - paid) STORED,
  date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الملاحظات
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- أكاديمي، واجبات، حضور، سلوك، متابعة عامة، متميز
  content TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأنشطة (سجل التغييرات)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- إنشاء الفهارس لتحسين الأداء
-- ============================================

CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_students_center ON students(center);
CREATE INDEX idx_students_status ON students(status);

CREATE INDEX idx_homework_student_id ON homework(student_id);
CREATE INDEX idx_homework_date ON homework(date);
CREATE INDEX idx_homework_status ON homework(status);

CREATE INDEX idx_exams_student_id ON exams(student_id);
CREATE INDEX idx_exams_date ON exams(date);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_month ON payments(month);

CREATE INDEX idx_notes_student_id ON notes(student_id);
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_date ON notes(date);

-- ============================================
-- إعداد Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (للمبتدئين: تسمح بالوصول الكامل)
-- في الإنتاج، يجب تقييد هذه السياسات

CREATE POLICY "Enable all access for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for homework" ON homework FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for exams" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for activities" ON activities FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- إنشاء Views مفيدة
-- ============================================

-- View: ملخص حالة كل طالب
CREATE OR REPLACE VIEW student_summary AS
SELECT 
  s.id,
  s.name,
  s.grade,
  s.center,
  s.status,
  s.att_rate,
  s.hw_completed,
  s.exam_avg,
  s.pay_status,
  COUNT(DISTINCT h.id) as total_homework,
  COUNT(DISTINCT CASE WHEN h.status = 'مكتمل' THEN h.id END) as completed_homework,
  COUNT(DISTINCT e.id) as total_exams,
  COUNT(DISTINCT a.id) as total_attendance,
  COUNT(DISTINCT CASE WHEN a.status = 'حاضر' THEN a.id END) as present_days,
  COALESCE(SUM(p.total), 0) as total_paid,
  COALESCE(SUM(p.remaining), 0) as total_remaining
FROM students s
LEFT JOIN homework h ON s.id = h.student_id
LEFT JOIN exams e ON s.id = e.student_id
LEFT JOIN attendance a ON s.id = a.student_id
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.grade, s.center, s.status, s.att_rate, s.hw_completed, s.exam_avg, s.pay_status;

-- ============================================
-- Functions مفيدة
-- ============================================

-- Function: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ function على الجداول
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_updated_at BEFORE UPDATE ON homework
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- بيانات تجريبية (اختياري)
-- ============================================

-- يمكنك إضافة بيانات تجريبية هنا إذا أردت
