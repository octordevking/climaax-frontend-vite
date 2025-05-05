import { useEffect, useState } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Pagination } from '@mui/material';
import { round, shortenStr } from '../../utils';
import moment from "moment-timezone";

export default function StakingHistoryTable ({ data, txStatus, timeRange, currentPage, setCurrentPage, pageSize = 10, address}){
    
    const [currentTime, setCurrentTime] = useState(moment().tz("Africa/Abidjan"));

    useEffect(() => {
        const interval = setInterval(() => {
            const now = moment().tz("Africa/Abidjan");
            setCurrentTime(now);
        }, 1000);
        return () => clearInterval(interval);
    }, [])

    const totalPages = Math.ceil(data.length / pageSize);
    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const filteredData = data.filter(row => {
        if (txStatus === "all") return true;
        if (txStatus === "active") return row.flag === 0 ;  
        if (txStatus === "completed") return row.flag === 1;
    });

    const filteredByTimeRange = filteredData.filter(row => {
        const rowTime = new Date(row.created_at);
        if (timeRange === "all") return true;
        if (timeRange === "7") {
        const sevenDaysAgo = moment().add(-7, "days");
        return rowTime >= sevenDaysAgo;
        }
        if (timeRange === "30") {
        const thirtyDaysAgo = moment().add(-1, "months");
        return rowTime >= thirtyDaysAgo;
        }
    });

    const paginatedData = filteredByTimeRange.slice(0, 10); // Adjust the slice as needed for pagination
    
    return (
        <Box>
        <TableContainer className='history-table'>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Txn Hash</TableCell>
                <TableCell>Stake Amt</TableCell>
                <TableCell>Stake Opt</TableCell>
                <TableCell>Reward</TableCell>
                <TableCell>Reward Rate</TableCell>
                <TableCell>Unlock time</TableCell>
                <TableCell>Received Amt</TableCell>
                </TableRow>
            </TableHead>
            { paginatedData.length === 0 ?
                (
                <TableBody>
                    <TableRow>
                    <TableCell colSpan={7} align="center">{ address ? 'No Stake Log Found.' : 'Connect your wallet to see Staking Logs'}</TableCell>
                    </TableRow>
                </TableBody>
                ) :
                (<TableBody>
                {paginatedData.map((row) => (
                    <TableRow key={row.trx_hash}>
                    <TableCell>
                        <a 
                        href={`https://xrpscan.com/tx/${row.trx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        {shortenStr(row.trx_hash,10)}
                        </a>
                    </TableCell>
                    <TableCell>{round(row.amount, 2)}{" "}AAX</TableCell>
                    <TableCell>{row.duration}{` Month${row.duration === 1 ?'':'s'}`}</TableCell>
                    <TableCell>{round(row.amount * (1 + row.reward_percentage / 100), 5)}{" "}AAX</TableCell>
                    <TableCell>{row.reward_percentage}%</TableCell>
                    <TableCell>
                        {(() => {
                            const end = moment(row.created_at).add(row.duration, 'months');

                            if (currentTime.isAfter(end)) {
                            return 'Released';
                            }

                            const duration = moment.duration(end.diff(currentTime));
                            const years = duration.years();
                            const months = duration.months();
                            const days = duration.days();

                            if (years >= 1) {
                                return `${years} year${years > 1 ? 's' : ''} ${months} mo left`;
                            } else if (months >= 3) {
                                return `${months} mo left`;
                            } else if (months >= 1) {
                                return `${months} mo ${days} days left`;
                            } else {
                                return `${Math.ceil(duration.asDays())} days left`;
                            }
                        })()}
                    </TableCell>
                    <TableCell>{isNaN(row.received_amount)? '0' : round(row.received_amount)} {" "}AAX</TableCell>
                    </TableRow>
                ))}
                </TableBody>)            
            }
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
        </Box>
    );
}