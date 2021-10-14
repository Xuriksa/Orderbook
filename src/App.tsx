import React, { useState,  } from 'react';
import './styles/App.css';

import MarketSelect from './Components/MarketSelect';
import Orderbook from './Components/Orderbook';

const App = () =>
{
    const [market, setMarket] = useState('');
    return (
        <div className="App">
            <MarketSelect market={market} setMarket={setMarket} />
            {
                market !== "" && <Orderbook market={market} />
            }
        </div>
    );
}

export default App;
