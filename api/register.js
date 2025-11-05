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
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Connect to database and insert email
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    const cleanEmail = email.trim().toLowerCase();
    const result = await client.query(
      'INSERT INTO signups (email) VALUES ($1) RETURNING id, email, created_at',
      [cleanEmail]
    );
    
    await client.end();
    
    console.log('Email saved:', result.rows[0]);
    
    // Check if request expects JSON (from quiz/fetch) or HTML redirect (from form)
    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
    
    if (acceptsJson || req.headers['content-type'] === 'application/json') {
      // Return JSON response for API calls
      res.status(200).json({ success: true, message: 'Email saved successfully' });
    } else {
      // Redirect for form submissions
      res.writeHead(302, { 'Location': '/countdown.html' });
      res.end();
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Handle duplicate email
    if (error.code === '23505') {
      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
      if (acceptsJson || req.headers['content-type'] === 'application/json') {
        return res.status(200).json({ success: true, message: 'Email already registered' });
      }
      res.writeHead(302, { 'Location': '/?error=duplicate' });
      res.end();
      return;
    }
    
    // Handle other errors
    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
    if (acceptsJson || req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ success: false, error: 'Failed to save email' });
    }
    
    res.writeHead(302, { 'Location': '/?error=failed' });
    res.end();
  }
};