const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        // Create Payment Intent
        if (pathname === '/api/create-payment-intent' && req.method === 'POST') {
            const { amount, currency = 'usd', metadata = {} } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ 
                    error: 'Invalid amount',
                    message: 'Amount must be greater than 0'
                });
            }

            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency,
                    metadata,
                    automatic_payment_methods: {
                        enabled: true,
                    },
                });

                res.status(200).json({
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                });
                return;
            } catch (stripeError) {
                console.error('Stripe error:', stripeError);
                return res.status(500).json({ 
                    error: 'Payment intent creation failed',
                    message: stripeError.message
                });
            }
        }

        // Get Payment Intent Status
        if (pathname === '/api/payment-intent/:id' && req.method === 'GET') {
            const urlParts = pathname.split('/');
            const paymentIntentId = urlParts[urlParts.length - 1];

            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

                res.status(200).json({
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    metadata: paymentIntent.metadata,
                });
                return;
            } catch (stripeError) {
                console.error('Stripe error:', stripeError);
                return res.status(404).json({ 
                    error: 'Payment intent not found',
                    message: stripeError.message
                });
            }
        }

        // Create Checkout Session
        if (pathname === '/api/create-checkout-session' && req.method === 'POST') {
            const { success_url, cancel_url, line_items, metadata = {} } = req.body;

            if (!success_url || !cancel_url || !line_items) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    message: 'success_url, cancel_url, and line_items are required'
                });
            }

            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items,
                    mode: 'payment',
                    success_url,
                    cancel_url,
                    metadata,
                });

                res.status(200).json({
                    sessionId: session.id,
                    url: session.url,
                });
                return;
            } catch (stripeError) {
                console.error('Stripe error:', stripeError);
                return res.status(500).json({ 
                    error: 'Checkout session creation failed',
                    message: stripeError.message
                });
            }
        }

        // Webhook handler
        if (pathname === '/api/webhook' && req.method === 'POST') {
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!sig || !webhookSecret) {
                return res.status(400).json({ 
                    error: 'Webhook signature missing',
                    message: 'Stripe signature or webhook secret not configured'
                });
            }

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            } catch (err) {
                console.error('Webhook signature verification failed:', err.message);
                return res.status(400).json({ 
                    error: 'Webhook signature verification failed',
                    message: err.message
                });
            }

            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    console.log('Payment succeeded:', event.data.object);
                    // TODO: Update your database here
                    break;
                case 'payment_intent.payment_failed':
                    console.log('Payment failed:', event.data.object);
                    // TODO: Handle failed payment
                    break;
                case 'checkout.session.completed':
                    console.log('Checkout session completed:', event.data.object);
                    // TODO: Update your database here
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.status(200).json({ received: true });
            return;
        }

        // Get Stripe Publishable Key
        if (pathname === '/api/stripe-config' && req.method === 'GET') {
            res.status(200).json({
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            });
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