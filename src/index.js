const express = require('express');
const app = express();
app.use(express.json());

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://mnu4513:1234qwer@firstcluster.daae6aq.mongodb.net/url-sortner', {useNewUrlParser: true})
.then(() => console.log('mongoDB connected'))
.catch((error) => console.log(error));

const route = require('./routes/route');
app.use('/', route);

app.listen(3001, function () {
    console.log('app is running on port',3001);
});