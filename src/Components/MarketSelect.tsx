import React from 'react';

import '../styles/MarketSelect.css';

type MarketProps = {
    market: string;
    setMarket: Function;
};

const MarketSelect = ({ market, setMarket }: MarketProps) => {
    const markets = [
        {label: "", value: ""},
        { label: "BTC-USDC", value: "BTC-USDC" },
        { label: "ETH-BTC", value: "ETH-BTC" },
    ];

    let key: number = 0;
    const options = markets.map((m) =>
    {
        return <option key={++key + ""} value={m.value}>{m.label}</option>
    });

    return (
        <div id="select-container">
            <label id="market-label" htmlFor="markets">Choose a Market:</label>
            <select name="markets" value={market} onChange={(e) => { setMarket(e.target.value) }}>
                {options}
            </select>
        </div>
    );
};

export default MarketSelect;