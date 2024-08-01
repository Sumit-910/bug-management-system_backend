// imports
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// db import
// require('./src/config/db');

// uses
app.use(cors);
app.use(express.json());

// routes
const { authRoute } = require('./src/routes');

app.use('/auth', authRoute);

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log("server up!")
    console.log("PORT : " + port)
    console.log("DB connected")
});