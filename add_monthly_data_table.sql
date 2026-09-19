-- Migration script to add student_monthly_data table to existing Supabase database
-- Run this in your Supabase SQL Editor to add the new monthly data functionality

-- Add the new table for student monthly data
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_monthly_data_student_id ON student_monthly_data(student_id);
CREATE INDEX IF NOT EXISTS idx_student_monthly_data_month_year ON student_monthly_data(month_index, year);

-- Enable Row Level Security
ALTER TABLE student_monthly_data ENABLE ROW LEVEL SECURITY;

-- Add policy for public access
CREATE POLICY "Public Access Student Monthly Data" ON student_monthly_data FOR ALL USING (true) WITH CHECK (true);

-- Add current_month and current_year columns to students table if they don't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()) - 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());

-- Success message
SELECT 'Student monthly data table added successfully!' as status;