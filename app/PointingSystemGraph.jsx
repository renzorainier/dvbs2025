import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db2 } from "./firebaseConfig2.js";
import { Menu } from "@headlessui/react";
import Confetti from "react-confetti";

// Helper function to get the default day (Monday-Friday)
const getDefaultDay = () => {
  const today = new Date().getDay();
  // Adjust to start from Monday (A) to Friday (E)
  // Sunday (0) and Saturday (6) will default to Friday (E)
  if (today === 0 || today === 6) {
    return "E"; // Weekends default to Friday
  } else {
    return String.fromCharCode(65 + today - 1); // Monday=A, Tuesday=B, etc.
  }
};

// Helper function to format numbers with commas
const formatNumber = (num) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function PointingSystemGraph({ isVisitorView }) {
  // State to hold the points data for each group and day
  const [pointsData, setPointsData] = useState({
    primary: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
    middlers: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
    juniors: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
    youth: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
  });

  // State for the currently selected day
  const [selectedDay, setSelectedDay] = useState(getDefaultDay());
  // State to manage point changes for the popup
  const [pointChanges, setPointChanges] = useState({
    primary: 0,
    middlers: 0,
    juniors: 0,
    youth: 0,
  });

  // UI state for managing the point adjustment popup
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [isAdding, setIsAdding] = useState(true);

  // State and ref for confetti and audio
  const [confettiActive, setConfettiActive] = useState(false);
  const audioRef = useRef(null); // Ref for audio, though new Audio() is used directly

  // Ref to hold the previous points data for chart re-rendering checks
  const previousPointsData = useRef(pointsData);
  // State to control the visitor view prompt
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false);

  // --- NEW REF: To track if the initial snapshot for each document has been processed ---
  const initialSnapshotProcessed = useRef({
    primary: false,
    middlers: false,
    juniors: false,
    youth: false,
  });

  // Effect hook to fetch and listen to real-time data from Firebase
  useEffect(() => {
    const fetchPointsData = async () => {
      const documents = ["primary", "middlers", "juniors", "youth"];
      const listeners = {}; // To store unsubscribe functions

      for (const docName of documents) {
        const docRef = doc(db2, "points", docName);
        // Set up a real-time listener for each document
        listeners[docName] = onSnapshot(docRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const newPointsData = docSnapshot.data();

            setPointsData((prevData) => {
              const updatedData = {
                ...prevData,
                [docName]: newPointsData,
              };

              // --- MODIFIED LOGIC FOR CONFETTI AND SOUND ---
              // Check if it's NOT the initial snapshot for this specific document.
              // If it's a subsequent update AND the data has actually changed,
              // then trigger confetti and sound.
              if (initialSnapshotProcessed.current[docName]) {
                // Perform a deep comparison to ensure the data content has genuinely changed.
                // onSnapshot can sometimes fire even for metadata updates or if data
                // matches previous, so this check prevents false positives.
                if (JSON.stringify(prevData[docName]) !== JSON.stringify(newPointsData)) {
                  setConfettiActive(true); // Activate confetti
                  playEnterSound(); // Play the sound
                  setTimeout(() => {
                    setConfettiActive(false); // Deactivate confetti after 5 seconds
                  }, 7000);
                }
              }

              // Mark this document's initial snapshot as processed.
              // This ensures that the next time `onSnapshot` fires for this document,
              // `initialSnapshotProcessed.current[docName]` will be true, indicating a live update.
              initialSnapshotProcessed.current = {
                ...initialSnapshotProcessed.current,
                [docName]: true,
              };

              return updatedData;
            });
          } else {
            console.error(`Document ${docName} does not exist!`);
          }
        });
      }

      // Cleanup function: Unsubscribe from all listeners when the component unmounts
      // or when `selectedDay` changes (which triggers a re-run of this effect).
      return () => {
        Object.values(listeners).forEach((unsubscribe) => unsubscribe());
        // --- NEW: Reset initialSnapshotProcessed when re-establishing listeners ---
        // This is crucial so that when `selectedDay` changes and new listeners are set up,
        // their first data load (from Firebase) doesn't trigger confetti/sound.
        initialSnapshotProcessed.current = {
            primary: false,
            middlers: false,
            juniors: false,
            youth: false,
        };
      };
    };

    fetchPointsData();
  }, [selectedDay]); // Dependency: Re-run this effect if `selectedDay` changes

  // Effect hook to render and update the Chart.js graph
  useEffect(() => {
    const renderChart = () => {
      // Destroy any existing chart instance to prevent memory leaks and conflicts
      const existingChart = Chart.getChart("pointsChart");
      if (existingChart) {
        existingChart.destroy();
      }

      // Prepare datasets for the chart based on current pointsData and selectedDay
      const datasets = Object.keys(pointsData).map((docName, index) => {
        const data = pointsData[docName][`${selectedDay}points`] || 0;
        const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
        return {
          label: docName,
          data: [data],
          backgroundColor: colors[index],
        };
      });

      // Get the canvas context and create a new bar chart
      const ctx = document.getElementById("pointsChart");
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
              display: false, // Hide legend as group names are shown elsewhere
            },
            title: {
              display: false, // Hide chart title
              text: `Points for ${getDayLabel(selectedDay)}`,
              font: {
                size: 18,
              },
            },
          },
          elements: {
            bar: {
              borderRadius: 10, // Apply rounded corners to bars
            },
          },
          scales: {
            x: {
              ticks: {
                display: true, // Display x-axis labels
              },
            },
          },
        },
      });
    };

    renderChart(); // Initial chart render and re-render on data change
    previousPointsData.current = pointsData; // Update ref with current data for next render cycle
  }, [pointsData, selectedDay]); // Dependencies: Re-render chart when pointsData or selectedDay changes

  // Helper function to get the full day name from its code (A, B, C, D, E)
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

  // Handler for changing the selected day
  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  // Async function to update points in Firebase
  const updatePoints = async (group, day, points) => {
    const docRef = doc(db2, "points", group);
    const newPoints = { [`${day}points`]: points };
    await updateDoc(docRef, newPoints);
  };

  // Handler for clicking on a group to open the point adjustment popup
  const handleGroupClick = (group, isAdding) => {
    setCurrentGroup(group);
    setIsAdding(isAdding);
    setIsPopupVisible(true);
  };

  // Handler for input change in the point adjustment popup
  const handleInputChange = (e) => {
    setPointChanges({
      ...pointChanges,
      [currentGroup]: parseInt(e.target.value) || 0,
    });
  };

  // Handler for submitting point changes from the popup
  const handlePointsSubmit = () => {
    const currentPoints = pointsData[currentGroup][`${selectedDay}points`];
    const change = isAdding
      ? pointChanges[currentGroup]
      : -pointChanges[currentGroup];
    const newPoints = currentPoints + change;

    if (newPoints >= 0) {
      setPointsData((prevData) => ({
        ...prevData,
        [currentGroup]: {
          ...prevData[currentGroup],
          [`${selectedDay}points`]: newPoints,
        },
      }));
      updatePoints(currentGroup, selectedDay, newPoints); // Update Firebase
    }
    setIsPopupVisible(false); // Close the popup

    // --- REMOVED: Confetti and sound trigger from here ---
    // As per your request, these will now only trigger when new data is received from Firebase live.
  };

  // Handler for the "Back" button in the popup
  const handleBackClick = () => {
    setIsPopupVisible(false);
  };

  // Function to play the sound effect
  const playEnterSound = () => {
    const audio = new Audio("/win.mp3"); // Ensure the path to your sound file is correct
    audio.play().catch(e => console.error("Error playing sound:", e)); // Catch potential errors like user gesture requirement
  };

  // Array of colors for group backgrounds
  const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];


  return (
    <div className="points-system-container h-screen bg-black flex flex-col md:flex-row">
      {showVisitorPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="mb-4 text-center">
              You are in visitor view. This feature is disabled.
            </p>
            <button
              className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowVisitorPrompt(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Graph Section */}
      <div className="h-full md:w-2/3 p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 w-full h-full">
          <div className="w-full h-full">
            <canvas id="pointsChart"></canvas>
          </div>
        </div>
      </div>
      {/* Right Section */}
      <div className="md:w-1/3 flex flex-col items-center p-4">
        <Menu as="div" className="relative inline-block text-left mb-4">
          <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            {getDayLabel(selectedDay)}
          </Menu.Button>

          <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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

        {Object.keys(pointsData).map((group, index) => (
          <div
            key={group}
            style={{ backgroundColor: colors[index % colors.length] }}
            className="h-full md:h-full w-full flex flex-col items-center rounded-lg m-2 justify-center cursor-pointer"
            onClick={() => handleGroupClick(group, true)}>
            <div className="text-5xl md:text-9xl text-white font-bold">
              {formatNumber(pointsData[group][`${selectedDay}points`])}
            </div>
            <div className="md:text-7xl text-white font-bold">{group}</div>
          </div>
        ))}
      </div>
      {/* Popup Section */}
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <div className="text-center text-2xl font-bold mb-4">
              {currentGroup}
            </div>
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setIsAdding(true)}
                className={`px-4 py-2 rounded-md mr-2 ${
                  isAdding
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}>
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className={`px-4 py-2 rounded-md ${
                  !isAdding
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}>
                Minus
              </button>
            </div>
            <input
              value={pointChanges[currentGroup]}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-md px-2 py-1 w-full no-spin"
              placeholder="Enter points"
              type="number"
            />
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  if (!isVisitorView) {
                    handlePointsSubmit();
                  } else {
                    setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                  }
                }}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md">
                Enter
              </button>
              <button
                onClick={handleBackClick}
                className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md shadow-md">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
     {confettiActive && (
  <Confetti
    numberOfPieces={10000} // More pieces for a denser effect
    gravity={0.2}        // Slightly increased gravity for faster fall
    // colors={[
    //   '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    //   '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
    //   '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    //   '#FF5722'
    // ]} // Using your theme colors
    friction={1} // Slightly less friction for a bit more movement before slowing
    recycle={false}      // Ensures a single burst
  />
)}
      <audio ref={audioRef} />
    </div>
  );
}

