var socket = null;
var gameId = '';
var player = null;
var playerId = '';
var playerIdx = null;
var playerIndexes = {};

var currentTurnToGuessBases = null;
var currentTurnToPlay = null;
var handFirstPlayer = null;

var canvas = document.getElementById('canvas');
canvas.height = 620;
canvas.width = 1000;
var ctx = canvas.getContext('2d')

var borderSeparation = 30;
var separation = 30;
var cardWidth = 80;
var cardHeight = cardWidth * 1.525;

var images = {};
var imagesLoaded = false;

//ctx.fillStyle = "#267272";
//ctx.fillRect(0, 0, canvas.width, canvas.height);

// ctx.moveTo(canvas.width / 2, 0);
// ctx.lineTo(canvas.width / 2, canvas.height);
// ctx.stroke();


// ctx.moveTo(0, canvas.height / 2);
// ctx.lineTo(canvas.width, canvas.height / 2);
// ctx.stroke();

function loadImages(sources, callback) {
    var images = [];
    var loadImages = 0;
    var numImages = sources.length;
    for (var iIdx in sources) {
        if (sources[iIdx] == null) {
            ++loadImages;
        } else {
            images[iIdx] = new Image();
            images[iIdx].onload = function () {
                if (++loadImages >= numImages) {
                    callback(images);
                }
            };
            images[iIdx].src = "/static/images/" + sources[iIdx]
        }
    }
}

function preloadImages() {
    var imagesNames = [];
    var cardNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    var cardClubs = ["C", "H", "D", "S"];
    for (var ccIdx in cardClubs) {
        for (var cnIdx in cardNumbers) {
            imagesNames.push(cardNumbers[cnIdx] + cardClubs[ccIdx] + ".png");
        }
    }
    imagesNames.push("background.png");
    imagesNames.push("gray_back.png");
    imagesNames.push("empty_base.png", "filled_base.png", "extra_base.png");

    loadImages(imagesNames, function (imagesResources) {
        for (var iIdx in imagesResources) {
            images[imagesNames[iIdx]] = imagesResources[iIdx];
        }
        imagesLoaded = true;
    });
}


preloadImages();

function loadGame(gId, playerId) {
    gameId = gId;
    playerId = playerId;
    console.log("Loading game with id " + gameId + " and player " + playerId);

    socket = io({
        query: {
            game: gameId,
            name: playerId
        }
    });


    socket.on('warnMessage', function (data) {
        console.log("Warn message for Game: " + data.gameId + "| PlayerId: " + data.playerId + "| Msg: " + data.message);
    })

    socket.on('newGame', function (game) {
        console.log("New game");
        // Let's set which player am I
        for (var pIdx in game.playersPool.players) {
            if (game.playersPool.players[pIdx].id == playerId) {
                playerIdx = pIdx % 4;
                break;
            }
        }
        if (playerIdx == null) {
            console.log("Player " + playerId + " is not in this game");
            return;
        }
        player = game.playersPool.players[pIdx];

        playerIndexes["bottom"] = playerIdx % 4;
        playerIndexes["right"] = (playerIdx + 1) % 4;
        playerIndexes["top"] = (playerIdx + 2) % 4;
        playerIndexes["left"] = (playerIdx + 3) % 4;

        handFirstPlayer = game.rounds[game.rounds.length - 1].handFirstPlayer;
        setCurrentTurn(game);
        draw(game);
    });

    socket.on('deal', function (data) {
        console.log("Deal");
    });

    socket.on('cardPlayed', function (data) {
        console.log("A card was played");
        currentTurnToPlay = data.currentTurnToPlay;
        draw(data.game);
    });

    socket.on('handDone', function (data) {
        console.log("Hand done");
        currentTurnToPlay = data.currentTurnToPlay;
        handFirstPlayer = data.handFirstPlayer;
        draw(data.game);
    });

    socket.on('roundDone', function (data) {
        console.log("Round done");
        currentTurnToGuessBases = data.currentTurnToGuessBases;
        currentTurnToPlay = data.currentTurnToPlay;
        handFirstPlayer = data.handFirstPlayer;
        draw(data.game);
    });

    socket.on('baseGuessed', function (data) {
        console.log('baseGuessed');
        console.log(data);
        currentTurnToGuessBases = data.currentTurnToGuessBases;
        currentTurnToPlay = data.currentTurnToPlay;
        draw(data.game);
    });
}
function setHandFirstPlayer(game) {
    handFirstPlayer = game.rounds[game.rounds.length - 1].handFirstPlayer;
}

