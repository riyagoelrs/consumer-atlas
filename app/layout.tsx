import type { Metadata } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/libre-caslon-display/400.css';
import './globals.css';
export const metadata:Metadata={title:'The Consumer Atlas — Culture, connected.',description:'An evolving research atlas of the connections between culture, consumer behavior and commerce.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
