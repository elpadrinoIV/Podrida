
function loadScore(gId) {
    var socket = io({
        query: {
            game: gId,
            name: "tuVieja"
        }
    });

    socket.on('warnMessage', function (data) {
        console.log("Warn message for Game: " + data.gameId + "| PlayerId: " + data.playerId + "| Msg: " + data.message);
    });

    socket.on('newGame', function (data) {
        drawScore(data);
    });

    socket.on('roundDone', function (data) {
        drawScore(data.game);
    });

    socket.on('baseGuessed', function (data) {
        drawScore(data.game)
    });
}

function drawScore(game) {
    console.log(game);
    var table = document.getElementById("score");

    var thead = '<thead><tr><td class="round">Cartas</td>';
    var player = null;
    for (var pIdx in game.playersPool.players) {
        player = game.playersPool.players[pIdx];
        thead += '<td class="name">' + player.name + '</td>' + '<td class="asked">P</td><td class="done">H</td>';
    }
    thead += "</tr></thead>";

    var tbody = "<tbody>";
    for (var rIdx in game.roundCardNumbers) {
        tbody += '<tr>';
        tbody += '<td>' + game.roundCardNumbers[rIdx] + '</td>';
        var round = null
        if (rIdx < game.rounds.length) {
            round = game.rounds[rIdx];
        }
        if (round == null) {
            for (var pIdx in game.playersPool.players) {
                tbody += '<td class="score"></td><td class="asked"></td><td class="done"></td>'
            }
        } else {
            var score = round.scores;
            if (score == null || score.length == 0) {
                for (var pIdx in game.playersPool.players) {
                    tbody += '<td class="score"></td><td class="asked"></td><td class="done"></td>'
                }
            }
            console.log(score);
            for (var sIdx in score) {
                player = score[sIdx];
                tbody += '<td class="score">';
                if (player.score != null) {
                    tbody += player.score;
                }
                tbody += '</td>';
                tbody += '<td class="asked">'
                if (player.askedBases != null) {
                    tbody += + player.askedBases;
                }
                tbody += '</td>';

                if (player.doneBases != null) {
                    if (player.askedBases == player.doneBases) {
                        tbody += '<td class="done even">';
                    } else if (player.askedBases < player.doneBases) {
                        tbody += '<td class="done over">';
                    } else {
                        tbody += '<td class="done under">';
                    }
                } else {
                    tbody += '<td class="done">';
                }
                if (player.doneBases != null) {
                    tbody += player.doneBases
                }
                tbody += '</td>';
            }
        }

        tbody += '</tr>';
    }
    tbody += '<tr><td>Total</td>';

    for (var pIdx in game.playersPool.players) {
        player = game.playersPool.players[pIdx];
        tbody += '<td class="name">' + player.score + '</td>' + '<td class="asked"></td><td class="done"></td>';
    }
    tbody += '</tr>';

    tbody += "</tbody>";
    table.innerHTML = thead + tbody;
}