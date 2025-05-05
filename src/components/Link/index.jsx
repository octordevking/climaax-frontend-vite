import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function MyLink({ children, href }) {
    const navigate = useNavigate();

    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        window.scrollTo(0, 0);
        if (href && href.startsWith('http')) {
            window.open(href, '_blank');
        } else {
            navigate(href);
        }
    }

    return (
        <Link onClick={onClick}>{children}</Link>
    )
}
