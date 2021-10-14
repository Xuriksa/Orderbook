export type Order =
{
    size: string;
    price: string;
}

export type Change =
{
    type: string;
    size: string;
    price: string;
};

export type Book =
{
    asks: Order[];
    bids: Order[];
};