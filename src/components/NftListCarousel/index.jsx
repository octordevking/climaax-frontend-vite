import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { shortenStr, getUrlFromEncodedUri } from "../../utils";
import "./style.scss"; // Import external styles

const NftListCarousel = () => {
    const { nfts } = useAppContext();
    const [nftMetadata, setNftMetadata] = useState({});

    useEffect(() => {
        const fetchMetadata = async () => {
            const metadataMap = {};
            await Promise.all(
                nfts.map(async (nft) => {
                    const metadataUrl = getUrlFromEncodedUri(nft.uri);
                    try {
                        const response = await fetch(metadataUrl);
                        const data = await response.json();
                        metadataMap[nft.nft_id] = {
                            name: data.name || "Unknown NFT",
                            image: data.image ? `https://ipfs.io/ipfs/${data.image.split("ipfs://")[1]}` : null,
                        };
                    } catch (error) {
                        console.error(`Failed to fetch metadata for NFT ${nft.nft_id}`, error);
                        metadataMap[nft.nft_id] = { name: "Unknown NFT", image: null };
                    }
                })
            );
            setNftMetadata(metadataMap);
        };

        if (nfts.length > 0) fetchMetadata();
    }, [nfts]);

    return (
        <Box className="nft-carousel">
            <motion.div
                className="nft-slider"
                animate={{ x: ["0%", "-100%"] }}
                transition={{
                    ease: "linear",
                    duration: 20,
                    repeat: Infinity,
                }}
            >
                {[...nfts, ...nfts].map((nft, index) => {
                    const metadata = nftMetadata[nft.nft_id] || {};
                    return (
                        <Box key={`${nft.nft_id}-${index}`} className="nft-slide">
                            <img src={metadata.image} alt={metadata.name} className="nft-image" />
                            <Box className="nft-details">
                                <Typography className="nft-name">{metadata.name}</Typography>
                                <Typography className="nft-id">{shortenStr(nft.nft_id, 10)}</Typography>
                            </Box>
                        </Box>
                    );
                })}
            </motion.div>
        </Box>
    );
};

export default NftListCarousel;
