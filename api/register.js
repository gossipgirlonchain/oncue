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
    
    // Redirect to countdown page with success
    res.writeHead(302, { 'Location': '/countdown.html' });
    res.end();
    
  } catch (error) {
    console.error('Error:', error);
    
    // Handle duplicate email
    if (error.code === '23505') {
      res.writeHead(302, { 'Location': '/?error=duplicate' });
      res.end();
      return;
    }
    
    res.writeHead(302, { 'Location': '/?error=failed' });
    res.end();
  }
};