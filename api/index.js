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

// Main handler
module.exports = async function handler(req, res) {
    setCorsHeaders(res);

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Parse URL pathname - handle both Vercel and local environments
    let pathname;
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        pathname = url.pathname;
    } catch (e) {
        pathname = req.url || '/';
    }

    // Parse request body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            if (req.body && typeof req.body === 'string') {
                req.body = JSON.parse(req.body);
            }
        } catch (e) {
            console.error('Error parsing request body:', e.message);
            req.body = {};
        }
    }

    try {
        // Health check endpoint
        if ((pathname === '/health' || pathname === '/api/health') && req.method === 'GET') {
            return res.status(200).json({
                status: 'ok',
                supabase: supabase ? 'connected' : 'not configured',
                supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'not set',
                timestamp: new Date().toISOString()
            });
        }

        // Database check endpoint
        if ((pathname === '/api/db-check' || pathname === '/db-check') && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            try {
                // Check if students table exists and is accessible
                const { data: studentsData, error: studentsError } = await supabase
                    .from('students')
                    .select('count', { count: 'exact', head: true });

                // Try to list tables using information_schema
                const { data: tablesData, error: tablesError } = await supabase
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_schema', 'public')
                    .order('table_name');

                const result = {
                    students: {
                        exists: !studentsError,
                        count: studentsData ? studentsData : 0,
                        error: studentsError ? studentsError.message : null,
                        fullError: studentsError
                    },
                    tables: tablesData ? tablesData.map(t => t.table_name) : [],
                    tablesError: tablesError ? tablesError.message : null
                };

                return res.json(result);
            } catch (err) {
                console.error('Database check error:', err);
                return res.status(500).json({ error: 'Database check failed', message: err.message });
            }
        }

        // GET all students from Supabase
        if (pathname === '/api/students' && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase error fetching students:', error);
                    // Check if table doesn't exist
                    if (error.code === '42P01') {
                        return res.status(500).json({
                            error: 'Table not found',
                            message: 'The students table does not exist in Supabase. Please run supabase_setup.sql',
                            code: error.code
                        });
                    }
                    // Check if RLS issue
                    if (error.code === '42501') {
                        return res.status(500).json({
                            error: 'Permission denied',
                            message: 'Row Level Security is enabled but no policies exist. Please check Supabase RLS settings',
                            code: error.code
                        });
                    }
                    throw error;
                }
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching students:', err);
                return res.status(500).json({ error: 'Failed to fetch students', message: err.message });
            }
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

            try {
                const studentData = req.body;
                delete studentData.teacher;

                const { data, error } = await supabase
                    .from('students')
                    .insert([studentData])
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error creating student:', err);
                return res.status(500).json({ error: 'Failed to create student', message: err.message });
            }
        }

        // PUT update student
        if (pathname.match(/^\/api\/students\/[^\/]+$/) && req.method === 'PUT') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            try {
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
                return res.json(data);
            } catch (err) {
                console.error('Error updating student:', err);
                return res.status(500).json({ error: 'Failed to update student', message: err.message });
            }
        }

        // DELETE student
        if (pathname.match(/^\/api\/students\/[^\/]+$/) && req.method === 'DELETE') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase not configured' });
            }

            try {
                const id = pathname.split('/').pop();
                const { error } = await supabase
                    .from('students')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return res.json({ success: true });
            } catch (err) {
                console.error('Error deleting student:', err);
                return res.status(500).json({ error: 'Failed to delete student', message: err.message });
            }
        }

        // GET all data from Supabase (legacy)
        if ((pathname === '/data' || pathname === '/api/data') && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({
                    error: 'Supabase not configured',
                    message: 'Please check environment variables for SUPABASE_URL and SUPABASE_ANON_KEY'
                });
            }

            try {
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
                return res.status(200).json(result);
            } catch (err) {
                console.error('Error fetching data:', err);
                return res.status(500).json({ error: 'Failed to fetch data', message: err.message });
            }
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

        // GET homework
        if (pathname === '/api/homework' && req.method === 'GET') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('homework')
                    .select('*, students(name, grade)')
                    .order('date', { ascending: false });

                if (error) throw error;
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching homework:', err);
                return res.status(500).json({ error: 'Failed to fetch homework', message: err.message });
            }
        }

        // POST homework
        if (pathname === '/api/homework' && req.method === 'POST') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('homework')
                    .insert([req.body])
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error creating homework:', err);
                return res.status(500).json({ error: 'Failed to create homework', message: err.message });
            }
        }

        // PUT homework
        if (pathname.match(/^\/api\/homework\/[^\/]+$/) && req.method === 'PUT') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { data, error } = await supabase
                    .from('homework')
                    .update(req.body)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error updating homework:', err);
                return res.status(500).json({ error: 'Failed to update homework', message: err.message });
            }
        }

        // DELETE homework
        if (pathname.match(/^\/api\/homework\/[^\/]+$/) && req.method === 'DELETE') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { error } = await supabase
                    .from('homework')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return res.json({ success: true });
            } catch (err) {
                console.error('Error deleting homework:', err);
                return res.status(500).json({ error: 'Failed to delete homework', message: err.message });
            }
        }

        // GET exams
        if (pathname === '/api/exams' && req.method === 'GET') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('exams')
                    .select('*, students(name, grade)')
                    .order('date', { ascending: false });

                if (error) throw error;
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching exams:', err);
                return res.status(500).json({ error: 'Failed to fetch exams', message: err.message });
            }
        }

        // POST exams
        if (pathname === '/api/exams' && req.method === 'POST') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('exams')
                    .insert([req.body])
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error creating exam:', err);
                return res.status(500).json({ error: 'Failed to create exam', message: err.message });
            }
        }

        // PUT exams
        if (pathname.match(/^\/api\/exams\/[^\/]+$/) && req.method === 'PUT') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { data, error } = await supabase
                    .from('exams')
                    .update(req.body)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error updating exam:', err);
                return res.status(500).json({ error: 'Failed to update exam', message: err.message });
            }
        }

        // DELETE exams
        if (pathname.match(/^\/api\/exams\/[^\/]+$/) && req.method === 'DELETE') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { error } = await supabase
                    .from('exams')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return res.json({ success: true });
            } catch (err) {
                console.error('Error deleting exam:', err);
                return res.status(500).json({ error: 'Failed to delete exam', message: err.message });
            }
        }

        // GET attendance
        if (pathname === '/api/attendance' && req.method === 'GET') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { date } = req.query;
                let query = supabase
                    .from('attendance')
                    .select('*, students(name, grade)')
                    .order('date', { ascending: false });

                if (date) {
                    query = query.eq('date', date);
                }

                const { data, error } = await query;

                if (error) throw error;
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching attendance:', err);
                return res.status(500).json({ error: 'Failed to fetch attendance', message: err.message });
            }
        }

        // POST attendance
        if (pathname === '/api/attendance' && req.method === 'POST') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const records = Array.isArray(req.body) ? req.body : [req.body];

                const { data, error } = await supabase
                    .from('attendance')
                    .upsert(records, { onConflict: 'student_id,date' })
                    .select();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error saving attendance:', err);
                return res.status(500).json({ error: 'Failed to save attendance', message: err.message });
            }
        }

        // GET payments
        if (pathname === '/api/payments' && req.method === 'GET') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('payments')
                    .select('*, students(name, grade)')
                    .order('date', { ascending: false });

                if (error) throw error;
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching payments:', err);
                return res.status(500).json({ error: 'Failed to fetch payments', message: err.message });
            }
        }

        // POST payments
        if (pathname === '/api/payments' && req.method === 'POST') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('payments')
                    .insert([req.body])
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error creating payment:', err);
                return res.status(500).json({ error: 'Failed to create payment', message: err.message });
            }
        }

        // PUT payments
        if (pathname.match(/^\/api\/payments\/[^\/]+$/) && req.method === 'PUT') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { data, error } = await supabase
                    .from('payments')
                    .update(req.body)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error updating payment:', err);
                return res.status(500).json({ error: 'Failed to update payment', message: err.message });
            }
        }

        // DELETE payments
        if (pathname.match(/^\/api\/payments\/[^\/]+$/) && req.method === 'DELETE') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { error } = await supabase
                    .from('payments')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return res.json({ success: true });
            } catch (err) {
                console.error('Error deleting payment:', err);
                return res.status(500).json({ error: 'Failed to delete payment', message: err.message });
            }
        }

        // GET notes
        if (pathname === '/api/notes' && req.method === 'GET') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*, students(name, grade)')
                    .order('date', { ascending: false });

                if (error) throw error;
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching notes:', err);
                return res.status(500).json({ error: 'Failed to fetch notes', message: err.message });
            }
        }

        // POST notes
        if (pathname === '/api/notes' && req.method === 'POST') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('notes')
                    .insert([req.body])
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error creating note:', err);
                return res.status(500).json({ error: 'Failed to create note', message: err.message });
            }
        }

        // PUT notes
        if (pathname.match(/^\/api\/notes\/[^\/]+$/) && req.method === 'PUT') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { data, error } = await supabase
                    .from('notes')
                    .update(req.body)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error updating note:', err);
                return res.status(500).json({ error: 'Failed to update note', message: err.message });
            }
        }

        // DELETE notes
        if (pathname.match(/^\/api\/notes\/[^\/]+$/) && req.method === 'DELETE') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const id = pathname.split('/').pop();
                const { error } = await supabase
                    .from('notes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return res.json({ success: true });
            } catch (err) {
                console.error('Error deleting note:', err);
                return res.status(500).json({ error: 'Failed to delete note', message: err.message });
            }
        }

        // GET activities
        if (pathname === '/api/activities' && req.method === 'GET') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .order('timestamp', { ascending: false });

                if (error) throw error;
                return res.json(data || []);
            } catch (err) {
                console.error('Error fetching activities:', err);
                return res.status(500).json({ error: 'Failed to fetch activities', message: err.message });
            }
        }

        // POST activities
        if (pathname === '/api/activities' && req.method === 'POST') {
            if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

            try {
                const { data, error } = await supabase
                    .from('activities')
                    .insert([req.body])
                    .select()
                    .single();

                if (error) throw error;
                return res.json(data);
            } catch (err) {
                console.error('Error creating activity:', err);
                return res.status(500).json({ error: 'Failed to create activity', message: err.message });
            }
        }

        // 404 handler
        res.status(404).json({ 
            error: 'Not found',
            message: `Route ${req.method} ${pathname} not found`
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}