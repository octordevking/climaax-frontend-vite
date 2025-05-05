import React, { useContext, useState, useEffect } from 'react';
import './style.scss';
import { Box, Typography, Grid, Tabs, Tab, TextField } from '@mui/material';
import DashboardLayout from '../../components/DashboardLayout';
import { useAppContext } from '../../context/AppContext';
import { connectWallet, createWebsocket, isMobile, getTrustLine, getTradeHistory, getSwapPayload } from '../../utils';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LoadingModal from '../../components/LoadingModal';
import toast from 'react-hot-toast';
import TradingViewChart from '../../components/TradingViewChart';
import TradeHistoryTable from '../../components/TradeHistoryTable';

export default function Swap() {
  const { address, amountToken, setAddress, amountXrp, trustLine, setTrustLineStatus, getTokenAmount } = useAppContext();
  const [tabIndex, setTabIndex] = useState(0);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [ohlvc, setOhlvc] = useState([]);
  const [swapXrpAmt, setSwapXrpAmt] = useState(0);
  const [swapAaxAmt, setSwapAaxAmt] = useState(0);
  const defaultSteps = [
    {
      label: 'Check trustline',
      description: `Checking the new AAX token Trustline. Please wait...`,
      qr: true,
    },
    {
      label: 'Payment to escrow',
      subtitle: ``,
      description: `Send your payment to the escrow address. Please confirm the address.`,
      qr: true,
    },
    {
      label: 'Verifying your transaction',
      description: `Thanks for your payment. We are verifying your transaction. Once transaction is approved, your token will be swaped with a new token. Please wait...`,
      tx: true
    },
    {
      label: 'Now swaping...',
      description: `You signed successfully. Please wait a moment while sending you tokens.`,
    },
  ];

  const trustlineSteps = [
    {
      label: 'Check trustline',
      description: `Checking the new AAX token Trustline. Please wait...`,
      qr: true,
    },
  ];
  const [steps, setSteps] = useState(defaultSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [openLoading, setOpenLoading] = useState(false);
  
  const closeLoadingModal = () => {
    setOpenLoading(false);
  }

  const setTrustLine = async (callback) => {
    try {
      setSteps(trustlineSteps);
      const mobile = isMobile();

      const trustLineData = await getTrustLine(address, mobile);

      if (!trustLineData) {
        closeLoadingModal();
        toast.error("Can't set trustline. Please try again later.");
        return;
      }

      const payload = trustLineData.result;

      if (payload) {
        const _steps = [...steps];
        _steps[0].qr_link = payload.refs.qr_png;
        setSteps(_steps);

        if (mobile) {
          window.open(payload.next.always, "_blank");
        }

        const ws_url = payload.refs.websocket_status;
        const webs = createWebsocket(ws_url);

        webs.onmessage = async (e) => {
          const event = JSON.parse(e.data);

          if (event.signed) {
            toast.success("Trustline is set successfully");
            setSteps(defaultSteps);
            callback();
            setTrustLineStatus(true);
          } else if ("signed" in event && event.signed === false) {
            toast.error("Transaction is cancelled");
            setSteps(defaultSteps);
            closeLoadingModal();
          }
        };
      } else if (payload === null) {
        toast.success("Trustline is already set");
        setSteps(defaultSteps);
        callback();
      } else {
        toast.error("Something went wrong. Please try again later.");
        closeLoadingModal();
      }
    } catch (error) {
      closeLoadingModal()
      toast.error(error.message);
      return;
    }
  }

  const onTrustline = async () => {
    if (!address) {
      toast.error("Please connect your wallet first.")
      return;
    }

    setCurrentStep(0);
    setSteps(trustlineSteps);
    setOpenLoading(true);

    await setTrustLine(() => {
      setOpenLoading(false);
    });
  }

  const onSwap = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!swapXrpAmt) {
      toast.error("Please enter xrp amount");
      return;
    }
    
    if(swapXrpAmt <= 0){
      toast.error("Please enter valid xrp amount");
      return;
    }

    if(!trustLine){
      toast.error("Please set trustline");
      return;
    }

    await swap();
  }

  const swap = async () => {
    try {
      setCurrentStep(0);
      setSteps(defaultSteps);
      setOpenLoading(true);

      const mobile = isMobile();
      setCurrentStep(1);

      const data =await getSwapPayload(address, swapXrpAmt, swapAaxAmt.toFixed(5), mobile);

      if (!data) {
        closeLoadingModal();
        toast.error("Server response is invalid. Please try again later.");
        return;
      }

      const payload = data.result;

      if (payload) {
        const _steps = [...defaultSteps];
        _steps[1].qr_link = payload.refs.qr_png;
        setSteps(_steps);
        
        if (mobile) {
          window.open(payload.next.always, "_blank");
        }

        const ws_url = payload.refs.websocket_status;
        const webs = createWebsocket(ws_url);

        webs.onmessage = async (e) => {
          const event = JSON.parse(e.data);

          if (event.signed) {
            const payloadUuid = event.payload_uuidv4;
            try {
              const _steps = [...steps];
              _steps[2].subtitle = event.txid;
              setSteps(_steps);
              setCurrentStep(2);

              const check = await fetch(`${import.meta.env.VITE_SERVER_URL}/get-payload?uuid=${payloadUuid}`);
              const checkData = await check.json();
              const hex = checkData.result.response.hex;

              const checkSign = await fetch(`${import.meta.env.VITE_SERVER_URL}/check-sign?hex=${hex}`);
              const checkSignData = await checkSign.json();

              if (checkSignData.result.xrpAddress === address) {
                setCurrentStep(3);
                toast.success("Swap is completed successfully");
                setSwapXrpAmt(0);
                getTokenAmount(address);
              } else {
                toast.error("Invalid signature");
                closeLoadingModal();
              }

            } catch (error) {
              toast.error(error.message);
            } finally {
              closeLoadingModal();
            }
          } else if ("signed" in event && event.signed === false) {
            toast.error("Transaction is cancelled");
            closeLoadingModal();
          }
        };
      } else {
        toast.error("Something went wrong. Please try again later.");
        closeLoadingModal();
      } 
    } catch (error) {
      closeLoadingModal()
      toast.error(error.message);
      return;
    }
  }

  useEffect(()=>{
    setSwapAaxAmt(isNaN(swapXrpAmt / tokenPrice) ? 0 : swapXrpAmt / tokenPrice);    
  }, [swapXrpAmt])

  useEffect(() => {
    const fetchTradeHistory = async (period = '1w') => {
      const result = await getTradeHistory(period);
      if (result.lenth === 0){
        return [];
      }
      const sortedTradeHistory = [...result.tradeHistory].sort((a, b) => new Date(b.time) - new Date(a.time));
      setTradeHistory(sortedTradeHistory);
      setOhlvc(result.ohlvc);
      setTokenPrice(result.latestPrice);
    }
    fetchTradeHistory();
  }, [])

  return (
    <DashboardLayout className="swap-container">
      <Grid container spacing={2} justifyContent={"center"} className="swap-grid-container">
        <LoadingModal open={openLoading} steps={steps} currentStep={currentStep} />
        <Box className="trading-card">
          <Tabs
            value={tabIndex}
            onChange={(e, newIndex) => setTabIndex(newIndex)}
            variant="fullWidth"
            className="trade-history-tabs"
          >
            <Tab label="Chart" className={tabIndex === 0 ? 'trade-history-tab-active' : 'trade-history-tab'} />
            <Tab label="Trade History" className={tabIndex === 1 ? 'trade-history-tab-active' : 'trade-history-tab'} />
          </Tabs>
          <Box className="swap-section">
            {tabIndex === 0 ?
              (<TradingViewChart data={ohlvc}></TradingViewChart>) :
              (<TradeHistoryTable data={tradeHistory} />)
            }
          </Box>
        </Box>
        
        <Box className="swap-card">
          <Box className="card-header">
            <Box className="wallet-status-box">
              <Box display="flex" justifyContent="space-between"  gap={"50px"} marginBottom="12px">
                <Box>
                  <Typography className="wallet-label" color="#888">AAX Available</Typography>
                  <Typography className="wallet-balance">{amountToken}</Typography>
                </Box>
                <Box>
                  <Typography className="wallet-label" color="#888">XRP Available</Typography>
                  <Typography className="wallet-balance">{amountXrp}</Typography>
                </Box>
              </Box>
              {trustLine ? 
                <></> : 
                (!address? 
                  <span  className='warning'> Connect Wallet</span> :
                  <Typography className='warning'>To swap, you need to set {' '}
                    <span  className='warning' onClick={onTrustline}> AAX trustline</span>
                  </Typography>
                )
              }
            </Box>
          </Box>  
          <Box className="swap-section">
            <Typography className="label">From</Typography>
            <Box className="swap-input-box">
              <Box className="input-info">
                <TextField
                  className="amount"
                  variant="standard" // or "outlined" or "filled"
                  value={swapXrpAmt}
                  type='number'
                  onChange={(e) => setSwapXrpAmt(e.target.value)}
                  inputProps={{ step: "0.1" }} // optional for number-like input
                />
              </Box>
              <Box className="token-select">
                <img src="/xrp-cryptocurrency.svg" alt="XRP" className="token-icon" />
                <Typography>XRP</Typography>
              </Box>
            </Box>
            <Typography className="balance">Balance: {amountXrp}</Typography>
          </Box>

          <Box className="swap-section">
            <Typography className="label">To</Typography>
            <Box className="swap-input-box">
              <Box className="input-info">
                <Typography className="amount">{swapAaxAmt.toFixed(5)}</Typography>
              </Box>
              <Box className="token-select">
                <img src="https://static.wixstatic.com/media/885065_3c934ec615c74beca77d53466f4859bd~mv2.png/v1/fill/w_123,h_113,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/LogoAAd.png" alt="XRP" className="token-icon" />
                <Typography>AAX</Typography>
              </Box>
            </Box>
            <Typography className="balance">Balance: {amountToken}</Typography>
            <Typography className='label'>
              1 AAX ≈ {parseFloat(tokenPrice).toFixed(5)} XRP
            </Typography>
          </Box>

          <Box className="swap-btn" onClick = {onSwap}>
            Buy AAX
          </Box>
        </Box>
      </Grid>
    </DashboardLayout>
  );
}
