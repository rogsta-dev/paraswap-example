const paraswap = require("@paraswap/sdk");
const axios = require("axios");
const ethers = require("ethers");

// construct minimal SDK with fetcher only
const paraSwapMin = paraswap.constructSimpleSDK({ chainId: 56, axios });

swapExample();

async function swapExample() {
    // Get All tokens to show in dropdowns
    const allAvailableTokens = await paraSwapMin.swap.getTokens();


    // user selects a source + destination token
    const srcToken = allAvailableTokens.filter(t => t.symbol === "USDC")[0];
    const destToken = allAvailableTokens.filter(t => t.symbol === "ETH")[0];

    // get users amount to swap (Here it is 100 USDC)
    const srcAmount = "100";
    // get user slippage percentage
    const slippage = 0.05;

    // we need to get the address of the connected wallet here (for example purpose a random wallet is generated)
    const signer = ethers.Wallet.createRandom();
    const senderAddress = signer.address;

    // get rate when sending 1 of Source token
    const priceRate = await paraSwapMin.swap.getRate({
        srcToken: srcToken.address,
        destToken: destToken.address,
        // format the amount according to src token decimals
        amount: ethers.parseUnits(srcAmount, srcToken.decimals),
        // set the wallet address of the user
        userAddress: senderAddress,
        srcDecimals: srcToken.decimals,
        destDecimals: destToken.decimals,
        // this is always sell if the user enters the amount from the src token
        side: paraswap.SwapSide.SELL,
    });

    // Receive Amount in dest token:
    const amountInDestToken = ethers.formatUnits(priceRate.destAmount, destToken.decimals)
    console.log(amountInDestToken);
    // Receive Amount in USD
    console.log(priceRate.destUSD);
    // Order Routing value
    console.log(getOrderRouting(priceRate));
    // order Routing Chart
    console.log(priceRate.bestRoute)
    // price impact?? idk yet. We need to get the actual price of the tokens to calculate price impact

    // minimum received
    console.log(amountInDestToken * (1 - slippage));
    // network fees
    console.log(priceRate.gasCostUSD);
}

function getOrderRouting(priceRate) {
    let orderRouting;
    const exchanges = new Set(priceRate.bestRoute
        .map(route => route.swaps
            .map(swap => swap.swapExchanges
                .map(swapExchange => swapExchange.exchange))).flat(3));
    if (exchanges.size == 1) {
        [orderRouting] = exchanges;
    } else {
        orderRouting = "MultiSwap";
    }
    return orderRouting;
}