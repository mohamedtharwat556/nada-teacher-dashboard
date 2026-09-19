const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
try {
    if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL_HERE' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️  Supabase credentials not properly configured');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
}

// Helper function to set CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
}

module.exports = async function handler(req, res) {
    setCorsHeaders(res);

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({
                    error: 'Supabase not configured',
                    message: 'Please check environment variables for SUPABASE_URL and SUPABASE_ANON_KEY'
                });
            }

            console.log('📖 Fetching data from Supabase...');

            const [studentsRes, homeworkRes, examsRes, attendanceRes, paymentsRes, notesRes, activitiesRes, monthlyDataRes] = await Promise.all([
                supabase.from('students').select('*'),
                supabase.from('homework').select('*'),
                supabase.from('exams').select('*'),
                supabase.from('attendance').select('*'),
                supabase.from('payments').select('*'),
                supabase.from('notes').select('*'),
                supabase.from('activities').select('*'),
                supabase.from('student_monthly_data').select('*')
            ]);

            // Convert monthly data to camelCase
            const monthlyData = monthlyDataRes.data ? monthlyDataRes.data.map(row => ({
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
            })) : [];

            const result = {
                students: studentsRes.data || [],
                homework: homeworkRes.data || [],
                exams: examsRes.data || [],
                attendance: attendanceRes.data || [],
                payments: paymentsRes.data || [],
                notes: notesRes.data || [],
                activities: activitiesRes.data || [],
                studentMonthlyData: monthlyData
            };

            console.log('✅ Data fetched successfully');
            return res.status(200).json(result);
        }

        if (req.method === 'POST') {
            if (!supabase) {
                return res.status(500).json({ 
                    error: 'Supabase not configured',
                    message: 'Please check environment variables for SUPABASE_URL and SUPABASE_ANON_KEY'
                });
            }

            const updates = req.body;
            
            if (!updates || typeof updates !== 'object') {
                return res.status(400).json({ 
                    error: 'Invalid request body',
                    message: 'Request body must be a JSON object'
                });
            }

            console.log('💾 Saving data to Supabase:', Object.keys(updates));
            
            // Handle student monthly data separately
            if (updates.studentMonthlyData) {
                const monthlyData = updates.studentMonthlyData;
                
                // Convert camelCase to snake_case for Supabase
                const snakeCaseData = monthlyData.map(row => ({
                    id: row.id || randomUUID(), // Generate UUID if not provided
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
            
            // Save remaining data to store table
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
            res.status(200).json({ success: true, message: 'Data saved successfully to Supabase' });
            return;
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Error in data API:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};