import React, { useState, useEffect, useRef, Fragment } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import Confetti from "react-confetti";
import { Menu, Transition, Dialog } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { FaCheckCircle } from "react-icons/fa";

function DailyRewards() {
  const [primaryData, setPrimaryData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("memoryVerse");
  const audioRef = useRef(null);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [studentToUnmark, setStudentToUnmark] = useState(null);

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
      dbPath: "dvbs/primary",
      color: "#FFC100",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
    {
      name: "Middlers",
      dbPath: "dvbs/middlers",
      color: "#04d924",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
    {
      name: "Juniors",
      dbPath: "dvbs/juniors",
      color: "#027df7",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
    {
      name: "Youth",
      dbPath: "dvbs/youth",
      color: "#f70233",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
  ];

  const pointsMapping = {
    memoryVerse: 3,
    bestInCraft: 2,
    bestInActivitySheet: 2,
    bible: 3,
  };

  const currentConfig = configurations[currentConfigIndex];

  useEffect(() => {
    const fetchPrimary = async () => {
      const docRef = doc(
        db,
        currentConfig.dbPath.split("/")[0],
        currentConfig.dbPath.split("/")[1]
      );
      const primarySnapshot = await getDoc(docRef);
      if (primarySnapshot.exists()) {
        setPrimaryData(primarySnapshot.data());
      } else {
        console.error("No such document!");
      }
    };

    fetchPrimary();
  }, [currentConfig.dbPath]);

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

  const handleClick = (fieldName) => {
    const prefix = fieldName.slice(0, 3);
    const dayLetter = getCurrentDayLetter();
    const fieldToUpdate = `${prefix}${dayLetter}${selectedField}`;

    if (primaryData[fieldToUpdate]) {
      setStudentToUnmark({ fieldName, fieldToUpdate });
      setShowConfirmation(true);
    } else {
      updateStudentAttendance(fieldToUpdate, true);
    }
  };

  const updateStudentAttendance = async (fieldToUpdate, markAs) => {
    const prefix = fieldToUpdate.slice(0, 3);
    const dayLetter = getCurrentDayLetter();
    const pointField = `${prefix}${dayLetter}points`;
    const increment = pointsMapping[selectedField];

    try {
      const docRef = doc(
        db,
        currentConfig.dbPath.split("/")[0],
        currentConfig.dbPath.split("/")[1]
      );

      await updateDoc(docRef, {
        [fieldToUpdate]: markAs,
        [pointField]:
          (primaryData[pointField] || 0) + (markAs ? increment : -increment),
      });

      setPrimaryData((prevData) => ({
        ...prevData,
        [fieldToUpdate]: markAs,
        [pointField]:
          (prevData[pointField] || 0) + (markAs ? increment : -increment),
      }));
    } catch (error) {
      console.error("Error updating document: ", error);
    }

    setShowConfirmation(false);
    setStudentToUnmark(null);
  };

  const getButtonColor = (fieldName) => {
    const prefix = fieldName.slice(0, 3);
    const dayLetter = getCurrentDayLetter();
    const fieldToCheck = `${prefix}${dayLetter}${selectedField}`;
    return primaryData[fieldToCheck];
  };

  const sortedNames = Object.keys(primaryData)
    .filter((fieldName) => fieldName.endsWith("name"))
    .map((fieldName) => {
      const prefix = fieldName.slice(0, 3);
      const dayLetter = getCurrentDayLetter();
      const fieldToCheck = `${prefix}${dayLetter}${selectedField}`;
      return {
        name: primaryData[fieldName],
        isMarked: primaryData[fieldToCheck],
      };
    })
    .sort((a, b) => (a.isMarked === b.isMarked ? 0 : a.isMarked ? -1 : 1))
    .map((student) => student.name);

  const filteredNames = sortedNames.filter((name) => {
    const nameMatches = name.toLowerCase().includes(searchQuery.toLowerCase());
    const fieldIndexMatches = Object.keys(primaryData).some(
      (key) =>
        primaryData[key] === name &&
        key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return nameMatches || fieldIndexMatches;
  });

  return (
    <div
      className="h-screen overflow-auto"
      style={{ backgroundColor: currentConfig.color }}>
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto" style={{ maxWidth: "90%" }}>
          <div className="flex   flex-col gap-4">
            <div className="w-full  ">
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
                            Rewards
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Allows us to give different rewards to students by clicking the dropdown. Rewards are indicated by 5 bars.
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
              <Menu as="div" className="relative inline-block mt-4">
                <div>
                  <Menu.Button className="inline-flex justify-center w-full rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
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
                  as={Fragment}
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
                              active
                                ? "bg-blue-500 text-white"
                                : "text-gray-900"
                            } flex w-full items-center rounded-lg px-4 py-4 text-2xl font-semibold hover:bg-blue-100 transition-colors duration-200`}>
                            {config.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>

            <div className="w-full max-w-md mx-auto">
              <Menu as="div" className="relative inline-block w-full mb-4">
                <div>
                  <Menu.Button className="inline-flex justify-center w-full rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                    <h2 className="text-2xl font-bold">
                      {selectedField
                        ? selectedField
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                            .replace(/\b\w/g, (char) => char.toUpperCase())
                        : "Select Field to Modify"}
                    </h2>
                    <ChevronDownIcon
                      className="ml-2 -mr-1 h-8 w-10"
                      aria-hidden="true"
                    />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute mt-2 origin-top divide-y divide-gray-100 rounded-lg bg-gradient-to-b from-gray-100 to-white shadow-xl ring-1 ring-black/5 focus:outline-none flex flex-col items-center z-50">
                    {currentConfig.fields.map((field, index) => (
                      <Menu.Item key={index}>
                        {({ active }) => (
                          <button
                            onClick={() => setSelectedField(field)}
                            className={`${
                              active
                                ? "bg-blue-500 text-white"
                                : "text-gray-900"
                            } flex w-full items-center rounded-lg px-4 py-4 text-2xl font-semibold hover:bg-blue-100 transition-colors duration-200`}>
                            {field
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>

          <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
            <input
              type="text"
              placeholder="Search by name or ID no."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex flex-col gap-4 ">
              {filteredNames.map((name, index) => {
                const studentIndex = Object.keys(primaryData).find(
                  (key) => primaryData[key] === name
                );
                const savedFieldName = `${studentIndex.slice(0, -4)}saved`; // Construct the saved field name

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between">
                    <button
                      className="flex-grow flex items-center justify-center gap-2 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg"
                      style={{
                        backgroundColor: primaryData[
                          `${studentIndex.slice(
                            0,
                            3
                          )}${getCurrentDayLetter()}${selectedField}`
                        ]
                          ? currentConfig.color
                          : "#9ca3af",
                      }}
                      onClick={() => {
                        handleClick(studentIndex);
                      }}>
                      <span>{name}</span> {/* Name */}
                      {primaryData[savedFieldName] && <FaCheckCircle />}{" "}
                      {/* Check if saved is true */}
                    </button>
                    <div className="flex ml-1 border-2 border-gray-400 p-1 rounded-md">
                      {["A", "B", "C", "D", "E"].map((dayLetter) => {
                        const fieldName = `${studentIndex.slice(
                          0,
                          3
                        )}${dayLetter}${selectedField}`;
                        const indicatorColor = primaryData[fieldName]
                          ? currentConfig.color
                          : "#9ca3af";
                        return (
                          <div
                            key={dayLetter}
                            className="w-4 h-7 rounded-lg mr-1"
                            style={{ backgroundColor: indicatorColor }}></div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Unmark Confirmation</h2>
            <p className="mb-4">
              Are you sure you want to unmark this student?
            </p>
            <div className="flex justify-end">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                onClick={() =>
                  updateStudentAttendance(studentToUnmark.fieldToUpdate, false)
                }>
                Yes
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded"
                onClick={() => setShowConfirmation(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
      <audio ref={audioRef} />
    </div>
  );
}

export default DailyRewards;
