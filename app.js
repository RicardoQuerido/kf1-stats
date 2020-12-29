const express = require('express');
const axios = require('axios');
const parser = require('xml2json');
const format = require('format-number');
const path = require("path");


//----------------- PROCESSING ----------------------
const perksInfo = {
    "medic": {
        primarySteps: [200, 750, 4000, 12000, 25000, 100000]
    },
    "sharpshooter": {
        primarySteps: [30, 100, 700, 2500, 7500, 8500]
    },
    "commando": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000]
    },
    "support": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        secondarySteps: [2000, 7000, 35000, 120000, 250000, 370000]
    },
    "firebug": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000]
    },
    "demolitions": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000]
    },
    "berserker": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000]
    }
}

const minLevel = 0,
    maxLevel = 6;

getPerkLevel = (perkName, primaryPoints, secondaryPoints = null) => {
    let perkLevel = maxLevel;
    const primarySteps = perksInfo[perkName].primarySteps;

    for (level = 0; level < primarySteps.length; level++) {
        if (primarySteps[level] < primaryPoints) continue;
        if (!secondaryPoints) return level;
        perkLevel = level;
        break;
    }

    if (secondaryPoints) {
        const secondarySteps = perksInfo[perkName].primarySteps;
        while (perkLevel >= minLevel) {
            if (secondarySteps[perkLevel] < secondaryPoints) break;
            perkLevel -= 1;
        }
    }

    return perkLevel;
}



//----------------- CONFIG N LISTEN ----------------------
let app = express();
let port = 3000;

app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, "public")));

const formatNumber = format();

let parserOptions = {
    object: true
};

app.get('/', function (req, res) {
    console.log("New connection!");

    axios.get('https://steamcommunity.com/id/frostheart21/statsfeed/1250/')
        .then(d => {
            const info = parser.toJson(d.data, parserOptions);
            const stats = info.statsfeed.stats.item;
            sharpshooterPoints = stats[4].value;
            medicPoints = stats[1].value;
            commandoPoints = stats[6].value;
            supportPoints = stats[3].value;
            berserkerPoints = stats[7].value;
            firebugPoints = stats[8].value;
            demolitionsPoints = stats[20].value;

            res.render('index', {
                sharpshooterPoints: formatNumber(sharpshooterPoints),
                medicPoints: formatNumber(medicPoints),
                commandoPoints: formatNumber(commandoPoints),
                supportPoints: formatNumber(supportPoints),
                berserkerPoints: formatNumber(berserkerPoints),
                firebugPoints: formatNumber(firebugPoints),
                demolitionsPoints: formatNumber(demolitionsPoints),
                sharpshooterProgress: "2%",
                commandoProgress: "2%",
                supportProgress: "2%",
                berserkerProgress: "2%",
                firebugProgress: "2%",
                medicProgress: "2%",
                demolitionsProgress: "2%",
                medicLevel: getPerkLevel("medic", medicPoints),
                sharpshooterLevel: getPerkLevel("sharpshooter", sharpshooterPoints),
                supportLevel: getPerkLevel("support", supportPoints),
                commandoLevel: getPerkLevel("commando", commandoPoints),
                berserkerLevel: getPerkLevel("berserker", berserkerPoints),
                firebugLevel: getPerkLevel("firebug", firebugPoints),
                demolitionsLevel: getPerkLevel("demolitions", demolitionsPoints)
            })
        })
});


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});