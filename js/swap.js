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
        var t = document.createTextNode("Pick new host (it can take awhile): ");
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

function submit(index) {
    var div = document.getElementById("instructions");
    var instruction2 = document.getElementById("instruction2");
    if (instruction2) div.removeChild(instruction2);
    var p = document.createElement("p");
    p.setAttribute("id", "instruction2");
    var t = document.createTextNode("New host: " + chunks[index] + ". Overwrite the contents of your save file with the result below. Then send your whole HostCharacterName_123456789 folder (including the SaveGameInfo file) to the new host to put in their Saves folder.");
    p.appendChild(t);
    div.appendChild(p);

    var out = document.getElementById("output");
    out.value = "";
    if (index === 1) {
        out.value = originalString;
    } else {
        var outString = "";
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
            outString += chunks[j];
        }
        out.value = outString;
    }
}