export default PointingSystemGraph;

// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";
// import { doc, onSnapshot, updateDoc } from "firebase/firestore";
// import { db2 } from "./firebaseConfig2.js";
// import { Menu } from "@headlessui/react";
// import Confetti from "react-confetti";

// const getDefaultDay = () => {
//   const today = new Date().getDay();
//   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// };

// const formatNumber = (num) =>
//   num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// function PointingSystemGraph({ isVisitorView }) {
//   const [pointsData, setPointsData] = useState({
//     primary: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//     middlers: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//     juniors: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//     youth: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//   });

//   const [selectedDay, setSelectedDay] = useState(getDefaultDay());
//   const [pointChanges, setPointChanges] = useState({
//     primary: 0,
//     middlers: 0,
//     juniors: 0,
//     youth: 0,
//   });

//   const [isPopupVisible, setIsPopupVisible] = useState(false);
//   const [currentGroup, setCurrentGroup] = useState(null);
//   const [isAdding, setIsAdding] = useState(true);
//   const [confettiActive, setConfettiActive] = useState(false);
//   const audioRef = useRef(null);
//   const previousPointsData = useRef(pointsData);
//   const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt

//   useEffect(() => {
//     const fetchPointsData = async () => {
//       const documents = ["primary", "middlers", "juniors", "youth"];
//       const listeners = {};

