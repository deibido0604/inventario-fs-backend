const jwt = require('jsonwebtoken');

// Generar token de prueba válido por 30 días
const generateTestToken = () => {
  const payload = {
    email: 'test@inventario.com',
    username: 'test_user',
    userId: 'test_123',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 días
  };

  // Usa el mismo JWT_SECRET que en Vercel
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'inventario-fs');
  
  return token;
};

generateTestToken();