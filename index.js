import { PrismaClient } from '@prisma/client';
import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


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
  cookie: { secure: false } // set to true if your using https
}));

app.use(express.static(__dirname));



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
            const user = await prisma.User.findUnique({
                where: {
                    email: email,
                },
            });
            const groups = await prisma.groupToUser.findMany({
                where: {
                    userId: user.id,
                },
                include: {
                    group: true,
                },
            });
            const rappels = await prisma.rappel.findMany({
                where: {
                    OR: groups.map(groupToUser => ({ groupId: groupToUser.groupId })),
                },
            });
            const group = groups.map(groupToUser => groupToUser.group);
            const rappel = rappels.sort((a, b) => new Date(a.date) - new Date(b.date));
            console.log(rappels);
            console.log(group);
            res.render('dashboard',{user: user,groups: group,rappels: rappel});
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});




app.get('/groupe/:id', async (req, res) => {
    const email = req.session.email;
    if(!email){
        return;
    }
    const user = await prisma.User.findUnique({
        where: {
            email: email,
        },
    });
    if (!user) {
        res.status(404).send('vous ne faite pas partie de ce groupe');
        return;
    }
    const group = await prisma.group.findUnique({
        where: {
            id: parseInt(req.params.id),
        },
    });
    const users = await prisma.User.findMany({
        where: {
            groups: {
                some: {
                    groupId: parseInt(req.params.id),
                },
            },
        },
    });
    console.log(group);
    console.log(users);
    res.render('groupe',{groupe: group, users: users});
});



app.get('/create-group', async (req, res) => {
    try {
        const sessionUserEmail = req.session.email;
        if (!req.session.email) {
            res.render('home', { user: false });
            return;
        } else {
            const users = await prisma.user.findMany({ where: { email: { not: sessionUserEmail } } });
            res.render('create-group', { users: users, sessionUserEmail: sessionUserEmail});
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
        
        const usersArray = Array.isArray(users) ? users : [users];
        usersArray.push(req.session.email);
        console.log(usersArray);
        for (let email of usersArray) {
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

app.get('/rappel/:id', async (req, res) => {
    try {
        const sessionUserEmail = req.session.email;
        if (!req.session.email) {
            res.render('home', { user: false });
            return;
        } else {
            const groupId = parseInt(req.params.id);
            const user = await prisma.user.findUnique({ where: { email: sessionUserEmail } });
            const group = await prisma.groupToUser.findFirst({ where: { groupId: groupId, userId: user.id } });
            if (group) {
                res.render('rappel', { id: groupId });
            } else {
                res.status(403).send('Accès refusé');
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});
app.post('/rappel', async (req, res) => {
    try {
        const { nom, description, date, heure, couleur, groupId } = req.body;
        const dateTime = new Date(`${date}T${heure}`).toISOString();
        const groupid = parseInt(groupId);
        const rappel = await prisma.rappel.create({
            data: {
                nom,
                description,
                date: dateTime,
                heure: dateTime,
                couleur,
                groupId : groupid,
            }
        });
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue lors de la création du rappel');
    }
});

app.listen(3000, () => console.log('Server started on localhost:3000'))
