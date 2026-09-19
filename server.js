require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL_HERE' && supabaseKey && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error.message);
    }
} else {
    console.warn('⚠️  Supabase credentials not found in .env. Server will run but API will fail.');
    console.warn('⚠️  Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
}

// Middleware
app.use(cors({
    origin: '*', // In production, specify your domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Default empty state
const defaultData = {
    students: [], homework: [], exams: [], attendance: [], payments: [], notes: [], activities: [], monthlyEvaluations: [], studentMonthlyData: []
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        supabase: supabase ? 'connected' : 'not configured',
        timestamp: new Date().toISOString()
    });
});

// GET all students
app.get('/api/students', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        console.log('📖 Fetching students from Supabase...');
        const { data, error } = await supabase.from('students').select('*');
        
        if (error) {
            console.error('❌ Supabase students query error:', error);
            throw error;
        }
        
        // Convert snake_case to camelCase for frontend compatibility
        const students = data.map(student => ({
            id: student.id,
            name: student.name,
            grade: student.grade,
            center: student.center,
            status: student.status,
            attRate: student.att_rate,
            hwCompleted: student.hw_completed,
            examAvg: student.exam_avg,
            payStatus: student.pay_status,
            generalNotes: student.general_notes,
            currentMonth: student.current_month,
            currentYear: student.current_year,
            createdAt: student.created_at,
            updatedAt: student.updated_at
        }));
        
        console.log('✅ Students fetched successfully:', students.length);
        res.json(students);
    } catch (err) {
        console.error('❌ Error reading students from Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database read error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// POST create new student
app.post('/api/students', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        const studentData = req.body;
        
        // Convert camelCase to snake_case for Supabase
        const snakeCaseData = {
            name: studentData.name,
            grade: studentData.grade,
            center: studentData.center,
            status: studentData.status || 'منتظم',
            att_rate: studentData.attRate || 100,
            hw_completed: studentData.hwCompleted || studentData.homeworkCompleted || '0/0',
            exam_avg: studentData.examAvg || 0,
            pay_status: studentData.payStatus || 'لم يتم الدفع',
            general_notes: studentData.generalNotes || '',
            current_month: studentData.currentMonth || new Date().getMonth(),
            current_year: studentData.currentYear || new Date().getFullYear()
        };
        
        console.log('💾 Creating student in Supabase:', snakeCaseData.name);
        
        const { data, error } = await supabase.from('students').insert(snakeCaseData).select().single();
        
        if (error) {
            console.error('❌ Supabase student insert error:', error);
            throw error;
        }
        
        // Convert back to camelCase for response
        const responseStudent = {
            id: data.id,
            name: data.name,
            grade: data.grade,
            center: data.center,
            status: data.status,
            attRate: data.att_rate,
            hwCompleted: data.hw_completed,
            examAvg: data.exam_avg,
            payStatus: data.pay_status,
            generalNotes: data.general_notes,
            currentMonth: data.current_month,
            currentYear: data.current_year,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
        
        console.log('✅ Student created successfully');
        res.status(201).json(responseStudent);
    } catch (err) {
        console.error('❌ Error creating student in Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database write error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// PUT update student
app.put('/api/students/:id', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        const { id } = req.params;
        const studentData = req.body;
        
        // Convert camelCase to snake_case for Supabase
        const snakeCaseData = {
            name: studentData.name,
            grade: studentData.grade,
            center: studentData.center,
            status: studentData.status,
            att_rate: studentData.attRate,
            hw_completed: studentData.hwCompleted || studentData.homeworkCompleted,
            exam_avg: studentData.examAvg,
            pay_status: studentData.payStatus,
            general_notes: studentData.generalNotes,
            current_month: studentData.currentMonth,
            current_year: studentData.currentYear
        };
        
        console.log('💾 Updating student in Supabase:', id);
        
        const { data, error } = await supabase.from('students').update(snakeCaseData).eq('id', id).select().single();
        
        if (error) {
            console.error('❌ Supabase student update error:', error);
            throw error;
        }
        
        // Convert back to camelCase for response
        const responseStudent = {
            id: data.id,
            name: data.name,
            grade: data.grade,
            center: data.center,
            status: data.status,
            attRate: data.att_rate,
            hwCompleted: data.hw_completed,
            examAvg: data.exam_avg,
            payStatus: data.pay_status,
            generalNotes: data.general_notes,
            currentMonth: data.current_month,
            currentYear: data.current_year,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
        
        console.log('✅ Student updated successfully');
        res.json(responseStudent);
    } catch (err) {
        console.error('❌ Error updating student in Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database write error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// DELETE student
app.delete('/api/students/:id', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        const { id } = req.params;
        
        console.log('🗑️ Deleting student from Supabase:', id);
        
        const { error } = await supabase.from('students').delete().eq('id', id);
        
        if (error) {
            console.error('❌ Supabase student delete error:', error);
            throw error;
        }
        
        console.log('✅ Student deleted successfully');
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        console.error('❌ Error deleting student from Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database write error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// GET student monthly data
app.get('/api/student-monthly-data', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        console.log('📖 Fetching student monthly data from Supabase...');
        const { data, error } = await supabase.from('student_monthly_data').select('*');
        
        if (error) {
            console.error('❌ Supabase monthly data query error:', error);
            throw error;
        }
        
        // Convert snake_case to camelCase for frontend compatibility
        const monthlyData = data.map(row => ({
            id: row.id,
            studentId: row.student_id,
            monthIndex: row.month_index,
            year: row.year,
            attendanceRate: row.attendance_rate,
            homeworkCompleted: row.homework_completed,
            examAvg: row.exam_avg,
            paymentStatus: row.payment_status,
            status: row.status,
            generalNotes: row.general_notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        
        console.log('✅ Monthly data fetched successfully:', monthlyData.length);
        res.json(monthlyData);
    } catch (err) {
        console.error('❌ Error reading monthly data from Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database read error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// GET all data from Supabase
app.get('/api/data', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        console.log('📖 Fetching data from Supabase...');
        
        // Fetch from store table (legacy) for most data
        const { data: storeData, error: storeError } = await supabase.from('store').select('*');
        
        if (storeError) {
            console.error('❌ Supabase store query error:', storeError);
            throw storeError;
        }
        
        // Reconstruct the JSON object from the store rows
        let result = { ...defaultData };
        if (storeData && storeData.length > 0) {
            storeData.forEach(row => {
                result[row.id] = row.value;
            });
        }
        
        // Fetch student monthly data from the new table
        const { data: monthlyData, error: monthlyError } = await supabase.from('student_monthly_data').select('*');
        
        if (monthlyError) {
            console.warn('⚠️ Could not fetch student monthly data:', monthlyError.message);
            // Continue without monthly data
        } else if (monthlyData) {
            // Convert snake_case to camelCase for consistency
            result.studentMonthlyData = monthlyData.map(row => ({
                id: row.id,
                studentId: row.student_id,
                monthIndex: row.month_index,
                year: row.year,
                attendanceRate: row.attendance_rate,
                homeworkCompleted: row.homework_completed,
                examAvg: row.exam_avg,
                paymentStatus: row.payment_status,
                status: row.status,
                generalNotes: row.general_notes,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        }
        
        console.log('✅ Data fetched successfully');
        res.json(result);
    } catch (err) {
        console.error('❌ Error reading from Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database read error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// POST update specific keys to Supabase
app.post('/api/data', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ 
            error: 'Supabase not configured',
            message: 'Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
        });
    }

    try {
        const updates = req.body;
        
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ 
                error: 'Invalid request body',
                message: 'Request body must be a JSON object'
            });
        }

        console.log('💾 Saving data to Supabase:', Object.keys(updates));
        
        // Handle student monthly data separately - save to new table
        if (updates.studentMonthlyData) {
            const monthlyData = updates.studentMonthlyData;
            
            // Convert camelCase to snake_case for Supabase
            const snakeCaseData = monthlyData.map(row => ({
                id: row.id,
                student_id: row.studentId,
                month_index: row.monthIndex,
                year: row.year,
                attendance_rate: row.attendanceRate,
                homework_completed: row.homeworkCompleted,
                exam_avg: row.examAvg,
                payment_status: row.paymentStatus,
                status: row.status,
                general_notes: row.generalNotes
            }));
            
            const { error: monthlyError } = await supabase.from('student_monthly_data').upsert(snakeCaseData, { onConflict: 'student_id,month_index,year' });
            
            if (monthlyError) {
                console.error('❌ Supabase monthly data upsert error:', monthlyError);
                throw monthlyError;
            }
            
            console.log('✅ Student monthly data saved successfully');
            
            // Remove from updates so it doesn't go to store table
            delete updates.studentMonthlyData;
        }
        
        // Convert remaining updates into an array of upsert operations for store table
        const upserts = Object.keys(updates).map(key => ({
            id: key,
            value: updates[key]
        }));

        if (upserts.length > 0) {
            const { error } = await supabase.from('store').upsert(upserts, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Supabase upsert error:', error);
                throw error;
            }
        }

        console.log('✅ Data saved successfully');
        res.json({ success: true, message: 'Data saved successfully to Supabase' });
    } catch (err) {
        console.error('❌ Error writing to Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database write error',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Serve static files after API routes to avoid conflicts
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
    console.log('=================================');
    console.log(`📱 Teacher Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`👨‍👩‍👧 Parent Portal:   http://localhost:${PORT}/index.html`);
    console.log(`❤️ Health Check:     http://localhost:${PORT}/api/health`);
    console.log('=================================');
    
    if (!supabase) {
        console.warn('⚠️  WARNING: Supabase is not configured. Please set up your .env file.');
    }
});
