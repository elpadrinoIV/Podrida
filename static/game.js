var socket = null;
var gameId = '';
var player = null;
var playerId = '';
var playerIdx = null;
var playerIndexes = {};

var currentTurnToGuessBases = null;
var currentTurnToPlay = null;

var canvas = document.getElementById('canvas');
canvas.height = 800;
canvas.width = 1000;
var ctx = canvas.getContext('2d')

var borderSeparation = 30;
var separation = 30;
var cardWidth = 100;
var cardHeight = cardWidth * 1.525;

var backgroundImage = null;

//ctx.fillStyle = "#267272";
//ctx.fillRect(0, 0, canvas.width, canvas.height);

// ctx.moveTo(canvas.width / 2, 0);
// ctx.lineTo(canvas.width / 2, canvas.height);
// ctx.stroke();


// ctx.moveTo(0, canvas.height / 2);
// ctx.lineTo(canvas.width, canvas.height / 2);
// ctx.stroke();

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

        console.log(playerIndexes);
        console.log(game);
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
        draw(data.game);
    });

    socket.on('roundDone', function (data) {
        console.log("Round done");
        currentTurnToGuessBases = data.currentTurnToGuessBases;
        currentTurnToPlay = data.currentTurnToPlay;
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

function draw(game) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    drawPlayers(game.playersPool);
    drawBases(game.playersPool);
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
    ctx.fillText(playersPool.players[playerIndexes["bottom"]].name, canvas.width / 2, canvas.height - borderSeparation + 25);

    // right
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(playersPool.players[playerIndexes["right"]].name, 0, canvas.width / 2 - borderSeparation + 25);
    ctx.restore();
    // top
    ctx.fillText(playersPool.players[playerIndexes["top"]].name, canvas.width / 2, 25);

    // left
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(playersPool.players[playerIndexes["left"]].name, 0, canvas.width / 2 - borderSeparation + 25);
    ctx.restore();
}

loadImages(["/background.png"], function (imgs) {
    ctx.drawImage(imgs[0], 0, 0, canvas.width, canvas.height);
    backgroundImage = imgs[0];
});

function drawBases(playersPool) {
    loadImages(["/empty_base.png", "/filled_base.png", "/extra_base.png"], function (imgs) {
        var baseSeparation = separation;
        var baseWidth = 17;
        var baseHeight = 17;
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
                var img = imgs[1];
                if (i >= player.askedBases) {
                    img = imgs[2];
                }
                ctx.drawImage(img, i * separation + initialDx, canvas.height - cardHeight - borderSeparation * 2, baseWidth, baseHeight);
            }
        } else {
            for (var i = 0; i < player.askedBases; i++) {
                var img = imgs[0];
                if (i < player.doneBases) {
                    img = imgs[1];
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
                var img = imgs[1];
                if (i >= player.askedBases) {
                    img = imgs[2];
                }
                ctx.drawImage(img, canvas.width - borderSeparation - cardHeight - borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
            }
        } else {
            for (var i = 0; i < player.askedBases; i++) {
                var img = imgs[0];
                if (i < player.doneBases) {
                    img = imgs[1];
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
                var img = imgs[1];
                if (i >= player.askedBases) {
                    img = imgs[2];
                }
                ctx.drawImage(img, i * separation + initialDx, borderSeparation + cardHeight + borderSeparation / 2, baseWidth, baseHeight);
            }
        } else {
            for (var i = 0; i < player.askedBases; i++) {
                var img = imgs[0];
                if (i < player.doneBases) {
                    img = imgs[1];
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
                var img = imgs[1];
                if (i >= player.askedBases) {
                    img = imgs[2];
                }
                ctx.drawImage(img, borderSeparation + cardHeight + borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
            }
        } else {
            for (var i = 0; i < player.askedBases; i++) {
                var img = imgs[0];
                if (i < player.doneBases) {
                    img = imgs[1];
                }
                ctx.drawImage(img, borderSeparation + cardHeight + borderSeparation, i * separation + initialDy, baseWidth, baseHeight);
            }
        }
    });
}


function drawCards(playersPool) {
    var images = [];

    // Current player
    var player = playersPool.players[playerIndexes["bottom"]];
    for (var cIdx in player.cards) {
        images.push(player.cards[cIdx].imageName);
    }

    loadImages(images, function (imgs) {
        console.log("All cards loaded")

        var totalWidth = separation * (imgs.length - 1) + cardWidth;
        var initialDx = canvas.width / 2 - totalWidth / 2;

        for (var iIdx in images) {
            ctx.drawImage(imgs[iIdx], iIdx * separation + initialDx, canvas.height - cardHeight - borderSeparation, cardWidth, cardHeight);
        }
    })


    loadImages(["/gray_back.png"], function (imgs) {
        // Right Player
        var totalCards = playersPool.players[playerIndexes["right"]].cards.length
        var totalWidth = separation * (totalCards - 1) + cardWidth;
        var initialDx = canvas.height / 2 - totalWidth / 2 - canvas.height / 2;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        for (var i = 0; i < totalCards; i++) {
            ctx.drawImage(imgs[0], i * separation + initialDx, canvas.width / 2 - cardHeight - borderSeparation, cardWidth, cardHeight);
        }
        ctx.restore();

        // Top player
        totalCards = playersPool.players[playerIndexes["top"]].cards.length
        totalWidth = separation * (totalCards - 1) + cardWidth;
        initialDx = canvas.width / 2 - totalWidth / 2;
        for (var i = 0; i < totalCards; i++) {
            ctx.drawImage(imgs[0], i * separation + initialDx, borderSeparation, cardWidth, cardHeight);
        }

        // Left Player
        totalCards = playersPool.players[playerIndexes["left"]].cards.length
        totalWidth = separation * (totalCards - 1) + cardWidth;
        initialDx = canvas.height / 2 - totalWidth / 2 - canvas.height / 2;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        for (var i = 0; i < totalCards; i++) {
            ctx.drawImage(imgs[0], i * separation + initialDx, canvas.width / 2 - cardHeight - borderSeparation, cardWidth, cardHeight);
        }
        ctx.restore();
    });
}

function drawPlayedCards(playersPool) {
    var images = [];
    for (var i in playersPool.players) {
        if (playersPool.players[i].currentCard) {
            images.push(playersPool.players[i].currentCard.imageName)
        } else {
            images.push(null);
        }

    }

    loadImages(images, function (imgs) {
        // Bottom player
        if (imgs[playerIndexes["bottom"]]) {
            ctx.drawImage(imgs[playerIndexes["bottom"]], canvas.width / 2 - cardWidth / 2, canvas.height / 2 + borderSeparation * 0.5, cardWidth, cardHeight);
        }

        // Right player
        if (imgs[playerIndexes["right"]]) {
            ctx.drawImage(imgs[playerIndexes["right"]], canvas.width / 2 + cardWidth, canvas.height / 2 - cardHeight / 2, cardWidth, cardHeight);
        }

        // Top  player
        if (imgs[playerIndexes["top"]]) {
            ctx.drawImage(imgs[playerIndexes["top"]], canvas.width / 2 - cardWidth / 2, canvas.height / 2 - cardHeight - borderSeparation * 0.5, cardWidth, cardHeight);
        }

        // Left player
        if (imgs[playerIndexes["left"]]) {
            ctx.drawImage(imgs[playerIndexes["left"]], canvas.width / 2 - cardWidth * 2, canvas.height / 2 - cardHeight / 2, cardWidth, cardHeight);
        }
    });
}


function drawTriumph(triumph) {
    var images = [triumph.imageName, "/gray_back.png"];

    loadImages(images, function (imgs) {
        for (var i = 1; i < 5; i++) {
            ctx.drawImage(imgs[1], borderSeparation / 2 - (5 - i), canvas.height - cardHeight - borderSeparation / 2 + (5 - i), cardWidth, cardHeight);
        }
        ctx.drawImage(imgs[0], borderSeparation / 2, canvas.height - cardHeight - borderSeparation / 2, cardWidth, cardHeight);
    });
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