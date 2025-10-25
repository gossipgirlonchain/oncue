module.exports = async (req, res) => {
  console.log('=== API CALLED ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (req.method === 'POST') {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        console.log('Invalid email');
        return res.status(400).send('Invalid email');
      }

      console.log('Valid email received:', email);

      // Use direct PostgreSQL connection instead of Neon package
      try {
        const { Client } = require('pg');
        const client = new Client({
          connectionString: process.env.DATABASE_URL
        });
        
        await client.connect();
        console.log('Connected to database');
        
        const cleanEmail = email.trim().toLowerCase();
        const result = await client.query(
          'INSERT INTO signups (email) VALUES ($1) RETURNING id, email, created_at',
          [cleanEmail]
        );
        
        console.log('Email saved to database:', result.rows[0]);
        await client.end();
        
      } catch (dbError) {
        console.log('Database error:', dbError.message);
        // Continue anyway - don't crash the function
      }

      return res.redirect(302, 'https://oncue.market/?success=true');
      
    } catch (error) {
      console.error('General error:', error);
      return res.redirect(302, 'https://oncue.market/?error=true');
    }
  }
  
  return res.status(405).send('Method not allowed');
};