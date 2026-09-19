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

// Helper function to convert snake_case to camelCase
function snakeToCamel(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);

    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = snakeToCamel(obj[key]);
        return acc;
    }, {});
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
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            console.log('📖 Fetching student monthly data from Supabase...');
            const { data, error } = await supabase.from('student_monthly_data').select('*');
            
            if (error) {
                console.error('❌ Supabase monthly data query error:', error);
                return res.status(500).json({ error: 'Database error', message: error.message });
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
            return res.json(monthlyData);
        }

        if (req.method === 'POST') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const updates = req.body;
            
            if (!updates || typeof updates !== 'object') {
                return res.status(400).json({ 
                    error: 'Invalid request body',
                    message: 'Request body must be a JSON object'
                });
            }

            console.log('💾 Saving monthly data to Supabase:', Object.keys(updates));
            
            // Handle student monthly data
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
                
                const { error } = await supabase.from('student_monthly_data').upsert(snakeCaseData, { onConflict: 'student_id,month_index,year' });
                
                if (error) {
                    console.error('❌ Supabase monthly data upsert error:', error);
                    throw error;
                }
                
                console.log('✅ Student monthly data saved successfully');
                return res.status(200).json({ success: true, message: 'Monthly data saved successfully' });
            }

            return res.status(400).json({ error: 'Invalid data format' });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Error in student monthly data API:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};