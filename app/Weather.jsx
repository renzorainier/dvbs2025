import { useEffect, useState } from "react";
import Image from 'next/image';

const apiIds = [
  "189271b827844bff7388350c44848615",
  "4a7e550819cb999a4c6c4a42cd3d41f9",
  "cb840835313ce5b884987ce98fffbd89",
];

function Weather() {
  const defaultCity = "Antipolo";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shuffledApiIds = shuffleArray(apiIds);
        const response = await fetchWeatherData(defaultCity, shuffledApiIds);
        if (response && response.status === 200) {
          const result = await response.json();
          setData(result);
        } else {
          throw new Error("No valid response received from any API");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [defaultCity]);

  const fetchWeatherData = async (city, apiIds) => {
    for (const apiId of apiIds) {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiId}&units=metric`
      );
      if (response && response.status === 200) {
        return response;
      }
    }
    return null;
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  return (
    <div className="flex flex-col justify-center items-center">
      {!loading ? (
        data && (
          <div className="w-full rounded-lg" style={{ maxWidth: "90%" }}>
            <div className="bg-gradient-to-r text-white from-yellow-500 to-red-500 text-transparent rounded-lg shadow-lg p-1 flex flex-row items-center justify-center space-x-4">
              <h1 className="text-base font-bold text-center">{data.name}</h1>
              <Image
                src={`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div>|</div>
              <h1 className="text-base font-bold text-center">
                {data.weather[0].description}
              </h1>
              <h1 className="text-base font-bold text-center">
                {data.main.temp.toFixed()} °C
              </h1>
            </div>
          </div>
        )
      ) : (
        <div className="w-full rounded-lg" style={{ maxWidth: "90%" }}>
          <div className="bg-gradient-to-r text-white from-yellow-500 to-red-500 text-transparent rounded-lg shadow-lg p-1 flex flex-row items-center justify-center space-x-4">
            <div className="flex justify-center items-center p-4">Loading...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Weather;
