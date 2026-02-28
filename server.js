const express = require('express');
require('dotenv').config();
const db = require('./config/db.js');

const authRoutes = require('./routes/auth-route.js');
const brandRoutes = require('./routes/brand-route.js');
const productRoutes = require('./routes/product-route.js');


const cors = require('cors');

const app = express();
app.use(cors());
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/auth', authRoutes);
app.use('/brands', brandRoutes);
app.use('/product', productRoutes);



db.connectToDatabase()
.then(function(){
    app.listen(4000)
})
.catch(function(error){
    console.log('Failed to Connect to the Database')
    console.log(error);
})