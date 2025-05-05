import React from 'react';
import { Modal, Box, Typography, IconButton, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './style.scss';

const WalletModal = ({ open, onClose, onSelect }) => {
  const wallets = [
    {
      name: 'Xaman',
      key: 'xaman',
    },
    {
      name: 'Ledger',
      key: 'ledger',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} className="wallet-modal">
      <Box className="wallet-modal-box">
        <div className="wallet-modal-header">
          <Typography variant="h6">Select Wallet</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <Grid container spacing={2} className="wallet-options">
          {wallets.map((wallet) => (
            <Grid item xs={6} key={wallet.key}>
              <div className="wallet-option" onClick={() => onSelect(wallet.key)}>
                <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
                <Typography variant="body1">{wallet.name}</Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Modal>
  );
};

export default WalletModal;
