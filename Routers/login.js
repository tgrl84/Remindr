import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.render('connexion');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});
router.post('/', async (req, res) => {
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

export default router;