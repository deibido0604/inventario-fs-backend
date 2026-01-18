const jwt = require('jsonwebtoken');

const generateTestToken = () => {
  const payload = {
    email: 'test@inventario.com',
    username: 'test_user',
    userId: 'test_123',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'inventario-fs');
  
  return token;
};

generateTestToken();