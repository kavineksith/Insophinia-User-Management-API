const express = require('express');
const { request, response } = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');

// HTTPS Server Implementation
// const fs = require('fs');
// const https = require('https');

const corsOptions = require('./middleware/corsOptions.js');
const { logger } = require('./middleware/eventLogger.js');
const errorHandler = require('./middleware/errorLogger.js');
const limiter = require('./middleware/requestLimiter.js');
const app = express();

const hostname = '127.0.0.1';
const port = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(limiter);
app.use(logger);
app.use(errorHandler);

// routes
app.use('/', require('./routes/root'));
app.use('/auth/login', require('./routes/auth/loginRoute.js'));
app.use('/auth/logout', require('./routes/auth/logoutRoute.js'));
app.use('/api/keys', require('./routes/api/userOperations.js'));
app.use('/profiles', require('./routes/admin/adminOperations.js'));
app.use('/permissions', require('./routes/admin/rolePermissionsManage.js'));
app.use('/roles', require('./routes/admin/userRolesManage.js'));

app.listen(port, hostname, () => {
    console.log(`Server is running on http://${hostname}:${port}/`);
});

// HTTPS Server Implementation
/*
// HTTPS implementation
const privateKey = fs.readFileSync('path/to/privateKey.pem', 'utf8');
const certificate = fs.readFileSync('path/to/certificate.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, hostname, () => {
    console.log(`Server is running on http://${hostname}:${port}/`);
});
*/