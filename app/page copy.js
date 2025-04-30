"use client";
import Main from "./Main.jsx";
import Head from "next/head.js";
import React from "react";

export default function Home() {
  return (
    <>
      <Head>
      <link rel="manifest" href="/manifest.json" />

        <title>Attendance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400&amp;display=swap"
          rel="stylesheet"
        />
        {/* Open Graph meta tags */}
        <meta property="og:title" content="Rescue Zone | DVBS 2024" />
        <meta property="og:image" content="https://dvbs.vercel.app/target.png" />
        {/* Add more Open Graph meta tags as needed */}
      </Head>

      <div>
        <Main />
      </div>
    </>
  );
}
