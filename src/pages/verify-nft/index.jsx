import React, { useContext, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Pagination,
  Checkbox
} from '@mui/material';
import toast from 'react-hot-toast';
import { useActiveWallet, useActiveWalletConnectionStatus } from "thirdweb/react";
import DashboardLayout from '../../components/DashboardLayout';
import { useAppContext } from '../../context/AppContext';
import {
  getUrlFromEncodedUri,
  getVerifiedSGBNftsOfAccount,
  xrpNftVerify,
  sgbNftVerify,
} from '../../utils';
import SongbirdWalletConnect from '../../components/ConnectSongbird';
import NftListCarousel from '../../components/NftListCarousel';

import './style.scss';

const InfoCard = ({ title, value }) => (
  <Card className="info-card">
    <CardContent>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

const NFTTable = ({ nfts, loading, tabIndex, currentPage, setCurrentPage, pageSize = 10 }) => {
  const totalPages = Math.ceil(nfts.length / pageSize);
  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlePageChange = (_, value) => setCurrentPage(value);

  return (
    <>
      {loading ? (
        <Box className="loading-container">
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <>
          <Typography variant="h6" className="table-title">Your NFTs</Typography>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="right" alignItems="right" mb={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: 'white',
                      backgroundColor: '#333',
                      border: '1px solid #555',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#1976d2',
                      color: '#fff',
                    },
                  }}
                />
            </Box>
          )}
          <TableContainer className="nft-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>NFT</TableCell>
                  <TableCell>Token ID</TableCell>
                  <TableCell>Holding Points</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedNFTs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No NFTs found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedNFTs.map((nft) => (
                    <TableRow key={nft.id}>
                      <TableCell className="nft-name-cell">
                        <div className="nft-name-wrapper">
                          <img src={nft.image} alt={nft.name} className="nft-image" />
                          <span className="nft-name">{nft.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="nft-id-cell">
                        <a
                          href={
                            tabIndex === 0
                              ? `https://xrplexplorer.com/en/nft/${nft.id}`
                              : `https://xhaven.io/item/songbird/${nft.id}/`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nft-id-link"
                        >
                          {nft.id}
                        </a>
                      </TableCell>
                      <TableCell>{nft.points}</TableCell>
                      <TableCell>{nft.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
};

export default function Dashboard() {
  const wallet = useActiveWallet();
  const status = useActiveWalletConnectionStatus();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sgbVerifiedNfts, setVerifiedSgbNfts] = useState([]);
  const [formattedNfts, setFormattedNfts] = useState([]);
  const [formattedSgbNfts, setFormattedSgbNfts] = useState([]);
  const [totalXRPPoints, setTotalXRPPoints] = useState(0);
  const [totalSgbPoint, setTotalSgbPoint] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { userVerifiedNfts, address, poolInfo } = useAppContext();
  const calculateTotalPoints = (nfts) => nfts?.calculatedPoints?.totalPoints || 0;

  const getIpfsUrl = (ipfsUri) => {
    const hash = ipfsUri.replace('ipfs://', '');
    const gateways = [
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://nftstorage.link/ipfs/${hash}`
    ];
    return gateways;
  };

  const resolveFirstWorkingImage = async (ipfsUri) => {
    const urls = getIpfsUrl(ipfsUri);
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'HEAD' }); // Only check if accessible
        if (res.ok) return url;
      } catch (e) {
        console.warn(`Image fetch failed from: ${url}`, e);
      }
    }
    return null;
  };

  const fetchWithFallback = async (urls) => {
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn(`Failed to fetch from: ${url}`, e);
      }
    }
    throw new Error('All IPFS gateways failed');
  };

  const processNfts = async (nfts, isSgb = false) => {
    if (!nfts || nfts.error) return [];
  
    if (isSgb) {
      return nfts.account_nfts.map((nft) => ({
        id: `${nft.contract_address}_${nft.nft_id}`,
        name: nft.name,
        image: nft.image_url,
        points: nft.points,
        status: nft.isVerified ? 'Verified ✅' : 'Not Verified ❌',
      }));
    }
  
    setLoading(true);
  
    const concurrencyLimit = 5;
    const results = [];
    const executing = [];
  
    for (const nft of nfts.account_nfts) {
      const p = (async () => {
        const decodedUrl = nft.uri?.startsWith('ipfs://') ? getIpfsUrl(nft.uri) : [getUrlFromEncodedUri(nft.uri)];
        let metadata = {};
  
        try {
          metadata = await fetchWithFallback(decodedUrl);
        } catch (err) {
          console.warn('Metadata fetch failed:', nft.nft_id, err);
        }
        
        let image = metadata?.image || '';
        
        if (image.startsWith('ipfs://')) {
          image = await resolveFirstWorkingImage(image);
        }
    
        return {
          id: nft.nft_id,
          name: metadata?.name || 'Unnamed NFT',
          image,
          points: nft.points || 0,
          status: nft.isVerified ? 'Verified ✅' : 'Not Verified ❌',
        };
      })();
  
      results.push(p);
  
      if (concurrencyLimit <= nfts.account_nfts.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= concurrencyLimit) {
          await Promise.race(executing);
        }
      }
    }
  
    const processedNfts = await Promise.all(results);
  
    setLoading(false);
    return processedNfts;
  };
  

  const verifyXrpNfts = async (address, nfts) => {
    if (!address) return;

    const points = calculateTotalPoints(nfts);
    const res = await xrpNftVerify(address, (points > 0), points);
    console.log('XRP NFT verification response:', res);
  };

  const verifySgbNfts = async (address, nfts, xrpAddress) => {
    console.log('Verifying SGB NFTs...', address, nfts, xrpAddress);
    if (!address) return;

    const points = calculateTotalPoints(nfts);
    console.log('SGB NFT points:', points);
    const res = await sgbNftVerify(address, points, xrpAddress);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    console.log('SGB NFT verification response:', res);
  }

  useEffect(() => {
    if (userVerifiedNfts?.account_nfts) {
      processNfts(userVerifiedNfts).then(setFormattedNfts);
      verifyXrpNfts(address, userVerifiedNfts);
    }
    setTotalXRPPoints(calculateTotalPoints(userVerifiedNfts));
  }, [userVerifiedNfts]);

  useEffect(() => {
    if (sgbVerifiedNfts?.account_nfts && status === 'connected') {
      processNfts(sgbVerifiedNfts, true).then(setFormattedSgbNfts);
      setTotalSgbPoint(calculateTotalPoints(sgbVerifiedNfts));
      verifySgbNfts(wallet.getAccount().address, sgbVerifiedNfts, address);
    }
  }, [sgbVerifiedNfts]);

  useEffect(() => {
    const fetchSgbNfts = async () => {
      if (status !== 'connected') {
        setVerifiedSgbNfts([]);
        return;
      }
      const nfts = await getVerifiedSGBNftsOfAccount(wallet.getAccount().address);
      if (!nfts || nfts.error) {
        toast.error('Failed to fetch SGB NFTs');
        setVerifiedSgbNfts([]);
        return;
      }
      setVerifiedSgbNfts(nfts);
    };
    fetchSgbNfts();
  }, [status]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, [tabIndex]);

  return (
    <DashboardLayout className="dashboard-container">
      <Box className="dashboard-header">
        {/* <NftListCarousel /> */}
        <Tabs
          value={tabIndex}
          onChange={(_, newIndex) => setTabIndex(newIndex)}
          variant="fullWidth"
          className="dashboard-tabs"
        >
          <Tab label="XRP Ledger" className={tabIndex === 0 ? 'dashboard-tab-active' : 'dashboard-tab'} />
          <Tab label="Songbird" className={tabIndex === 1 ? 'dashboard-tab-active' : 'dashboard-tab'} />
        </Tabs>
        <Box className="wallet-section" alignItems="center">
          {tabIndex === 0 ? (
            <></>
          ) : (
            <SongbirdWalletConnect className="btn-wallet" />
          )}
        </Box>
      </Box>
      <Grid container spacing={2} justifyContent="center" className="info-section">
        <Grid item xs={12} md={6}>
          <InfoCard title="Total Holding Points" value={(totalXRPPoints + totalSgbPoint).toFixed(2)} />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoCard
            title="Estimated Monthly Rewards"
            value={`${poolInfo.totalPoints === 0 ? '0.00' : ((totalSgbPoint + totalXRPPoints) / poolInfo?.totalPoints * 0.01 * poolInfo.poolAmount).toFixed(2)} AAX`}
          />
        </Grid>
      </Grid>
      <NFTTable
        nfts={tabIndex === 0 ? formattedNfts : formattedSgbNfts}
        loading={loading}
        tabIndex={tabIndex}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </DashboardLayout>
  );
}
