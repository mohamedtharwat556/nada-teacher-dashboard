const { createClient } = require('@supabase/supabase-js');

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

        // GET all data from Supabase
        if ((pathname === '/data' || pathname === '/api/data') && req.method === 'GET') {
            if (!supabase) {
                return res.status(500).json({ 
                    error: 'Supabase not configured',
                    message: 'Please check environment variables for SUPABASE_URL and SUPABASE_ANON_KEY'
                });
            }

            console.log('📖 Fetching data from Supabase...');
            const { data, error } = await supabase.from('store').select('*');
            
            if (error) {
                console.error('❌ Supabase query error:', error);
                throw error;
            }
            
            let result = { ...defaultData };
            if (data && data.length > 0) {
                data.forEach(row => {
                    result[row.id] = row.value;
                });
            }
            
            console.log('✅ Data fetched successfully');
            res.status(200).json(result);
            return;
        }

        // POST update specific keys to Supabase
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