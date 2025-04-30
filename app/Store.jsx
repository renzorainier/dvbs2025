import React, { useState, useEffect, Fragment, useRef } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import { Menu, Transition, Dialog } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { IoIosBackspace } from "react-icons/io";

function Store({ isVisitorView }) {
  const [students, setStudents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [showPoints, setShowPoints] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt
  const audioRef = useRef(null);

  let [isOpen, setIsOpen] = useState(true);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "dvbs"));
        const studentData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const currentDayLetter = getCurrentDayLetter();
        const presentStudents = studentData
          .map((group) => {
            const groupStudents = [];
            for (const key in group) {
              if (key.endsWith(currentDayLetter)) {
                const prefix = key.slice(0, 3);
                const inTimeField = `${prefix}${currentDayLetter}`;
                const pointsField = `${prefix}${currentDayLetter}points`;
                if (group[inTimeField]) {
                  groupStudents.push({
                    id: group.id,
                    prefix,
                    inTimeField,
                    pointsField,
                    name: group[`${prefix}name`],
                    location: group[`${prefix}loc`],
                    points: group[pointsField],
                  });
                }
              }
            }
            return groupStudents;
          })
          .flat();

        // Sort students alphabetically by name
        presentStudents.sort((a, b) => a.name.localeCompare(b.name));

        const uniqueLocations = [
          ...new Set(presentStudents.map((student) => student.location)),
        ];

        setStudents(presentStudents);
        setLocations(uniqueLocations);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students: ", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  };

  // const getCurrentDayLetter = () => {
  //   const days = ["A", "B", "C", "D", "E", "F", "G"];
  //   const dayIndex = new Date().getDay();
  //   return days[dayIndex === 0 ? 6 : dayIndex - 1];
  // };

  const handleClick = (student) => {
    setCurrentPoints(student.points);
    setCurrentStudent(student);
    setShowPoints(true);
    setPaymentStatus(null); // Reset payment status when showing points
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (currentStudent && !isNaN(amount) && amount > 0) {
      const newPoints = currentPoints - amount;
      if (newPoints < 0) {
        setPaymentStatus("Insufficient points"); // Show warning text
        return;
      }
      const docRef = doc(db, "dvbs", currentStudent.id);
      const pointsField = currentStudent.pointsField;

      try {
        await updateDoc(docRef, {
          [pointsField]: newPoints,
        });

        setCurrentPoints(newPoints);
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === currentStudent.id &&
            student.prefix === currentStudent.prefix
              ? { ...student, points: newPoints }
              : student
          )
        );
        setPaymentAmount("");
        setPaymentStatus("Payment complete"); // Show payment complete text
        playEnterSound();
      } catch (error) {
        console.error("Error updating points: ", error);
      }
    } else {
      setPaymentStatus("Please enter a valid amount"); // Show warning text
    }
  };

  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((student) =>
      selectedLocation ? student.location === selectedLocation : true
    );

  const getBackgroundColor = (prefix) => {
    switch (prefix) {
      case "primary": // Assuming 'pr' stands for primary
        return "#FFC100";
      case "middlers": // Assuming 'mi' stands for middlers
        return "#04d924";
      case "juniors": // Assuming 'ju' stands for juniors
        return "#027df7";
      case "youth": // Assuming 'yo' stands for youth
        return "#f70233";
      default:
        return "#FFFFFF"; // Default color if no match
    }
  };

  const playEnterSound = () => {
    const audio = new Audio("/point.wav");
    audio.play();
  };

  return (
    <div className="bg-[#9ca3af] h-screen overflow-auto">
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
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto" style={{ maxWidth: "90%" }}>
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
                        Store
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Allows students to purchase specific items with their
                          points. Clicking on names displays the points, which
                          then proceeds to payment.{" "}
                        </p>
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
          <Menu as="div" className="relative inline-block mt-5 mb-3">
            <div>
              <Menu.Button className="inline-flex rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <h2 className="text-4xl font-bold">
                  {selectedLocation || "All Locations"}
                </h2>
                <ChevronDownIcon
                  className="ml-2 -mr-1 h-10 w-10"
                  aria-hidden="true"
                />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95">
              <Menu.Items className="absolute z-10 mt-2 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-2xl font-semibold text-left`}
                        onClick={() => handleLocationChange("")}>
                        All Locations
                      </button>
                    )}
                  </Menu.Item>
                  {locations.map((location) => (
                    <Menu.Item key={location}>
                      {({ active }) => (
                        <button
                          className={`${
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block px-4 py-2 text-2xl font-semibold text-left`}
                          onClick={() => handleLocationChange(location)}>
                          {location}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          <div className="w-full max-w-md text-gray-700 bg-white mt-5 p-5 border rounded-lg shadow-lg mx-auto">
            <input
              type="text"
              className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
              placeholder="Search by name"
              value={searchQuery}
              onChange={handleSearchChange}
            />

            {filteredStudents.map((student) => (
              <div
                key={`${student.id}-${student.prefix}`}
                className="flex items-center mb-4">
                <button
                  className="flex-1 text-white font-bold py-2 px-4 rounded-lg bg-gray-400 hover:bg-gray-700"
                  onClick={() => handleClick(student)}>
                  {student.name} - {student.id.charAt(0).toUpperCase()}{student.prefix}
                  </button>

                <div
                  className="ml-4 h-10 p-2 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: getBackgroundColor(student.id),
                    width: "80px", // Set a fixed width for the points div
                  }}>
                  <span className="font-bold">{student.points} pts</span>
                </div>
              </div>
            ))}
          </div>

          {showPoints && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <div className="fixed inset-0 bg-black opacity-50" />
              <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
                <p className="text-xl font-bold mb-2">
                  Points: {currentPoints}
                </p>
                {paymentStatus && (
                  <p
                    className={`mb-2 ${
                      paymentStatus === "Payment complete"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}>
                    {paymentStatus}
                  </p>
                )}{" "}
                {/* Show payment status */}
                <input
                  type="number"
                  className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                  placeholder="Enter points to pay"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <button
                  className="bg-green-500 text-white font-bold py-2 px-4 rounded mb-4"
                  onClick={() => {
                    if (!isVisitorView) {
                      handlePayment();
                    } else {
                      setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                    }
                  }}>
                  Confirm Payment
                </button>
                <button
                  className="bg-red-500 text-white font-bold py-2 px-4 rounded"
                  // disabled={paymentAmount !== ""}
                  onClick={() => {
                    if (paymentAmount !== "") {
                      setPaymentStatus("Remove the typed number first");
                    } else {
                      setShowPoints(false);
                      setPaymentStatus(null);
                    }
                  }}>
                  <IoIosBackspace style={{ fontSize: "2.0em" }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default Store;

// import React, { useState, useEffect, Fragment, useRef } from "react";
// import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
// import { db } from "./firebase.js"; // Import your Firebase config
// import { Menu, Transition } from "@headlessui/react";
// import { ChevronDownIcon } from "@heroicons/react/20/solid";

// function Store({ isVisitorView }) {
//   const [students, setStudents] = useState([]);
//   const [locations, setLocations] = useState([]);
//   const [selectedLocation, setSelectedLocation] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [currentPoints, setCurrentPoints] = useState(null);
//   const [currentStudent, setCurrentStudent] = useState(null);
//   const [showPoints, setShowPoints] = useState(false);
//   const [paymentAmount, setPaymentAmount] = useState("");
//   const [paymentStatus, setPaymentStatus] = useState(null);
//   const audioRef = useRef(null);
//   const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt

//   useEffect(() => {
//     const fetchStudents = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, "dvbs"));
//         const studentData = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         const currentDayLetter = getCurrentDayLetter();
//         const presentStudents = studentData
//           .map((group) => {
//             const groupStudents = [];
//             for (const key in group) {
//               if (key.endsWith(currentDayLetter)) {
//                 const prefix = key.slice(0, 2);
//                 const inTimeField = `${prefix}${currentDayLetter}`;
//                 const pointsField = `${prefix}${currentDayLetter}points`;
//                 if (group[inTimeField]) {
//                   groupStudents.push({
//                     id: group.id,
//                     prefix,
//                     inTimeField,
//                     pointsField,
//                     name: group[`${prefix}name`],
//                     location: group[`${prefix}loc`],
//                     points: group[pointsField],
//                   });
//                 }
//               }
//             }
//             return groupStudents;
//           })
//           .flat();

//         // Sort students alphabetically by name
//         presentStudents.sort((a, b) => a.name.localeCompare(b.name));

//         const uniqueLocations = [
//           ...new Set(presentStudents.map((student) => student.location)),
//         ];

//         setStudents(presentStudents);
//         setLocations(uniqueLocations);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching students: ", error);
//         setLoading(false);
//       }
//     };

//     fetchStudents();
//   }, []);

//   const getCurrentDayLetter = () => {
//     const days = ["A", "B", "C", "D", "E"];
//     const dayIndex = new Date().getDay();
//     return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
//   };

//   // const getCurrentDayLetter = () => {
//   //   const days = ["A", "B", "C", "D", "E", "F", "G"];
//   //   const dayIndex = new Date().getDay();
//   //   return days[dayIndex === 0 ? 6 : dayIndex - 1];
//   // };

//   const handleClick = (student) => {
//     setCurrentPoints(student.points);
//     setCurrentStudent(student);
//     setShowPoints(true);
//     setPaymentStatus(null); // Reset payment status when showing points
//   };

//   const handleLocationChange = (location) => {
//     setSelectedLocation(location);
//   };

//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//   };

//   const handlePayment = async () => {
//     const amount = parseFloat(paymentAmount);
//     if (currentStudent && !isNaN(amount) && amount > 0) {
//       const newPoints = currentPoints - amount;
//       if (newPoints < 0) {
//         setPaymentStatus("Insufficient points"); // Show warning text
//         return;
//       }
//       const docRef = doc(db, "dvbs", currentStudent.id);
//       const pointsField = currentStudent.pointsField;

//       try {
//         await updateDoc(docRef, {
//           [pointsField]: newPoints,
//         });

//         setCurrentPoints(newPoints);
//         setStudents((prevStudents) =>
//           prevStudents.map((student) =>
//             student.id === currentStudent.id &&
//             student.prefix === currentStudent.prefix
//               ? { ...student, points: newPoints }
//               : student
//           )
//         );
//         setPaymentAmount("");
//         setPaymentStatus("Payment complete"); // Show payment complete text
//         playEnterSound();

//       } catch (error) {
//         console.error("Error updating points: ", error);
//       }
//     } else {
//       setPaymentStatus("Please enter a valid amount"); // Show warning text
//     }
//   };

//   const filteredStudents = students
//     .filter((student) =>
//       student.name.toLowerCase().includes(searchQuery.toLowerCase())
//     )
//     .filter((student) =>
//       selectedLocation ? student.location === selectedLocation : true
//     );

//   const  getBackgroundColor = (prefix) => {
//     switch (prefix) {
//       case "primary": // Assuming 'pr' stands for primary
//         return "#FFC100";
//       case "middlers": // Assuming 'mi' stands for middlers
//         return "#04d924";
//       case "juniors": // Assuming 'ju' stands for juniors
//         return "#027df7";
//       case "youth": // Assuming 'yo' stands for youth
//         return "#f70233";
//       default:
//         return "#FFFFFF"; // Default color if no match
//     }
//   };

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   return (
//     <div className="bg-[#9ca3af] h-screen overflow-auto">
//         {showVisitorPrompt && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50"></div>
//           <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//             <p className="mb-4 text-center">
//               You are in visitor view. This feature is disabled.
//             </p>
//             <button
//               className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//               onClick={() => setShowVisitorPrompt(false)}>
//               OK
//             </button>
//           </div>
//         </div>
//       )}
//       <div className="flex justify-center items-center overflow-auto">
//         <div className="w-full rounded-lg mx-auto" style={{ maxWidth: "90%" }}>
//           <Menu as="div" className="relative inline-block mt-5 mb-3">
//             <div>
//               <Menu.Button className="inline-flex rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
//                 <h2 className="text-4xl font-bold">
//                   {selectedLocation || "All Locations"}
//                 </h2>
//                 <ChevronDownIcon
//                   className="ml-2 -mr-1 h-10 w-10"
//                   aria-hidden="true"
//                 />
//               </Menu.Button>
//             </div>
//             <Transition
//               as={Fragment}
//               enter="transition ease-out duration-100"
//               enterFrom="transform opacity-0 scale-95"
//               enterTo="transform opacity-100 scale-100"
//               leave="transition ease-in duration-75"
//               leaveFrom="transform opacity-100 scale-100"
//               leaveTo="transform opacity-0 scale-95">
//               <Menu.Items className="absolute z-10 mt-2 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//                 <div className="py-1">
//                   <Menu.Item>
//                     {({ active }) => (
//                       <button
//                         className={`${
//                           active ? "bg-gray-100 text-gray-900" : "text-gray-700"
//                         } block px-4 py-2 text-2xl font-semibold text-left`}
//                         onClick={() => handleLocationChange("")}>
//                         All Locations
//                       </button>
//                     )}
//                   </Menu.Item>
//                   {locations.map((location) => (
//                     <Menu.Item key={location}>
//                       {({ active }) => (
//                         <button
//                           className={`${
//                             active
//                               ? "bg-gray-100 text-gray-900"
//                               : "text-gray-700"
//                           } block px-4 py-2 text-2xl font-semibold text-left`}
//                           onClick={() => handleLocationChange(location)}>
//                           {location}
//                         </button>
//                       )}
//                     </Menu.Item>
//                   ))}
//                 </div>
//               </Menu.Items>
//             </Transition>
//           </Menu>

//           <div className="w-full max-w-md text-gray-700 bg-white mt-5 p-5 border rounded-lg shadow-lg mx-auto">
//             <input
//               type="text"
//               className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
//               placeholder="Search by name"
//               value={searchQuery}
//               onChange={handleSearchChange}
//             />

//             {filteredStudents.map((student) => (
//               <div
//                 key={`${student.id}-${student.prefix}`}
//                 className="flex items-center mb-4">
//                 <button
//                   className="flex-1 text-white font-bold py-2 px-4 rounded-lg bg-gray-400 hover:bg-gray-700"
//                   onClick={() => handleClick(student)}>
//                   {student.name}
//                 </button>
//                 <div
//                   className="ml-4 h-10 p-2 rounded-lg"
//                   style={{
//                     backgroundColor: getBackgroundColor(student.id),
//                   }}></div>{" "}
//                 {/* Add colored div */}
//               </div>
//             ))}
//           </div>

//           {showPoints && (
//             <div className="fixed inset-0 z-40 flex items-center justify-center">
//               <div
//                 className="fixed inset-0 bg-black opacity-50"
//                 onClick={() => setShowPoints(false)}
//               />
//               <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//                 <p className="text-xl font-bold mb-2">
//                   Points: {currentPoints}
//                 </p>
//                 {paymentStatus && (
//                   <p
//                     className={`mb-2 ${
//                       paymentStatus === "Payment complete"
//                         ? "text-green-500"
//                         : "text-red-500"
//                     }`}>
//                     {paymentStatus}
//                   </p>
//                 )}{" "}
//                 {/* Show payment status */}
//                 <input
//                   type="number"
//                   className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
//                   placeholder="Enter points to pay"
//                   value={paymentAmount}
//                   onChange={(e) => setPaymentAmount(e.target.value)}
//                 />
//                 <button
//                   className="bg-green-500 text-white font-bold py-2 px-4 rounded mb-4"
//                   onClick={() => {
//                     if (!isVisitorView) {
//                       handleClick();
//                     } else {
//                       setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
//                     }
//                   }}>
//                   Confirm Payment
//                 </button>
//                 <button
//                   className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
//                   disabled={paymentAmount !== ""}
//                   onClick={() => {
//                     if (paymentAmount !== "") {
//                       setPaymentStatus("Remove the typed number first");
//                     } else {
//                       setShowPoints(false);
//                       setPaymentStatus(null);
//                     }
//                   }}>
//                   OK
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//       <audio ref={audioRef} />

//     </div>
//   );
// }

// export default Store;
