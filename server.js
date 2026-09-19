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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

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
        const { data, error } = await supabase.from('store').select('*');
        
        if (error) {
            console.error('❌ Supabase query error:', error);
            throw error;
        }
        
        // Reconstruct the JSON object from the rows
        let result = { ...defaultData };
        if (data && data.length > 0) {
            data.forEach(row => {
                result[row.id] = row.value;
            });
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
        
        // Convert updates into an array of upsert operations
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
    console.log('📱 Teacher Dashboard: http://localhost:3000/dashboard.html');
    console.log('👨‍👩‍👧 Parent Portal:   http://localhost:3000/index.html');
    console.log('❤️ Health Check:     http://localhost:3000/api/health');
    console.log('=================================');
    
    if (!supabase) {
        console.warn('⚠️  WARNING: Supabase is not configured. Please set up your .env file.');
    }
});
