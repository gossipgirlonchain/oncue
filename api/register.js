const { Client } = require('pg');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API called, method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers));
    
    // Parse request body
    let email;
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      email = parsed.email;
    } else {
      email = req.body.email;
    }
    
    console.log('Email received:', email);
    
    if (!email || !email.includes('@')) {
      console.error('Invalid email format');
      const isJsonRequest = req.headers['content-type'] === 'application/json';
      if (isJsonRequest) {
        return res.status(400).json({ success: false, error: 'Valid email required' });
      }
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set in environment variables');
      const isJsonRequest = req.headers['content-type'] === 'application/json';
      if (isJsonRequest) {
        return res.status(500).json({ success: false, error: 'Database connection not configured. Please set DATABASE_URL in Vercel environment variables.' });
      }
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    console.log('Connecting to database...');
    
    // Connect to database and insert email
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    console.log('Database connected successfully');
    
    const cleanEmail = email.trim().toLowerCase();
    console.log('Inserting email:', cleanEmail);
    
    const result = await client.query(
      'INSERT INTO signups (email) VALUES ($1) RETURNING id, email, created_at',
      [cleanEmail]
    );
    
    console.log('Email saved successfully:', result.rows[0]);
    
    await client.end();
    console.log('Database connection closed');
    
    // Check if request expects JSON (from quiz/fetch) or HTML redirect (from form)
    const isJsonRequest = req.headers['content-type'] === 'application/json' || 
                          (req.headers.accept && req.headers.accept.includes('application/json'));
    
    if (isJsonRequest) {
      // Return JSON response for API calls
      return res.status(200).json({ success: true, message: 'Email saved successfully' });
    } else {
      // Redirect for form submissions
      res.writeHead(302, { 'Location': '/countdown.html' });
      res.end();
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    const isJsonRequest = req.headers['content-type'] === 'application/json' || 
                          (req.headers.accept && req.headers.accept.includes('application/json'));
    
    // Handle duplicate email
    if (error.code === '23505') {
      if (isJsonRequest) {
        return res.status(200).json({ success: true, message: 'Email already registered' });
      }
      res.writeHead(302, { 'Location': '/?error=duplicate' });
      res.end();
      return;
    }
    
    // Handle other errors
    if (isJsonRequest) {
      return res.status(500).json({ success: false, error: 'Failed to save email' });
    }
    
    res.writeHead(302, { 'Location': '/?error=failed' });
    res.end();
  }
};