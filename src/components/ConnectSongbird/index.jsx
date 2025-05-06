import { Box } from "@mui/material";
import { createThirdwebClient, defineChain } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import "./style.scss";

export default function SongbirdWalletConnect(){
    const client = createThirdwebClient({
        clientId: "5268b675094fa745e33361bf62f64da1",
    });
    
    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.bifrostwallet"),
    ]
    const chain = defineChain({
        id: 19,
        rpc: "https://rpc.ftso.au/songbird",
        nativeCurrency:{
            name: "Songbird",
            symbol: "SGB",
            decimals: 18
        }
    })
    return (
        <Box className="wallet-container">
            <ConnectButton 
                client={client}
                chain={chain}
                wallets={wallets}
                connectModal={{
                    size:"compact",
                    title: "Connect to Songbird",
                    showThirdwebBranding: false,
                }}
                connectButton={{ label:"Connect to Songbrid"}}
            />
        </Box>    
    )
}