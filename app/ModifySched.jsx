import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db3 } from './firebaseConfig3.js'; // Assuming db3 is your initialized Firestore instance

const ModifySched = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Base schedule data for A-D, which will be combined with E-I for each group
  const baseScheduleAD = {
    A: "Registration/Attendance",
    Aend: "08:30",
    Aloc: "Ground Floor",
    Astart: "07:30",
    B: "Opening Assembly",
    Bend: "09:00",
    Bloc: "Sanctuary",
    Bstart: "08:30",
    C: "Bible Exploration Time",
    Cend: "09:35",
    Cloc: "K4",
    Cstart: "09:00",
    D: "Gospel Sharing ",
    Dend: "09:50",
    Dloc: "Grade 6",
    Dstart: "09:35",
  };

  // Schedule data for E-I for each specific group, derived from the image
  const schedulesByGroup = {
    primary: {
      E: "Snacks",
      Eend: "10:20",
      Eloc: "Classroom",
      Estart: "10:00",
      F: "Games",
      Fend: "10:40",
      Floc: "Quadrangle",
      Fstart: "10:20",
      G: "Crafts",
      Gend: "11:00",
      Gloc: "Classroom",
      Gstart: "10:40",
      H: "Closing Assembly",
      Hend: "11:20",
      Hloc: "Sanctuary",
      Hstart: "11:00",
      I: "Departure",
      Iend: "12:00",
      Iloc: "Ground Floor",
      Istart: "11:20"
    },
    middlers: {
      E: "Games",
      Eend: "10:20",
      Eloc: "Classroom",
      Estart: "10:00",
      F: "Snacks",
      Fend: "10:40",
      Floc: "Classroom",
      Fstart: "10:20",
      G: "Crafts",
      Gend: "11:00",
      Gloc: "Quadrangle",
      Gstart: "10:40",
      H: "Closing Assembly",
      Hend: "11:20",
      Hloc: "Sanctuary",
      Hstart: "11:00",
      I: "Departure",
      Iend: "12:00",
      Iloc: "Ground Floor",
      Istart: "11:20"
    },
    juniors: {
      E: "Crafts",
      Eend: "10:20",
      Eloc: "Quadrangle",
      Estart: "10:00",
      F: "Games",
      Fend: "10:40",
      Floc: "Classroom",
      Fstart: "10:20",
      G: "Snacks",
      Gend: "11:00",
      Gloc: "Classroom",
      Gstart: "10:40",
      H: "Closing Assembly",
      Hend: "11:20",
      Hloc: "Sanctuary",
      Hstart: "11:00",
      I: "Departure",
      Iend: "12:00",
      Iloc: "Ground Floor",
      Istart: "11:20"
    },
    youth: {
      E: "Crafts",
      Eend: "10:20",
      Eloc: "Classroom",
      Estart: "10:00",
      F: "Games",
      Fend: "10:40",
      Floc: "Quadrangle",
      Fstart: "10:20",
      G: "Snacks",
      Gend: "11:00",
      Gloc: "Classroom",
      Gstart: "10:40",
      H: "Closing Assembly",
      Hend: "11:20",
      Hloc: "Sanctuary",
      Hstart: "11:00",
      I: "Departure",
      Iend: "12:00",
      Iloc: "Ground Floor",
      Istart: "11:20"
    }
  };

  const updateData = async () => {
    setLoading(true);
    setMessage('');

    try {
      const documentIds = ['primary', 'middlers', 'juniors', 'youth'];
      const updatePromises = documentIds.map(async (docId) => {
        const targetDocRef = doc(db3, 'sched2025', docId);

        // Combine base A-D schedule with specific E-I schedule for the current group
        const fullScheduleForGroup = {
          ...baseScheduleAD,
          ...schedulesByGroup[docId]
        };

        // Set the document with the combined schedule data.
        // This will overwrite existing data or create the document if it doesn't exist.
        await setDoc(targetDocRef, fullScheduleForGroup);
        console.log(`Updated sched2025/${docId} with:`, fullScheduleForGroup);
      });

      await Promise.all(updatePromises); // Wait for all document updates to complete

      setMessage('Successfully updated schedules for primary, middlers, juniors, and youth in "sched2025" collection.');
    } catch (error) {
      console.error("Error updating schedule data:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-extrabold mb-6 text-gray-800">
          Update <span className="text-blue-600">'sched2025'</span> Schedules
        </h1>

        <p className="text-gray-600 mb-6">
          This tool will update the `primary`, `middlers`, `juniors`, and `youth` documents
          within your Firebase Firestore's
          <span className="font-semibold text-blue-600"> 'sched2025' </span>
          collection with their respective predefined schedules.
          <br />
          <span className="font-semibold text-red-500">
            Ensure your Firebase security rules allow write access to these documents for this to work.
          </span>
        </p>

        <button
          onClick={updateData}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg text-white font-bold text-lg transition duration-300 ease-in-out transform ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75`}
        >
          {loading ? 'Updating All Schedules...' : 'Update All Schedules'}
        </button>

        {message && (
          <p className={`mt-6 text-lg font-medium ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ModifySched;
