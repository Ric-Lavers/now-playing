import express from 'express';

const router = express.Router();

/* GET health check. */
router.get('/', function(req, res, next) {
  res.json({ status: 'ok' });
});

export default router;
