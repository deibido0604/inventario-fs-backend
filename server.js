// server.js - MEJORADO
import dotenv from "dotenv";
dotenv.config();

// Verificamos que las variables estén cargadas
console.log("✅ Variables cargadas:", {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? "Definida" : "Undefined"
});

import app from "./app.js";
import { connectDB } from "./config/MDBConnection.js";

// Primero conectamos, luego iniciamos el servidor
const iniciarServidor = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 MongoDB URI: ${process.env.MONGO_URI?.substring(0, 30)}...`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

iniciarServidor();