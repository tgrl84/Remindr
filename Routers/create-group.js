import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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

export default router;