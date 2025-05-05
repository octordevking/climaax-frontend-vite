import React, { useEffect, useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import LoadingIcon from "../../assets/images/loading.gif";
import LoadingQR from "../../assets/images/qr-loading.gif";
import { IconButton } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import Link from "../Link";
import './style.scss';
import { formatTransaction } from '../../utils';

const Subtitle = ({ tx, subtitle }) => {
    return (
        <Box>
            {tx ?
                // <Link href={`https://testnet.xrpl.org/transactions/${subtitle}`}>
                <Link href={`https://xrpscan.com/tx/${subtitle}`}>
                    <Typography variant="caption">Tx ID: {formatTransaction(subtitle)}</Typography>
                </Link>
                :
                <Typography variant="caption">{subtitle}</Typography>
            }
        </Box>
    );
}

export default function LoadingModal({ open, onClose, steps, currentStep }) {
    const [activeStep, setActiveStep] = useState(0);
    const [isQRLoading, setIsQRLoading] = useState(true);

    const handleImageLoad = () => {
        setIsQRLoading(false);
    };

    useEffect(() => {
        open && setIsQRLoading(true);
    }, [open])

    useEffect(() => {
        currentStep !== undefined && setActiveStep(currentStep);
    }, [currentStep]);

    return (
        <Modal
            className="modal-wrapper"
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            open={open}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: {
                    timeout: 500,
                },
            }}
        >
            <Fade in={open}>
                <Box className="modal-content">
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Stepper activeStep={activeStep} orientation="vertical">
                        {steps.map((step, index) => (
                            <Step key={step.label}>
                                <StepLabel
                                    sx={{ position: "relative" }}
                                    optional={
                                        index === activeStep ? (
                                            <>
                                                <img className='loading-indicator' src={LoadingIcon} alt="" />
                                                <Subtitle tx={step.tx} subtitle={step.subtitle} />
                                            </>
                                        ) : index < activeStep && step.subtitle ?
                                            <Subtitle tx={step.tx} subtitle={step.subtitle} />
                                            : null
                                    }
                                >
                                    {step.label}
                                </StepLabel>
                                <StepContent>
                                    <Box className="modal-box">
                                        {step.qr &&
                                            <Box className="modal-detail">
                                                {isQRLoading &&
                                                    <Box className="qrcode">
                                                        <img src={LoadingQR} alt="" />
                                                    </Box>
                                                }
                                                <Box className="qr">
                                                    <img src={step.qr_link} alt="qr_code" onLoad={handleImageLoad} />
                                                </Box>
                                            </Box>
                                        }
                                        <Typography className='description'>{step.description}</Typography>
                                    </Box>
                                </StepContent>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            </Fade>
        </Modal>
    );
}
