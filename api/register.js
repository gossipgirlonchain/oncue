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

      return res.redirect(302, 'https://oncue.market/?success=true');
      
    } catch (error) {
      console.error('Error:', error);
      return res.redirect(302, 'https://oncue.market/?error=true');
    }
  }
  
  return res.status(405).send('Method not allowed');
};