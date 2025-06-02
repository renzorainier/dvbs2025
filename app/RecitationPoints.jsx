import React, { useState, useEffect, Fragment, useRef } from "react";
import { collection, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import { Menu, Transition, Dialog } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
// IoIosBackspace is not needed for this component as there's no manual input to clear.

function RecitationPoints({ isVisitorView }) {
  const [students, setStudents] = useState([]);
  // Set the default selectedCategory to "primary"
  const [selectedCategory, setSelectedCategory] = useState("primary");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState(null); // To show general success/error messages at the top
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // For visitor view
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false); // State for the success floating prompt
  const [floatingPromptMessage, setFloatingPromptMessage] = useState(""); // Message for the success floating prompt
  const audioRef = useRef(null); // For playing sound

  // New states for the confirmation floating div
  const [showConfirmationDiv, setShowConfirmationDiv] = useState(false);
  const [studentToConfirm, setStudentToConfirm] = useState(null);

  // Define the categories for filtering
  const categories = ["primary", "middlers", "juniors", "youth"];

  // State for the initial instructional modal
  let [isOpen, setIsOpen] = useState(true);

  function closeModal() {
    setIsOpen(false);
  }

  // Effect to fetch student data from Firestore in real-time
  useEffect(() => {
    // Set up a real-time listener to the 'dvbs' collection
    const unsubscribe = onSnapshot(collection(db, "dvbs"), (snapshot) => {
      // Map the document data to an array of student objects
      const studentData = snapshot.docs.map((doc) => ({
        id: doc.id, // This 'id' is the document ID (e.g., "primary", "middlers")
        ...doc.data(),
      }));

      console.log("Fetched student data:", studentData); // Log fetched student data

      // Determine the current day's letter (A-E)
      const currentDayLetter = getCurrentDayLetter();

      // Filter and transform student data to include only present students for the current day
      const presentStudents = studentData
        .map((group) => {
          const groupStudents = [];
          // Iterate through keys in each group document
          for (const key in group) {
            // Check if the key ends with the current day's letter, indicating an 'in-time' field
            if (key.endsWith(currentDayLetter)) {
              const prefix = key.slice(0, 3); // Extract prefix (e.g., 'pri', 'mid')
              const inTimeField = `${prefix}${currentDayLetter}`; // Construct the 'in-time' field name
              const pointsField = `${prefix}${currentDayLetter}points`; // Construct the 'points' field name

              // If the student is marked as present for the current day
              if (group[inTimeField]) {
                groupStudents.push({
                  id: group.id, // The document ID (e.g., "primary", "middlers"), used as category
                  prefix, // The shortened prefix (e.g., "pri", "mid", "023")
                  inTimeField,
                  pointsField,
                  name: group[`${prefix}name`], // Get student name
                  location: group[`${prefix}loc`], // Get student location (kept for reference in student object)
                  points: group[pointsField], // Get current points
                });
              }
            }
          }
          return groupStudents;
        })
        .flat(); // Flatten the array of arrays into a single array

      console.log("Present students:", presentStudents); // Log present students

      // Sort students alphabetically by name
      presentStudents.sort((a, b) => a.name.localeCompare(b.name));

      // Update state with fetched and processed data
      setStudents(presentStudents);
      setLoading(false); // Set loading to false once data is fetched
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Function to get the current day's letter for dynamic field access
  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"]; // Days A-E for Monday-Friday
    const dayIndex = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
    // Return the corresponding letter, default to E if outside Monday-Friday (Friday if it's weekend)
    const currentDay = new Date().getDay();
    if (currentDay >= 1 && currentDay <= 5) {
      return days[currentDay - 1];
    } else {
      // If it's Saturday (6) or Sunday (0), default to Friday's data 'E'
      return 'E';
    }
  };

  // Handles click on student name to show confirmation div
  const handleStudentClick = (student) => {
    if (isVisitorView) {
      setShowVisitorPrompt(true);
      return;
    }
    setStudentToConfirm(student);
    setShowConfirmationDiv(true);
    setUpdateStatus(null); // Clear previous status messages
  };

  // Handles adding 1 point after confirmation
  const confirmAddPoint = async () => {
    if (!studentToConfirm) {
      setUpdateStatus("Error: No student selected for confirmation.");
      return;
    }

    const docRef = doc(db, "dvbs", studentToConfirm.id); // Reference to the student's document
    const pointsField = studentToConfirm.pointsField; // The specific points field for the current day

    try {
      // Calculate new points (current points + 1)
      const newPoints = studentToConfirm.points + 1;

      // Update the document in Firestore
      await updateDoc(docRef, {
        [pointsField]: newPoints,
      });

      // Update the local state to reflect the new points immediately
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id === studentToConfirm.id && s.prefix === studentToConfirm.prefix
            ? { ...s, points: newPoints }
            : s
        )
      );

      // Set and show the floating prompt for success
      setFloatingPromptMessage(`+1 Point for ${studentToConfirm.name}!`);
      setShowFloatingPrompt(true);

      // Hide the floating prompt after 2 seconds
      setTimeout(() => {
        setShowFloatingPrompt(false);
        setFloatingPromptMessage("");
      }, 3000); // 2 seconds

      setUpdateStatus(`1 point added to ${studentToConfirm.name}!`); // Success message for the status bar
      playEnterSound(); // Play sound effect
      setShowConfirmationDiv(false); // Close the confirmation div
      setStudentToConfirm(null); // Clear the student to confirm
    } catch (error) {
      console.error("Error updating points: ", error);
      setUpdateStatus("Error updating points. Please try again."); // Error message
      setShowConfirmationDiv(false); // Close the confirmation div on error
      setStudentToConfirm(null); // Clear the student to confirm
    }
  };

  // Handles canceling the point addition
  const cancelAddPoint = () => {
    setShowConfirmationDiv(false);
    setStudentToConfirm(null);
    setUpdateStatus(null); // Clear any pending status
  };

  // Handles category filter change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Handles search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filters students based on search query and selected category (student.id)
  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((student) =>
      selectedCategory ? student.id === selectedCategory : true
    );

  // Determines background color based on the full group name (e.g., "primary", "middlers")
  const getBackgroundColor = (fullGroupName) => {
    switch (fullGroupName) {
      case "primary":
        return "#FFC100";
      case "middlers":
        return "#04d924";
      case "juniors":
        return "#027df7";
      case "youth":
        return "#f70233";
      default:
        return "#FFFFFF"; // Default color if group name doesn't match
    }
  };

  // Plays a sound effect
  const playEnterSound = () => {
    const audio = new Audio("/point.wav"); // Assumes 'point.wav' is in the public folder
    audio.play();
  };

  // Function to get the main background color based on selected category
  const getMainBackgroundColor = (category) => {
    switch (category) {
      case "primary":
        return "#FFC100";
      case "middlers":
        return "#04d924";
      case "juniors":
        return "#027df7";
      case "youth":
        return "#f70233";
      default:
        return "#9ca3af"; // Default gray if no category or unknown category
    }
  };

  return (
    <div
      className="h-screen overflow-auto font-inter relative transition-colors duration-500" // Added transition-colors
      style={{ backgroundColor: getMainBackgroundColor(selectedCategory) }} // Dynamically set background color
    >
      {/* Visitor View Prompt Modal */}
      {showVisitorPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="mb-4 text-center">
              You are in visitor view. This feature is disabled.
            </p>
            <button
              className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowVisitorPrompt(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Floating Success Prompt */}
      <Transition
        show={showFloatingPrompt}
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 translate-y-full"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-full"
      >
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg text-lg font-semibold">
          {floatingPromptMessage}
        </div>
      </Transition>

      {/* Confirmation Floating Div */}
      <Transition
        show={showConfirmationDiv}
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" />
          <div className="bg-white rounded-lg p-6 shadow-xl z-10 flex flex-col items-center max-w-sm w-full mx-4">
            {studentToConfirm && (
              <>
                <p className="text-2xl font-bold mb-2 text-gray-800">
                  {studentToConfirm.name}
                </p>

                <p className="text-xl font-semibold text-gray-700 mb-4">
                  Current Points: {studentToConfirm.points}
                </p>
                <button
                  className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 w-full mb-3"
                  onClick={confirmAddPoint}
                >
                  Add 1 Point
                </button>
                <button
                  className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 w-full"
                  onClick={cancelAddPoint}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </Transition>

      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto" style={{ maxWidth: "90%" }}>
          {/* Initial Instructional Modal */}
          <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={closeModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
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
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Recitation Points
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          To award a recitation point, simply click on a
                          student's name. A confirmation prompt will appear.
                          Click "Add 1 Point" to confirm and update their score.
                        </p>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-[#9BCF53] px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          onClick={closeModal}
                        >
                          Got it, thanks!
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          {/* Category Filter Dropdown */}
          <Menu as="div" className="relative inline-block mt-5 mb-3">
            <div>
              <Menu.Button className="inline-flex rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <h2 className="text-4xl font-bold capitalize">
                  {selectedCategory} {/* Displays the selected category, defaults to "primary" */}
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
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {/* Removed "All Categories" Menu.Item */}
                  {categories.map((category) => (
                    <Menu.Item key={category}>
                      {({ active }) => (
                        <button
                          className={`${
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block px-4 py-2 text-2xl font-semibold text-left w-full capitalize`}
                          onClick={() => handleCategoryChange(category)}
                        >
                          {category}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Search Bar and Student List */}
          <div className="w-full max-w-md text-gray-700 bg-white mt-5 p-5 border rounded-lg shadow-lg mx-auto">
            <input
              type="text"
              className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by name"
              value={searchQuery}
              onChange={handleSearchChange}
            />

            {/* Display general update status (less prominent now) */}
            {updateStatus && (
              <p
                className={`mb-4 text-center font-semibold ${
                  updateStatus.includes("added")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {updateStatus}
              </p>
            )}

            {loading ? (
              <p className="text-center text-gray-600">Loading students...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-center text-gray-600">No students found.</p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={`${student.id}-${student.prefix}`}
                  className="flex items-center mb-4 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    className="flex-1 text-white font-bold py-3 px-4 rounded-l-lg bg-gray-600 hover:bg-gray-800 transition-colors duration-200 text-left text-l"
                    onClick={() => handleStudentClick(student)}
                  >
                    {student.name} - {student.id.charAt(0).toUpperCase()}
                    {student.prefix}
                  </button>

                  <div
                    className="h-full p-3 rounded-r-lg flex items-center justify-center text-white text-l font-bold"
                    style={{
                      backgroundColor: getBackgroundColor(student.id), // Using student.id for coloring
                      width: "100px", // Fixed width for points display
                    }}
                  >
                    <span>{student.points} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default RecitationPoints;
