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
        // Handle operations with student ID via query parameter
        const { id } = req.query;

        if (id) {
            // Handle specific student operations
            if (req.method === 'GET') {
                if (!supabase) {
                    return res.status(500).json({ error: 'Supabase not configured' });
                }

                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Supabase error fetching student:', error);
                    return res.status(404).json({ error: 'Student not found' });
                }

                const camelCaseData = snakeToCamel(data);
                return res.json(camelCaseData);
            }

            if (req.method === 'PUT') {
                if (!supabase) {
                    return res.status(500).json({ error: 'Supabase not configured' });
                }

                const studentData = req.body;
                delete studentData.teacher;

                const dbData = {};
                if (studentData.name !== undefined) dbData.name = studentData.name;
                if (studentData.grade !== undefined) dbData.grade = studentData.grade;
                if (studentData.center !== undefined) dbData.center = studentData.center;
                if (studentData.status !== undefined) dbData.status = studentData.status;
                if (studentData.attRate !== undefined) dbData.att_rate = parseInt(studentData.attRate);
                if (studentData.hwCompleted !== undefined) dbData.hw_completed = studentData.hwCompleted;
                if (studentData.examAvg !== undefined) dbData.exam_avg = parseInt(studentData.examAvg);
                if (studentData.payStatus !== undefined) dbData.pay_status = studentData.payStatus;
                if (studentData.generalNotes !== undefined) dbData.general_notes = studentData.generalNotes;
                if (studentData.currentMonth !== undefined) dbData.current_month = parseInt(studentData.currentMonth);
                if (studentData.currentYear !== undefined) dbData.current_year = parseInt(studentData.currentYear);

                const { data, error } = await supabase
                    .from('students')
                    .update(dbData)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase update error:', error);
                    return res.status(500).json({ error: 'Failed to update student' });
                }

                const camelCaseData = snakeToCamel(data);
                return res.json(camelCaseData);
            }

            if (req.method === 'DELETE') {
                if (!supabase) {
                    return res.status(500).json({ error: 'Supabase not configured' });
                }

                const { error } = await supabase
                    .from('students')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Supabase delete error:', error);
                    return res.status(500).json({ error: 'Failed to delete student' });
                }

                return res.json({ success: true });
            }

            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Handle general students operations (GET all, POST)
        if (req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            console.log('Fetching students from Supabase...');
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error fetching students:', error);
                return res.status(500).json({
                    error: 'Supabase error',
                    message: error.message,
                    code: error.code
                });
            }

            console.log('Students fetched successfully:', data ? data.length : 0, 'students');
            const camelCaseData = snakeToCamel(data);
            return res.json(camelCaseData || []);
        }

        if (req.method === 'POST') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const studentData = req.body;
            console.log('POST student data:', studentData);

            delete studentData.teacher;

            const dbData = {
                name: studentData.name,
                grade: studentData.grade,
                center: studentData.center,
                status: studentData.status,
                att_rate: studentData.attRate ? parseInt(studentData.attRate) : 100,
                hw_completed: studentData.hwCompleted || '0/0',
                exam_avg: studentData.examAvg ? parseInt(studentData.examAvg) : 0,
                pay_status: studentData.payStatus || 'لم يتم الدفع',
                general_notes: studentData.generalNotes,
                current_month: studentData.currentMonth !== undefined ? parseInt(studentData.currentMonth) : new Date().getMonth(),
                current_year: studentData.currentYear !== undefined ? parseInt(studentData.currentYear) : new Date().getFullYear()
            };

            const { data, error } = await supabase
                .from('students')
                .insert([dbData])
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            const camelCaseData = snakeToCamel(data);
            return res.status(201).json(camelCaseData);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Error in students API:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};