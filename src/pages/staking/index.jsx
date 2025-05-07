import React, { useContext, useEffect, useState } from 'react';
import "./style.scss";
import { Box, Button,  Grid, Input, Typography, Tabs, Tab, FormControl, Select, MenuItem} from '@mui/material';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingModal from '../../components/LoadingModal';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { createWebsocket, isMobile, round, getStatkingHistory, connectWallet, shortenStr } from '../../utils'
import StakingHistoryTable from '../../components/StakingHistory';

export default function Home() {
  const defaultSteps = [
    { label: 'Payment to escrow', subtitle: ``, description: 'Send your payment to the escrow address.', qr: true },
    { label: 'Verifying your transaction', description: 'We are verifying your transaction...', tx: true },
    { label: 'Now staking...', description: 'Staking your funds, please wait...', },
  ];
  const MIN_STAKING_AMOUNT = parseFloat(import.meta.env.VITE_MINIMUM_STAKING_AMOUNT);

  const [currentPage, setCurrentPage] = useState(1);
  const [amount, setAmount] = useState(0);
  const { address, amountToken, stakeOptions, getTokenAmount, walletType} = useAppContext();
  const [isValidAmount, setIsValidAmount] = useState(false);
  const [steps, setSteps] = useState(defaultSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [openLoading, setOpenLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [stakingHistory, setStakingHistory] = useState([]);

  useEffect(() => {
    setOptions(stakeOptions);
  }, [stakeOptions]);
  
  const fetchStakingHistory = async () => {
    try {
      const result = await getStatkingHistory(address);
      if (result) {
        setStakingHistory(result);
      } else {
        setStakingHistory([]);
      }
    } catch (error) {
      console.error("Error fetching staking history:", error);
      setStakingHistory([]);
    }
  };

  useEffect(() => {
    fetchStakingHistory();
  }, [address]);
  
  const closeLoadingModal = () => setOpenLoading(false);

  const onAmountChange = (e) => {
    const value = e.target.value;
    if (isNaN(value) || value < MIN_STAKING_AMOUNT || value > amountToken) {
      setIsValidAmount(false);
    } else {
      setIsValidAmount(true);
    }
    setOptions(prev => prev.map(option => {
      option.receive = (value * (1 + option.reward_percentage / 100) * 100).toFixed(0) / 100;
      return option;
    }));
    setAmount(value);
  };

  const onMaxClick = () => setAmount(amountToken);

  const onOptionSelected = (index) => {
    setOptions(prev => prev.map((option, i) => {
      option.selected = i === index;
      return option;
    }));
  };

  const handleTimeRangeChange = (event) => {
    setSelectedTimeRange(event.target.value);
  }

  const stakeFunds = async () => {
    try {
      setCurrentStep(0);
      setSteps(defaultSteps);
      setOpenLoading(true);

      const mobile = isMobile();
      const selectedOption = stakeOptions.find(option => option.selected);
      
      if (!selectedOption || !amount || !walletType) {
        toast.error("Please enter an amount and select a stake option");
        closeLoadingModal();
        return;
      }

      if(walletType !== "xumm") {
        toast.error("Please use Xaman wallet to stake");
        closeLoadingModal();
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/stake/payload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, amount: round(amount), option: selectedOption.id, isMobile: mobile, walletType: walletType }),
      });
      const data = await res.json();

      if (data?.result?.refs?.qr_png) {
        const _steps = [...steps];
        _steps[0].qr_link = data.result.refs.qr_png;
        setSteps(_steps);
        const ws_url = data.result.refs.websocket_status;
        const webs = createWebsocket(ws_url);
        webs.onmessage = async (e) => {
          const event = JSON.parse(e.data);
          if (event.signed === true) {
            await processSignedTransaction(event);
            closeLoadingModal();
          } else if (event.signed === false) {
            toast.error("Transaction is not signed");
            closeLoadingModal();
          } else if (event.expired === true){
            toast.error("Transaction expired");
            webs.close();
            return;
          }
        };
        
      } else {
        toast.error("Invalid server response");
        closeLoadingModal();
      }
    } catch (error) {
      closeLoadingModal();
      toast.error(error.message);
    }
  };

  const processSignedTransaction = async (event) => {
    const payloadUuid = event.payload_uuidv4;
    try {
      setCurrentStep(1);
      const check = await fetch(`${import.meta.env.VITE_SERVER_URL}/get-payload?uuid=${payloadUuid}`);
      const checkData = await check.json();
      const hex = checkData.result.response.hex;

      const checkSign = await fetch(`${import.meta.env.VITE_SERVER_URL}/check-sign?hex=${hex}`);
      const checkSignData = await checkSign.json();

      if (checkSignData.result.xrpAddress === address) {
        setCurrentStep(2);
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/stake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txid: event.txid, address, amount, option: stakeOptions.find(o => o.selected).id }),
        });
        const data = await res.json();
        if (data.status !== 200) {
          toast.error(data.error);
          closeLoadingModal();
          return;
        }
        toast.success("Staking completed successfully");
        resetForm();
        getTokenAmount(address);
        await fetchStakingHistory();
      } else {
        toast.error("Invalid signature");
        closeLoadingModal();
      }
    } catch (error) {
      toast.error(error.message);
      closeLoadingModal();
    }
  };

  const resetForm = () => {
    setAmount("");
    setOptions(prev => prev.map(option => { option.selected = false; return option; }));
  };

  const onStake = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || isNaN(amount) || amount < MIN_STAKING_AMOUNT || amountToken - amount < 0) {
      toast.error("Invalid staking amount");
      return;
    }

    await stakeFunds();
  };

  return (
    <DashboardLayout className="home-box">
      <LoadingModal open={openLoading} steps={steps} currentStep={currentStep} />
      <Grid container spacing={2} justifyContent={"center"} className="staking-container">
        <Box className="card">
          <Box className="card-header">
            <Box className={`wallet-status ${amountToken > 0 ? 'active' : 'inactive'}`}>
              <Box className="wallet-info">
                <Typography className="wallet-address-title">{address?  "Your Wallet Information" : 'Please connect your wallet'}</Typography>
                <Typography className="wallet-address">{address}</Typography>
                <Typography className="wallet-balance">{amountToken} AAX</Typography>
              </Box>
              <Box className="wallet-actions">
                {/* <Button className="btn-get" onClick={() => {
                  if (address) {
                    return;
                  } else {
                    connectWallet();
                  }
                }}>
                {address? 'Get AAX' : "Connect Wallet"}</Button> */}
                {/* <Typography className="help-tooltip" title="You need to activate your Xaman wallet before staking.">
                  ℹ️
                </Typography> */}
              </Box>
            </Box>
          </Box>

          <Box className="card-body">
            <Box className="input-group">
              <Input
                value={amount}
                onChange={onAmountChange}
                className={isValidAmount ? "amount-input" : "amount-input invalid"}
              />
              {!isValidAmount ? (
                <Typography color={"#fd3b3b"}>Invalid Staking Amount</Typography> ): 
                (<></>)
              }
              <Box className="btn-max" onClick={onMaxClick} component="div" role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && onMaxClick()}>
                MAX
              </Box>
            </Box>

            <Box className="stake-options">
              {options.filter(s => s.visibility === 1).map((option, index) => (
                <Grid container key={option.id} className={`stake-option ${option.selected ? "selected" : ""}`} onClick={() => onOptionSelected(index)}>
                  <Grid item xs={4}>
                    <Typography className="column-title">Duration</Typography>
                    <Typography className="column-value">{option.duration} Month{option.duration === 1 ? "" : "s"}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography className="column-title">Reward</Typography>
                    <Typography className="column-value">{option.reward_percentage}%</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography className="column-title">Receive</Typography>
                    <Typography className="column-value">{option.receive} AAX</Typography>
                  </Grid>
                </Grid>
              ))}
            </Box>
            <Box>
              <Button className="btn-stake" onClick={onStake}>Stake</Button>
            </Box>
          </Box>
        </Box>
        <Box className="card">
          <Box className="card-header" display={"flex-row"}>
            <Box display="flex-col" className="history-header" alignItems="center">
              <Box display="flex-col" alignItems="center">
                <Typography className="card-title">Staking History</Typography>
                <Typography className="card-subtitle">Your staking history</Typography>
              </Box>
              <Box display="flex-row" className="history-search-filterbox" alignItems="center" mb={2}>
                <Tabs value={selectedTab} width={"100%"} onChange={(e, newValue) => setSelectedTab(newValue)} className='tab-container'>
                  <Tab label="All" value="all" className={`tab-item${selectedTab === 'all'? '-selected': ''}`} />
                  <Tab label="Active" value="active" className={`tab-item${selectedTab === 'active'? '-selected': ''}`}/>
                  <Tab label="Completed" value="completed" className={`tab-item${selectedTab === 'completed'? '-selected': ''}`}/>
                </Tabs>
                <FormControl size="small">
                  <Select 
                    value={selectedTimeRange} 
                    onChange={handleTimeRangeChange} 
                    label="Time" 
                    className='select-time-range' 
                    sx={
                      {
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent', // removes the blue border
                        },
                        '&:focus': {
                          outline: 'none',
                        }
                      }
                    }>
                    <MenuItem value="all" className='time-range' >All</MenuItem>
                    <MenuItem value="7" className='time-range'>Last 7 Days</MenuItem>
                    <MenuItem value="30" className='time-range'>Last 30 Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          <Box className="card-body" height={"100%"}>
            <StakingHistoryTable data={stakingHistory} txStatus={selectedTab} timeRange={selectedTimeRange} currentPage={currentPage} setCurrentPage={setCurrentPage} address={address}/>
          </Box>
        </Box>
      </Grid>  
    </DashboardLayout>
  );
}
