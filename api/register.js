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

      // Try to connect to database
      try {
        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL);
        
        const cleanEmail = email.trim().toLowerCase();
        await sql`INSERT INTO signups (email) VALUES (${cleanEmail})`;
        console.log('Email saved to database:', cleanEmail);
      } catch (dbError) {
        console.log('Database error (continuing anyway):', dbError.message);
      }

      return res.redirect(302, 'https://oncue.market/?success=true');
      
    } catch (error) {
      console.error('General error:', error);
      return res.redirect(302, 'https://oncue.market/?error=true');
    }
  }
  
  return res.status(405).send('Method not allowed');
};