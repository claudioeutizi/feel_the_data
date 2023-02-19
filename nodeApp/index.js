const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/map', (req, res) => {
  res.sendFile(__dirname + '/public/map/map.html');
});

app.get('/city', (req, res) => {
  res.sendFile(__dirname + '/public/city.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});