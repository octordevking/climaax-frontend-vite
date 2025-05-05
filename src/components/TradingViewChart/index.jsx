
import { CandlestickSeries, createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import './style.scss'

export default function TradingViewChart ({data})  {
    const chartContainerRef = useRef();
    const backgroundColor = '#1a1a1a';
    const textColor = 'white';
    useEffect( () => {
        if (!data) {
            return;
        }
        if(data.length === 0){
            return;
        }

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
                
            },
            grid:{
                vertLines: {
                    color: '#aaa',
                    style: 1,
                },
                horzLines: {
                    color: '#aaa',
                    style: 1,
                }
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });

        chart.timeScale().fitContent();

        const newSeries = chart.addSeries(CandlestickSeries, 
        { 
            wickUpColor: 'rgb(54, 116, 217)',
            upColor: 'rgb(54, 116, 217)',
            wickDownColor: 'rgb(225, 50, 85)',
            downColor: 'rgb(225, 50, 85)',
            borderVisible: false,
        });
        newSeries.setData(data);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div className='trading-chart'
            ref={chartContainerRef}
        />
    );
};

