const express = require('express');
const axios = require('axios');
const parser = require('xml2json');
const format = require('format-number');
const path = require("path");

//----------------- PLAYER STATS PROCESSING ----------------------
const playerStats = {}


//----------------- PLAYER ACHIEVEMENTS PROCESSING ----------------
const playerAchievements = {}


//----------------- PERK LEVEL PROCESSING ------------------------
const perkLevelsInfo = {
    "medic": {
        primarySteps: [200, 750, 4000, 12000, 25000, 100000]
    },
    "sharpshooter": {
        primarySteps: [30, 100, 700, 2500, 5500, 8500]
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
        while (perkLevel > minLevel) {
            if (secondarySteps[perkLevel - 1] <= secondaryPoints) break;
            perkLevel -= 1;
        }
    }

    return perkLevel;
}

getLevelProgress = (perkName, level, primaryPoints, secondaryPoints = null) => {
    let progress = 0;

    if (level === 6) return 100; //TODO: view formula for this case

    const primarySteps = perkLevelsInfo[perkName].primarySteps;
    let currentLevelPoints, nextLevelPoints;

    if (level === 0) {
        currentLevelPoints = 0;
        nextLevelPoints = primarySteps[0];
    } else {
        currentLevelPoints = primarySteps[level - 1];
        nextLevelPoints = primarySteps[level];
    }

    progress += (primaryPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)

    if (secondaryPoints) {
        const secondarySteps = perkLevelsInfo[perkName].secondarySteps;
        if (level === 0) {
            currentLevelPoints = 0;
            nextLevelPoints = secondarySteps[0];
        } else {
            currentLevelPoints = secondarySteps[level - 1];
            nextLevelPoints = secondarySteps[level];
        }
        const secondaryProgress = (secondaryPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints);
        return [progress * 100, secondaryProgress * 100];
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
            const achievements = info.statsfeed.achievements.item;

            for (let i = 0; i < stats.length; i++) {
                const currentStat = stats[i];
                playerStats[currentStat.APIName] = currentStat.value;
            }

            for (let i = 0; i < achievements.length; i++) {
                const currentAchievment = achievements[i];
                playerAchievements[currentAchievment.APIName] = currentAchievment.value;
            }

            const sharpshooterPoints = playerStats.headshotkills;
            const medicPoints = playerStats.damagehealed;
            const commandoPoints = playerStats.bullpupdamage;
            const stalkerPoints = playerStats.stalkerkills;
            const supportPoints = playerStats.shotgundamage;
            const weldingPoints = playerStats.weldingpoints;
            const berserkerPoints = playerStats.meleedamage;
            const firebugPoints = playerStats.flamethrowerdamage;
            const demolitionsPoints = playerStats.explosivesdamage;

            const medicLevel = getPerkLevel("medic", medicPoints);
            const sharpshooterLevel = getPerkLevel("sharpshooter", sharpshooterPoints);
            const supportLevel = getPerkLevel("support", supportPoints, weldingPoints);
            const commandoLevel = getPerkLevel("commando", commandoPoints, stalkerPoints);
            const berserkerLevel = getPerkLevel("berserker", berserkerPoints);
            const firebugLevel = getPerkLevel("firebug", firebugPoints);
            const demolitionsLevel = getPerkLevel("demolitions", demolitionsPoints);

            const [commandoProgress, stalkerProgress] = getLevelProgress("commando", commandoLevel, commandoPoints, stalkerPoints);
            const [supportProgress, weldingProgress] = getLevelProgress("support", supportLevel, supportPoints, weldingPoints);

            res.render('index', {
                sharpshooterPoints: formatNumber(sharpshooterPoints),
                medicPoints: formatNumber(medicPoints),
                commandoPoints: formatNumber(commandoPoints),
                stalkerPoints: formatNumber(stalkerPoints),
                supportPoints: formatNumber(supportPoints),
                weldingPoints: formatNumber(weldingPoints),
                berserkerPoints: formatNumber(berserkerPoints),
                firebugPoints: formatNumber(firebugPoints),
                demolitionsPoints: formatNumber(demolitionsPoints),
                sharpshooterProgress: getLevelProgress("sharpshooter", sharpshooterLevel, sharpshooterPoints),
                commandoProgress,
                stalkerProgress,
                supportProgress,
                weldingProgress,
                berserkerProgress: getLevelProgress("berserker", berserkerLevel, berserkerPoints),
                firebugProgress: getLevelProgress("firebug", firebugLevel, firebugPoints),
                medicProgress: getLevelProgress("medic", medicLevel, medicPoints),
                demolitionsProgress: getLevelProgress("demolitions", demolitionsLevel, demolitionsPoints),
                medicLevel,
                sharpshooterLevel,
                supportLevel,
                commandoLevel,
                berserkerLevel,
                firebugLevel,
                demolitionsLevel
            })
        })
});


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});