import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();


router.get('/', async (req, res) => {
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

export default router;