function setCurrentTurn(game) {
    if (game.rounds[game.rounds.length - 1].currentTurnToGuessBases) {
        currentTurnToGuessBases = game.rounds[game.rounds.length - 1].currentTurnToGuessBases;
    } else {
        currentTurnToGuessBases = null;
    }

    if (game.rounds[game.rounds.length - 1].currentTurnToPlay) {
        currentTurnToPlay = game.rounds[game.rounds.length - 1].currentTurnToPlay;
    } else {
        currentTurnToPlay = null;
    }
}

var playerCards = [];
canvas.addEventListener('click', function (event) {
    console.log(event);
    if (playerCards.length == 0) {
        return;
    }
    if (event.offsetY >= canvas.height - cardHeight - borderSeparation &&
        event.offsetY <= canvas.height - borderSeparation) {
        var totalWidth = separation * (playerCards.length - 1) + cardWidth;
        var initialDx = canvas.width / 2 - totalWidth / 2;

        if (event.offsetX >= initialDx && event.offsetX <= initialDx + totalWidth) {
            // Asume it's the last card and check if  it fall under the other cards
            var clickedCard = playerCards[playerCards.length - 1];
            for (var cIdx = 0; cIdx < playerCards.length - 1; cIdx++) {
                // That "+2" is to fix sth I don't understand
                if (event.offsetX < (cIdx + 1) * separation + initialDx + 2) {
                    // This is the card!
                    clickedCard = playerCards[cIdx];
                    break;
                }
            }
            console.log(clickedCard);
            socket.emit('playCard', {
                "gameId": gameId,
                "playerId": player.id,
                "card": clickedCard
            });
        }
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function draw(game) {
    while (!imagesLoaded) {
        console.log("Waiting for images to be loaded");
        await sleep(1000);
    }
    console.log("All images loaded")
    console.log(game)
    ctx.drawImage(images['background.png'], 0, 0, canvas.width, canvas.height);

    drawPlayers(game.playersPool);
    drawBases(game.playersPool);
    drawBasesAskedVsCards(game);
    playerCards = game.playersPool.players[playerIndexes["bottom"]].cards;
    drawCards(game.playersPool);
    drawPlayedCards(game.playersPool);
    if (game.rounds[game.rounds.length - 1].triumph) {
        drawTriumph(game.rounds[game.rounds.length - 1].triumph);
    }
    drawCurrentTurn();
}

function drawCurrentTurn() {
    console.log("drawCurrentTurn");
    if (currentTurnToGuessBases) {
        console.log(currentTurnToGuessBases)
        drawCurrentTurnName(currentTurnToGuessBases.name);
    } else if (currentTurnToPlay) {
        console.log(currentTurnToPlay)
        drawCurrentTurnName(currentTurnToPlay.name);
    }
}

function drawCurrentTurnName(name) {
    document.getElementById("currentTurn").innerHTML = "Turno: " + name;
}


// Asume first player is current player and then go 
// counter clockwise
function drawPlayers(playersPool) {
    if (playerIdx == null) {
        return;
    }
    ctx.font = "25px Helvetica";
    ctx.fillStyle = "white"
    ctx.textAlign = "center"

    // bottom
    var name = playersPool.players[playerIndexes["bottom"]].name;
    if (handFirstPlayer && playersPool.players[playerIndexes["bottom"]].id == handFirstPlayer.id) {
        name = "-->  " + name + "  <--";
    }
    ctx.fillText(name, canvas.width / 2, canvas.height - borderSeparation + 25);

    // right
    name = playersPool.players[playerIndexes["right"]].name;
    if (handFirstPlayer && playersPool.players[playerIndexes["right"]].id == handFirstPlayer.id) {
        name = "-->  " + name + "  <--";
    }
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(name, 0, canvas.width / 2 - borderSeparation + 25);
    ctx.restore();
    // top
    name = playersPool.players[playerIndexes["top"]].name;
    if (handFirstPlayer && playersPool.players[playerIndexes["top"]].id == handFirstPlayer.id) {
        name = "-->  " + name + "  <--";
    }
    ctx.fillText(name, canvas.width / 2, 25);

    // left
    name = playersPool.players[playerIndexes["left"]].name;
    if (handFirstPlayer && playersPool.players[playerIndexes["left"]].id == handFirstPlayer.id) {
        name = "-->  " + name + "  <--";
    }
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(name, 0, canvas.width / 2 - borderSeparation + 25);
    ctx.restore();
}

function drawBasesAskedVsCards(game) {
    var totalBases = game.rounds[game.rounds.length - 1].cardsPerPlayer;
    var askedBases = 0;

    for (var pIdx in playerIndexes) {
        askedBases += game.playersPool.players[playerIndexes[pIdx]].askedBases;
    }

    document.getElementById("askedVsCards").innerHTML = askedBases + "/" + totalBases;
}

function drawBases(playersPool) {
    var baseSeparation = separation;
    var baseWidth = 14;
    var baseHeight = 14;
    var totalWidth = 0;
    var initialDx = 0;
    var initialDy = 0;
    var player = null;

    // Bottom player
    player = playersPool.players[playerIndexes["bottom"]];
    if (player.doneBases > player.askedBases) {
        totalWidth = baseSeparation * player.doneBases;
    } else {
        totalWidth = baseSeparation * player.askedBases;
    }

    initialDx = canvas.width / 2 - totalWidth / 2;
    initialDy = canvas.height / 2 - totalWidth / 2;

    if (player.doneBases > player.askedBases) {
        for (var i = 0; i < player.doneBases; i++) {
            var img = images['filled_base.png'];
            if (i >= player.askedBases) {
                img = images['extra_base.png'];
            }
            ctx.drawImage(img, i * separation + initialDx, canvas.height - cardHeight - borderSeparation * 2, baseWidth, baseHeight);
        }
    } else {
        for (var i = 0; i < player.askedBases; i++) {
            var img = images['empty_base.png'];
            if (i < player.doneBases) {
                img = images['filled_base.png'];
            }
            ctx.drawImage(img, i * separation + initialDx, canvas.height - cardHeight - borderSeparation * 2, baseWidth, baseHeight);
        }
    }

    // Right player
    player = playersPool.players[playerIndexes["right"]];
    if (player.doneBases > player.askedBases) {
        totalWidth = baseSeparation * player.doneBases;
    } else {
        totalWidth = baseSeparation * player.askedBases;
    }

    initialDx = canvas.width / 2 - totalWidth / 2;
    initialDy = canvas.height / 2 - totalWidth / 2;

    if (player.doneBases > player.askedBases) {
        for (var i = 0; i < player.doneBases; i++) {
            var img = images['filled_base.png'];
            if (i >= player.askedBases) {
                img = images['extra_base.png'];
            }
            ctx.drawImage(img, canvas.width - borderSeparation - cardHeight - borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
        }
    } else {
        for (var i = 0; i < player.askedBases; i++) {
            var img = images['empty_base.png'];
            if (i < player.doneBases) {
                img = images['filled_base.png'];
            }
            ctx.drawImage(img, canvas.width - borderSeparation - cardHeight - borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
        }
    }

    // Top player
    player = playersPool.players[playerIndexes["top"]];
    if (player.doneBases > player.askedBases) {
        totalWidth = baseSeparation * player.doneBases;
    } else {
        totalWidth = baseSeparation * player.askedBases;
    }

    initialDx = canvas.width / 2 - totalWidth / 2;
    initialDy = canvas.height / 2 - totalWidth / 2;

    if (player.doneBases > player.askedBases) {
        for (var i = 0; i < player.doneBases; i++) {
            var img = images["filled_base.png"];
            if (i >= player.askedBases) {
                img = images["extra_base.png"];
            }
            ctx.drawImage(img, i * separation + initialDx, borderSeparation + cardHeight + borderSeparation / 2, baseWidth, baseHeight);
        }
    } else {
        for (var i = 0; i < player.askedBases; i++) {
            var img = images["empty_base.png"];
            if (i < player.doneBases) {
                img = images["filled_base.png"];
            }
            ctx.drawImage(img, i * separation + initialDx, borderSeparation + cardHeight + borderSeparation / 2, baseWidth, baseHeight);
        }
    }

    // Left player
    player = playersPool.players[playerIndexes["left"]];
    if (player.doneBases > player.askedBases) {
        totalWidth = baseSeparation * player.doneBases;
    } else {
        totalWidth = baseSeparation * player.askedBases;
    }

    initialDx = canvas.width / 2 - totalWidth / 2;
    initialDy = canvas.height / 2 - totalWidth / 2;

    if (player.doneBases > player.askedBases) {
        for (var i = 0; i < player.doneBases; i++) {
            var img = images["filled_base.png"];
            if (i >= player.askedBases) {
                img = images["extra_base.png"];
            }
            ctx.drawImage(img, borderSeparation + cardHeight + borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
        }
    } else {
        for (var i = 0; i < player.askedBases; i++) {
            var img = images["empty_base.png"];
            if (i < player.doneBases) {
                img = images["filled_base.png"];
            }
            ctx.drawImage(img, borderSeparation + cardHeight + borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
        }
    }

}


function drawCards(playersPool) {

    // Current player
    var player = playersPool.players[playerIndexes["bottom"]];

    var totalWidth = separation * (player.cards.length - 1) + cardWidth;
    var initialDx = canvas.width / 2 - totalWidth / 2;

    for (var cIdx in player.cards) {
        var img = images[player.cards[cIdx].imageName];
        ctx.drawImage(images[player.cards[cIdx].imageName], cIdx * separation + initialDx, canvas.height - cardHeight - borderSeparation, cardWidth, cardHeight);
    }

    var oponentCardSeparation = separation * 0.8;
    // Right Player
    var totalCards = playersPool.players[playerIndexes["right"]].cards.length
    var totalWidth = oponentCardSeparation * (totalCards - 1) + cardWidth;
    var initialDx = canvas.height / 2 - totalWidth / 2 - canvas.height / 2;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    for (var i = 0; i < totalCards; i++) {
        ctx.drawImage(images["gray_back.png"], i * oponentCardSeparation + initialDx, canvas.width / 2 - cardHeight - borderSeparation, cardWidth, cardHeight);
    }
    ctx.restore();

    // Top player
    totalCards = playersPool.players[playerIndexes["top"]].cards.length
    totalWidth = oponentCardSeparation * (totalCards - 1) + cardWidth;
    initialDx = canvas.width / 2 - totalWidth / 2;
    for (var i = 0; i < totalCards; i++) {
        ctx.drawImage(images["gray_back.png"], i * oponentCardSeparation + initialDx, borderSeparation, cardWidth, cardHeight);
    }

    // Left Player
    totalCards = playersPool.players[playerIndexes["left"]].cards.length
    totalWidth = oponentCardSeparation * (totalCards - 1) + cardWidth;
    initialDx = canvas.height / 2 - totalWidth / 2 - canvas.height / 2;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    for (var i = 0; i < totalCards; i++) {
        ctx.drawImage(images["gray_back.png"], i * oponentCardSeparation + initialDx, canvas.width / 2 - cardHeight - borderSeparation, cardWidth, cardHeight);
    }
    ctx.restore();

}

function drawPlayedCards(playersPool) {
    // Bottom player

    if (playersPool.players[playerIndexes["bottom"]].currentCard) {
        ctx.drawImage(images[playersPool.players[playerIndexes["bottom"]].currentCard.imageName], canvas.width / 2 - cardWidth / 2, canvas.height / 2 + borderSeparation * 0.0, cardWidth, cardHeight);
    }

    // Right player
    if (playersPool.players[playerIndexes["right"]].currentCard) {
        ctx.drawImage(images[playersPool.players[playerIndexes["right"]].currentCard.imageName], canvas.width / 2 + cardWidth, canvas.height / 2 - cardHeight / 2, cardWidth, cardHeight);
    }

    // Top  player
    if (playersPool.players[playerIndexes["top"]].currentCard) {
        ctx.drawImage(images[playersPool.players[playerIndexes["top"]].currentCard.imageName], canvas.width / 2 - cardWidth / 2, canvas.height / 2 - cardHeight - borderSeparation * 0.0, cardWidth, cardHeight);
    }

    // Left player
    if (playersPool.players[playerIndexes["left"]].currentCard) {
        ctx.drawImage(images[playersPool.players[playerIndexes["left"]].currentCard.imageName], canvas.width / 2 - cardWidth * 2, canvas.height / 2 - cardHeight / 2, cardWidth, cardHeight);
    }
}



function drawTriumph(triumph) {
    for (var i = 1; i < 5; i++) {
        ctx.drawImage(images['gray_back.png'], borderSeparation / 2 - (5 - i), canvas.height - cardHeight - borderSeparation / 2 + (5 - i), cardWidth, cardHeight);
    }
    ctx.drawImage(images[triumph.imageName], borderSeparation / 2, canvas.height - cardHeight - borderSeparation / 2, cardWidth, cardHeight);

}

function guessBases() {
    if (currentTurnToGuessBases.name != player.name) {
        console.log("Not your turn to guess player " + player.name);
        return;
    }
    console.log(player);
    console.log(gameId);
    console.log("Player " + player.name + " is guessing " + document.getElementById("basesGuess").value + " bases");
    socket.emit('guessBases', {
        "gameId": gameId,
        "playerId": player.id,
        "bases": document.getElementById("basesGuess").value
    });
}