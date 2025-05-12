import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportBluetooth from "@ledgerhq/hw-transport-web-ble";
import AppXrp from "@ledgerhq/hw-app-xrp";
import toast from 'react-hot-toast';

const websockets = [];

export const createWebsocket = (url) => {
    const ws = new WebSocket(url);
    websockets.push(ws);
    return ws;
}

export const isMobile = () => {
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    const maxMobileScreenWidth = 768;
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    return hasTouchScreen && screenWidth <= maxMobileScreenWidth;
};

export const formatTransaction = (address) => {
    if (address) {
        let shortenedStr = address.substring(0, 8) + "..." + address.substring(address.length - 8);
        return shortenedStr;
    }

    return "Invalid Transaction ID";
}

export const formatAddress = (address) => {
    if (address) {
        let shortenedStr = address.substring(0, 6) + "..." + address.substring(address.length - 6);
        return shortenedStr;
    }

    return "Disconnected";
}

export const getAddress = () => {
    const data = localStorage.getItem("address");
    return data;
}

export const getWalletType = () => {
    const data = localStorage.getItem("walletType");
    return data;
}

export const round = (value, decimal = 6) => {
    return (value * 10 ** decimal).toFixed(0) / (10 ** decimal);
}

export const getAccountNfts = async (accountAddress) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/${accountAddress}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
} 

export const getValidatedNfts = async(offset, limit) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/nftlist?offset=${offset}&limit=${limit}`);
        const data = await res.json();

        if (res.status !== 200) {
            return [];
        }

        if (!data.result || data.error) {
            return [];
        }
        return data.result;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export const shortenStr = (str, length) => {
    if (str.length > length) {
        return str.substring(0, length) + "...";
    }

    return str;
}

export const connectWallet = async (steps, setSteps, setCurrentStep, setOpenLoading, setAddress, setWalletType) => {
    try {
        setCurrentStep(0);
        setOpenLoading(true);

        const mobile = isMobile();
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/signin-xumm?isMobile=${mobile}`);
        const data = await res.json();

        if (!data) {
            toast.error("Server response isn't correct");
            setOpenLoading(false);
            return;
        }

        const payload = data.result;
        console.log("Connecting to wallet payload: ", payload);
        if (payload) {
            const _steps = [...steps];
            _steps[0].qr_link = payload.refs.qr_png;
            setSteps(_steps);
            console.log("Mobile: ", mobile);

            if (mobile) {
                    // iOS devices → use direct redirect
                    window.location.href = payload.next.always;
            }

            const ws_url = payload.refs.websocket_status;
            const webs = createWebsocket(ws_url);

            webs.onmessage = async (e) => {
                const event = JSON.parse(e.data);
                console.log("WebSocket event: ", event);
                if (event.signed) {
                    const payloadUuid = event.payload_uuidv4;
                    try {
                        const _steps = [...steps];
                        _steps[1].subtitle = payloadUuid;
                        setSteps(_steps);
                        setCurrentStep(1);

                        const check = await fetch(`${import.meta.env.VITE_SERVER_URL}/get-payload?uuid=${payloadUuid}`);
                        const checkData = await check.json();
                        const hex = checkData.result.response.hex;

                        setCurrentStep(2);
                        const checkSign = await fetch(`${import.meta.env.VITE_SERVER_URL}/check-sign?hex=${hex}`);
                        const checkSignData = await checkSign.json();

                        if ("xrpAddress" in checkSignData.result) {
                            localStorage.setItem("address", checkSignData.result.xrpAddress);
                            setAddress(checkSignData.result.xrpAddress);
                            localStorage.setItem("walletType", "xumm");
                            setWalletType("xumm");
                        }

                    } catch (error) {
                        toast.error(error.message);
                    } finally {
                        setOpenLoading(false);
                    }
                } else if (event.expired === true) {
                    toast.error("Transaction expired. Please try again.");
                    webs.close();
                }
            };
        } else {
            toast.error("Something went wrong. Please try again later.");
            setOpenLoading(false);
        }
    } catch (error) {
        toast.error(error.message);
        setOpenLoading(false);
    }
};

