const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const removeExtension = (fileName) => {
    return {
        filename: fileName.split('.').shift(),
        route: fileName.split('.').shift().replace('Route', '')
    };
};

console.log('==========RUTAS DISPONIBLES==========');

// Leer todos los archivos .js excepto index.js
const files = fs.readdirSync(__dirname).filter(file => {
    return file !== 'index.js' && file.endsWith('.js');
});

files.forEach(file => {
    const { filename, route } = removeExtension(file);
    
    try {
        // Cargar el archivo de ruta
        const routeModule = require(`./${filename}`);
        
        // Montar la ruta
        router.use(`/${route}`, routeModule);
        console.log(`✅ /${route}`);
    } catch (error) {
        console.error(`❌ Error cargando ${filename}:`, error.message);
    }
});

console.log('====================================');

// NO USES router.get('*', ...) - eso causa el error
// En su lugar, deja que app.js maneje el 404

module.exports = router;