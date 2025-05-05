import React from 'react';
import Link from '../Link';
import { Box } from '@mui/material';

export default function Image({ src, alt, href, className }) {

    return (
        <Box className={className} sx={{ display: 'flex', alignItems: 'center' }}>
            {href ?
                <Link href={href}>
                    <img style={{ width: '100%' }} src={src} alt={alt ?? 'Image'} />
                </Link> :
                <img style={{ width: '100%' }} src={src} alt={alt ?? 'Image'} />
            }
        </Box>
    );
}
