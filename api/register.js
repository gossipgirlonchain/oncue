const { neon } = require('@neondatabase/serverless');

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

module.exports = async (req, res) => {
  console.log('API called:', req.method, req.body);
  
  if (req.method === 'POST') {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).send('Invalid email');
      }

      console.log('Email received:', email);
      console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);

      if (sql) {
        const cleanEmail = email.trim().toLowerCase();
        await sql`INSERT INTO signups (email) VALUES (${cleanEmail})`;
        console.log('Email saved to database:', cleanEmail);
      } else {
        console.log('No database connection available');
      }

      return res.redirect(302, 'https://oncue.market/?success=true');
      
    } catch (error) {
      console.error('Error:', error);
      return res.redirect(302, 'https://oncue.market/?error=true');
    }
  }
  
  return res.status(405).send('Method not allowed');
};