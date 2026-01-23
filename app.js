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

const { connectDB } = require("./config/MDBConnection.js");

const app = express();

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

app.use(async (req, res, next) => {
    const publicRoutes = ['/', '/health', '/api-docs'];
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    const defaultUser = {
        id: 'temporary-user-001',
        email: 'temp_user@inventario.com',
        username: 'temp_user',
        name: 'Usuario Temporal',
        role: 'admin',
        permissions: ['all'],
        tenant: 'temporary-tenant',
        bypass_auth: true,
        bypass_timestamp: new Date().toISOString()
    };
    
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.decode(token);
            if (decoded) {
                req.user = { ...defaultUser, ...decoded, original_token_data: true };
                req.headers['console-user'] = decoded.email || decoded.username || defaultUser.email;
            } else {
                req.user = defaultUser;
                req.headers['console-user'] = defaultUser.email;
            }
        } catch (err) {
            req.user = defaultUser;
            req.headers['console-user'] = defaultUser.email;
        }
    } else {
        req.user = defaultUser;
        req.headers['console-user'] = defaultUser.email;
    }
    
    next();
});

app.use('/api-inventario-fs', require('./routes/index'));

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'inventario-fs-backend',
        auth_status: 'TOKEN_VERIFICATION_DISABLED_TEMPORARILY'
    });
});

app.get('/', (req, res) => {
    const pkg = require(path.join(__dirname, 'package.json'));
    res.json({
        name: pkg.name,
        version: pkg.version,
        status: 'Inventario FS API Service',
        documentation: '/api-docs',
        health: '/health',
        basePath: '/api-inventario-fs',
        security_note: '⚠️  ADVERTENCIA: La verificación de token está deshabilitada temporalmente en todos los entornos'
    });
});

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        next();
    } else {
        next(err);
    }
});

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