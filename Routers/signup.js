import express from 'express';
const router = express.Router();

router.get('/', async (_, res) => {
    try {
        res.render('creation');
    } catch (error) {
        console.error(error);
        res.status(500).send('Une erreur est survenue');
    }
});

router.post('/', async (req, res) => {
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

export default router;