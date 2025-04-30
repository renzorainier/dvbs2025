import React, { useState, useEffect, useRef, Fragment } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import { Menu, Transition , Dialog} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { FaCheckCircle } from "react-icons/fa";

function SalvationDecision() {
  const [primaryData, setPrimaryData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const audioRef = useRef(null);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [studentToUnmark, setStudentToUnmark] = useState(null);
  const [studentToMark, setStudentToMark] = useState(null);


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
    },
    {
      name: "Middlers",
      dbPath: "dvbs/middlers",
      color: "#04d924",
    },
    {
      name: "Juniors",
      dbPath: "dvbs/juniors",
      color: "#027df7",
    },
    {
      name: "Youth",
      dbPath: "dvbs/youth",
      color: "#f70233",
    },
  ];

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

  const handleClick = (fieldName) => {
    const savedFieldName = `${fieldName.slice(0, -4)}saved`;
    if (primaryData[savedFieldName]) {
      setStudentToUnmark({ fieldName, savedFieldName });
      setShowConfirmation(true);
    } else {
      setStudentToMark({ fieldName, savedFieldName });
      setShowSaveConfirmation(true);
    }
  };
  const updateStudentSalvationDecision = async (fieldToUpdate, markAs, savedOnDvbs = false) => {
    try {
      const docRef = doc(
        db,
        currentConfig.dbPath.split("/")[0],
        currentConfig.dbPath.split("/")[1]
      );

      const updates = {
        [fieldToUpdate]: markAs,
      };

      if (markAs && savedOnDvbs) {
        updates[`${fieldToUpdate.slice(0, -5)}savedOnDvbs`] = true;
        updates[`${fieldToUpdate.slice(0, -5)}savedDate`] = new Date();
      } else {
        // Clear savedOnDvbs and savedDate fields if not saved on DVBS
        updates[`${fieldToUpdate.slice(0, -5)}savedOnDvbs`] = false;
        updates[`${fieldToUpdate.slice(0, -5)}savedDate`] = "";
      }

      await updateDoc(docRef, updates);

      setPrimaryData((prevData) => ({
        ...prevData,
        ...updates,
      }));

      // Play audio if the student is marked as saved
      if (markAs) {
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }

    setShowConfirmation(false);
    setStudentToUnmark(null);
    setShowSaveConfirmation(false);
    setStudentToMark(null);
  };


  const sortedNames = Object.keys(primaryData)
    .filter((fieldName) => fieldName.endsWith("name"))
    .map((fieldName) => {
      return {
        name: primaryData[fieldName],
        isMarked: primaryData[`${fieldName.slice(0, -4)}saved`],
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
          <div className="flex flex-col gap-4">
            <div className="w-full">
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
                            Salvation
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                            Allows us to mark students, whether saved on DVBS or already saved, with salvation indicated by a checkmark on all lists.                            </p>
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
          </div>

          <div className="w-full mt-4 max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
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
                        backgroundColor: primaryData[savedFieldName]
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {showSaveConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Mark Student as Saved</h2>
            <p className="mb-4">
              Was this student saved during DVBS?
            </p>
            <div className="flex justify-end">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                onClick={() =>
                  updateStudentSalvationDecision(
                    studentToMark.savedFieldName,
                    true,
                    true
                  )
                }>
                Yes
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                onClick={() =>
                  updateStudentSalvationDecision(
                    studentToMark.savedFieldName,
                    true,
                    false
                  )
                }>
                No
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded"
                onClick={() => setShowSaveConfirmation(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
                  updateStudentSalvationDecision(
                    studentToUnmark.savedFieldName,
                    false
                  )
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
      <audio ref={audioRef} src="point.wav" /> {/* Update with your audio file */}
    </div>
  );
}

export default SalvationDecision;
