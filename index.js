import { PrismaClient } from '@prisma/client';
import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import homeRoutes from './Routers/home.js';
import signupRoutes from './Routers/signup.js';
import loginRoutes from './Routers/login.js';
import dashboardRoutes from './Routers/dashboard.js';
import groupeRoutes from './Routers/groupe.js';
import creategroupRoutes from './Routers/create-group.js';
import rappelRoutes from './Routers/rappel.js';

const app = express();
const prisma = new PrismaClient(); 


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(__dirname));
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));


app.use('/', homeRoutes);
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/groupe', groupeRoutes);
app.use('/create-group', creategroupRoutes);
app.use('/rappel', rappelRoutes);


app.get('/logout', async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.listen(3000, () => console.log('Server started on localhost:3000'))
