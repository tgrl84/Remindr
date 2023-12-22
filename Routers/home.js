import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
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

export default router;