//       for (const docName of documents) {
//         const docRef = doc(db2, "points", docName);
//         listeners[docName] = onSnapshot(docRef, (doc) => {
//           if (doc.exists()) {
//             const newPointsData = doc.data();
//             setPointsData((prevData) => {
//               const updatedData = {
//                 ...prevData,
//                 [docName]: newPointsData,
//               };

//               // Check if points increased
//               if (
//                 prevData[docName][`${selectedDay}points`] <
//                 newPointsData[`${selectedDay}points`]
//               ) {
//                 setConfettiActive(true);
//                 playEnterSound();
//                 setTimeout(() => {
//                   setConfettiActive(false);
//                 }, 5000);
//               }

//               return updatedData;
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

//     fetchPointsData();
//   }, [selectedDay]);

//   useEffect(() => {
//     const renderChart = () => {
//       const existingChart = Chart.getChart("pointsChart");
//       if (existingChart) {
//         existingChart.destroy();
//       }

//       const datasets = Object.keys(pointsData).map((docName, index) => {
//         const data = pointsData[docName][`${selectedDay}points`] || 0;
//         const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//         return {
//           label: docName,
//           data: [data],
//           backgroundColor: colors[index],
//         };
//       });

//       const ctx = document.getElementById("pointsChart");
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
//               display: false,
//               text: `Points for ${getDayLabel(selectedDay)}`,
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
//                 display: true,
//               },
//             },
//           },
//         },
//       });
//     };

//     renderChart(); // Render the chart when pointsData changes
//     // Update previous points data ref
//     previousPointsData.current = pointsData;
//   }, [pointsData, selectedDay]);

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

