import { Box } from '@mui/material'
import React from 'react'

export default function CenterBox(props) {
    const { children, sx } = props;
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", ...sx }} {...props}>
            {children}
        </Box>
    )
}
