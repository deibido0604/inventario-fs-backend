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

const files = fs.readdirSync(__dirname).filter(file => {
    return file !== 'index.js' && file.endsWith('.js');
});

files.forEach(file => {
    const { filename, route } = removeExtension(file);
    
    try {
        const routeModule = require(`./${filename}`);
        
        router.use(`/${route}`, routeModule);
        console.log(` /${route}`);
    } catch (error) {
        console.error(` Error cargando ${filename}:`, error.message);
    }
});

console.log('====================================');

module.exports = router;