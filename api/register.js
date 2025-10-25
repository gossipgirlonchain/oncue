const { neon } = require('@neondatabase/serverless');

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export default async function handler(req, res) {
  console.log('API called:', req.method, req.body);
  
  if (req.method === 'POST') {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).send('Invalid email');
      }

      if (sql) {
        const cleanEmail = email.trim().toLowerCase();
        await sql`INSERT INTO signups (email) VALUES (${cleanEmail})`;
        console.log('Email saved:', cleanEmail);
      } else {
        console.log('No database - email would be:', email);
      }

      return res.redirect(302, 'https://oncue.market/?success=true');
      
    } catch (error) {
      console.error('Error:', error);
      return res.redirect(302, 'https://oncue.market/?error=true');
    }
  }
  
  return res.status(405).send('Method not allowed');
}