export const connectLedgerWallet = async (steps, setSteps, setCurrentStep, setOpenLoading, setAddress, setWalletType, ledgerMode) => {
    try {
        if (!ledgerMode) {
            return;
        }
        setCurrentStep(0);
        setOpenLoading(true);
        let transport, xrp;
        if (ledgerMode === 'usb') {
            transport = await TransportWebUSB.create();
            xrp = new AppXrp(transport);
        } else if (ledgerMode === 'bluetooth') {
            transport = await TransportBluetooth.create();
        }
        
    
        setCurrentStep(1);
        const result = await xrp.getAddress("44'/144'/0'/0/0"); // Standard XRP derivation path
        const { address } = result;
    
        if (address) {
            setAddress(address);
            setCurrentStep(2);
            toast.success("Ledger wallet connected successfully!");
            setWalletType("ledger");
            localStorage.setItem("address", address);
            localStorage.setItem("walletType", "ledger");
        } else {
            throw new Error("Failed to get address from Ledger.");
        }
    } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to connect Ledger wallet.");
    } finally {
        setOpenLoading(false);
    }
};

export const getVerifiedXRPNftsOfAccount = async (address) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/verified-nfts?walletAddress=${address}`);
        // const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/verified-nfts?walletAddress=${'r9ZW5tjbhKFLWxs4j1KqF61YSHAyDvo52D'}`);
        const data = await res.json();

        if (res.status !== 200) {
            return ;
        }

        if (!data.result || data.error) {
            return ;
        }
        return data.result;
    } catch (error) {
        console.error(error);
        return ;
    }
};

export const getUrlFromEncodedUri = (encodedUri) => {
    const hex = encodedUri.match(/.{1,2}/g).map((byte) => String.fromCharCode(parseInt(byte, 16))).join("");
    return hex.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${hex.split("ipfs://")[1]}` : hex;
};

export const getVerifiedSGBNftsOfAccount  = async (address) => {
    try {
        if (!address) {
            return ;
        }
        const decodedAddress = address.toLowerCase();
        // const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/sgb/verified-nfts?sgbAddress=${'0xa29073e603114ecdcac2a0930190db14bdd54658'}`);
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/sgb/verified-nfts?sgbAddress=${decodedAddress}`);
        const data = await res.json();

        if (res.status !== 200) {
            return ;
        }

        if (!data.result || data.error) {
            return ;
        }
        return data.result;
    } catch (error) {
        console.error(error);
        return ;
    }
}

export const getStatkingHistory = async (address) => {
    if (!address) {
        return [];
    }
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/stake/logs?address=${address}`);
        const data = await res.json();
        return data.result;
    } catch (error) {
        return [];
    }
}

export const getTrustLine = async (address, isMobile) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/trustline`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                address: address,
                isMobile: isMobile
            })
        });
        
        if(res.status !== 200){
            return null;
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const getTradeHistory = async (period) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/swap/trade-history?period=${period}`);
        if (!res || res.status !== 200) {
            return [];
        }
        const data = await res.json();
        if (!data) {
            return [];
        }
        return data.result;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export const checkSwapConditions = async (address) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/swap/check-conditions?address=${address}`);
        if (!res || res.status !== 200) {
            return [];
        }
        const data = await res.json();
        if (!data) {
            return [];
        }
        return data.result;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export const getSwapPayload = async (address, xrpAmt, aaxAmt, isMobile) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/swap/payload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                address: address,
                xrpAmt: xrpAmt,
                aaxAmt: aaxAmt,
                isMobile: isMobile
            })
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const xrpNftVerify = async (address, verified, points) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/verify/xrp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                address: address,
                verified: verified,
                points: points
            })
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const sgbNftVerify = async (address, points, xrpAddress) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/verify/sgb`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                address: address,
                points: points,
                xrpAddress: xrpAddress
            }),
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const fetchPoolInfo = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/nfts/pool-infor`);
        if (!res || res.status !== 200) {
            return [];
        }
        const data = await res.json();
        if (!data) {
            return [];
        }
        return data.result;
    } catch (error) {
        console.error(error);
        return [];
    }
}


  