//   const handleDayChange = (day) => {
//     setSelectedDay(day);
//   };

//   const updatePoints = async (group, day, points) => {
//     const docRef = doc(db2, "points", group);
//     const newPoints = { [`${day}points`]: points };
//     await updateDoc(docRef, newPoints);
//   };

//   const handleGroupClick = (group, isAdding) => {
//     setCurrentGroup(group);
//     setIsAdding(isAdding);
//     setIsPopupVisible(true);
//   };

//   const handleInputChange = (e) => {
//     setPointChanges({
//       ...pointChanges,
//       [currentGroup]: parseInt(e.target.value) || 0,
//     });
//   };

//   const handlePointsSubmit = () => {
//     const currentPoints = pointsData[currentGroup][`${selectedDay}points`];
//     const change = isAdding
//       ? pointChanges[currentGroup]
//       : -pointChanges[currentGroup];
//     const newPoints = currentPoints + change;

//     if (newPoints >= 0) {
//       setPointsData((prevData) => ({
//         ...prevData,
//         [currentGroup]: {
//           ...prevData[currentGroup],
//           [`${selectedDay}points`]: newPoints,
//         },
//       }));
//       updatePoints(currentGroup, selectedDay, newPoints);
//     }
//     setIsPopupVisible(false);

//     if (isAdding) {
//       setConfettiActive(true);
//       playEnterSound();
//       setTimeout(() => {
//         setConfettiActive(false);
//       }, 5000);
//     }
//   };

//   const handleBackClick = () => {
//     setIsPopupVisible(false);
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];

  // return (
  //   <div className="points-system-container h-screen bg-black flex flex-col md:flex-row">
  //     {showVisitorPrompt && (
  //       <div className="fixed inset-0 z-50 flex items-center justify-center">
  //         <div className="fixed inset-0 bg-black opacity-50"></div>
  //         <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
  //           <p className="mb-4 text-center">
  //             You are in visitor view. This feature is disabled.
  //           </p>
  //           <button
  //             className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
  //             onClick={() => setShowVisitorPrompt(false)}>
  //             OK
  //           </button>
  //         </div>
  //       </div>
  //     )}

  //     {/* Graph Section */}
  //     <div className="h-full md:w-2/3 p-4">
  //       <div className="bg-white rounded-lg shadow-lg p-4 w-full h-full">
  //         <div className="w-full h-full">
  //           <canvas id="pointsChart"></canvas>
  //         </div>
  //       </div>
  //     </div>
  //     {/* Right Section */}
  //     <div className="md:w-1/3 flex flex-col items-center p-4">
  //       <Menu as="div" className="relative inline-block text-left mb-4">
  //         <Menu.Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
  //           {getDayLabel(selectedDay)}
  //         </Menu.Button>

  //         <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
  //           {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
  //             (day, index) => (
  //               <Menu.Item key={day}>
  //                 {({ active }) => (
  //                   <button
  //                     onClick={() =>
  //                       handleDayChange(String.fromCharCode(65 + index))
  //                     }
  //                     className={`${
  //                       active ? "bg-blue-100 text-blue-900" : "text-gray-900"
  //                     } group flex rounded-md items-center w-full px-4 py-2 text-sm`}>
  //                     {day}
  //                   </button>
  //                 )}
  //               </Menu.Item>
  //             )
  //           )}
  //         </Menu.Items>
  //       </Menu>

  //       {Object.keys(pointsData).map((group, index) => (
  //         <div
  //           key={group}
  //           style={{ backgroundColor: colors[index % colors.length] }}
  //           className="h-full md:h-full w-full flex flex-col items-center rounded-lg m-2 justify-center cursor-pointer"
  //           onClick={() => handleGroupClick(group, true)}>
  //           <div className="text-5xl md:text-9xl text-white font-bold">
  //             {formatNumber(pointsData[group][`${selectedDay}points`])}
  //           </div>
  //           <div className="md:text-7xl text-white font-bold">{group}</div>
  //         </div>
  //       ))}
  //     </div>
  //     {/* Popup Section */}
  //     {isPopupVisible && (
  //       <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
  //         <div className="bg-white p-4 rounded-md shadow-lg">
  //           <div className="text-center text-2xl font-bold mb-4">
  //             {currentGroup}
  //           </div>
  //           <div className="flex justify-center mb-4">
  //             <button
  //               onClick={() => setIsAdding(true)}
  //               className={`px-4 py-2 rounded-md mr-2 ${
  //                 isAdding
  //                   ? "bg-blue-500 text-white"
  //                   : "bg-gray-200 text-gray-700"
  //               }`}>
  //               Add
  //             </button>
  //             <button
  //               onClick={() => setIsAdding(false)}
  //               className={`px-4 py-2 rounded-md ${
  //                 !isAdding
  //                   ? "bg-red-500 text-white"
  //                   : "bg-gray-200 text-gray-700"
  //               }`}>
  //               Minus
  //             </button>
  //           </div>
  //           <input
  //             value={pointChanges[currentGroup]}
  //             onChange={handleInputChange}
  //             className="border border-gray-300 rounded-md px-2 py-1 w-full no-spin"
  //             placeholder="Enter points"
  //             type="number"
  //           />
  //           <div className="flex justify-center mt-4">
  //             <button
  //               onClick={() => {
  //                 if (!isVisitorView) {
  //                   handlePointsSubmit();
  //                 } else {
  //                   setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
  //                 }
  //               }}
  //               className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md">
  //               Enter
  //             </button>
  //             <button
  //               onClick={handleBackClick}
  //               className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md shadow-md">
  //               Back
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //     {confettiActive && <Confetti numberOfPieces={200} />}
  //     <audio ref={audioRef} />
  //   </div>
  // );
