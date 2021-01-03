const express = require('express');
const axios = require('axios');
const parser = require('xml2json');
const format = require('format-number');
const path = require("path");
const {
    info
} = require('console');

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

    return [progress * 100, null];
}

//----------------- INDEX PAGE ---------------------------
createIndexArgs = () => {
    const indexArgs = {};
    const playerInfo = {
        "sharpshooter": {
            "points":playerStats.headshotkills
        },
        "medic": {
            "points":playerStats.damagehealed
        },
        "commando": {
            "points":playerStats.bullpupdamage,
            "secondaryPoints":playerStats.stalkerkills
        },
        "support": {
            "points":playerStats.shotgundamage,
            "secondaryPoints":playerStats.weldingpoints
        },
        "berserker": {
            "points":playerStats.meleedamage
        },
        "firebug": {
            "points":playerStats.flamethrowerdamage
        },
        "demolitions": {
            "points":playerStats.explosivesdamage
        },
    };

    for(const [currentPerk, currentPerkInfo] of Object.entries(playerInfo)) {
        const level = getPerkLevel(currentPerk, currentPerkInfo["points"], currentPerkInfo["secondaryPoints"]);
        const [progress, secondaryProgress] = getLevelProgress(currentPerk, level, currentPerkInfo["points"], currentPerkInfo["secondaryPoints"]);
        
        indexArgs[`${currentPerk}Points`] = formatNumber(currentPerkInfo["points"]);
        indexArgs[`${currentPerk}SecondaryPoints`] = formatNumber(currentPerkInfo["secondaryPoints"]);
        indexArgs[`${currentPerk}Level`] = level;
        indexArgs[`${currentPerk}Progress`] = progress;
        indexArgs[`${currentPerk}SecondaryProgress`] = secondaryProgress;
    }

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

            const indexArgs = createIndexArgs();

            res.render('index', indexArgs);
        })
});


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});