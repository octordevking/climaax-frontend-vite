import {useState, useEffect} from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Pagination } from '@mui/material';
import {shortenStr} from '../../utils';
import './style.scss';

function timeAgo(dateString) {
    const timestamp = new Date(dateString).getTime();
    const now = Date.now();
    const diff = now - timestamp;
  
    const seconds = Math.floor(diff / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s. ago`;
  
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min. ago`;
  
    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    if (hours < 24) {
      return remainingMin > 0
        ? `${hours}h. ${remainingMin}min ago`
        : `${hours}h. ago`;
    }
  
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
  
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return days < 30
      ? `${months}mo. ${remainingDays}d ago`
      : `${months}mo. ago`;
}

export default function TradeHistoryTable ({data, pageSize = 10}) {
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / pageSize);
    const [paginatedHistory, setPaginatedHistory] = useState([]);
    
    useEffect(() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    }, []);

    const handlePageChange = (event, value) => {
      setCurrentPage(value);
    };

    useEffect(()=> {
        setPaginatedHistory(data.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    }, [currentPage])

    return (
      <>
        {loading ? (
          <Box className="loading-container">
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <>
             {totalPages > 1 && (
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box >
                  <Typography variant="h6" className="table-title">Trade History</Typography>  
                </Box> {/* For spacing */}
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
            <TableContainer className="trade-history-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Buy/Sell</TableCell>
                    <TableCell>Amount(AAX)</TableCell>
                    <TableCell>Price(XRP)</TableCell>
                    <TableCell>Value(XRP)</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No Trade History found.</TableCell>
                    </TableRow>
                  ) : (
                    paginatedHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          {history.is_seller_taker? '🔴 Sell' : '🟢 Buy'}
                        </TableCell>
                        <TableCell>{parseFloat(history.amount).toFixed(2)}</TableCell>
                        <TableCell>{history.quote_amount}</TableCell>
                        <TableCell>{parseFloat(history.price).toFixed(5)}</TableCell>
                        <TableCell className='table-wallet-cell'>
                            <a href={`https://xpmarket.com/wallet/${history.buyer}`}>
                                {shortenStr(history.buyer, 10)}
                            </a>
                        </TableCell>
                        <TableCell className='table-wallet-cell'>
                            <a href={`https://xpmarket.com/wallet/${history.seller}`}>
                                {shortenStr(history.seller, 10)}
                            </a></TableCell>
                        <TableCell>{timeAgo(history.time)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
  
            {totalPages > 1 && (
              <Box display="flex" justifyContent="flex-end" mt={2}>
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
          </>
        )}
      </>
    );
};