import React, { useState, useEffect } from 'react';

import '../styles/Orderbook.css';
import { Order, Change, Book } from '../types';
import BookPipeLine from '../Logic/BookPipeLine';

type OrderbookProps = {
    market: string;
};

type TableRowProps = {
    data: Order;
    type: string;
};

const Orderbook = ({ market }: OrderbookProps) =>
{
    const [orders, setOrders] = useState({ asks: [], bids: [] } as Book); // order book
    const [bpl, setBPL] = useState(null as any); // updates pipeline
    const [spread, setSpread] = useState(0.0); // the spread
    const [topCount, setTopCount] = useState(15); // the number of orders to display in both books

    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [total, setTotal] = useState('');

    const handleIntInputChange = (value: string, mutator: Function) =>
    {
        let n = parseInt(value);

        if (value === "" || !isNaN(n) && n > 0)
        {
            mutator(value);
        }
    }

    // central function to update order book state based on sorted and trimmed lists of asks and bids
    // return the new order book because state values may not be updated immediately
    const updateBook = (asks: Order[], bids: Order[]): Book => {
        let book: Book = { asks:  [...asks], bids: [...bids] };
        setOrders(book);
        return book;
    }

    // store the order book given the data in the initial snapshot message from the socket, limit is number of orders to display
    // return the new order book because state values may not be updated immediately
    const storeBook = (data: Book, limit: number): Book => {
        let temp_asks: Order[] = data.asks;
        let temp_bids: Order[] = data.bids;

        temp_asks = temp_asks.filter((ask) => parseFloat(ask.size) > 0.0);
        temp_bids = temp_bids.filter((bid) => parseFloat(bid.size) > 0.0);

        temp_asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        temp_bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

        temp_asks = temp_asks.slice(0, limit);
        temp_bids = temp_bids.slice(0, limit);

        updateSpread(temp_asks, temp_bids);
        return updateBook(temp_asks, temp_bids);
    };

    // move the values in the pipeline to the order book, limit is number of orders to display
    // recive old and return the new order book because state values may not be updated immediately
    const movePipeLine = (changes: Change[], book: Book, limit: number): Book => {
        let temp_asks: Order[] = book.asks;
        let temp_bids: Order[] = book.bids;

        for (let i = 0; i < changes.length; i++)
        {
            let change: Change = changes[i];

            if (parseFloat(change.size) > 0.0) {                
                if (change.type === "buy") {
                    temp_bids.push({ size: change.size, price: change.price });
                }
                else if (change.type === "sell") {
                    temp_asks.push({ size: change.size, price: change.price });
                }
            }
        }

        temp_asks = temp_asks.filter((ask) => parseFloat(ask.size) > 0.0);
        temp_bids = temp_bids.filter((bid) => parseFloat(bid.size) > 0.0);

        temp_asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        temp_bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

        temp_asks = temp_asks.slice(0, limit);
        temp_bids = temp_bids.slice(0, limit);

        updateSpread(temp_asks, temp_bids);
        return updateBook(temp_asks, temp_bids);
    }

    // update spread given sorted list of new asks and bids
    const updateSpread = (asks: Order[], bids: Order[]) => {
        if (asks.length > 0 && bids.length > 0)
        {
            let difference: number = parseFloat(Math.abs(parseFloat(bids[0].price) - parseFloat(asks[0].price)).toPrecision(7));
            setSpread(difference);
        }
    }

    useEffect(() => {
        let q: number = parseFloat(quantity);
        let p: number = parseFloat(price);

        if (!isNaN(q) && q >= 0.0 && !isNaN(p)) // price can go below 0
        {
            setTotal((p * q).toString());
        }

    }, [quantity, price]);

    // new pipeline, start it
    useEffect(() => {
        if (bpl != null) {
            bpl.start();
        }

    }, [bpl]);

    // market or number of orders changed, start new pipeline
    useEffect(() => {
        if (market !== "") {
            if (bpl !== null) {
                bpl.cancel();
            }

            /* we need a data pipeline from the socket because a rerender on every new message
             * will overwhelm the JS thread and freeze the other UI Components. 
             */
            setBPL(new BookPipeLine(market, topCount, storeBook, movePipeLine));
        }
    }, [market, topCount]);

    // table row with an order. data is [size, price]; type is "asks" or "bids"
    const TableRow = ({ data, type }: TableRowProps) => {
        return (
            <div
                onClick={() => { setPrice(data.price) }}
                className="table-row"
            >
                <div className="col">
                    <p className="cell-text">{data.size}</p>
                </div>
                <div className="col">
                    <p className={type === "asks" ? "asks-cell-text" : "bids-cell-text"}>{data.price}</p>
                </div>
            </div>
        );
    }

    let askID: number = 0;
    const askTable = orders.asks.map((ask) => {
        return <TableRow key={askID++} data={ask} type={"asks"} />
    });

    let bidID: number = 0;
    const bidTable = orders.bids.map((bid) => {
        return <TableRow key={bidID++} data={bid} type={"bids"} />
    });

    return (
        <div id="main-container">
            <input
                type="text"
                value={topCount}
                onChange={(e) => { handleIntInputChange(e.target.value, setTopCount) }}
                placeholder="Number of orders to Display."                
                maxLength={2}
                className="end-input"
            />
            <input
                value={quantity}
                onChange={(e) => { handleIntInputChange(e.target.value, setQuantity) }}
                placeholder="Quantity BTC."
                className="input"
            />
            <input
                value={price}
                placeholder="Price USDC (Click on a Price in the order book)."                
                readOnly
                className="input"
            />
            <input
                value={total}
                placeholder="Total (Quantity * Price)."
                readOnly
                className="end-input"
            />
            <div id="table">
                <div className="row">
                    <div className="col">
                        <p className="cell-text">Market Size</p>
                    </div>
                    <div className="col">
                        <p className="cell-text">Price (BTC)</p>
                    </div>
                </div>
            
                {askTable}
                <div className="row">
                    <div className="col">
                        <p className="cell-text">Spread</p>
                    </div>
                    <div className="col">
                        <p className="cell-text">{spread}</p>
                    </div>
                </div>
                {bidTable}
            </div>
        </div>
    );


}

export default Orderbook;