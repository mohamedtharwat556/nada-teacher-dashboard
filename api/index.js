const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error.message);
    }
} else {
    console.warn('⚠️  Supabase credentials not found. API will fail.');
}

// Default empty state
const defaultData = {
    students: [], homework: [], exams: [], attendance: [], payments: [], notes: [], activities: []
};

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

// Main handler
export default async function handler(req, res) {
    setCorsHeaders(res);

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    try {
        // Health check endpoint
        if ((pathname === '/health' || pathname === '/api/health') && req.method === 'GET') {
            res.status(200).json({ 
                status: 'ok', 
                supabase: supabase ? 'connected' : 'not configured',
                timestamp: new Date().toISOString()
            });
            return;
        }

        // GET all students from Supabase
        if (pathname === '/api/students' && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            res.json(data || []);
            return;
        }

        // GET search students
        if (pathname === '/api/students/search' && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const { name, grade, center } = req.query;
            
            let query = supabase.from('students').select('*');
            
            if (name && name.trim() !== '') {
                query = query.ilike('name', `%${name.trim()}%`);
            }
            
            if (grade && grade.trim() !== '') {
                query = query.eq('grade', grade);
            }
            
            if (center && center.trim() !== '') {
                query = query.eq('center', center);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            res.json(data || []);
            return;
        }

        // GET single student
        if (pathname.match(/^\/api\/students\/[^\/]+$/) && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const id = pathname.split('/').pop();
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            res.json(data);
            return;
        }

        // POST create student
        if (pathname === '/api/students' && req.method === 'POST') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const studentData = req.body;
            delete studentData.teacher;
            
            const { data, error } = await supabase
                .from('students')
                .insert([studentData])
                .select()
                .single();
            
            if (error) throw error;
            res.json(data);
            return;
        }

        // PUT update student
        if (pathname.match(/^\/api\/students\/[^\/]+$/) && req.method === 'PUT') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const id = pathname.split('/').pop();
            const studentData = req.body;
            delete studentData.teacher;
            
            const { data, error } = await supabase
                .from('students')
                .update(studentData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            res.json(data);
            return;
        }

        // DELETE student
        if (pathname.match(/^\/api\/students\/[^\/]+$/) && req.method === 'DELETE') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            const id = pathname.split('/').pop();
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            res.json({ success: true });
            return;
        }

        // GET all data from Supabase (legacy)
        if ((pathname === '/data' || pathname === '/api/data') && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ 
                    error: 'Supabase not configured',
                    message: 'Please check environment variables for SUPABASE_URL and SUPABASE_ANON_KEY'
                });
            }

            console.log('📖 Fetching data from Supabase...');
            
            // Fetch data from all tables
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
            res.status(200).json(result);
            return;
        }

        // POST update specific keys to Supabase (legacy)
        if ((pathname === '/data' || pathname === '/api/data') && req.method === 'POST') {
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
            
            // Save to store table for compatibility
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

        // 404 handler
        res.status(404).json({ 
            error: 'Not found',
            message: `Route ${req.method} ${pathname} not found`
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).json({ 
            error: 'Internal server error',
            message: err.message
        });
    }
}