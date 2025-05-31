import React from 'react';
import Image from 'next/image';
import whaleGif from './whale.gif';

function Whale() {
  return (
    <div className="relative w-96 h-auto mx-auto my-10">
      <Image
        src={whaleGif}
        alt="A looping animated whale"
        width={400}
        height={300}
        className="w-full h-auto object-contain rounded-lg shadow-xl transition-all duration-300 ease-in-out hover:scale-105"
        unoptimized={true}
      />
    </div>
  );
}

export default Whale;
