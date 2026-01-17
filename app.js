const express = require('express');
const morgan = require('morgan');
const nocache = require('nocache');
const bodyParser = require('body-parser');
const bearerToken = require('express-bearer-token');
const mung = require('express-mung');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const timeout = require('connect-timeout');
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

require('dotenv').config();

// Importar conexión MongoDB
const { connectDB } = require("./config/MDBConnection.js");

const app = express();

// Conectar a MongoDB
connectDB();

const client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 15,
    jwksUri: process.env.JWSKURI || 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

async function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
            audience: process.env.AUDIENCE || 'api://default',
            issuer: process.env.ISSUER || 'https://sts.windows.net/tenant-id/',
            algorithms: ["RS256"],
        }, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
}

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './uploads'
}));

app.use(mung.json(
    (body, req, res) => {
        const reponseBody = body;
        reponseBody.message = body.message || 'Successfull request!';
        reponseBody.code = reponseBody.code != null ? reponseBody.code : res.statusCode;
        reponseBody.success = reponseBody.code === 200;
        return reponseBody;
    }
));

function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}

app.use(morgan('combined'));
app.use(cors());
app.use(nocache());
app.use(helmet());
app.use(bearerToken());
app.use(timeout('200s'));
app.use(haltOnTimedout);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Middleware de autenticación - Versión simplificada para desarrollo
app.use(async (req, res, next) => {
    // Permitir rutas públicas
    const publicRoutes = ['/', '/health', '/api-docs'];
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                return res.status(401).json({ 
                    success: false,
                    code: 401, 
                    message: 'Unauthorized, token missing', 
                    data: {} 
                });
            }
            
            // En desarrollo, puedes usar un token simple
            if (process.env.NODE_ENV === 'development') {
                // Verificación simple para desarrollo
                const decoded = jwt.decode(token);
                if (decoded) {
                    req.user = decoded;
                    req.headers['console-user'] = decoded.email || decoded.username || 'dev_user';
                }
            } else {
                // En producción, usar la verificación completa
                // const decoded = await verifyToken(token);
                // req.headers['console-user'] = decoded;
            }
        } catch (err) {
            console.error('Token verification error:', err.message);
            return res.status(401).json({
                success: false,
                code: 401,
                error: 'Unauthorized',
                message: 'Invalid token',
                data: {}
            });
        }
    } else if (process.env.NODE_ENV === 'development') {
        // En desarrollo, permitir continuar sin token
        console.log('⚠️  Desarrollo: Sin token de autorización');
        req.user = { email: 'dev@localhost', username: 'dev_user' };
        req.headers['console-user'] = 'dev@localhost';
    } else {
        return res.status(401).json({
            success: false,
            code: 401,
            error: 'Unauthorized',
            message: 'Token required',
            data: {}
        });
    }
    next();
});

// Cargar rutas - CAMBIO AQUÍ: usar /inventario-fs en lugar de /api-back-office
app.use('/inventario-fs', require('./routes/index'));

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'inventario-fs-backend'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    const pkg = require(path.join(__dirname, 'package.json'));
    res.json({
        name: pkg.name,
        version: pkg.version,
        status: 'Inventario FS API Service',
        documentation: '/api-docs',
        health: '/health',
        basePath: '/inventario-fs'
    });
});

// Error handler para JWT
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            code: 401,
            error: 'Unauthorized',
            message: 'Invalid token',
            data: {}
        });
    } else {
        next(err);
    }
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false,
        code: 404, 
        message: 'Route not found', 
        path: req.originalUrl,
        method: req.method 
    });
});

module.exports = app;