const express = require('express') 
const bodyParser = require('body-parser')
const path = require('path');

const adminData = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const dbRoutes = require('./routes/db')

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));
 

// Filter only routes that start with '/admin'
app.use('/admin', adminData.routes);
app.use(shopRoutes);
app.use(dbRoutes);


app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
   
});



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {console.log("Serveur a l'ecoute ${PORT}") })