// }

// export default PointingSystemGraph;

// import React, { useState, useEffect, useRef } from "react";
// import Chart from "chart.js/auto";
// import { doc, onSnapshot, updateDoc } from "firebase/firestore";
// import { db2 } from "./firebaseConfig2.js";
// import { Menu } from "@headlessui/react";
// import Confetti from "react-confetti";

// const getDefaultDay = () => {
//   const today = new Date().getDay();
//   return today === 0 || today === 6 ? "E" : String.fromCharCode(65 + today - 1);
// };

// const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// function PointingSystemGraph() {
//   const [pointsData, setPointsData] = useState({
//     primary: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//     middlers: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//     juniors: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//     youth: { Apoints: 0, Bpoints: 0, Cpoints: 0, Dpoints: 0, Epoints: 0 },
//   });

//   const [selectedDay, setSelectedDay] = useState(getDefaultDay());
//   const [pointChanges, setPointChanges] = useState({
//     primary: 0,
//     middlers: 0,
//     juniors: 0,
//     youth: 0,
//   });

//   const [isPopupVisible, setIsPopupVisible] = useState(false);
//   const [currentGroup, setCurrentGroup] = useState(null);
//   const [isAdding, setIsAdding] = useState(true);
//   const [confettiActive, setConfettiActive] = useState(false);
//   const audioRef = useRef(null);
//   const previousPointsData = useRef(pointsData);

//   useEffect(() => {
//     const fetchPointsData = async () => {
//       const documents = ["primary", "middlers", "juniors", "youth"];
//       const listeners = {};

//       for (const docName of documents) {
//         const docRef = doc(db2, "points", docName);
//         listeners[docName] = onSnapshot(docRef, (doc) => {
//           if (doc.exists()) {
//             const newPointsData = doc.data();
//             setPointsData((prevData) => {
//               const updatedData = {
//                 ...prevData,
//                 [docName]: newPointsData,
//               };

//               // Check if points increased
//               if (prevData[docName][`${selectedDay}points`] < newPointsData[`${selectedDay}points`]) {
//                 setConfettiActive(true);
//                 playEnterSound();
//                 setTimeout(() => {
//                   setConfettiActive(false);
//                 }, 5000);
//               }

//               return updatedData;
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

//     fetchPointsData();
//   }, [selectedDay]);

//   useEffect(() => {
//     renderChart(); // Render the chart when pointsData changes
//     // Update previous points data ref
//     previousPointsData.current = pointsData;
//   }, [pointsData, selectedDay]);

//   const renderChart = () => {
//     const existingChart = Chart.getChart("pointsChart");
//     if (existingChart) {
//       existingChart.destroy();
//     }

//     const datasets = Object.keys(pointsData).map((docName, index) => {
//       const data = pointsData[docName][`${selectedDay}points`] || 0;
//       const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];
//       return {
//         label: docName,
//         data: [data],
//         backgroundColor: colors[index],
//       };
//     });

