// Visitors.js
import React, { useState, useEffect, Fragment, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { Menu, Transition, Combobox } from "@headlessui/react";
import InvitedByField from "./InvitedByField.jsx";
import { IoMdPersonAdd } from "react-icons/io";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Checkbox } from "@headlessui/react";
import { FaBookBible } from "react-icons/fa6";

function Visitors({
  config,
  currentConfigIndex,
  setCurrentConfigIndex,
  isVisitorView,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newVisitorAddress, setNewVisitorAddress] = useState("");
  const [invitedBy, setInvitedBy] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [age, setAge] = useState("");
  const [broughtBible, setBroughtBible] = useState(false);
  const [primaryData, setPrimaryData] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [visitorID, setVisitorID] = useState(null);
  const audioRef = useRef(null);
  const [addVisitorClicked, setAddVisitorClicked] = useState(false);
  const [paddedIndex, setPaddedIndex] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt

  const predefinedRoutes = [
    "Antipolo Hills",
    "Banaba",
    "Famous",
    "Fatima",
    "Insular",
    "Kaysipot",
    "LaSalle",
    "Mira Verde",
    "Monte Oro",
    "Oreta",
    "Queenstown 1",
    "Queenstown 2",
    "Samba Homes",
    "Sampaga",
    "Brgy. San Luis",
    "Santana",
    "Sarimanok",
    "Solid",
    "Sta. Elena",
    "TakTak Road",
    "Town and Country",

  ];

  const handleClick = () => {
    setBroughtBible(!broughtBible);
  };

  useEffect(() => {
    const fetchPrimary = async () => {
      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );
      const primarySnapshot = await getDoc(docRef);
      if (primarySnapshot.exists()) {
        setPrimaryData(primarySnapshot.data());
        console.log(primarySnapshot.data());
      } else {
        console.error("No such document!");
      }
    };

    fetchPrimary();
  }, [config.dbPath]);

  //wala lang trey rey adfafdasfasfdaf

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

  const handleInputChange = (event, field) => {
    switch (field) {
      case "firstName":
        setFirstName(event.target.value);
        break;
      case "lastName":
        setLastName(event.target.value);
        break;
      case "loc":
        setNewVisitorAddress(event.target.value);
        break;
      case "invitedBy":
        setInvitedBy(event.target.value);
        break;
      case "contactNumber":
        setContactNumber(event.target.value);
        break;
      default:
        break;
    }
  };

  const handleAgeSelect = (age) => {
    setAge(age);
  };

  const handleRouteSelect = (route) => {
    setNewVisitorAddress(route);
  };

  const clearInvitedByField = () => {
    setInvitedBy("");
  };

  const addVisitor = async () => {
    if (
      firstName.trim() === "" ||
      lastName.trim() === "" ||
      newVisitorAddress.trim() === "" ||
      invitedBy.trim() === "" ||
      age === ""
    ) {
      console.error("Please fill in all required fields.");
      setShowPopup(true);
      return;
    }

    try {
      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );
      const existingIndexes = Object.keys(primaryData)
        .filter((key) => key.match(/^\d+/))
        .map((key) => parseInt(key.match(/^\d+/)[0]));
      const newIndex = existingIndexes.length
        ? Math.max(...existingIndexes) + 1
        : 1;
        const paddedIndex = String(newIndex).padStart(3, "0");

      // const paddedIndex = String(newIndex).padStart(2, "0");

      const visitorName = `${
        lastName.trim().charAt(0).toUpperCase() + lastName.trim().slice(1)
      }, ${
        firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1)
      }`;

      setPaddedIndex(paddedIndex);
      setVisitorName(visitorName);

      const newFields = {
        [`${paddedIndex}name`]: visitorName,
        [`${paddedIndex}loc`]: newVisitorAddress,
        [`${paddedIndex}invitedBy`]: invitedBy,
        [`${paddedIndex}contactNumber`]: contactNumber,
        [`${paddedIndex}age`]: age,
        [`${paddedIndex}Aout`]: "",
        [`${paddedIndex}Bout`]: "",
        [`${paddedIndex}Cout`]: "",
        [`${paddedIndex}Dout`]: "",
        [`${paddedIndex}Eout`]: "",
        [`${paddedIndex}Abible`]: false,
        [`${paddedIndex}Bbible`]: false,
        [`${paddedIndex}Cbible`]: false,
        [`${paddedIndex}Dbible`]: false,
        [`${paddedIndex}Ebible`]: false,
        [`${paddedIndex}Apoints`]: getCurrentDayLetter() === "A" ? 1 : 0,
        [`${paddedIndex}Bpoints`]: getCurrentDayLetter() === "B" ? 1 : 0,
        [`${paddedIndex}Cpoints`]: getCurrentDayLetter() === "C" ? 1 : 0,
        [`${paddedIndex}Dpoints`]: getCurrentDayLetter() === "D" ? 1 : 0,
        [`${paddedIndex}Epoints`]: getCurrentDayLetter() === "E" ? 1 : 0,
        [`${paddedIndex}saved`]: false,
        [`${paddedIndex}savedDate`]: "",
        [`${paddedIndex}savedOnDvbs`]: false,
        [`${paddedIndex}invites`]: [],
      };

      setAddVisitorClicked(true);

      const currentDayLetter = getCurrentDayLetter();
      const currentTime = new Date().toLocaleString();
      ["A", "B", "C", "D", "E"].forEach((letter) => {
        newFields[`${paddedIndex}${letter}`] =
          letter === currentDayLetter ? currentTime : "";
        newFields[`${paddedIndex}${letter}bible`] =
          letter === currentDayLetter ? broughtBible : false;

        // Add 3 points if Bible is brought
        if (broughtBible && letter === currentDayLetter) {
          const pointsField = `${paddedIndex}${letter}points`;
          const currentPoints = primaryData[pointsField] || 0;
          newFields[pointsField] = currentPoints + 4;
        }
      });

      await updateDoc(docRef, newFields);

      setFirstName("");
      setLastName("");
      setNewVisitorAddress("");
      setInvitedBy("");
      setContactNumber("");
      setAge("");
      setBroughtBible(false);
      console.log("Visitor added successfully!");

      setPrimaryData((prevData) => ({
        ...prevData,
        ...newFields,
      }));

      setVisitorID({
        id: `${config.dbPath.split("/")[1][0].toUpperCase()}${paddedIndex}`,
        name: visitorName,
        location: newVisitorAddress,
      });

      playEnterSound();
      clearInvitedByField();
    } catch (error) {
      console.error("Error adding visitor: ", error);
    }
    setAddVisitorClicked(false);
  };

  // In your JSX

  const ageOptions = [
    config.ageRange[0],
    config.ageRange[1],
    config.ageRange[2],
  ];

  const playEnterSound = () => {
    const audio = new Audio("/point.wav");
    audio.play();
  };

  return (
    <div className="flex flex-col items-center pb-5 ">
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" />
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="mb-2">Please fill in all required fields.</p>
            <button
              className={`bg-[${config.color}] hover:bg-[${config.color}] text-white font-bold py-2 px-4 rounded`}
              onClick={() => setShowPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {visitorID && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" />
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="text-5xl font-bold text-gray-800">{visitorID.id}</p>
            <p className="text-lg text-gray-800">{visitorID.name}</p>
            <p className="text-md text-gray-800">{visitorID.location}</p>
            <button
              className={`bg-[${config.color}] text-white font-bold py-2 px-4 rounded mt-4`}
              onClick={() => setVisitorID(null)}>
              OK
            </button>
          </div>
        </div>
      )}

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

      <div className="w-full max-w-md bg-white shadow-md rounded-lg border  mx-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Add New Visitor
          </h2>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => handleInputChange(e, "firstName")}
                placeholder="First Name"
                className="border border-gray-300 rounded-lg px-4 py-2 w-1/2 focus:outline-none focus:border-[${config.color}]"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => handleInputChange(e, "lastName")}
                placeholder="Last Name"
                className="border border-gray-300 rounded-lg px-4 py-2 w-1/2 focus:outline-none focus:border-[${config.color}]"
              />
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={newVisitorAddress}
                onChange={(e) => handleInputChange(e, "loc")}
                placeholder="Address/Select Route"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[${config.color}]"
              />
              <Menu as="div" className="relative w-1/2">
                <div>
                  <Menu.Button
                    className={`bg-[${config.color}] flex justify-center text-white text-center inline-flex rounded-md justify-between w-full  shadow-sm px-4 py-2 text-xl font-bold text-gray-700`}>
                    {"Route"}
                    <ChevronDownIcon
                      className="ml-2 -mr-1 h-7 w-7"
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
                  <Menu.Items className="origin-top-right absolute z-50 -right-6 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-2 grid grid-cols-2 divide-y divide-gray-200">
                      {predefinedRoutes.map((route) => (
                        <Menu.Item key={route}>
                          {({ active }) => (
                            <button
                              onClick={() => handleRouteSelect(route)}
                              className={`${
                                active
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700"
                              } block w-full text-left px-4 py-2 text-lg font-medium `}>
                              {route}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>

            <div className="flex items-center">
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button
                    className={`bg-[${config.color}] mr-2 z-50 inline-flex rounded-md  shadow-sm px-4 py-2  text-sm font-medium text-white`}>
                    {age ? `Age: ${age}` : "Age"}
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
                  <Menu.Items className="origin-top-left z-50 w-20 absolute left-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-2 divide-y divide-gray-200">
                      {ageOptions.map((ageOption) => (
                        <Menu.Item key={ageOption}>
                          {({ active }) => (
                            <button
                              onClick={() => handleAgeSelect(ageOption)}
                              className={`${
                                active
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700"
                              } block w-full px-4 py-2 text-sm`}>
                              {ageOption}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <input
                type="text"
                value={contactNumber}
                onChange={(e) => handleInputChange(e, "contactNumber")}
                placeholder="Contact Number (optional)"
                className="flex-grow ml-2 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[${config.color}]"
              />
            </div>

            <div className="w-full mt-5  bg-[#9ca3af] shadow-md rounded-lg border  mx-auto">
              <div className="p-6">
                <InvitedByField
                  invitedBy={invitedBy}
                  handleInputChange={handleInputChange}
                  config={config}
                  clearInvitedBy={clearInvitedByField}
                  addVisitorClicked={addVisitorClicked}
                  paddedIndex={paddedIndex}
                  visitorName={visitorName}
                />
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  broughtBible
                    ? `bg-[${config.color}] text-white`
                    : "bg-[#9ca3af] text-gray-800"
                }`}
                onClick={handleClick}>
                <FaBookBible />
                <span className="text-white font-medium">Bible</span>
              </button>
            </div>
            <button
              className={`bg-[${config.color}] gap-2 text-white font-semibold py-3 px-6 rounded-lg mt-4 w-full flex items-center justify-center transition duration-300 ease-in-out`}
              onClick={() => {
                if (!isVisitorView) {
                  addVisitor();
                } else {
                  setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                }
              }}>
              <IoMdPersonAdd />
              Add Visitor
            </button>
          </div>
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default Visitors;

// import React, { useState, useEffect, Fragment, useRef } from "react";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { db } from "./firebase.js";
// import { Menu, Transition } from "@headlessui/react";
// import InvitedByField from "./InvitedByField";

// function Visitors({ config, currentConfigIndex, setCurrentConfigIndex }) {
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [newVisitorAddress, setNewVisitorAddress] = useState("");
//   const [invitedBy, setInvitedBy] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [age, setAge] = useState("");
//   const [broughtBible, setBroughtBible] = useState(false);
//   const [primaryData, setPrimaryData] = useState({});
//   const [showPopup, setShowPopup] = useState(false);
//   const [visitorID, setVisitorID] = useState(null);
//   const audioRef = useRef(null);

//   const predefinedRoutes = ["Route 1", "Route 2", "Route 3", "Route 4"];

//   useEffect(() => {
//     const fetchPrimary = async () => {
//       const docRef = doc(
//         db,
//         config.dbPath.split("/")[0],
//         config.dbPath.split("/")[1]
//       );
//       const primarySnapshot = await getDoc(docRef);
//       if (primarySnapshot.exists()) {
//         setPrimaryData(primarySnapshot.data());
//         console.log(primarySnapshot.data());
//       } else {
//         console.error("No such document!");
//       }
//     };

//     fetchPrimary();
//   }, [config.dbPath]);

//   const getCurrentDayLetter = () => {
//     const days = ["A", "B", "C", "D", "E", "F", "G"];
//     const dayIndex = new Date().getDay();
//     return days[dayIndex === 0 ? 6 : dayIndex - 1];
//   };

//   const handleInputChange = (event, field) => {
//     switch (field) {
//       case "firstName":
//         setFirstName(event.target.value);
//         break;
//       case "lastName":
//         setLastName(event.target.value);
//         break;
//       case "loc":
//         setNewVisitorAddress(event.target.value);
//         break;
//       case "invitedBy":
//         setInvitedBy(event.target.value);
//         break;
//       case "contactNumber":
//         setContactNumber(event.target.value);
//         break;
//       default:
//         break;
//     }
//   };

//   const handleAgeSelect = (age) => {
//     setAge(age);
//   };

//   const handleRouteSelect = (route) => {
//     setNewVisitorAddress(route);
//   };

//   const addVisitor = async () => {
//     if (
//       firstName.trim() === "" ||
//       lastName.trim() === "" ||
//       newVisitorAddress.trim() === "" ||
//       invitedBy.trim() === "" ||
//       age === ""
//     ) {
//       console.error("Please fill in all required fields.");
//       setShowPopup(true);
//       return;
//     }

//     try {
//       const docRef = doc(
//         db,
//         config.dbPath.split("/")[0],
//         config.dbPath.split("/")[1]
//       );
//       const existingIndexes = Object.keys(primaryData)
//         .filter((key) => key.match(/^\d+/))
//         .map((key) => parseInt(key.match(/^\d+/)[0]));
//       const newIndex = existingIndexes.length
//         ? Math.max(...existingIndexes) + 1
//         : 1;
//       const paddedIndex = String(newIndex).padStart(2, "0");

//       const visitorName = `${
//         lastName.trim().charAt(0).toUpperCase() + lastName.trim().slice(1)
//       }, ${
//         firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1)
//       }`;

//       const newFields = {
//         [`${paddedIndex}name`]: visitorName,
//         [`${paddedIndex}loc`]: newVisitorAddress,
//         [`${paddedIndex}invitedBy`]: invitedBy,
//         [`${paddedIndex}contactNumber`]: contactNumber,
//         [`${paddedIndex}age`]: age,
//         [`${paddedIndex}Aout`]: "",
//         [`${paddedIndex}Bout`]: "",
//         [`${paddedIndex}Cout`]: "",
//         [`${paddedIndex}Dout`]: "",
//         [`${paddedIndex}Eout`]: "",
//         [`${paddedIndex}Abible`]: false,
//         [`${paddedIndex}Bbible`]: false,
//         [`${paddedIndex}Cbible`]: false,
//         [`${paddedIndex}Dbible`]: false,
//         [`${paddedIndex}Ebible`]: false,
//         [`${paddedIndex}Apoints`]: getCurrentDayLetter() === "A" ? 1 : 0,
//         [`${paddedIndex}Bpoints`]: getCurrentDayLetter() === "B" ? 1 : 0,
//         [`${paddedIndex}Cpoints`]: getCurrentDayLetter() === "C" ? 1 : 0,
//         [`${paddedIndex}Dpoints`]: getCurrentDayLetter() === "D" ? 1 : 0,
//         [`${paddedIndex}Epoints`]: getCurrentDayLetter() === "E" ? 1 : 0,
//         [`${paddedIndex}saved`]: false,
//         [`${paddedIndex}savedDate`]: "",
//         [`${paddedIndex}savedOnDvbs`]: false,
//         [`${paddedIndex}invites`]: [],
//       };

//       const currentDayLetter = getCurrentDayLetter();
//       const currentTime = new Date().toLocaleString();
//       ["A", "B", "C", "D", "E"].forEach((letter) => {
//         newFields[`${paddedIndex}${letter}`] =
//           letter === currentDayLetter ? currentTime : "";
//         newFields[`${paddedIndex}${letter}bible`] =
//           letter === currentDayLetter ? broughtBible : false;

//         // Add 3 points if Bible is brought
//         if (broughtBible && letter === currentDayLetter) {
//           const pointsField = `${paddedIndex}${letter}points`;
//           const currentPoints = primaryData[pointsField] || 0;
//           newFields[pointsField] = currentPoints + 4;
//         }
//       });

//       await updateDoc(docRef, newFields);

//       setFirstName("");
//       setLastName("");
//       setNewVisitorAddress("");
//       setInvitedBy("");
//       setContactNumber("");
//       setAge("");
//       setBroughtBible(false);
//       console.log("Visitor added successfully!");

//       setPrimaryData((prevData) => ({
//         ...prevData,
//         ...newFields,
//       }));

//       setVisitorID({
//         id: `${config.dbPath.split("/")[1][0].toUpperCase()}${paddedIndex}`,
//         name: visitorName,
//         location: newVisitorAddress,
//       });

//       playEnterSound();
//     } catch (error) {
//       console.error("Error adding visitor: ", error);
//     }
//   };

//   const ageOptions = [
//     config.ageRange[0],
//     config.ageRange[1],
//     config.ageRange[2],
//   ];

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   return (
//     <div className="flex flex-col items-center pb-5">
//       {showPopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50" />
//           <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//             <p className="mb-2">Please fill in all required fields.</p>
//             <button
//               className={`bg-[${config.color}] hover:bg-[${config.color}] text-white font-bold py-2 px-4 rounded`}
//               onClick={() => setShowPopup(false)}>
//               OK
//             </button>
//           </div>
//         </div>
//       )}

//       {visitorID && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50" />
//           <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//             <p className="text-5xl font-bold text-gray-800">{visitorID.id}</p>
//             <p className="text-lg text-gray-800">{visitorID.name}</p>
//             <p className="text-md text-gray-800">{visitorID.location}</p>
//             <button
//               className={`bg-[${config.color}] text-white font-bold py-2 px-4 rounded mt-4`}
//               onClick={() => setVisitorID(null)}>
//               OK
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="w-full bg-white shadow-md rounded-lg border overflow-hidden mx-auto">
//         <div className="p-6">
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">
//             Add New Visitor
//           </h2>
//           <div className="space-y-6">
//             <div className="flex items-center space-x-4">
//               <input
//                 type="text"
//                 value={firstName}
//                 onChange={(e) => handleInputChange(e, "firstName")}
//                 placeholder="First Name"
//                 className="border border-gray-300 rounded-lg px-4 py-2 w-1/2 focus:outline-none focus:border-[${config.color}]"
//               />
//               <input
//                 type="text"
//                 value={lastName}
//                 onChange={(e) => handleInputChange(e, "lastName")}
//                 placeholder="Last Name"
//                 className="border border-gray-300 rounded-lg px-4 py-2 w-1/2 focus:outline-none focus:border-[${config.color}]"
//               />
//             </div>
//             <div className="flex items-center space-x-4">
//               <Menu
//                 as="div"
//                 className="relative inline-block text-left w-full z-40">
//                 <div>
//                   <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
//                     {age ? `Age: ${age}` : "Select Age"}
//                   </Menu.Button>
//                 </div>
//                 <Transition
//                   as={Fragment}
//                   enter="transition ease-out duration-100"
//                   enterFrom="transform opacity-0 scale-95"
//                   enterTo="transform opacity-100 scale-100"
//                   leave="transition ease-in duration-75"
//                   leaveFrom="transform opacity-100 scale-100"
//                   leaveTo="transform opacity-0 scale-95">
//                   <Menu.Items className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
//                     <div className="py-1">
//                       {ageOptions.map((ageOption) => (
//                         <Menu.Item key={ageOption}>
//                           {({ active }) => (
//                             <button
//                               onClick={() => handleAgeSelect(ageOption)}
//                               className={`${
//                                 active
//                                   ? "bg-gray-100 text-gray-900"
//                                   : "text-gray-700"
//                               } block w-full text-left px-4 py-2 text-sm`}>
//                               {ageOption}
//                             </button>
//                           )}
//                         </Menu.Item>
//                       ))}
//                     </div>
//                   </Menu.Items>
//                 </Transition>
//               </Menu>
//               <div className="flex items-center space-x-4">
//                 <label className="flex items-center space-x-2">
//                   <input
//                     type="checkbox"
//                     checked={broughtBible}
//                     onChange={() => setBroughtBible(!broughtBible)}
//                     className={`form-checkbox h-6 w-6 text-[${config.color}] rounded focus:ring-2 focus:ring-offset-2 focus:ring-${config.color} transition duration-200`}
//                   />
//                   <span className="text-gray-800 font-medium">Bible</span>
//                 </label>
//               </div>
//             </div>

//             <div className="flex items-center space-x-4">
//               <input
//                 type="text"
//                 value={newVisitorAddress}
//                 onChange={(e) => handleInputChange(e, "loc")}
//                 placeholder="Address or Select Route"
//                 className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[${config.color}]"
//               />
//               <Menu as="div" className="relative inline-block text-left w-1/2">
//                 <div>
//                   <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
//                     {"Select Route"}
//                   </Menu.Button>
//                 </div>
//                 <Transition
//                   as={Fragment}
//                   enter="transition ease-out duration-100"
//                   enterFrom="transform opacity-0 scale-95"
//                   enterTo="transform opacity-100 scale-100"
//                   leave="transition ease-in duration-75"
//                   leaveFrom="transform opacity-100 scale-100"
//                   leaveTo="transform opacity-0 scale-95">
//                   <Menu.Items className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
//                     <div className="py-1">
//                       {predefinedRoutes.map((route) => (
//                         <Menu.Item key={route}>
//                           {({ active }) => (
//                             <button
//                               onClick={() => handleRouteSelect(route)}
//                               className={`${
//                                 active
//                                   ? "bg-gray-100 text-gray-900"
//                                   : "text-gray-700"
//                               } block w-full text-left px-4 py-2 text-sm`}>
//                               {route}
//                             </button>
//                           )}
//                         </Menu.Item>
//                       ))}
//                     </div>
//                   </Menu.Items>
//                 </Transition>
//               </Menu>
//             </div>

//             <InvitedByField
//               invitedBy={invitedBy}
//               handleInputChange={handleInputChange}
//               config={config}
//             />

//             {/* <input
//               type="text"
//               value={invitedBy}
//               onChange={(e) => handleInputChange(e, "invitedBy")}
//               placeholder="Invited by"
//               className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[${config.color}]"
//             /> */}
//             <input
//               type="text"
//               value={contactNumber}
//               onChange={(e) => handleInputChange(e, "contactNumber")}
//               placeholder="Contact Number (optional)"
//               className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[${config.color}]"
//             />

//             <button
//               className={`bg-[${config.color}] text-white font-semibold py-3 px-6 rounded-lg mt-4 w-full flex items-center justify-center transition duration-300 ease-in-out`}
//               onClick={addVisitor}>
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-6 w-6 mr-2"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                 />
//               </svg>
//               Add Visitor
//             </button>
//           </div>
//         </div>
//       </div>
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default Visitors;
