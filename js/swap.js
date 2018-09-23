function parse(e) {
    originalString = e.target.value;
    chunks = [];
    var players = [];
    var s = originalString;
    var index = s.indexOf("<player><name>");
    if (index === -1) return null; // malformed
    chunks.push(s.substring(0, index + 14));
    s = s.substring(index + 14);

    index = s.indexOf("</name>");
    if (index === -1) return [];
    var hostName = s.substring(0, index);
    players.push([hostName, chunks.length]);
    chunks.push(hostName);
    s = s.substring(index);

    s = s.split("</player>", 2);
    if (s[1] === undefined) return null;
    chunks.push(s[0]);
    s = "</player>" + s[1];

    index = s.indexOf("<farmhand><name>");
    while(index > -1) {
        index = s.indexOf("<farmhand><name>");
        if (index === -1) return null;
        chunks.push(s.substring(0, index + 16));
        s = s.substring(index + 16);

        index = s.indexOf("</name>");
        if (index === -1) return null;
        var farmhandName = s.substring(0, index);
        players.push([farmhandName, chunks.length]);
        chunks.push(farmhandName);
        s = s.substring(index);

        index = s.indexOf("</farmhand>");
        if (index === -1) return null;
        chunks.push(s.substring(0, index));
        s = s.substring(index);

        index = s.indexOf("<farmhand><name>");
    }
    chunks.push(s);
    return players;
};

function setCharacters(e) {
    var players = parse(e);
    var div = document.getElementById("instructions");
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
    if (!players) {
        var t = document.createTextNode("Error: The save file couldn't be read. Check that the whole thing is pasted, and it starts with '<?xml...'");
        div.appendChild(t);
    } else {
        var t = document.createTextNode("Pick new host (it can take a minute): ");
        div.appendChild(t);
        for (var i = 0; i < players.length; i++) {
            var input = document.createElement("input");
            input.setAttribute("type", "submit");
            input.setAttribute("value", players[i][0]);
            input.setAttribute("onclick", "submit(" + players[i][1] + ")");
            div.appendChild(input);
        }
        if (players.length < 2) {
            var p = document.createElement("p");
            p.setAttribute("id", "instruction2");
            var t = document.createTextNode("No farmhands found.");
            p.appendChild(t);
            div.appendChild(p);
        }
    }
}

function isolateTag(string, tag) {
    var startIndex = string.indexOf("<" + tag + ">");
    var endIndex = string.indexOf("</" + tag + ">") + tag.length + 3;
    var noContents = false;
    if (startIndex === -1) {
        startIndex = string.indexOf("<" + tag + "/>" + tag.length + 3);
        noContents = true;
        endIndex = startIndex;
    }
    if (startIndex === -1) {
        return string; // malformed
    }
    var beforeTag = string.substring(0, startIndex) + "<" + tag + ">";
    var contents = noContents ? "" : string.substring(startIndex + tag.length + 2, endIndex - tag.length - 3);
    var afterTag = "</" + tag + ">" + string.substring(endIndex);
    return [beforeTag, contents, afterTag];
}

function fixMail(newHostString, originalHostString) {
    newHostString = isolateTag(newHostString, "mailReceived");
    originalHostString = isolateTag(originalHostString, "mailReceived");

    var newHostMail = newHostString[1];
    var oldHostMail = originalHostString[1];
    var mailString = newHostMail;
    // Mail that all players should share
    var transferrableMail = [
        "<string>ccDoorUnlock</string>",
        "<string>ccPantry</string>",
        "<string>ccCraftsRoom</string>",
        "<string>ccFishTank</string>",
        "<string>ccBoilerRoom</string>",
        "<string>ccBulletin</string>",
        "<string>ccVault</string>",
        "<string>jojaPantry</string>",
        "<string>jojaCraftsRoom</string>",
        "<string>jojaFishTank</string>",
        "<string>jojaBoilerRoom</string>",
        "<string>jojaVault</string>",
        "<string>JojaMember</string>"
    ];
    for (var i = 0; i < transferrableMail.length; i++) {
        if (oldHostMail.includes(transferrableMail[i]) && !newHostMail.includes(transferrableMail[i])) {
            mailString += transferrableMail[i];
        }
    }
    
    return newHostString[0] + mailString + newHostString[2];
}