//     const ctx = document.getElementById("pointsChart");
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
//             display: false,
//             text: `Points for ${getDayLabel(selectedDay)}`,
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
//               display: true,
//             },
//           },
//         },
//       },
//     });
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

//   const handleDayChange = (day) => {
//     setSelectedDay(day);
//   };

//   const updatePoints = async (group, day, points) => {
//     const docRef = doc(db2, "points", group);
//     const newPoints = { [`${day}points`]: points };
//     await updateDoc(docRef, newPoints);
//   };

//   const handleGroupClick = (group, isAdding) => {
//     setCurrentGroup(group);
//     setIsAdding(isAdding);
//     setIsPopupVisible(true);
//   };

//   const handleInputChange = (e) => {
//     setPointChanges({
//       ...pointChanges,
//       [currentGroup]: parseInt(e.target.value) || 0,
//     });
//   };

//   const handlePointsSubmit = () => {
//     const currentPoints = pointsData[currentGroup][`${selectedDay}points`];
//     const change = isAdding
//       ? pointChanges[currentGroup]
//       : -pointChanges[currentGroup];
//     const newPoints = currentPoints + change;

//     if (newPoints >= 0) {
//       setPointsData((prevData) => ({
//         ...prevData,
//         [currentGroup]: {
//           ...prevData[currentGroup],
//           [`${selectedDay}points`]: newPoints,
//         },
//       }));
//       updatePoints(currentGroup, selectedDay, newPoints);
//     }
//     setIsPopupVisible(false);

//     if (isAdding) {
//       setConfettiActive(true);
//       playEnterSound();
//       setTimeout(() => {
//         setConfettiActive(false);
//       }, 5000);
//     }
//   };

//   const handleBackClick = () => {
//     setIsPopupVisible(false);
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   const colors = ["#FFC100", "#04d924", "#027df7", "#f70233"];

//   return (
//     <div className="points-system-container h-screen bg-black flex flex-col md:flex-row">
//       {/* Graph Section */}
//       <div className="h-full md:w-2/3 p-4">
//         <div className="bg-white rounded-lg shadow-lg p-4 w-full h-full">
//           <div className="w-full h-full">
//             <canvas id="pointsChart"></canvas>
//           </div>
//         </div>
//       </div>
//       {/* Right Section */}
//       <div className="md:w-1/3 flex flex-col items-center p-4">
//         <Menu as="div" className="relative inline-block text-left mb-4">
//           <Menu.Button
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
//             {getDayLabel(selectedDay)}
//           </Menu.Button>

//           <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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

//         {Object.keys(pointsData).map((group, index) => (
//           <div
//             key={group}
//             style={{ backgroundColor: colors[index % colors.length] }}
//             className="h-full md:h-full w-full flex flex-col items-center rounded-lg m-2 justify-center cursor-pointer"
//             onClick={() => handleGroupClick(group, true)}>
//             <div className="text-5xl md:text-9xl text-white font-bold">
//             {formatNumber(pointsData[group][`${selectedDay}points`])}
//             </div>
//             <div className="md:text-7xl text-white font-bold">{group}</div>
//           </div>
//         ))}
//       </div>
//       {/* Popup Section */}
//       {isPopupVisible && (
//         <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
//           <div className="bg-white p-4 rounded-md shadow-lg">
//             <div className="text-center text-2xl font-bold mb-4">
//               {currentGroup}
//             </div>
//             <div className="flex justify-center mb-4">
//               <button
//                 onClick={() => setIsAdding(true)}
//                 className={`px-4 py-2 rounded-md mr-2 ${
//                   isAdding ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
//                 }`}>
//                 Add
//               </button>
//               <button
//                 onClick={() => setIsAdding(false)}
//                 className={`px-4 py-2 rounded-md ${
//                   !isAdding ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
//                 }`}>
//                 Minus
//               </button>
//             </div>
//             <input
//               value={pointChanges[currentGroup]}
//               onChange={handleInputChange}
//               className="border border-gray-300 rounded-md px-2 py-1 w-full no-spin"
//               placeholder="Enter points"
//               type="number"
//             />
//             <div className="flex justify-center mt-4">
//               <button
//                 onClick={handlePointsSubmit}
//                 className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md">
//                 Enter
//               </button>
//               <button
//                 onClick={handleBackClick}
//                 className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md shadow-md">
//                 Back
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {confettiActive && <Confetti numberOfPieces={200} />}
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default PointingSystemGraph;
