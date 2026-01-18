const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Ruta para obtener token de prueba
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // En desarrollo, aceptar cualquier credencial
  if (process.env.NODE_ENV === 'development' || !process.env.JWSKURI) {
    const token = jwt.sign(
      {
        email: username || 'test@inventario.com',
        username: username || 'test_user',
        userId: 'test_123',
        role: 'admin'
      },
      process.env.JWT_SECRET || 'clave_secreta_para_desarrollo',
      { expiresIn: '30d' }
    );
    
    return res.json({
      success: true,
      token,
      user: {
        email: username || 'test@inventario.com',
        username: username || 'test_user',
        role: 'admin'
      }
    });
  }
  
  // En producción, validar credenciales reales
  res.status(401).json({
    success: false,
    message: 'Autenticación no configurada para producción'
  });
});

// Ruta para verificar token
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'clave_secreta_para_desarrollo'
    );
    
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

module.exports = router;