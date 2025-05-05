import React, { useEffect, useState, createContext, useContext } from 'react';
// import * as ReactDOM from "react-dom/client";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { ThirdwebProvider } from 'thirdweb/react';
// import reportWebVitals from './reportWebVitals';
import '../index.css';
import "../global.scss";
// import Home from "./pages/staking";
import { Toaster, toast } from 'react-hot-toast';
import { getAddress, getVerifiedXRPNftsOfAccount, round, getValidatedNfts, fetchPoolInfo } from '../utils';
// import Swap from './pages/swap';
// import Verifying from './pages/verify-nft';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [address, setAddress] = useState(getAddress);
  const [amountToken, setAmountToken] = useState(0);
  const [trustLine, setTrustLineStatus] = useState(false);
  const [amountXrp, setAmountXrp] = useState(0);
  const [stakeOptions, setStakeOptions] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [userVerifiedNfts, setUserVerifiedNfts] = useState([]);
  const [poolInfo, setPoolInfo] = useState({});
  const [walletType, setWalletType] = useState(null);

  const fetchData = async (url, errorMessage, callback) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== 200) {
        toast.error(data.error || errorMessage);
        return null;
      }
      callback(data.result);
    } catch (error) {
      console.error(errorMessage, error);
      toast.error(errorMessage);
    }
  };

  const getPoolInfo = async () => {
    const poolInfo = await fetchPoolInfo();
    setPoolInfo(poolInfo);
  }


  const getTokenAmount = async (address) => {
    if (!address) return;
    await fetchData(
      `${import.meta.env.VITE_SERVER_URL}/account?address=${address}`,
      "Can't read account balance.",
      (result) => {
        setTrustLineStatus(result.trustline);
        setAmountToken(round(result.aax.balance));
        setAmountXrp(parseFloat(result.xrp) / 10 ** 6);
      }
    );
  };

  const getStakeOptions = async () => {
    await fetchData(
      `${import.meta.env.VITE_SERVER_URL}/stake/options`,
      "Can't read stake options",
      setStakeOptions
    );
  };

  const fetchNfts = async () => {
    try {
      const nftList = await getValidatedNfts(0, 15);
      setNfts(nftList);
    } catch (error) {
      console.error("Error fetching NFT list", error);
    }
  };

  const fetchUserVerifiedNfts = async () => {
    try {
      const nftList = await getVerifiedXRPNftsOfAccount(address);
      setUserVerifiedNfts(nftList);
    } catch (error) {
      console.error("Error fetching user verified NFTs", error);
    }
  };

  useEffect(() => {
    fetchNfts();
    getStakeOptions();
    getPoolInfo();
  }, []);

  useEffect(() => {
    if (!address) {
      setUserVerifiedNfts([]);
      setAmountToken(0);
      setAmountXrp(0);
      setTrustLineStatus(false);
      return;
    }
    getTokenAmount(address);
    fetchUserVerifiedNfts();
  }, [address]);

  return (
    <AppContext.Provider
      value={{ 
        address,
        setAddress,
        amountToken,
        setAmountToken,
        stakeOptions,
        setStakeOptions,
        nfts,
        setNfts,
        userVerifiedNfts,
        setUserVerifiedNfts,
        amountXrp,
        setAmountXrp,
        trustLine,
        setTrustLineStatus,
        getTokenAmount,
        poolInfo,
        walletType,
        setWalletType
      }}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            overflow: 'hidden',
            maxWidth: '400px',
            borderRadius: '8px',
            padding: '12px',
            margin: '8px',
            fontSize: '16px',
            minHeight: '70px',
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: { background: '#22c55e', color: '#fff' },
          },
          error: {
            duration: 3000,
            style: { background: '#ef4444', color: '#fff' },
          },
        }}
      />
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);