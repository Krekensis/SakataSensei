import React from 'react';

interface SVGProps {
    name: string;
    size?: string;
    className?: string;
}

const icons: Record<string, string> = {
    checkmark: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`,
    cross: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`,
    import: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2m-8 1V4m0 12-4-4m4 4 4-4"/>`,
    logout: `<path d="M17 16l4-4m0 0l-4-4m4 4H7" /><path d="M12 20H6a3 3 0 01-3-3V7a3 3 0 013-3h6" />`,
    anilist: `<path d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"/>`,
    mal: `<path d="M8.45 15.91H6.067v-5.506h-.028l-1.833 2.454-1.796-2.454H2.39v5.507H0V6.808h2.263l1.943 2.671 1.98-2.671H8.45zm8.499 0h-2.384v-2.883H11.96c.008 1.011.373 1.989.914 2.884l-1.942 1.284c-.52-.793-1.415-2.458-1.415-4.527 0-1.015.211-2.942 1.638-4.37a4.809 4.809 0 0 1 2.737-1.37c.96-.15 1.936-.12 2.905-.12l.555 2.051H15.48c-.776 0-1.389.113-1.839.337-.637.32-1.009.622-1.447 1.78h2.372v-1.84h2.384zm3.922-2.05H24l-.555 2.05h-4.962V6.809h2.388z"/>`,
    menu: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />`,
    close: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`,
    home: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
    search: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />`,
    star: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />`,
    loader: `<path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" /> <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>`
};

const SVG: React.FC<SVGProps> = ({ name, size = "w-5 h-5", className = "" }) => {
    const iconPath = icons[name];
    const isFilled = ['anilist', 'mal', 'loader'].includes(name);

    if (iconPath) {
        return (
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`${size} ${className}`} 
                fill={isFilled ? "currentColor" : "none"}
                viewBox="0 0 24 24" 
                stroke={isFilled ? "none" : "currentColor"}
                role="img"
                strokeWidth={isFilled ? "0" : "2"}
                strokeLinecap={isFilled ? undefined : "round"}
                strokeLinejoin={isFilled ? undefined : "round"}
                dangerouslySetInnerHTML={{ __html: iconPath }}
            />
        );
    }

    return <div className={`${size} ${className} bg-gray-400 rounded`}></div>;
};

export default SVG;
