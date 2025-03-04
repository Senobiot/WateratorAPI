const Router = require('express').Router;
const router = new Router();
const authMiddleware = require('../middlewares/auth-middleware.js')
const gamesController = require('../controllers/games-controller.js');

router.get('/searchGame', authMiddleware, gamesController.searchGame);
router.get('/getGameDetails', authMiddleware, gamesController.getDetails);
router.post('/getGameDetailsById', authMiddleware, gamesController.getDetailsById);
router.get('/getTopGamesWithAuthorization', authMiddleware, gamesController.getAllGames);
router.get('/getTopGames', gamesController.getAllGames);

module.exports = router;