function fixHomeLocation(dest, source) {
    var cutDestString = isolateTag(dest, "homeLocation");
    var cutSourceString = isolateTag(source, "homeLocation");
    return cutDestString[0] + cutSourceString[1] + cutDestString[2];
}

function fixUpgradeLevels(dest, source) {
    var cutDestString = isolateTag(dest, "houseUpgradeLevel");
    var cutSourceString = isolateTag(source, "houseUpgradeLevel");
    dest = cutDestString[0] + cutSourceString[1] + cutDestString[2];
    cutDestString = isolateTag(dest, "daysUntilHouseUpgrade")
    cutSourceString = isolateTag(source, "daysUntilHouseUpgrade");
    return cutDestString[0] + cutSourceString[1] + cutDestString[2];
}

function fixEvents(newHostString, originalHostString) {
    newHostString = isolateTag(newHostString, "eventsSeen");
    originalHostString = isolateTag(originalHostString, "eventsSeen");

    var newHostEvents = newHostString[1];
    var oldHostEvents = originalHostString[1];
    var eventsString = newHostEvents;
    // Events that all players should share
    var transferrableEvents = [
        "<int>65</int>", // Bats or mushrooms
        "<int>1590166</int>", // Marnie gives you a cat
        "<int>897405</int>", // Marnie gives you a dog
        "<int>611439</int>", // Community center unlocked
        "<int>191393</int>", // Community center final cutscene
        "<int>502261</int>" // Joja final cutscene
    ];
    for (var i = 0; i < transferrableEvents.length; i++) {
        if (oldHostEvents.includes(transferrableEvents[i]) && !newHostEvents.includes(transferrableEvents[i])) {
            eventsString += transferrableEvents[i];
        }
    }
    
    return newHostString[0] + eventsString + newHostString[2];
}

function submit(index) {
    var div = document.getElementById("instructions");
    var instruction2 = document.getElementById("instruction2");
    if (instruction2) div.removeChild(instruction2);
    var p = document.createElement("p");
    p.setAttribute("id", "instruction2");
    var t = document.createTextNode("New host: " + chunks[index] + ". Overwrite the contents of your save file with the result below. Then send your whole HostCharacterName_123456789 folder (including the SaveGameInfo file) to the new host to put in their Saves folder.");
    p.appendChild(t);
    div.appendChild(p);

    document.getElementById("input").value = "";
    var out = document.getElementById("output");
    out.value = "";
    if (index === 1) {
        out.value = originalString;
    } else {
        var outString = "";
        // Swap player name/data with index name/data
        for (var i = 0; i < chunks.length; i++) {
            var j = i;
            if (i === index) {
                j = 1;
            } else if (i === index + 1) {
                j = 2;
            } else if (i === 1) {
                j = index;
            } else if (i === 2) {
                j = index + 1;
            }
            var nextChunk = chunks[j];
            if (i === 2) {
                nextChunk = fixEvents(nextChunk, chunks[2]);
                nextChunk = fixMail(nextChunk, chunks[2]);
                nextChunk = fixUpgradeLevels(nextChunk, chunks[2]);
                nextChunk = fixHomeLocation(nextChunk, "<homeLocation>FarmHouse</homeLocation>");
            } else if (j === 2) {
                nextChunk = fixUpgradeLevels(nextChunk, chunks[index + 1]);
                nextChunk = fixHomeLocation(nextChunk, chunks[index + 1]);
            }
            outString += nextChunk;
        }
        out.value = outString;
        out.select();
    }
}

function copy() {
    var out = document.getElementById("output");
    out.select();
    document.execCommand("copy");
}

