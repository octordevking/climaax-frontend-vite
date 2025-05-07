import React, { useContext, useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import "./style.scss";
import LogoutIcon from '@mui/icons-material/Logout';
import CenterBox from '../CenterBox/index';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAppContext } from '../../context/AppContext';
import { formatAddress } from '../../utils';
import WalletModal from '../WalletModal';
import toast from 'react-hot-toast';

export default function WalletButton() {
    const { address, setAddress, amountToken, setAmountToken, setWalletType } = useAppContext();
    const [modalOpen, setModalOpen] = useState(false);

    const onLogout = (e) => {
        e.stopPropagation();
        localStorage.removeItem('address');
        localStorage.removeItem('walletType');
        setAddress(null);
        setAmountToken(0);
        setWalletType(null);
    }

    const onCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(address);
        toast.success("Copied");
    }

    return (
        <Box className="wallet-container">
            {!address ?
                <Button className="btn-connect-wallet">
                    <AccountBalanceWalletIcon fontSize='small' />
                    <Typography onClick={() => setModalOpen(true)}>Connect Wallet</Typography>
                </Button> :
                <Box className="account-container">
                    <CenterBox>
                        <Typography className='hold-amount'>{amountToken || "0.0"} AAX</Typography>
                    </CenterBox>
                    <Button className="account-wrapper" onClick={onCopy}>
                        <Typography className='address'>{formatAddress(address)}</Typography>
                        <Box className="logout" onClick={onLogout}>    
                            <LogoutIcon />
                        </Box>
                    </Button>
                </Box>
            }
            <WalletModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </Box>
    )
}
