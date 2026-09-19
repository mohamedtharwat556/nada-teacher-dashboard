const { createClient } = require('@supabase/supabase-js');

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

            const [studentsRes, homeworkRes, examsRes, attendanceRes, paymentsRes, notesRes, activitiesRes] = await Promise.all([
                supabase.from('students').select('*'),
                supabase.from('homework').select('*'),
                supabase.from('exams').select('*'),
                supabase.from('attendance').select('*'),
                supabase.from('payments').select('*'),
                supabase.from('notes').select('*'),
                supabase.from('activities').select('*')
            ]);

            const result = {
                students: studentsRes.data || [],
                homework: homeworkRes.data || [],
                exams: examsRes.data || [],
                attendance: attendanceRes.data || [],
                payments: paymentsRes.data || [],
                notes: notesRes.data || [],
                activities: activitiesRes.data || []
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
            
            const upserts = Object.keys(updates).map(key => ({
                id: key,
                value: updates[key]
            }));

            const { error } = await supabase.from('store').upsert(upserts, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Supabase upsert error:', error);
                throw error;
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