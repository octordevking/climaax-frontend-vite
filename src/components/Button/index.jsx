import React from 'react'
import "./style.scss"
import { Box, Typography } from '@mui/material'
import StarIcon from "../../assets/images/star-icon.png"

export default function Button(props) {
    const { text } = props;
    return (
        <Box {...props} className={`btn-container ${props?.className}`}>
            <Box className="btn-wrapper">
                <img src={StarIcon} alt="" />
                <Typography className='btn-label'>{text}</Typography>
            </Box>
        </Box>
    )
}
