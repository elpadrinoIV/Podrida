var express = require('express')
var http = require('http');
var path = require('path')
var socketIO = require('socket.io')
var card = require('./card.js')
// var card_deck = require('./card_deck.js')
var player = require('./player.js')
// var round = require('./round.js')
var game = require('./game.js')
var player_pool = require('./player_pool.js')


// var pp = new player_pool.playersPool(players);
// var g = new game.Game(pp);
// console.log(g.roundCardNumbers)

// var r = new round.Round(13, pp, p1);
// r.deal()

//p4.currentCard = new card.Card("10", card.CardSuit.DIAMONDS)

//console.log("Triumph: ", r.triumph)
// console.log("Winner: ", r.handWinner().name)


// r.deal()

var p1 = new player.Player("NICOLAS", "Nico");
var p2 = new player.Player("GILDA", "Gil");
var p3 = new player.Player("JULIAN", "Juli");
var p4 = new player.Player("ALEJANDRA", "Ale");

var playersPool = new player_pool.PlayersPool([p1, p2, p3, p4]);
const games = {}

games['123'] = new game.Game(playersPool);
games['123'].dealNextRound();
//p3.currentCard = new card.Card("J", card.CardSuit.HEARTS);
//p4.currentCard = new card.Card("1", card.CardSuit.DIAMONDS);
//games['123'].rounds[games['123'].rounds.length - 1].triumph = new card.Card("J", card.CardSuit.HEARTS);

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 8080);
app.use('/static', express.static(__dirname + '/static'));

// app.get('/', function (request, response) {
//     response.sendFile(path.join(__dirname, 'index.html'));
// })

app.get('/game/:id/score', function (request, response) {
    //response.sendFile(path.join(__dirname, 'score.html'));
    console.log("Someone asking for score for game " + request.params.id);
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(`<html>
    <head>
        <title>Podrida</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            table {
                border-collapse: collapse;
            }
    
            table,
            tr,
            td {
                border: 1px solid black;
                text-align: center;
            }
    
            td.name {
                width: 10em;
            }
    
            td.asked,
            td.done {
                width: 1em;
            }
    
    
            td.under {
                background-color: #ff5a5a;
            }
    
            td.over {
                background-color: #bdbdff;
            }
    
            td.even {
                background-color: #94ff94;
            }
    
            thead {
                font-weight: bold;
            }
        </style>
    </head>
    
    <body>
        <table id="score">
        </table>
    
    </body>
    
    <script src="/static/score.js"></script>
    <script>loadScore('` + request.params.id + `');</script>
    </html>`
    );
});

app.get('/game/:id', function (request, response) {
    console.log("Someone asking for game " + request.params.id + " and the user is " + request.query.user);
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(`<html>

<head>
    <title>Podrida</title>
    <style> 
        canvas {
            width: 1000px;
            height: 620px;
            border: 5px solid black;
            background-color: green;
        }

        .currentTurn {
            position: absolute;
            top: 770;
            left: 800;
            width: 200px;
            height: 30px;
            font-family: "Helvetica";
            font-size: 20px;
            color: white;
        }
    </style>
    <script src="/socket.io/socket.io.js"></script>

</head>

<body>
    <canvas id="canvas"></canvas>
    <div id="currentTurn" class="currentTurn">Turno:</div>
    <div id="basesForm" class="container" border="1px solid black">
        <form>
        <input type="text" id="basesGuess">
        <button type="button" onclick="guessBases()" data-toggle="modal">Enviar</button>
    </div>
</body>

<script src="/static/game.js"></script>
<script>loadGame('` + request.params.id + `', '` + request.query.user +
        `');
</script>

</html>
    `);
    response.end(); //end the response
    //response.sendFile(path.join(__dirname, 'index.html'));
})

server.listen(8080, function () {
    console.log('Starting server');
});

// function baseGuessingEnded(round) {
//     socket.emit('baseGuessed', {
//         "currentTurn"
//     });
// }

// Add the WebSocket handlers
io.on('connection', function (socket) {
    console.log('A user connected:', socket.id);

    socket.emit('newGame', games['123']);
    socket.on('disconnect', function () {
        console.log("user disconected");
    });

    socket.on('newPlayer', function (data) {
        console.log("Bla " + data);
    });

    socket.on('guessBases', function (data) {
        console.log("Player: " + data.playerId + "| Game: " + data.gameId + "| Bases: " + data.bases);

        var game = games[data.gameId];
        if (!game) {
            console.log("No game with ID " + data.gameId);
            return;
        }

        var player = game.findPlayerById(data.playerId);
        if (player == null) {
            return;
        }

        if (isNaN(parseInt(data.bases))) {
            socket.emit("warnMessage", { "gameId": data.gameId, "playerId": data.playerId, "message": data.bases + " no es un numero" })
            return;
        }
        if (!game.currentRound().canGuessBases(player, parseInt(data.bases))) {
            socket.emit("warnMessage", { "gameId": data.gameId, "playerId": data.playerId, "message": "No podes pedir " + data.bases + " basas" })
            return;
        }
        game.currentRound().guessBases(player, parseInt(data.bases));
        io.sockets.emit('baseGuessed', {
            "game": game,
            "currentTurnToGuessBases": game.currentRound().currentTurnToGuessBases,
            "currentTurnToPlay": game.currentRound().currentTurnToPlay
        });
    });

    socket.on('playCard', function (data) {
        console.log("Player: " + data.playerId + "| Game: " + data.gameId + "| Card: " + data.card.toString());

        var game = games[data.gameId];
        if (!game) {
            console.log("No game with ID " + data.gameId);
            return;
        }

        var player = game.findPlayerById(data.playerId);
        if (player == null) {
            return;
        }

        var cardPlayed = player.findCard(data.card);
        if (cardPlayed == null) {
            return;
        }

        if (!game.currentRound().canPlayCard(player, cardPlayed)) {
            socket.emit("warnMessage", { "gameId": data.gameId, "playerId": data.playerId, "message": "No podes jugar esa carta" });
            return;
        }
        game.currentRound().playCard(player, cardPlayed);
        io.sockets.emit('cardPlayed', {
            "game": game,
            "currentTurnToPlay": game.currentRound().currentTurnToPlay
        });

        if (game.currentRound().isHandDone()) {
            setTimeout(() => {
                console.log("Hand Done");
                game.currentRound().endHand();
                io.sockets.emit('handDone', {
                    "currentTurnToPlay": game.currentRound().currentTurnToPlay,
                    "game": game
                });
            }, 5000);
        }

        if (game.currentRound().isRoundDone()) {
            setTimeout(() => {
                console.log("Round Done");
                game.currentRound().endRound();
                game.dealNextRound();
                io.sockets.emit('roundDone', {
                    "currentTurnToGuessBases": game.currentRound().currentTurnToGuessBases,
                    "currentTurnToPlay": game.currentRound().currentTurnToPlay,
                    "game": game
                });
            }, 9000);
        }
    });

    socket.on('handDone', function (data) {
        console.log("Hand done");
    });

    socket.on('roundDone', function (data) {

    })
});
// setInterval(function () {
//     io.sockets.emit('newGame', 'hi');
// }, 1000);





// http.createServer(function (req, res) {
//     res.writeHead(200, { 'Content-Type': 'text/html' });
//     res.write('Hello World!'); //write a response to the client
//     res.end(); //end the response
// }).listen(8080); //the server object listens on port 8080
