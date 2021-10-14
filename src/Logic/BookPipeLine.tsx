import { Order, Change, Book } from '../types';

export default class BookPipeLine
{
    market: string = ''; // selected market
    limit: number = 0;
    book: Book = { asks: [], bids: [] };;
    ws: any = null;
    queue: Change[] = [];
    current: number = 0;
    max: number = 30;

    storeBook = (data: Book, limit: number): Book => { return { asks: [], bids: [] } }; // function that stores the initial snapshot
    movePipeLine = (changes: Change[], book: Book, limit: number): Book => { return { asks: [], bids: [] } }; // function that moves changes in the pipeline into the store book

    constructor(market: string, limit: number, storeBook: (data: Book, limit: number) => Book, movePipeLine: (changes: Change[], book: Book, limit: number) => Book)
    {
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

    // connect to the socket and start receiving data
    start() {
        if (this.market !== "")
        {
            const endpoint: string = "wss://ws-feed.exchange.coinbase.com";
            const subscribe_message: any = {
                "type": "subscribe",
                "channels": [
                    {
                        "name": "level2",
                        "product_ids": [
                            this.market
                        ],
                    },
                ]
            }

            this.cancel();

            this.ws = new WebSocket(endpoint);

            this.ws.addEventListener("message", ({ data }: { data: any }) => {
                const datao = JSON.parse(data); // get json

                if (datao.type === "snapshot") // initial book, store it
                {
                    let newBook: Book = { asks: [], bids: [] }

                    for (let i: number = 0; i < datao.asks.length; i++) {
                        let order: Order = { size: datao.asks[i][1], price: datao.asks[i][0] };
                        newBook.asks.push(order);
                    }

                    for (let i: number = 0; i < datao.bids.length; i++) {
                        let order: Order = { size: datao.bids[i][1], price: datao.bids[i][0] };
                        newBook.bids.push(order);
                    }

                    this.book = this.storeBook(newBook, this.limit);
                }
                else if (datao.type === "l2update") // change message
                {
                    if (this.current >= this.max) // pipeline full, move elements into the book
                    {
                        this.book = this.movePipeLine(this.queue, this.book, this.limit);
                        this.queue = [];
                        this.current = 0;
                    }

                    for (let i: number = 0; i < datao.changes.length; i++)
                    {
                        let change: Change = { type: datao.changes[i][0], size: datao.changes[i][2], price: datao.changes[i][1] };
                        this.queue.push(change);                        
                    }

                    this.current++;

                }
            });

            this.ws.addEventListener("open", () => {
                this.ws.send(JSON.stringify(subscribe_message));
            });

            this.ws.addEventListener("close", () => {

            });
        }
        
    }

    cancel()
    {
        this.queue = [];
        this.current = 0;

        if (this.ws !== null) {
            this.ws.close();
        }
    }
}