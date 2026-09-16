require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname), {
    index: 'index.html',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        supabase: supabase ? 'connected' : 'not configured',
        timestamp: new Date().toISOString()
    });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Stripe config endpoint
app.get('/api/stripe-config', (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    });
});

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', metadata = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                error: 'Invalid amount',
                message: 'Amount must be greater than 0'
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ 
            error: 'Payment intent creation failed',
            message: error.message
        });
    }
});

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { success_url, cancel_url, line_items, metadata = {} } = req.body;

        if (!success_url || !cancel_url || !line_items) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'success_url, cancel_url, and line_items are required'
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url,
            cancel_url,
            metadata,
        });

        res.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ 
            error: 'Checkout session creation failed',
            message: error.message
        });
    }
});

// ============================================
// API Routes - Students
// ============================================

// GET all students
app.get('/api/students', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching students:', err.message);
        res.status(500).json({ error: 'Failed to fetch students', message: err.message });
    }
});

// GET single student
app.get('/api/students/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching student:', err.message);
        res.status(500).json({ error: 'Failed to fetch student', message: err.message });
    }
});

// POST create student
app.post('/api/students', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('students')
            .insert([req.body])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error creating student:', err.message);
        res.status(500).json({ error: 'Failed to create student', message: err.message });
    }
});

// PUT update student
app.put('/api/students/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('students')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error updating student:', err.message);
        res.status(500).json({ error: 'Failed to update student', message: err.message });
    }
});

// DELETE student
app.delete('/api/students/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting student:', err.message);
        res.status(500).json({ error: 'Failed to delete student', message: err.message });
    }
});

// ============================================
// API Routes - Homework
// ============================================

app.get('/api/homework', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('homework')
            .select('*, students(name, grade)')
            .order('date', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching homework:', err.message);
        res.status(500).json({ error: 'Failed to fetch homework', message: err.message });
    }
});

app.post('/api/homework', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('homework')
            .insert([req.body])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error creating homework:', err.message);
        res.status(500).json({ error: 'Failed to create homework', message: err.message });
    }
});

app.put('/api/homework/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('homework')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error updating homework:', err.message);
        res.status(500).json({ error: 'Failed to update homework', message: err.message });
    }
});

app.delete('/api/homework/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { error } = await supabase
            .from('homework')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting homework:', err.message);
        res.status(500).json({ error: 'Failed to delete homework', message: err.message });
    }
});

// ============================================
// API Routes - Exams
// ============================================

app.get('/api/exams', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*, students(name, grade)')
            .order('date', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching exams:', err.message);
        res.status(500).json({ error: 'Failed to fetch exams', message: err.message });
    }
});

app.post('/api/exams', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('exams')
            .insert([req.body])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error creating exam:', err.message);
        res.status(500).json({ error: 'Failed to create exam', message: err.message });
    }
});

app.put('/api/exams/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('exams')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error updating exam:', err.message);
        res.status(500).json({ error: 'Failed to update exam', message: err.message });
    }
});

app.delete('/api/exams/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { error } = await supabase
            .from('exams')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting exam:', err.message);
        res.status(500).json({ error: 'Failed to delete exam', message: err.message });
    }
});

// ============================================
// API Routes - Attendance
// ============================================

app.get('/api/attendance', async (req, res) => {
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
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching attendance:', err.message);
        res.status(500).json({ error: 'Failed to fetch attendance', message: err.message });
    }
});

app.post('/api/attendance', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const records = Array.isArray(req.body) ? req.body : [req.body];
        
        const { data, error } = await supabase
            .from('attendance')
            .upsert(records, { onConflict: 'student_id,date' })
            .select();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error saving attendance:', err.message);
        res.status(500).json({ error: 'Failed to save attendance', message: err.message });
    }
});

// ============================================
// API Routes - Payments
// ============================================

app.get('/api/payments', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*, students(name, grade)')
            .order('date', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching payments:', err.message);
        res.status(500).json({ error: 'Failed to fetch payments', message: err.message });
    }
});

app.post('/api/payments', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('payments')
            .insert([req.body])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error creating payment:', err.message);
        res.status(500).json({ error: 'Failed to create payment', message: err.message });
    }
});

app.put('/api/payments/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('payments')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error updating payment:', err.message);
        res.status(500).json({ error: 'Failed to update payment', message: err.message });
    }
});

