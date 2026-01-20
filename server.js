require('dotenv').config();

const app = require('./app.js');
const { connectDB } = require('./config/MDBConnection.js');

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {

    if (process.env.NODE_ENV === 'production') {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    } else {
      process.exit(1);
    }
  }
};

iniciarServidor();
