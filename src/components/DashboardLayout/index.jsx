import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Appbar from '../Appbar';
import "./style.scss";

export default function DashboardLayout(props) {
    const { children, className, ...restProps } = props;
    const location = useLocation();

    // Define your page data
    const pageData = {
        '/verify-nft': {
            title: 'NFT Verification',
            description: 'Verify your A.A. NFT holdings monthly for AAX payouts.'
        },
        '/staking': {
            title: 'AAX Staking',
            description: 'Stake your AAX and gain extra AAX rewards.'
        },
        '/swap': {
            title: 'Get AAX',
            description: 'Use our swapping tool to swap XRP to AAX.'
        }
    };

    const currentPage = pageData[location.pathname] || {
        title: 'Dashboard',
        description: 'Welcome to your dashboard.'
    };

    return (
        <Box {...restProps}>
            <Sidebar />
            <Appbar title={currentPage.title} description={currentPage.description} />
            <Box className="main-layout">
                <Box className={className}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
