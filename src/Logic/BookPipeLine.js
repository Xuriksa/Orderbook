"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BookPipeLine = /** @class */ (function () {
    function BookPipeLine(market, limit, storeBook, movePipeLine) {
        this.market = ''; // selected market
        this.limit = 0;
        this.book = { asks: [], bids: [] };
        this.ws = null;
        this.queue = [];
        this.current = 0;
        this.max = 30;
        this.storeBook = function (data, limit) { return { asks: [], bids: [] }; }; // function that stores the initial snapshot
        this.movePipeLine = function (changes, book, limit) { return { asks: [], bids: [] }; }; // function that moves changes in the pipeline into the store book
        this.market = market; // selected market
        this.limit = limit; // number of orders to display in each book
        this.book = { asks: [], bids: [] }; // stores the book, necessary because state updates in the UI component may not be done immediatly
        this.ws = null; // the websocket
        this.queue = []; // queue of changes since initial snapshot
        this.current = 0; // current number of messages (not changes) received
        this.max = limit; // max number of messages (not changes) the queue supports
        this.storeBook = storeBook; // function that stores the initial snapshot
        this.movePipeLine = movePipeLine; // function that moves changes in the pipeline into the store book
    }
    ;
    // connect to the socket and start receiving data
    BookPipeLine.prototype.start = function () {
        var _this = this;
        if (this.market !== "") {
            var endpoint = "wss://ws-feed.exchange.coinbase.com";
            var subscribe_message_1 = {
                "type": "subscribe",
                "channels": [
                    {
                        "name": "level2",
                        "product_ids": [
                            this.market
                        ],
                    },
                ]
            };
            this.cancel();
            this.ws = new WebSocket(endpoint);
            this.ws.addEventListener("message", function (_a) {
                var data = _a.data;
                var datao = JSON.parse(data); // get json
                if (datao.type === "snapshot") // initial book, store it
                 {
                    var newBook = { asks: [], bids: [] };
                    for (var i = 0; i < datao.asks.length; i++) {
                        var order = { size: datao.asks[i][1], price: datao.asks[i][0] };
                        newBook.asks.push(order);
                    }
                    for (var i = 0; i < datao.bids.length; i++) {
                        var order = { size: datao.bids[i][1], price: datao.bids[i][0] };
                        newBook.bids.push(order);
                    }
                    _this.book = _this.storeBook(newBook, _this.limit);
                }
                else if (datao.type === "l2update") // change message
                 {
                    if (_this.current >= _this.max) // pipeline full, move elements into the book
                     {
                        _this.book = _this.movePipeLine(_this.queue, _this.book, _this.limit);
                        _this.queue = [];
                        _this.current = 0;
                    }
                    for (var i = 0; i < datao.changes.length; i++) {
                        var change = { type: datao.changes[i][0], size: datao.changes[i][2], price: datao.changes[i][1] };
                        _this.queue.push(change);
                    }
                    _this.current++;
                }
            });
            this.ws.addEventListener("open", function () {
                _this.ws.send(JSON.stringify(subscribe_message_1));
            });
            this.ws.addEventListener("close", function () {
            });
        }
    };
    BookPipeLine.prototype.cancel = function () {
        this.queue = [];
        this.current = 0;
        if (this.ws !== null) {
            this.ws.close();
        }
    };
    return BookPipeLine;
}());
exports.default = BookPipeLine;
//# sourceMappingURL=BookPipeLine.js.map