



import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";
import { Menu } from "@headlessui/react";

const getDefaultSelectedDay = () => {
  const days = ["A", "B", "C", "D", "E"];
  const today = new Date().getDay();
  return days[today >= 1 && today <= 5 ? today - 1 : 4];
};

// const getDefaultSelectedDay = () => {
//   const today = new Date().getDay();
//   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// };

function AttendanceChart() {
  const [attendanceData, setAttendanceData] = useState({
    primary: {},
    middlers: {},
    juniors: {},
    youth: {},
  });
  const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay());
  const [previousAttendanceData, setPreviousAttendanceData] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    const shouldPlaySound = (previousData, newData, day) => {
      if (!previousData || !newData) return false;
      const previousCount = countPresentForDay(previousData, day);
      const newCount = countPresentForDay(newData, day);
      return newCount > previousCount;
    };

    const fetchAttendanceData = async () => {
      const documents = ["primary", "middlers", "juniors", "youth"];
      const listeners = {};

      for (const docName of documents) {
        const docRef = doc(db, "dvbs", docName);
        listeners[docName] = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const newData = doc.data();
            console.log(`Data for document ${docName}:`, newData); // Log the fetched data
            setAttendanceData((prevData) => {
              if (shouldPlaySound(prevData[docName], newData, selectedDay)) {
                playEnterSound();
              }
              return {
                ...prevData,
                [docName]: newData,
              };
            });
          } else {
            console.error(`Document ${docName} does not exist!`);
          }
        });
      }

      return () => {
        Object.values(listeners).forEach((unsubscribe) => unsubscribe());
      };
    };

    fetchAttendanceData();
  }, [selectedDay]);

  useEffect(() => {
    const renderChart = () => {
      const existingChart = Chart.getChart("attendanceChart");
      if (existingChart) {
        existingChart.destroy();
      }

      const datasets = Object.keys(attendanceData).map((docName, index) => {
        const data = countPresentForDay(attendanceData[docName], selectedDay);
        const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
        return {
          label: docName,
          data: [data],
          backgroundColor: colors[index],
        };
      });

      const ctx = document.getElementById("attendanceChart");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: [getDayLabel(selectedDay)],
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: `Attendance for ${getDayLabel(selectedDay)}`,
              font: {
                size: 18,
              },
            },
          },
          elements: {
            bar: {
              borderRadius: 10,
            },
          },
          scales: {
            x: {
              ticks: {
                display: false,
              },
            },
          },
        },
      });
    };

    if (attendanceData) {
      renderChart();
    }
  }, [attendanceData, selectedDay]);

  const countPresentForDay = (attendanceData, day) => {
    return Object.keys(attendanceData).filter((key) => {
      // Check if the key ends with the selected day and has a truthy value
      if (key.endsWith(day) && attendanceData[key]) {
        // Extract the prefix (index) part of the key
        const index = parseInt(key.substring(0, 3));
        // Ensure the index is a number between 1 and 99
        return !isNaN(index) && index >= 1 ;
      }
      return false;
    }).length;
  };

  // const countPresentForDay = (attendanceData, day) => {
  //   return Object.keys(attendanceData).filter(
  //     (key) => key.startsWith("0") && key.endsWith(day) && attendanceData[key]
  //   ).length;
  // };

  const getTotalAttendanceForDay = (day) => {
    return Object.keys(attendanceData).reduce((total, group) => {
      return total + countPresentForDay(attendanceData[group], day);
    }, 0);
  };

  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  const getDayLabel = (day) => {
    switch (day) {
      case "A":
        return "Monday";
      case "B":
        return "Tuesday";
      case "C":
        return "Wednesday";
      case "D":
        return "Thursday";
      case "E":
        return "Friday";
      default:
        return day;
    }
  };

  const playEnterSound = () => {
    const audio = new Audio("/point.wav");
    audio.play();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black">
      {/* Chart Section */}
      <div className="h-full md:w-1/2">
        <div className="bg-white rounded-lg p-4 shadow-lg w-full h-full">
          <canvas id="attendanceChart" className="w-full h-full"></canvas>
        </div>
      </div>

      {/* Values Section */}
      <div className="w-full md:w-1/2 flex flex-col items-center p-4">
        <Menu as="div" className="relative inline-block text-left mb-2">
          <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            {getDayLabel(selectedDay)}
          </Menu.Button>

          <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
              (day, index) => (
                <Menu.Item key={day}>
                  {({ active }) => (
                    <button
                      onClick={() =>
                        handleDayChange(String.fromCharCode(65 + index))
                      }
                      className={`${
                        active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                      } group flex rounded-md items-center w-full px-4 py-2 text-sm`}>
                      {day}
                    </button>
                  )}
                </Menu.Item>
              )
            )}
          </Menu.Items>
        </Menu>

        <div className="grid grid-cols-2 gap-4 w-full h-full py-3">
          {Object.keys(attendanceData).map((group, index) => (
            <div
              key={group}
              style={{
                backgroundColor: ["#FFC100", "#04d924", "#027df7", "#f70233"][
                  index
                ],
              }}
              className="h-full w-full flex flex-col items-center rounded-lg justify-center cursor-pointer p-4">
              <div className="text-5xl md:text-15xl text-white font-bold">
                {countPresentForDay(attendanceData[group], selectedDay)}
              </div>
              <div className="md:text-6xl text-4xl text-white font-bold">
                {group}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col items-center rounded-lg m-2 justify-center bg-gray-300 cursor-pointer">
          <div className="text-5xl md:text-15xl text-black font-bold">
            {getTotalAttendanceForDay(selectedDay)}
          </div>
          <div className="text-4xl md:text-4xl md:mb-4 text-black font-bold">
            Total
          </div>
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default AttendanceChart;



// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";

// function AttendanceChart() {
//   const targetData = {
//     primary: 39,
//     middlers: 63,
//     juniors: 79,
//     youth: 28,
//   };

//   const [currentData, setCurrentData] = useState({
//     primary: 0,
//     middlers: 0,
//     juniors: 0,
//     youth: 0,
//   });

//   const chartRef = useRef(null);

//   useEffect(() => {
//     const incrementCountForGroup = (group) => {
//       setCurrentData((prevData) => {
//         const newData = { ...prevData };
//         if (newData[group] < targetData[group]) {
//           newData[group]++;
//         }
//         return newData;
//       });
//     };

//     const setRandomIntervalForGroup = (group) => {
//       const randomDelay = Math.floor(Math.random() * 3 + 1) * 100;
//       return setTimeout(() => {
//         incrementCountForGroup(group);
//         setRandomIntervalForGroup(group);
//       }, randomDelay);
//     };

//     const intervals = Object.keys(currentData).map((group) => setRandomIntervalForGroup(group));

//     return () => intervals.forEach(clearTimeout);
//   }, [currentData]);

//   useEffect(() => {
//     const ctx = document.getElementById("attendanceChart");

//     if (chartRef.current) {
//       chartRef.current.data.datasets.forEach((dataset, index) => {
//         dataset.data[0] = currentData[dataset.label];
//       });
//       chartRef.current.update();
//     } else {
//       const datasets = Object.keys(currentData).map((docName, index) => {
//         const data = currentData[docName];
//         const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//         return {
//           label: docName,
//           data: [data],
//           backgroundColor: colors[index],
//         };
//       });

//       chartRef.current = new Chart(ctx, {
//         type: "bar",
//         data: {
//           labels: ["Attendance"],
//           datasets,
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               display: false,
//             },
//             title: {
//               display: true,
//               text: `Attendance`,
//               font: {
//                 size: 18,
//               },
//             },
//           },
//           elements: {
//             bar: {
//               borderRadius: 10,
//             },
//           },
//           scales: {
//             x: {
//               ticks: {
//                 display: false,
//               },
//             },
//           },
//           animation: {
//             duration: 0, // Disable animation for updates
//           },
//         },
//       });
//     }
//   }, [currentData]);

//   return (
//     <div className="flex flex-col md:flex-row h-screen w-screen bg-black">
//       {/* Chart Section */}
//       <div className="h-full md:w-1/2">
//         <div className="bg-white rounded-lg p-4 shadow-lg w-full h-full">
//           <canvas id="attendanceChart" className="w-full h-full"></canvas>
//         </div>
//       </div>

//       {/* Values Section */}
//       <div className="w-full md:w-1/2 flex flex-col items-center p-4">
//         <div className="grid grid-cols-2 gap-4 w-full h-full py-3">
//           {Object.keys(currentData).map((group, index) => (
//             <div
//               key={group}
//               style={{
//                 backgroundColor: ["#FFC100", "#04d924", "#027df7", "#f70233"][index],
//               }}
//               className="h-full w-full flex flex-col items-center rounded-lg justify-center cursor-pointer p-4"
//             >
//               <div className="text-5xl md:text-15xl text-white font-bold">
//                 {currentData[group]}
//               </div>
//               <div className="md:text-6xl text-4xl text-white font-bold">
//                 {group}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="w-full flex flex-col items-center rounded-lg m-2 justify-center bg-gray-300 cursor-pointer">
//           <div className="text-5xl md:text-15xl text-black font-bold">
//             {Object.values(currentData).reduce((total, count) => total + count, 0)}
//           </div>
//           <div className="text-4xl md:text-4xl md:mb-4 text-black font-bold">
//             Total
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AttendanceChart;









































































// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "./firebase.js";
// import { Menu } from "@headlessui/react";

// const getDefaultSelectedDay = () => {
//   const days = ["A", "B", "C", "D", "E"];
//   const today = new Date().getDay();
//   return days[today >= 1 && today <= 5 ? today - 1 : 4];
// };

// // const getDefaultSelectedDay = () => {
// //   const today = new Date().getDay();
// //   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// // };

// function AttendanceChart() {
//   const [attendanceData, setAttendanceData] = useState({
//     primary: {},
//     middlers: {},
//     juniors: {},
//     youth: {},
//   });
//   const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay());
//   const [previousAttendanceData, setPreviousAttendanceData] = useState({});
//   const audioRef = useRef(null);

//   useEffect(() => {
//     const shouldPlaySound = (previousData, newData, day) => {
//       if (!previousData || !newData) return false;
//       const previousCount = countPresentForDay(previousData, day);
//       const newCount = countPresentForDay(newData, day);
//       return newCount > previousCount;
//     };

//     const fetchAttendanceData = async () => {
//       const documents = ["primary", "middlers", "juniors", "youth"];
//       const listeners = {};

//       for (const docName of documents) {
//         const docRef = doc(db, "dvbs", docName);
//         listeners[docName] = onSnapshot(docRef, (doc) => {
//           if (doc.exists()) {
//             const newData = doc.data();
//             console.log(`Data for document ${docName}:`, newData); // Log the fetched data
//             setAttendanceData((prevData) => {
//               if (shouldPlaySound(prevData[docName], newData, selectedDay)) {
//                 playEnterSound();
//               }
//               return {
//                 ...prevData,
//                 [docName]: newData,
//               };
//             });
//           } else {
//             console.error(`Document ${docName} does not exist!`);
//           }
//         });
//       }

//       return () => {
//         Object.values(listeners).forEach((unsubscribe) => unsubscribe());
//       };
//     };

//     fetchAttendanceData();
//   }, [selectedDay]);

//   useEffect(() => {
//     const renderChart = () => {
//       const existingChart = Chart.getChart("attendanceChart");
//       if (existingChart) {
//         existingChart.destroy();
//       }

//       const datasets = Object.keys(attendanceData).map((docName, index) => {
//         const data = countPresentForDay(attendanceData[docName], selectedDay);
//         const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//         return {
//           label: docName,
//           data: [data],
//           backgroundColor: colors[index],
//         };
//       });

//       const ctx = document.getElementById("attendanceChart");
//       new Chart(ctx, {
//         type: "bar",
//         data: {
//           labels: [getDayLabel(selectedDay)],
//           datasets,
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               display: false,
//             },
//             title: {
//               display: true,
//               text: `Attendance for ${getDayLabel(selectedDay)}`,
//               font: {
//                 size: 18,
//               },
//             },
//           },
//           elements: {
//             bar: {
//               borderRadius: 10,
//             },
//           },
//           scales: {
//             x: {
//               ticks: {
//                 display: false,
//               },
//             },
//           },
//         },
//       });
//     };

//     if (attendanceData) {
//       renderChart();
//     }
//   }, [attendanceData, selectedDay]);

//   const countPresentForDay = (attendanceData, day) => {
//     return Object.keys(attendanceData).filter((key) => {
//       // Check if the key ends with the selected day and has a truthy value
//       if (key.endsWith(day) && attendanceData[key]) {
//         // Extract the prefix (index) part of the key
//         const index = parseInt(key.substring(0, 3));
//         // Ensure the index is a number between 1 and 99
//         return !isNaN(index) && index >= 1 ;
//       }
//       return false;
//     }).length;
//   };

//   // const countPresentForDay = (attendanceData, day) => {
//   //   return Object.keys(attendanceData).filter(
//   //     (key) => key.startsWith("0") && key.endsWith(day) && attendanceData[key]
//   //   ).length;
//   // };

//   const getTotalAttendanceForDay = (day) => {
//     return Object.keys(attendanceData).reduce((total, group) => {
//       return total + countPresentForDay(attendanceData[group], day);
//     }, 0);
//   };

//   const handleDayChange = (day) => {
//     setSelectedDay(day);
//   };

//   const getDayLabel = (day) => {
//     switch (day) {
//       case "A":
//         return "Monday";
//       case "B":
//         return "Tuesday";
//       case "C":
//         return "Wednesday";
//       case "D":
//         return "Thursday";
//       case "E":
//         return "Friday";
//       default:
//         return day;
//     }
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   return (
//     <div className="flex flex-col md:flex-row h-screen w-screen bg-black">
//       {/* Chart Section */}
//       <div className="h-full md:w-1/2">
//         <div className="bg-white rounded-lg p-4 shadow-lg w-full h-full">
//           <canvas id="attendanceChart" className="w-full h-full"></canvas>
//         </div>
//       </div>

//       {/* Values Section */}
//       <div className="w-full md:w-1/2 flex flex-col items-center p-4">
//         <Menu as="div" className="relative inline-block text-left mb-2">
//           <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
//             {getDayLabel(selectedDay)}
//           </Menu.Button>

//           <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
//             {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
//               (day, index) => (
//                 <Menu.Item key={day}>
//                   {({ active }) => (
//                     <button
//                       onClick={() =>
//                         handleDayChange(String.fromCharCode(65 + index))
//                       }
//                       className={`${
//                         active ? "bg-blue-100 text-blue-900" : "text-gray-900"
//                       } group flex rounded-md items-center w-full px-4 py-2 text-sm`}>
//                       {day}
//                     </button>
//                   )}
//                 </Menu.Item>
//               )
//             )}
//           </Menu.Items>
//         </Menu>

//         <div className="grid grid-cols-2 gap-4 w-full h-full py-3">
//           {Object.keys(attendanceData).map((group, index) => (
//             <div
//               key={group}
//               style={{
//                 backgroundColor: ["#FFC100", "#04d924", "#027df7", "#f70233"][
//                   index
//                 ],
//               }}
//               className="h-full w-full flex flex-col items-center rounded-lg justify-center cursor-pointer p-4">
//               <div className="text-5xl md:text-15xl text-white font-bold">
//                 {countPresentForDay(attendanceData[group], selectedDay)}
//               </div>
//               <div className="md:text-6xl text-4xl text-white font-bold">
//                 {group}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="w-full flex flex-col items-center rounded-lg m-2 justify-center bg-gray-300 cursor-pointer">
//           <div className="text-5xl md:text-15xl text-black font-bold">
//             {getTotalAttendanceForDay(selectedDay)}
//           </div>
//           <div className="text-4xl md:text-4xl md:mb-4 text-black font-bold">
//             Total
//           </div>
//         </div>
//       </div>
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default AttendanceChart;

// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "./firebase.js";
// import { Menu } from "@headlessui/react";

// const getDefaultSelectedDay = () => {
//   const days = ["A", "B", "C", "D", "E"];
//   const today = new Date().getDay();
//   return days[today >= 1 && today <= 5 ? today - 1 : 4];
// };

// // const getDefaultSelectedDay = () => {
// //   const today = new Date().getDay();
// //   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// // };

// function AttendanceChart() {
//   const [attendanceData, setAttendanceData] = useState({
//     primary: {},
//     middlers: {},
//     juniors: {},
//     youth: {},
//   });
//   const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay());
//   const [previousAttendanceData, setPreviousAttendanceData] = useState({});
//   const audioRef = useRef(null);

//   useEffect(() => {
//     const shouldPlaySound = (previousData, newData, day) => {
//       if (!previousData || !newData) return false;
//       const previousCount = countPresentForDay(previousData, day);
//       const newCount = countPresentForDay(newData, day);
//       return newCount > previousCount;
//     };

//     const fetchAttendanceData = async () => {
//       const documents = ["primary", "middlers", "juniors", "youth"];
//       const listeners = {};

//       for (const docName of documents) {
//         const docRef = doc(db, "dvbs", docName);
//         listeners[docName] = onSnapshot(docRef, (doc) => {
//           if (doc.exists()) {
//             const newData = doc.data();
//             console.log(`Data for document ${docName}:`, newData); // Log the fetched data
//             setAttendanceData((prevData) => {
//               if (shouldPlaySound(prevData[docName], newData, selectedDay)) {
//                 playEnterSound();
//               }
//               return {
//                 ...prevData,
//                 [docName]: newData,
//               };
//             });
//           } else {
//             console.error(`Document ${docName} does not exist!`);
//           }
//         });
//       }

//       return () => {
//         Object.values(listeners).forEach((unsubscribe) => unsubscribe());
//       };
//     };

//     fetchAttendanceData();
//   }, [selectedDay]);

//   useEffect(() => {
//     const renderChart = () => {
//       const existingChart = Chart.getChart("attendanceChart");
//       if (existingChart) {
//         existingChart.destroy();
//       }

//       const datasets = Object.keys(attendanceData).map((docName, index) => {
//         const data = countPresentForDay(attendanceData[docName], selectedDay);
//         const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//         return {
//           label: docName,
//           data: [data],
//           backgroundColor: colors[index],
//         };
//       });

//       const ctx = document.getElementById("attendanceChart");
//       new Chart(ctx, {
//         type: "bar",
//         data: {
//           labels: [getDayLabel(selectedDay)],
//           datasets,
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               display: false,
//             },
//             title: {
//               display: true,
//               text: `Attendance for ${getDayLabel(selectedDay)}`,
//               font: {
//                 size: 18,
//               },
//             },
//           },
//           elements: {
//             bar: {
//               borderRadius: 10,
//             },
//           },
//           scales: {
//             x: {
//               ticks: {
//                 display: false,
//               },
//             },
//           },
//         },
//       });
//     };

//     if (attendanceData) {
//       renderChart();
//     }
//   }, [attendanceData, selectedDay]);

//   const countPresentForDay = (attendanceData, day) => {
//     return Object.keys(attendanceData).filter((key) => {
//       // Check if the key ends with the selected day and has a truthy value
//       if (key.endsWith(day) && attendanceData[key]) {
//         // Extract the prefix (index) part of the key
//         const index = parseInt(key.substring(0, 2));
//         // Ensure the index is a number between 1 and 99
//         return !isNaN(index) && index >= 1 && index <= 99;
//       }
//       return false;
//     }).length;
//   };

//   // const countPresentForDay = (attendanceData, day) => {
//   //   return Object.keys(attendanceData).filter(
//   //     (key) => key.startsWith("0") && key.endsWith(day) && attendanceData[key]
//   //   ).length;
//   // };

//   const getTotalAttendanceForDay = (day) => {
//     return Object.keys(attendanceData).reduce((total, group) => {
//       return total + countPresentForDay(attendanceData[group], day);
//     }, 0);
//   };

//   const handleDayChange = (day) => {
//     setSelectedDay(day);
//   };

//   const getDayLabel = (day) => {
//     switch (day) {
//       case "A":
//         return "Monday";
//       case "B":
//         return "Tuesday";
//       case "C":
//         return "Wednesday";
//       case "D":
//         return "Thursday";
//       case "E":
//         return "Friday";
//       default:
//         return day;
//     }
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   return (
//     <div className="flex flex-col md:flex-row h-screen w-screen bg-black">
//       {/* Chart Section */}
//       <div className="h-full md:w-1/2">
//         <div className="bg-white rounded-lg p-4 shadow-lg w-full h-full">
//           <canvas id="attendanceChart" className="w-full h-full"></canvas>
//         </div>
//       </div>

//       {/* Values Section */}
//       <div className="w-full md:w-1/2 flex flex-col items-center p-4">
//         <Menu as="div" className="relative inline-block text-left mb-2">
//           <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
//             {getDayLabel(selectedDay)}
//           </Menu.Button>

//           <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
//             {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
//               (day, index) => (
//                 <Menu.Item key={day}>
//                   {({ active }) => (
//                     <button
//                       onClick={() =>
//                         handleDayChange(String.fromCharCode(65 + index))
//                       }
//                       className={`${
//                         active ? "bg-blue-100 text-blue-900" : "text-gray-900"
//                       } group flex rounded-md items-center w-full px-4 py-2 text-sm`}>
//                       {day}
//                     </button>
//                   )}
//                 </Menu.Item>
//               )
//             )}
//           </Menu.Items>
//         </Menu>

//         <div className="grid grid-cols-2 gap-4 w-full h-full py-3">
//           {Object.keys(attendanceData).map((group, index) => (
//             <div
//               key={group}
//               style={{
//                 backgroundColor: ["#FFC100", "#04d924", "#027df7", "#f70233"][
//                   index
//                 ],
//               }}
//               className="h-full w-full flex flex-col items-center rounded-lg justify-center cursor-pointer p-4">
//               <div className="text-5xl md:text-9xl text-white font-bold">
//                 {countPresentForDay(attendanceData[group], selectedDay)}
//               </div>
//               <div className="md:text-6xl text-4xl text-white font-bold">
//                 {group}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="w-full flex flex-col items-center rounded-lg m-2 justify-center bg-gray-300 cursor-pointer">
//           <div className="text-5xl md:text-9xl text-black font-bold">
//             {getTotalAttendanceForDay(selectedDay)}
//           </div>
//           <div className="text-4xl md:text-4xl md:mb-4 text-black font-bold">
//             Total
//           </div>
//         </div>
//       </div>
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default AttendanceChart;

// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "./firebase.js";
// import { Menu } from "@headlessui/react";

// const getDefaultSelectedDay = () => {
//   const today = new Date().getDay();
//   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// };

// function AttendanceChart() {
//   const [attendanceData, setAttendanceData] = useState({
//     primary: {},
//     middlers: {},
//     juniors: {},
//     youth: {},
//   });
//   const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay());
//   const [previousAttendanceData, setPreviousAttendanceData] = useState({});
//   const audioRef = useRef(null);

//   const shouldPlaySound = (previousData, newData, day) => {
//     if (!previousData || !newData) return false;
//     const previousCount = countPresentForDay(previousData, day);
//     const newCount = countPresentForDay(newData, day);
//     return newCount > previousCount;
//   };

//   useEffect(() => {
//     const fetchAttendanceData = async () => {
//       const documents = ["primary", "middlers", "juniors", "youth"];
//       const listeners = {};

//       for (const docName of documents) {
//         const docRef = doc(db, "dvbs", docName);
//         listeners[docName] = onSnapshot(docRef, (doc) => {
//           if (doc.exists()) {
//             const newData = doc.data();
//             setAttendanceData((prevData) => {
//               if (shouldPlaySound(prevData[docName], newData, selectedDay)) {
//                 playEnterSound();
//               }
//               return {
//                 ...prevData,
//                 [docName]: newData,
//               };
//             });
//           } else {
//             console.error(`Document ${docName} does not exist!`);
//           }
//         });
//       }

//       return () => {
//         Object.values(listeners).forEach((unsubscribe) => unsubscribe());
//       };
//     };

//     fetchAttendanceData();
//   }, [selectedDay]);

//   useEffect(() => {
//     if (attendanceData) {
//       renderChart();
//     }
//   }, [attendanceData, selectedDay,]);

//   const renderChart = () => {
//     const existingChart = Chart.getChart("attendanceChart");
//     if (existingChart) {
//       existingChart.destroy();
//     }

//     const datasets = Object.keys(attendanceData).map((docName, index) => {
//       const data = countPresentForDay(attendanceData[docName], selectedDay);
//       const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//       return {
//         label: docName,
//         data: [data],
//         backgroundColor: colors[index],
//       };
//     });

//     const ctx = document.getElementById("attendanceChart");
//     new Chart(ctx, {
//       type: "bar",
//       data: {
//         labels: [getDayLabel(selectedDay)],
//         datasets,
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             display: false,
//           },
//           title: {
//             display: true,
//             text: `Attendance for ${getDayLabel(selectedDay)}`,
//             font: {
//               size: 18,
//             },
//           },
//         },
//         elements: {
//           bar: {
//             borderRadius: 10,
//           },
//         },
//         scales: {
//           x: {
//             ticks: {
//               display: false,
//             },
//           },
//         },
//       },
//     });
//   };

//   const countPresentForDay = (attendanceData, day) => {
//     return Object.keys(attendanceData).filter(
//       (key) => key.startsWith("0") && key.endsWith(day) && attendanceData[key]
//     ).length;
//   };

//   const getTotalAttendanceForDay = (day) => {
//     return Object.keys(attendanceData).reduce((total, group) => {
//       return total + countPresentForDay(attendanceData[group], day);
//     }, 0);
//   };

//   const handleDayChange = (day) => {
//     setSelectedDay(day);
//   };

//   const getDayLabel = (day) => {
//     switch (day) {
//       case "A":
//         return "Monday";
//       case "B":
//         return "Tuesday";
//       case "C":
//         return "Wednesday";
//       case "D":
//         return "Thursday";
//       case "E":
//         return "Friday";
//       default:
//         return day;
//     }
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   return (
//     <div className="flex flex-col md:flex-row h-screen w-screen bg-black">
//       {/* Chart Section */}
//       <div className="h-full md:w-2/3">
//         <div className="bg-white rounded-lg p-4 shadow-lg w-full h-full">
//           <canvas id="attendanceChart" className="w-full h-full"></canvas>
//         </div>
//       </div>

//       {/* Values Section */}
//       <div className="w-full md:w-1/3 flex flex-col items-center p-4">
//         <Menu as="div" className="relative inline-block text-left mb-2">
//           <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
//             {getDayLabel(selectedDay)}
//             {/* <ChevronDownIcon className="w-5 h-5 ml-2" /> */}
//           </Menu.Button>

//           <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
//             {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
//               (day, index) => (
//                 <Menu.Item key={day}>
//                   {({ active }) => (
//                     <button
//                       onClick={() =>
//                         handleDayChange(String.fromCharCode(65 + index))
//                       }
//                       className={`${
//                         active ? "bg-blue-100 text-blue-900" : "text-gray-900"
//                       } group flex rounded-md items-center w-full px-4 py-2 text-sm`}>
//                       {day}
//                     </button>
//                   )}
//                 </Menu.Item>
//               )
//             )}
//           </Menu.Items>
//         </Menu>

//         {Object.keys(attendanceData).map((group, index) => (
//           <div
//             key={group}
//             style={{ backgroundColor: ["#FFC100", "#04d924", "#027df7", "#f70233"][index] }}
//             className="h-full md:h-full w-full flex flex-col items-center rounded-lg m-2 justify-center cursor-pointer">
//             <div className="text-5xl md:text-9xl text-white font-bold">
//               {countPresentForDay(attendanceData[group], selectedDay)}
//             </div>
//             <div className="md:text-6xl text-white font-bold">{group}</div>
//           </div>
//         ))}

//         <div className="w-full flex flex-col items-center rounded-lg m-2 justify-center bg-gray-300 cursor-pointer">
//           <div className="text-5xl md:text-9xl text-black font-bold">
//             {getTotalAttendanceForDay(selectedDay)}
//           </div>
//           <div className="md:text-4xl md:mb-4 text-black font-bold">Total</div>
//         </div>
//       </div>
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default AttendanceChart;

// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "./firebase.js";
// import { Menu } from "@headlessui/react";
// // import { ChevronDownIcon } from "@heroicons/react/solid";

// const getDefaultSelectedDay = () => {
//   const today = new Date().getDay();
//   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// };

// function AttendanceChart() {
//   const [attendanceData, setAttendanceData] = useState({
//     primary: {},
//     middlers: {},
//     juniors: {},
//     youth: {},
//   });
//   const [selectedDay, setSelectedDay] = useState(getDefaultSelectedDay());
//   const [previousAttendanceData, setPreviousAttendanceData] = useState({});
//   const audioRef = useRef(null);

//   useEffect(() => {
//     const fetchAttendanceData = async () => {
//       const documents = ["primary", "middlers", "juniors", "youth"];
//       const listeners = {};

//       for (const docName of documents) {
//         const docRef = doc(db, "dvbs", docName);
//         listeners[docName] = onSnapshot(docRef, (doc) => {
//           if (doc.exists()) {
//             const newData = doc.data();
//             setAttendanceData((prevData) => {
//               if (shouldPlaySound(prevData[docName], newData, selectedDay)) {
//                 playEnterSound();
//               }
//               return {
//                 ...prevData,
//                 [docName]: newData,
//               };
//             });
//           } else {
//             console.error(`Document ${docName} does not exist!`);
//           }
//         });
//       }

//       return () => {
//         Object.values(listeners).forEach((unsubscribe) => unsubscribe());
//       };
//     };

//     fetchAttendanceData();
//   }, [selectedDay, shouldPlaySound]);

//   useEffect(() => {
//     if (attendanceData) {
//       renderChart();
//     }
//   }, [attendanceData, selectedDay]);

//   const renderChart = () => {
//     const existingChart = Chart.getChart("attendanceChart");
//     if (existingChart) {
//       existingChart.destroy();
//     }

//     const datasets = Object.keys(attendanceData).map((docName, index) => {
//       const data = countPresentForDay(attendanceData[docName], selectedDay);
//       const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//       return {
//         label: docName,
//         data: [data],
//         backgroundColor: colors[index],
//       };
//     });

//     const ctx = document.getElementById("attendanceChart");
//     new Chart(ctx, {
//       type: "bar",
//       data: {
//         labels: [getDayLabel(selectedDay)],
//         datasets,
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             display: false,
//           },
//           title: {
//             display: true,
//             text: `Attendance for ${getDayLabel(selectedDay)}`,
//             font: {
//               size: 18,
//             },
//           },
//         },
//         elements: {
//           bar: {
//             borderRadius: 10,
//           },
//         },
//         scales: {
//           x: {
//             ticks: {
//               display: false,
//             },
//           },
//         },
//       },
//     });
//   };

//   const countPresentForDay = (attendanceData, day) => {
//     return Object.keys(attendanceData).filter(
//       (key) => key.startsWith("0") && key.endsWith(day) && attendanceData[key]
//     ).length;
//   };

//   const getTotalAttendanceForDay = (day) => {
//     return Object.keys(attendanceData).reduce((total, group) => {
//       return total + countPresentForDay(attendanceData[group], day);
//     }, 0);
//   };

//   const handleDayChange = (day) => {
//     setSelectedDay(day);
//   };

//   const getDayLabel = (day) => {
//     switch (day) {
//       case "A":
//         return "Monday";
//       case "B":
//         return "Tuesday";
//       case "C":
//         return "Wednesday";
//       case "D":
//         return "Thursday";
//       case "E":
//         return "Friday";
//       default:
//         return day;
//     }
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   const shouldPlaySound = (previousData, newData, day) => {
//     if (!previousData || !newData) return false;
//     const previousCount = countPresentForDay(previousData, day);
//     const newCount = countPresentForDay(newData, day);
//     return newCount > previousCount;
//   };

//   return (
//     <div className=" flex flex-col md:flex-row h-screen w-screen bg-black">
//       {/* Chart Section */}
//       <div className="h-full md:w-2/3">
//         <div className="bg-white rounded-lg p-4 shadow-lg w-full h-full">
//           <canvas id="attendanceChart" className="w-full h-full"></canvas>
//         </div>
//       </div>

//       {/* Values Section */}
//       <div className="w-full md:w-1/3 flex flex-col items-center p-4">
//         <Menu as="div" className="relative inline-block text-left mb-2">
//           <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
//             {getDayLabel(selectedDay)}
//             {/* <ChevronDownIcon className="w-5 h-5 ml-2" /> */}
//           </Menu.Button>

//           <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
//             {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
//               (day, index) => (
//                 <Menu.Item key={day}>
//                   {({ active }) => (
//                     <button
//                       onClick={() =>
//                         handleDayChange(String.fromCharCode(65 + index))
//                       }
//                       className={`${
//                         active ? "bg-blue-100 text-blue-900" : "text-gray-900"
//                       } group flex rounded-md items-center w-full px-4 py-2 text-sm`}>
//                       {day}
//                     </button>
//                   )}
//                 </Menu.Item>
//               )
//             )}
//           </Menu.Items>
//         </Menu>

//         {Object.keys(attendanceData).map((group, index) => (
//           <div
//             key={group}
//             style={{ backgroundColor: ["#FFC100", "#04d924", "#027df7", "#f70233"][index] }}
//             className="h-full md:h-full w-full flex flex-col items-center rounded-lg m-2 justify-center cursor-pointer">
//             <div className="text-5xl md:text-9xl text-white font-bold">
//               {countPresentForDay(attendanceData[group], selectedDay)}
//             </div>
//             <div className="md:text-6xl text-white font-bold">{group}</div>
//           </div>
//         ))}

//         <div className="w-full flex flex-col items-center rounded-lg m-2 justify-center bg-gray-300 cursor-pointer">
//           <div className="text-5xl md:text-9xl text-black font-bold">
//             {getTotalAttendanceForDay(selectedDay)}
//           </div>
//           <div className="md:text-4xl md:mb-4 text-black font-bold">Total</div>
//         </div>
//       </div>
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default AttendanceChart;
