import React from 'react'
import "./style.scss"
import { Box } from '@mui/material'
import XummIcon from "../../assets/images/xumm.png"

export default function ImageButton(props) {
    return (
        <Box {...props} className="imagebtn-container">
            <Box className="btn-wrapper">
                <img src={XummIcon} alt="" />
            </Box>
        </Box>
    )
}