app.delete('/api/payments/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting payment:', err.message);
        res.status(500).json({ error: 'Failed to delete payment', message: err.message });
    }
});

// ============================================
// API Routes - Notes
// ============================================

app.get('/api/notes', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*, students(name, grade)')
            .order('date', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching notes:', err.message);
        res.status(500).json({ error: 'Failed to fetch notes', message: err.message });
    }
});

app.post('/api/notes', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('notes')
            .insert([req.body])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error creating note:', err.message);
        res.status(500).json({ error: 'Failed to create note', message: err.message });
    }
});

app.put('/api/notes/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('notes')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error updating note:', err.message);
        res.status(500).json({ error: 'Failed to update note', message: err.message });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting note:', err.message);
        res.status(500).json({ error: 'Failed to delete note', message: err.message });
    }
});

// ============================================
// API Routes - Activities
// ============================================

app.get('/api/activities', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Error fetching activities:', err.message);
        res.status(500).json({ error: 'Failed to fetch activities', message: err.message });
    }
});

app.post('/api/activities', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const { data, error } = await supabase
            .from('activities')
            .insert([req.body])
            .select()
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error creating activity:', err.message);
        res.status(500).json({ error: 'Failed to create activity', message: err.message });
    }
});

// ============================================
// Legacy API - for backward compatibility
// ============================================

// GET all data (legacy format)
app.get('/api/data', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        console.log('📖 Fetching all data from new schema...');
        
        const [students, homework, exams, attendance, payments, notes, activities] = await Promise.all([
            supabase.from('students').select('*'),
            supabase.from('homework').select('*'),
            supabase.from('exams').select('*'),
            supabase.from('attendance').select('*'),
            supabase.from('payments').select('*'),
            supabase.from('notes').select('*'),
            supabase.from('activities').select('*')
        ]);

        const result = {
            students: students.data || [],
            homework: homework.data || [],
            exams: exams.data || [],
            attendance: attendance.data || [],
            payments: payments.data || [],
            notes: notes.data || [],
            activities: activities.data || []
        };
        
        console.log('✅ All data fetched successfully');
        res.json(result);
    } catch (err) {
        console.error('❌ Error reading from Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database read error',
            message: err.message
        });
    }
});

// POST update data (legacy format)
app.post('/api/data', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        const updates = req.body;
        
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ 
                error: 'Invalid request body',
                message: 'Request body must be a JSON object'
            });
        }

        console.log('💾 Saving data to new schema:', Object.keys(updates));
        
        // Handle each data type separately
        const operations = [];
        
        if (updates.students) {
            operations.push(supabase.from('students').upsert(updates.students, { onConflict: 'id' }));
        }
        if (updates.homework) {
            operations.push(supabase.from('homework').upsert(updates.homework, { onConflict: 'id' }));
        }
        if (updates.exams) {
            operations.push(supabase.from('exams').upsert(updates.exams, { onConflict: 'id' }));
        }
        if (updates.attendance) {
            operations.push(supabase.from('attendance').upsert(updates.attendance, { onConflict: 'student_id,date' }));
        }
        if (updates.payments) {
            operations.push(supabase.from('payments').upsert(updates.payments, { onConflict: 'id' }));
        }
        if (updates.notes) {
            operations.push(supabase.from('notes').upsert(updates.notes, { onConflict: 'id' }));
        }
        if (updates.activities) {
            operations.push(supabase.from('activities').upsert(updates.activities, { onConflict: 'id' }));
        }

        const results = await Promise.all(operations);
        
        // Check for errors
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            throw new Error(errors[0].error.message);
        }

        console.log('✅ Data saved successfully');
        res.json({ success: true, message: 'Data saved successfully to Supabase' });
    } catch (err) {
        console.error('❌ Error writing to Supabase:', err.message);
        res.status(500).json({ 
            error: 'Database write error',
            message: err.message
        });
    }
});

// 404 handler - for API routes only
app.use('/api', (req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: `API Route ${req.method} ${req.path} not found`
    });
});

// Fallback for static files (SPA support)
app.get('*', (req, res) => {
    // If it's an API route that wasn't caught
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ 
            error: 'Not found',
            message: `Route ${req.method} ${req.path} not found`
        });
    }
    
    // Otherwise serve index.html for SPA routing
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message
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
    console.log('📊 Using improved schema with separate tables');
    console.log('=================================');
    
    if (!supabase) {
        console.warn('⚠️  WARNING: Supabase is not configured. Please set up your .env file.');
    }
});