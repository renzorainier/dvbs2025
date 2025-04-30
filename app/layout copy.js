// src/app/layout.js

// import "./globals.css";
// import { Urbanist } from 'next/font/google';
// import RootLayout from './RootLayout';

// const inter = Urbanist({ subsets: ['latin'] });

// export const metadata = {
//   title: "Attendance Log",
//   description: "Just another project",
// };

// export default function Layout({ children }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <RootLayout>{children}</RootLayout>
//       </body>
//     </html>
//   );
// }









import "./globals.css";
import { Urbanist } from 'next/font/google'

const inter = Urbanist({ subsets: ['latin'] })

export const metadata = {
  title: "Rescue Zone | DVBS 2024",
  description: "Metro View Baptist Church",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} >{children}</body>
      <link rel="manifest" href="/manifest.json" />

    </html>
  );
}
