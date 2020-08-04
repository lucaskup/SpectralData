const express = require('express');
const path = require('path');

const router = express.Router();

/* GET home page. */
router.get('/:id', function(req, res, next) {
  console.log(req.params.id);
  // console.log('Lucas');
  res.sendFile(path.join(`${process.cwd()}/public/index.html`));
});

module.exports = router;
