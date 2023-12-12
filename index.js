import { PrismaClient } from '@prisma/client';
import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import session from 'express-session';

const app = express();
const prisma = new PrismaClient(); 

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if your using https
}));




app.get('/', async (req, res) => {
    try {
        if (!req.session.email) {
            res.render('home',{user: false});
            return;
        }
        else{
            res.render('home',{user: true});
        }
        
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

app.get('/login', async (req, res) => {
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
        req.session.email = email;
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/logout', async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/dashboard', async (req, res) => {
    try {
        if (!req.session.email) {
            res.render('dashboard');
            return;
        }
        else{
            const email = req.session.email;
            const data = await prisma.User.findUnique({
                where: {
                    email: email,
                },
            });
            res.render('dashboard',{user: data});
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/create-group', async (req, res) => {
    try {
        if (!req.session.email) {
            res.render('home', { user: false });
            return;
        } else {
            const users = await prisma.user.findMany();
            res.render('create-group', {users: users});
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});
app.post('/create-group', async (req, res) => {
    try {
        const { groupname: name, users } = req.body;
        const group = await prisma.Group.create({
            data: {
                name,
            },
        });

        for (let email of users) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.groupToUser.create({
                    data: {
                        userId: user.id,
                        groupId: group.id,
                    },
                });
            }
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

app.listen(3000, () => console.log('Server started on localhost:3000'))
