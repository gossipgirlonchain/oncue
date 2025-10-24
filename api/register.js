const { neon } = require('@neondatabase/serverless');

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

if (!sql) {
  throw new Error('No database connection string was provided. Please set DATABASE_URL environment variable.');
}

module.exports = async (req, res) => {
  // Enable CORS
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

    // Simple email validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Insert email into database
    const result = await sql`
      INSERT INTO signups (email)
      VALUES (${cleanEmail})
      RETURNING id, email, created_at
    `;

    return res.status(200).json({
      success: true,
      message: 'Successfully joined waitlist!'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate email
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }

    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};
