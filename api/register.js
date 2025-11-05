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
    let bodyData;
    if (typeof req.body === 'string') {
      bodyData = JSON.parse(req.body);
    } else {
      bodyData = req.body;
    }
    
    const email = bodyData.email;
    const archetype = bodyData.archetype || null; // e.g., 'insider', 'archivist', etc.
    const starSign = bodyData.starSign || null; // e.g., 'Gemini', 'Virgo', etc.
    
    console.log('Data received:', { email, archetype, starSign });
    
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
    
    try {
      await client.connect();
      console.log('Database connected successfully');
      
      const cleanEmail = email.trim().toLowerCase();
      console.log('Inserting data:', { email: cleanEmail, archetype, starSign });
      
      // Insert email with quiz results (handle NULL values properly)
      let result;
      try {
        // Always try to insert with archetype and star_sign (they can be NULL)
        result = await client.query(
          'INSERT INTO signups (email, archetype, star_sign) VALUES ($1, $2, $3) RETURNING id, email, archetype, star_sign, created_at',
          [cleanEmail, archetype || null, starSign || null]
        );
        console.log('Insert successful with quiz results');
      } catch (err) {
        console.error('Insert error:', err.code, err.message);
        // If columns don't exist, try basic insert
        if (err.code === '42703' || err.message.includes('column')) {
          console.log('Quiz result columns not found, using basic insert');
          result = await client.query(
            'INSERT INTO signups (email) VALUES ($1) RETURNING id, email, created_at',
            [cleanEmail]
          );
          console.log('Basic insert successful');
        } else {
          // Re-throw other errors (like duplicate email, connection issues, etc.)
          console.error('Database error:', err);
          throw err;
        }
      }
      
      console.log('Data saved successfully:', result.rows[0]);
    } finally {
      // Always close the connection, even if there's an error
      await client.end();
      console.log('Database connection closed');
    }
    
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
    console.error('=== ERROR DETAILS ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    const isJsonRequest = req.headers['content-type'] === 'application/json' || 
                          (req.headers.accept && req.headers.accept.includes('application/json'));
    
    // Handle duplicate email
    if (error.code === '23505') {
      console.log('Duplicate email detected');
      if (isJsonRequest) {
        return res.status(200).json({ success: true, message: 'Email already registered' });
      }
      res.writeHead(302, { 'Location': '/?error=duplicate' });
      res.end();
      return;
    }
    
    // Handle other errors
    const errorMessage = error.message || 'Failed to save email';
    console.error('Returning error to client:', errorMessage);
    
    if (isJsonRequest) {
      return res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
    
    res.writeHead(302, { 'Location': '/?error=failed' });
    res.end();
  }
};