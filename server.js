const express = require('express');
require('dotenv').config();
const db = require('./config/db.js');

const authRoutes = require('./routes/auth-route.js');
const brandRoutes = require('./routes/brand-route.js');
const productRoutes = require('./routes/product-route.js');
const productBatchRoutes = require('./routes/productBatch-route.js');
const invoiceRoutes = require('./routes/invoice-route.js');
const statsRoutes = require('./routes/stats-route.js');


const cors = require('cors');

const app = express();
app.use(cors());
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH',
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


app.use('/auth', authRoutes);
app.use('/brands', brandRoutes);
app.use('/product', productRoutes);
app.use('/product-batch', productBatchRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/stats', statsRoutes);



db.connectToDatabase()
.then(function(){
    app.listen(4000)
})
.catch(function(error){
    console.log('Failed to Connect to the Database')
    console.log(error);
})