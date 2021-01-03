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
        primarySteps: [200, 750, 4000, 12000, 25000, 100000],
        points: 0,
        level: 0
    },
    "sharpshooter": {
        primarySteps: [30, 100, 700, 2500, 5500, 8500],
        points: 0,
        level: 0
    },
    "commando": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        secondarySteps: [30, 100, 350, 1200, 2400, 3600],
        points: 0,
        secondaryPoints: 0,
        level: 0
    },
    "support": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        secondarySteps: [2000, 7000, 35000, 120000, 250000, 370000],
        points: 0,
        secondaryPoints: 0,
        level: 0
    },
    "firebug": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        points: 0,
        level: 0
    },
    "demolitions": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        points: 0,
        level: 0
    },
    "berserker": {
        primarySteps: [25000, 100000, 500000, 1500000, 3500000, 5500000],
        points: 0,
        level: 0
    }
}

const minLevel = 0,
    maxLevel = 6;

calculatePerkLevel = (perkName) => {
    let perkLevel = maxLevel;
    const primarySteps = perkLevelsInfo[perkName].primarySteps;
    const primaryPoints = perkLevelsInfo[perkName].points;
    const secondaryPoints = perkLevelsInfo[perkName].secondaryPoints;

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

calculateBarProgress = (perkName, isSecondary = false) => {
    const currentPerk = perkLevelsInfo[perkName];
    const level = currentPerk.level;

    if (level === 6) return 100; //TODO: view formula for this case

    const steps = isSecondary ? currentPerk.secondarySteps : currentPerk.primarySteps;
    const points = isSecondary ? currentPerk.secondaryPoints : currentPerk.points;
    let currentLevelPoints, nextLevelPoints;

    if (level === 0) {
        currentLevelPoints = 0;
        nextLevelPoints = steps[0];
    } else {
        currentLevelPoints = steps[level - 1];
        nextLevelPoints = steps[level];
    }

    return Math.min((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints) * 100, 100);
}

//----------------- INDEX PAGE ---------------------------
createPlayerArgs = (id) => {
    const indexArgs = {};
    perkLevelsInfo.sharpshooter.points = playerStats.headshotkills;
    perkLevelsInfo.medic.points = playerStats.damagehealed;
    perkLevelsInfo.commando.points = playerStats.bullpupdamage;
    perkLevelsInfo.commando.secondaryPoints = playerStats.stalkerkills;
    perkLevelsInfo.support.points = playerStats.shotgundamage;
    perkLevelsInfo.support.secondaryPoints = playerStats.weldingpoints;
    perkLevelsInfo.berserker.points = playerStats.meleedamage;
    perkLevelsInfo.firebug.points = playerStats.flamethrowerdamage;
    perkLevelsInfo.demolitions.points = playerStats.explosivesdamage;

    for (const [currentPerk, currentPerkInfo] of Object.entries(perkLevelsInfo)) {
        const level = calculatePerkLevel(currentPerk);
        currentPerkInfo.level = level;

        indexArgs[`${currentPerk}Points`] = formatNumber(currentPerkInfo.points);
        indexArgs[`${currentPerk}Level`] = level;
        indexArgs[`${currentPerk}Progress`] = calculateBarProgress(currentPerk);
        if (currentPerkInfo.secondaryPoints) {
            indexArgs[`${currentPerk}SecondaryPoints`] = formatNumber(currentPerkInfo.secondaryPoints);
            indexArgs[`${currentPerk}SecondaryProgress`] = calculateBarProgress(currentPerk,true);
        }
    }

    indexArgs['player'] = id;

    return indexArgs;
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

app.get('/player/:steamid', function (req, res) {
    const player = req.params.steamid;

    axios.get(`https://steamcommunity.com/id/${player}/statsfeed/1250/`)
        .then(d => {
            const info = parser.toJson(d.data, parserOptions);
            const stats = info.statsfeed.stats.item;
            const achievements = info.statsfeed.achievements.item;

            for (let i = 0; i < stats.length; i++) {
                const currentStat = stats[i];
                playerStats[currentStat.APIName] = currentStat.value;
            }

            for (let i = 0; i < achievements.length; i++) {
                const currentAchievement = achievements[i];
                playerAchievements[currentAchievement.APIName] = currentAchievement.value;
            }

            const playerArgs = createPlayerArgs(player);

            res.render('player', playerArgs);
        })
});


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});