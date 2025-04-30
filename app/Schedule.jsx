import React, { useState, useEffect, useRef,Fragment } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db3 } from "./firebaseConfig3.js";
import { Menu, Transition, Dialog } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

function Schedule() {
  const [scheduleData, setScheduleData] = useState({});
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef(null);

  let [isOpen, setIsOpen] = useState(true);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  const configurations = [
    {
      name: "Primary",
      db3Path: "sched/primary",
      color: "#FFC100",
    },
    {
      name: "Middlers",
      db3Path: "sched/middlers",
      color: "#04d924",
    },
    {
      name: "Juniors",
      db3Path: "sched/juniors",
      color: "#027df7",
    },
    {
      name: "Youth",
      db3Path: "sched/youth",
      color: "#f70233",
    },
  ];

  const currentConfig = configurations[currentConfigIndex];

  useEffect(() => {
    const fetchSchedule = async () => {
      const docRef = doc(
        db3,
        currentConfig.db3Path.split("/")[0],
        currentConfig.db3Path.split("/")[1]
      );
      const scheduleSnapshot = await getDoc(docRef);
      if (scheduleSnapshot.exists()) {
        const data = scheduleSnapshot.data();
        setScheduleData(data);
      } else {
        console.error("No such document!");
      }
    };

    fetchSchedule();
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentConfig.db3Path]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = "/ding.wav";
    }
  }, []);

  const playEnterSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const renderSchedule = () => {
    const segments = Object.keys(scheduleData)
      .filter((key) => key.length === 1)
      .sort();

    // if (currentTime.getHours() >= 12 && currentTime.getMinutes() >= 10 ) {
    if (
      currentTime.getHours() > 12 ||
      (currentTime.getHours() === 12 && currentTime.getMinutes() >= 30)
    ) {
      // Your code to display all events

      return segments.map((segment) => {
        const startTime = scheduleData[`${segment}start`];
        const endTime = scheduleData[`${segment}end`];
        return (
          <div key={segment} className="mb-4 p-4 border rounded-lg shadow-sm">
            <h3 className="text-lg font-bold">{scheduleData[segment]}</h3>
            <p className="text-sm">
              <strong>Location:</strong> {scheduleData[`${segment}loc`]}
            </p>
            <p className="text-sm">
              <strong>Time:</strong> {startTime} - {endTime}
            </p>
          </div>
        );
      });
    }

    const getCurrentTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    };

    const isCurrentEvent = (start, end) => {
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const [currentHour, currentMinute, currentSecond] = getCurrentTime()
        .split(":")
        .map(Number);

      const currentTime = new Date(
        0,
        0,
        0,
        currentHour,
        currentMinute,
        currentSecond
      );
      const startTime = new Date(0, 0, 0, startHour, startMinute);
      const endTime = new Date(0, 0, 0, endHour, endMinute);

      return currentTime >= startTime && currentTime < endTime;
    };

    const calculateRemainingTime = (end) => {
      const [endHour, endMinute] = end.split(":").map(Number);
      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0, 0);

      const diff = endTime - currentTime;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return `${minutes}m ${seconds}s`;
    };

    const calculateProgressWidth = (start, end) => {
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const [currentHour, currentMinute, currentSecond] = getCurrentTime()
        .split(":")
        .map(Number);

      const currentTime = new Date(
        0,
        0,
        0,
        currentHour,
        currentMinute,
        currentSecond
      ).getTime();
      const startTime = new Date(0, 0, 0, startHour, startMinute).getTime();
      const endTime = new Date(0, 0, 0, endHour, endMinute).getTime();

      const totalDuration = endTime - startTime;
      const elapsedTime = currentTime - startTime;

      return (elapsedTime / totalDuration) * 100;
    };

    const filteredSegments = segments.filter((segment) => {
      const endTime = scheduleData[`${segment}end`];
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const endDateTime = new Date();
      endDateTime.setHours(endHour, endMinute, 0, 0);
      return currentTime <= endDateTime;
    });

    const lastPastSegment = segments
      .filter((segment) => {
        const endTime = scheduleData[`${segment}end`];
        const [endHour, endMinute] = endTime.split(":").map(Number);
        const endDateTime = new Date();
        endDateTime.setHours(endHour, endMinute, 0, 0);
        return currentTime > endDateTime;
      })
      .pop();

    return [
      ...(lastPastSegment ? [lastPastSegment] : []),
      ...filteredSegments,
    ].map((segment, index, array) => {
      const startTime = scheduleData[`${segment}start`];
      const endTime = scheduleData[`${segment}end`];
      const isCurrent = isCurrentEvent(startTime, endTime);
      const remainingTime = isCurrent ? calculateRemainingTime(endTime) : "";
      const progressWidth = isCurrent
        ? calculateProgressWidth(startTime, endTime)
        : 0;
      const isLastPast = segment === lastPastSegment && index === 0;

      if (isCurrent && remainingTime === "0m 0s") {
        playEnterSound();
      }

      return (
        <div
          key={segment}
          className={`mb-4 p-4 border rounded-lg${
            isCurrent ? "shadow-md" : "shadow-sm"
          }`}
          style={{
            backgroundColor: isCurrent
              ? currentConfig.color
              : isLastPast
              ? "#cccccc"
              : "white",
            color: isCurrent || isLastPast ? "black" : "black",
          }}>
          <h3 className={`${isCurrent ? "text-4xl" : "text-lg"} font-bold`}>
            {scheduleData[segment]}
          </h3>
          <p className={`${isCurrent ? "text-lg" : "text-sm"}`}>
            <strong>Location:</strong> {scheduleData[`${segment}loc`]}
          </p>
          <p className={`${isCurrent ? "text-lg" : "text-sm"}`}>
            <strong>Time:</strong> {startTime} - {endTime}
          </p>
          {isCurrent && (
            <>
              <p className="mt-2 text-base font-bold">
                Remaining Time: {remainingTime}
              </p>
              <div className="w-full h-2 bg-white rounded-full mt-2">
                <div
                  className="h-2 bg-gray-500 rounded-full"
                  style={{
                    width: `${progressWidth}%`,
                    transition: "width 1s linear",
                  }}></div>
              </div>
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        backgroundColor: `${configurations[currentConfigIndex].color}`,
      }}
      className="h-screen overflow-auto">
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto " style={{ maxWidth: "90%" }}>
          <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={closeModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black/25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900">
                        Schedule
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                        Displays daily events with location and time. Ongoing events are highlighted with a timer and progress bar. Past events are removed except for the most recent one.                        </p>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-[#9BCF53] px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          onClick={closeModal}>
                          Got it, thanks!
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
          <Menu
            as="div"
            className="relative inline-block justify-center text-center mt-4">
            <div>
              <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <h2 className="text-4xl font-bold">
                  {configurations[currentConfigIndex].name}
                </h2>
                <ChevronDownIcon
                  className="ml-2 -mr-1 h-10 w-10"
                  aria-hidden="true"
                />
              </Menu.Button>
            </div>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95">
              <Menu.Items className="absolute mt-2 origin-top divide-y divide-gray-100 rounded-lg bg-gradient-to-b from-gray-100 to-white shadow-xl ring-1 ring-black/5 focus:outline-none flex flex-col items-center z-50">
                {configurations.map((config, index) => (
                  <Menu.Item key={index}>
                    {({ active }) => (
                      <button
                        onClick={() => setCurrentConfigIndex(index)}
                        className={`${
                          active ? "bg-blue-500 text-white" : "text-gray-900"
                        } flex w-full items-center rounded-lg px-4 py-4 text-2xl font-semibold hover:bg-blue-100 transition-colors duration-200`}>
                        {config.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mt-4 mx-auto">
            {Object.keys(scheduleData).length > 0 ? (
              renderSchedule()
            ) : (
              <p className="text-center font-bold text-xl">Loading...</p>
            )}
          </div>
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default Schedule;

// import React, { useState, useEffect, useRef } from "react";
// import { doc, getDoc } from "firebase/firestore";
// import { db3 } from "./firebaseConfig3.js"; // Import your Firebase config
// import { Menu, Transition } from "@headlessui/react";
// import { ChevronDownIcon } from "@heroicons/react/20/solid";

// function Schedule() {
//   const [scheduleData, setScheduleData] = useState({});
//   const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const audioRef = useRef(null);

//   const configurations = [
//     {
//       name: "Primary",
//       db3Path: "sched/primary",
//       color: "#FFC100",
//     },
//     {
//       name: "Middlers",
//       db3Path: "sched/middlers",
//       color: "#04d924",
//     },
//     {
//       name: "Juniors",
//       db3Path: "sched/juniors",
//       color: "#027df7",
//     },
//     {
//       name: "Youth",
//       db3Path: "sched/youth",
//       color: "#f70233",
//     },
//   ];

//   const currentConfig = configurations[currentConfigIndex];

//   useEffect(() => {
//     const fetchSchedule = async () => {
//       const docRef = doc(
//         db3,
//         currentConfig.db3Path.split("/")[0],
//         currentConfig.db3Path.split("/")[1]
//       );
//       const scheduleSnapshot = await getDoc(docRef);
//       if (scheduleSnapshot.exists()) {
//         const data = scheduleSnapshot.data();
//         console.log(data);
//         setScheduleData(data);
//       } else {
//         console.error("No such document!");
//       }
//     };

//     fetchSchedule();
//     const intervalId = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);

//     return () => clearInterval(intervalId);
//   }, [currentConfig.db3Path]);

//   useEffect(() => {
//     if (audioRef.current) {
//       audioRef.current.src = "/ding.wav";
//     }
//   }, []);

//   const playEnterSound = () => {
//     if (audioRef.current) {
//       audioRef.current.play();
//     }
//   };

//   const renderSchedule = () => {
//     const segments = Object.keys(scheduleData)
//       .filter((key) => key.length === 1)
//       .sort(); // Sort the segments to ensure proper order

//     const getCurrentTime = () => {
//       const now = new Date();
//       const hours = String(now.getHours()).padStart(2, "0");
//       const minutes = String(now.getMinutes()).padStart(2, "0");
//       const seconds = String(now.getSeconds()).padStart(2, "0");
//       return `${hours}:${minutes}:${seconds}`;
//     };

//     const isCurrentEvent = (start, end) => {
//       const [startHour, startMinute] = start.split(":").map(Number);
//       const [endHour, endMinute] = end.split(":").map(Number);
//       const [currentHour, currentMinute, currentSecond] = getCurrentTime()
//         .split(":")
//         .map(Number);

//       const currentTime = new Date(0, 0, 0, currentHour, currentMinute, currentSecond);
//       const startTime = new Date(0, 0, 0, startHour, startMinute);
//       const endTime = new Date(0, 0, 0, endHour, endMinute);

//       return currentTime >= startTime && currentTime < endTime;
//     };

//     const calculateRemainingTime = (end) => {
//       const [endHour, endMinute] = end.split(":").map(Number);
//       const endTime = new Date();
//       endTime.setHours(endHour, endMinute, 0, 0);

//       const diff = endTime - currentTime;
//       const minutes = Math.floor(diff / 60000);
//       const seconds = Math.floor((diff % 60000) / 1000);

//       return `${minutes}m ${seconds}s`;
//     };

//     const calculateProgressWidth = (start, end) => {
//       const [startHour, startMinute] = start.split(":").map(Number);
//       const [endHour, endMinute] = end.split(":").map(Number);
//       const [currentHour, currentMinute, currentSecond] = getCurrentTime()
//         .split(":")
//         .map(Number);

//       const currentTime = new Date(0, 0, 0, currentHour, currentMinute, currentSecond).getTime();
//       const startTime = new Date(0, 0, 0, startHour, startMinute).getTime();
//       const endTime = new Date(0, 0, 0, endHour, endMinute).getTime();

//       const totalDuration = endTime - startTime;
//       const elapsedTime = currentTime - startTime;

//       return (elapsedTime / totalDuration) * 100;
//     };

//     const filteredSegments = segments.filter((segment) => {
//       const endTime = scheduleData[`${segment}end`];
//       const [endHour, endMinute] = endTime.split(":").map(Number);
//       const endDateTime = new Date();
//       endDateTime.setHours(endHour, endMinute, 0, 0);
//       return currentTime <= endDateTime;
//     });

//     const lastPastSegment = segments
//       .filter((segment) => {
//         const endTime = scheduleData[`${segment}end`];
//         const [endHour, endMinute] = endTime.split(":").map(Number);
//         const endDateTime = new Date();
//         endDateTime.setHours(endHour, endMinute, 0, 0);
//         return currentTime > endDateTime;
//       })
//       .pop();

//     return [...(lastPastSegment ? [lastPastSegment] : []), ...filteredSegments].map((segment, index, array) => {
//       const startTime = scheduleData[`${segment}start`];
//       const endTime = scheduleData[`${segment}end`];
//       const isCurrent = isCurrentEvent(startTime, endTime);
//       const remainingTime = isCurrent ? calculateRemainingTime(endTime) : "";
//       const progressWidth = isCurrent ? calculateProgressWidth(startTime, endTime) : 0;
//       const isLastPast = segment === lastPastSegment && index === 0;

//       if (isCurrent && remainingTime === "0m 0s") {
//         playEnterSound();
//       }

//       return (
//         <div
//           key={segment}
//           className={`mb-4 p-4 border rounded-lg shadow-sm`}
//           style={{
//             backgroundColor: isCurrent
//               ? currentConfig.color
//               : isLastPast
//               ? "#cccccc" // Slightly darker gray for the last past event
//               : "white",
//             color: isCurrent || isLastPast ? "black" : "black",
//           }}
//         >
//           <h3 className={`${isCurrent ? "text-2xl text-center text-white" : "text-lg"} font-bold`}>{scheduleData[segment]}</h3>
//           <p className={`${isCurrent ? "text-lg text-center" : "text-sm"}`}>
//             <strong>Location:</strong> {scheduleData[`${segment}loc`]}
//           </p>
//           <p className={`${isCurrent ? "text-lg text-center" : "text-sm"}`}>
//             <strong>Time:</strong> {startTime} - {endTime}
//           </p>
//           {isCurrent && (
//             <>
//               <p className="mt-2 text-base font-bold">
//                 Remaining Time: {remainingTime}
//               </p>
//               <div className="w-full h-2 bg-white rounded-full mt-2">
//                 <div
//                   className="h-2 bg-gray-500 rounded-full"
//                   style={{ width: `${progressWidth}%`, transition: "width 1s linear" }}
//                 ></div>
//               </div>
//             </>
//           )}
//         </div>
//       );
//     });
//   };

//   return (
//     <div
//       style={{
//         backgroundColor: `${configurations[currentConfigIndex].color}`,
//       }}
//       className="h-screen overflow-auto"
//     >
//       <div className="flex justify-center items-center overflow-auto">
//         <div className="w-full rounded-lg mx-auto " style={{ maxWidth: "90%" }}>
//           <Menu
//             as="div"
//             className="relative inline-block justify-center text-center mt-4"
//           >
//             <div>
//               <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
//                 <h2 className="text-4xl font-bold">
//                   {configurations[currentConfigIndex].name}
//                 </h2>
//                 <ChevronDownIcon
//                   className="ml-2 -mr-1 h-10 w-10"
//                   aria-hidden="true"
//                 />
//               </Menu.Button>
//             </div>

//             <Transition
//               as={React.Fragment}
//               enter="transition ease-out duration-200"
//               enterFrom="transform opacity-0 scale-95"
//               enterTo="transform opacity-100 scale-100"
//               leave="transition ease-in duration-75"
//               leaveFrom="transform opacity-100 scale-100"
//               leaveTo="transform opacity-0 scale-95"
//               >
//                 <Menu.Items className="absolute mt-2 origin-top divide-y divide-gray-100 rounded-lg bg-gradient-to-b from-gray-100 to-white shadow-xl ring-1 ring-black/5 focus:outline-none flex flex-col items-center z-50">
//                   {configurations.map((config, index) => (
//                     <Menu.Item key={index}>
//                       {({ active }) => (
//                         <button
//                           onClick={() => setCurrentConfigIndex(index)}
//                           className={`${
//                             active ? "bg-blue-500 text-white" : "text-gray-900"
//                           } flex w-full items-center rounded-lg px-4 py-4 text-2xl font-semibold hover:bg-blue-100 transition-colors duration-200`}
//                         >
//                           {config.name}
//                         </button>
//                       )}
//                     </Menu.Item>
//                   ))}
//                 </Menu.Items>
//               </Transition>
//             </Menu>

//             <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mt-4 mx-auto">
//               {Object.keys(scheduleData).length > 0 ? (
//                 renderSchedule()
//               ) : (
//                 <p className="text-center font-bold text-xl">Loading...</p>
//               )}
//             </div>
//           </div>
//         </div>
//         <audio ref={audioRef} />
//       </div>
//     );
//   }

//   export default Schedule;
