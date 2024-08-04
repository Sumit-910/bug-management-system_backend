const mongoose = require('mongoose');

const url = process.env.MONGO_URL;

const connectionOptions = {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false
}

mongoose.connect(url, connectionOptions)
    .then(() => { console.log("Connected to MongoDB Atlas") })
    .catch((err) => console.error(`${err}`));