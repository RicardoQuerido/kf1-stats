const express = require('express');
const axios = require('axios');
const parser = require('xml2json');
const format = require('format-number');
const path = require("path");


//----------------- PROCESSING ----------------------
const perkLevelsInfo = {
    "medic": {
        primarySteps: [200, 750, 4000, 12000, 25000, 100000]
    },
    "sharpshooter": {
        primarySteps: [30, 100, 700, 2500, 7500, 8500]
    },
    "commando": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        secondarySteps: [30, 100, 350, 1200, 2400, 3600]
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
    const primarySteps = perkLevelsInfo[perkName].primarySteps;

    for (let level = 0; level < primarySteps.length; level++) {
        if (primarySteps[level] <= primaryPoints) continue;
        if (!secondaryPoints) return level;
        perkLevel = level;
        break;
    }

    if (secondaryPoints) {
        const secondarySteps = perkLevelsInfo[perkName].secondarySteps;
        while (perkLevel >= minLevel) {
            if (secondarySteps[perkLevel] <= secondaryPoints) break;
            perkLevel -= 1;
        }
    }

    return perkLevel;
}

getLevelProgress = (perkName, level, primaryPoints, secondaryPoints = null) => {
    let progress = 0;

    if(level === 6) return 100; //TODO: view formula for this case

    const primarySteps = perkLevelsInfo[perkName].primarySteps;
    let currentLevelPoints, nextLevelPoints;    

    if(level === 0) {
        currentLevelPoints = 0; 
        nextLevelPoints = primarySteps[0];
    } else {
        currentLevelPoints = primarySteps[level - 1]; 
        nextLevelPoints = primarySteps[level];
    }

    progress += (primaryPoints - currentLevelPoints)/(nextLevelPoints - currentLevelPoints)

    if (secondaryPoints) {
        const secondarySteps = perkLevelsInfo[perkName].secondarySteps;
        if(level === 0) {
            currentLevelPoints = 0; 
            nextLevelPoints = secondarySteps[0];
        } else {
            currentLevelPoints = secondarySteps[level - 1]; 
            nextLevelPoints = secondarySteps[level];
        }
        progress += (secondaryPoints - currentLevelPoints)/(nextLevelPoints - currentLevelPoints);
        progress /= 2;
    }

    return progress * 100;
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

            medicLevel = getPerkLevel("medic", medicPoints);
            sharpshooterLevel = getPerkLevel("sharpshooter", sharpshooterPoints);
            supportLevel = getPerkLevel("support", supportPoints);
            commandoLevel = getPerkLevel("commando", commandoPoints);
            berserkerLevel = getPerkLevel("berserker", berserkerPoints);
            firebugLevel = getPerkLevel("firebug", firebugPoints);
            demolitionsLevel = getPerkLevel("demolitions", demolitionsPoints);

            res.render('index', {
                sharpshooterPoints: formatNumber(sharpshooterPoints),
                medicPoints: formatNumber(medicPoints),
                commandoPoints: formatNumber(commandoPoints),
                supportPoints: formatNumber(supportPoints),
                berserkerPoints: formatNumber(berserkerPoints),
                firebugPoints: formatNumber(firebugPoints),
                demolitionsPoints: formatNumber(demolitionsPoints),
                sharpshooterProgress: getLevelProgress("sharpshooter",sharpshooterLevel,sharpshooterPoints),
                commandoProgress: getLevelProgress("commando",commandoLevel,commandoPoints),
                supportProgress: getLevelProgress("support",supportLevel,supportPoints),
                berserkerProgress: getLevelProgress("berserker",berserkerLevel,berserkerPoints),
                firebugProgress: getLevelProgress("firebug",firebugLevel,firebugPoints),
                medicProgress: getLevelProgress("medic",medicLevel,medicPoints),
                demolitionsProgress: getLevelProgress("demolitions",demolitionsLevel,demolitionsPoints),
                medicLevel: medicLevel,
                sharpshooterLevel: sharpshooterLevel,
                supportLevel: supportLevel,
                commandoLevel: commandoLevel,
                berserkerLevel: berserkerLevel,
                firebugLevel: firebugLevel,
                demolitionsLevel: demolitionsLevel
            })
        })
});


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});