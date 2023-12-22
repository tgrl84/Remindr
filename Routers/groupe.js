import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/:id', async (req, res) => {
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
    const rappels = await prisma.rappel.findMany({
        where: {
            OR: [{ groupId: parseInt(req.params.id) }],
        },
    });
    const rappel = rappels.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(group);
    console.log(users);
    res.render('groupe',{groupe: group, users: users,rappels: rappel});
});

export default router;