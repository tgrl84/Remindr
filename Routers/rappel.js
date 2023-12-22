import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/:id', async (req, res) => {
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

router.post('/', async (req, res) => {
    try {
        const { nom, description, date, heure, couleur, groupId } = req.body;
        const groupid = parseInt(groupId);
        console.log(couleur);
        const rappel = await prisma.rappel.create({
            data: {
                nom,
                description,
                date: date,
                heure: heure,
                couleur: couleur,
                groupId : groupid,
            }
        });
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue lors de la création du rappel');
    }
});

export default router;