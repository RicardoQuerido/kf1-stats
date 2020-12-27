const express = require('express');
const axios = require('axios');
const parser = require('xml2json');
const format = require('format-number');
const path = require("path");

let app = express();
let port = 3000;

app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, "public")));

const formatNumber = format();

let parserOptions = {
    object: true
};

// app.get('/', function (req, res) {
//     console.log("New connection!");

//     axios.get('https://steamcommunity.com/id/frostheart21/statsfeed/1250/')
//         .then(d => {
//             const info = parser.toJson(d.data, parserOptions);
//             const stats = info.statsfeed.stats.item;
//             res.render('index', {
//                 sharpshooterPoints: formatNumber(stats[4].value),
//                 medicPoints: formatNumber(stats[1].value),
//                 commandoPoints: formatNumber(stats[6].value),
//                 supportPoints: formatNumber(stats[3].value),
//                 berserkerPoints: formatNumber(stats[7].value),
//                 firebugPoints: formatNumber(stats[8].value),
//                 demolitionsPoints: formatNumber(stats[20].value),
//             })
//         })
// });


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})