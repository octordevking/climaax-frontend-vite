import React, {useContext, useState, useEffect} from 'react';
import { Modal, Box, Typography, IconButton, Grid } from '@mui/material';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import UsbIcon from '@mui/icons-material/Usb';
import CloseIcon from '@mui/icons-material/Close';
import { connectLedgerWallet, connectWallet } from '../../utils';
import LoadingModal from '../LoadingModal';
import { useAppContext } from '../../context/AppContext';
import './index.scss';

const ModeSelectionModal = ({ open, onClose, setLedgerMode }) => {  
  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      className="wallet-modal" 
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      closeAfterTransition>
      <Box className="wallet-modal-box">
        <Box className="wallet-modal-header">
          <Typography variant="h6">Select Wallet</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={2} className="wallet-options">
          <Grid item xs={12}>
            <Box className="wallet-option" onClick={() => {setLedgerMode('bluetooth');}}>
              <BluetoothIcon />
              <Typography variant="body1">Bluetooth</Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box className="wallet-option" onClick={() => {setLedgerMode('usb');}}>
              <UsbIcon />
              <Typography variant="body1">USB</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}
export default function WalletModal({ open, onClose, onSelect }) {
  const wallets = [
    {
      name: 'Xaman',
      icon: 'https://apiv2.sologenic.org/file/static?filename=bG9nb3MveHVtbV9sb2dvLnBuZw==', // Update to actual icon path
      key: 'xaman',
    },
    {
      name: 'Ledger',
      icon: 'https://apiv2.sologenic.org/file/static?filename=bG9nb3MvbGVkZ2VyX2RldmljZV93YWxsZXQucG5n', // Update to actual icon path
      key: 'ledger',
    },
  ];
  
  const defaultSteps = [
    {
        label: 'Singing Request',
        subtitle: "Sign a transaction to connect a wallet",
        description: `This will generate QR code to sign a transaction. Please scan the QR code with your XUMM app.`,
        qr: true,
    },
    {
        label: 'Collecting sign information',
        description: `We are collecting sign transaction payload information. Please wait...`,
        tx: true,
    },
    {
        label: 'Verifying signed data',
        description: `You signed successfully. Please wait a moment to verify your signature.`,
    },
  ];

  const ledgerSteps = [
    {
        label: 'Connecting',
        description: `Connecting your hardware wallet. Please wait...`,
    },
    {
        label: 'Getting your address',
        description: `We are collecting your xrp address`,
        tx: true,
    },
    {
        label: 'Verifying signed data',
        description: `You signed successfully. Please wait a moment to verify your signature.`,
    },
  ];

  const [ledgerMode, setLedgerMode] = useState(null);
  
  const { setAddress, setWalletType } = useAppContext();
  
  const [steps, setSteps] = useState(defaultSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [openLoading, setOpenLoading] = useState(false);
  const [openMode, setOpenMode] = useState(false);

  useEffect(() => {
    if (ledgerMode) {
      console.log(`Ledger mode set to: ${ledgerMode}`);
      connectLedgerWallet(steps, setSteps, setCurrentStep, setOpenLoading, setAddress, setWalletType, ledgerMode);
      setOpenMode(false);
    }
  }, [ledgerMode]);

  onSelect = (key) => {
    if (key === 'xaman') {
      setSteps(defaultSteps);
      setCurrentStep(0);
      connectWallet(steps, setSteps, setCurrentStep, setOpenLoading, setAddress, setWalletType);
    } else if (key === 'ledger') {
      setSteps(ledgerSteps);
      setOpenMode(true);
      // setCurrentStep(0);
      // connectLedgerWallet(steps, setSteps, setCurrentStep, setOpenLoading, setAddress, setWalletType);
      console.log('Ledger wallet selected');
    }
    onClose();
  }

  return (
    <>  
      <Modal 
        open={open} 
        onClose={onClose} 
        className="wallet-modal" 
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        closeAfterTransition
      >
        <Box className="wallet-modal-box">
          <Box className="wallet-modal-header">
            <Typography variant="h6">Select Wallet</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Grid container spacing={2} className="wallet-options">
            {wallets.map((wallet) => (
              <Grid item xs={6} key={wallet.key}>
                <Box className="wallet-option" onClick={() => onSelect(wallet.key)}>
                  <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
                  <Typography variant="body1">{wallet.name}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Modal>
      <LoadingModal open={openLoading} onClose={() => setOpenLoading(false)} steps={steps} currentStep={currentStep} />
      <ModeSelectionModal open={openMode} setLedgerMode={setLedgerMode} onClose={() => setOpenMode(false)} />
    </>
  );
};
