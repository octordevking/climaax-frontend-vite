import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import LogoImage from "../../assets/images/logo.png";
import Image from '../Image';
import "./style.scss";
import CenterBox from '../CenterBox';

export default function Sidebar() {
    const location = useLocation();

    const menuItems = [
        { path: '/verify-nft', label: 'nft verification', icon: 'wallet', title: 'NFT Verification', descritpion: 'Verify your A.A. NFT holdings monthly for AAX payouts' },
        { path: '/staking', label: 'AAX Staking', icon: 'stake', title: 'AAX Staking', descritpion: 'Stake your AAX and gain extra AAX rewards.' },
        { path: '/swap', label: 'Get AAX', icon: 'swap', title: 'Get AAX', descritpion: ' Use our swapping tool to swap XRP to AAX' },
    ];

    return (
        <Box className="sidebar-container">
            <CenterBox className="logo">
                <Image href="/" src={LogoImage} />
            </CenterBox>
            <List component="nav" className='menu-wrapper'>
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link to={item.path} key={item.path}>
                            <ListItemButton className={`menu-item ${isActive ? "active" : ""}`}>
                                <ListItemIcon className='menu-icon'>
                                    <Image src={`icons/${item.icon}${isActive ? "_active" : ""}.svg`} />
                                </ListItemIcon>
                                <ListItemText primary={item.label} className='menu-text' />
                            </ListItemButton>
                        </Link>
                    );
                })}
            </List>
        </Box>
    );
}
