require('dotenv').config();

const app = require("./app.js");
const { connectDB } = require("./config/MDBConnection.js");

const iniciarServidor = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.log("🔄 Continuando sin conexión a DB...");
    } else {
      process.exit(1);
    }
  }
};

iniciarServidor();

module.exports = app;