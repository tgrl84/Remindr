import { PrismaClient } from '@prisma/client';
import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';

const app = express();
const prisma = new PrismaClient();  
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', async (_, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/signup', async (_, res) => {
    try {
        res.render('creation');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        await prisma.User.create({
            data: {
                firstName,
                lastName,
                email,
                password,
            },
        });
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/login', async (_, res) => {
    try {
        res.render('connexion');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.User.findUnique({
            where: {
                email: email,
            },
        });

        if (!user) {
            res.status(404).send('Utilisateur non trouvé');
            return;
        }

        if (user.password !== password) {
            res.status(401).send('Mot de passe incorrect');
            return;
        }

        res.redirect('/dashboard/'+user.firstName);
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/dashboard/:name', async (req, res) => {
    try {
        res.render('dashboard',{user: req.params.name});
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.listen(3000, () => console.log('Server started on localhost:3000'))
