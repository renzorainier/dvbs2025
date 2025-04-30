import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config

function CopyPointsButton({ config }) {
  const [primaryData, setPrimaryData] = useState({});
  const [copyInProgress, setCopyInProgress] = useState(false);

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
      } else {
        console.error("No such document!");
      }
    };

    fetchPrimary();
  }, [config.dbPath]);

  const copyPoints = async () => {
    try {
      const dayLetter = getCurrentDayLetter();
      const prevDayLetter = getPreviousDayLetter(dayLetter);

      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );

      for (const fieldName in primaryData) {
        if (fieldName.endsWith(prevDayLetter + "points")) {
          const currentPointsField = fieldName.replace(prevDayLetter, dayLetter);
          await updateDoc(docRef, {
            [currentPointsField]: primaryData[fieldName] || 0,
          });
          setPrimaryData((prevData) => ({
            ...prevData,
            [currentPointsField]: primaryData[fieldName] || 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error updating Firebase: ", error);
    }

    setCopyInProgress(false);
  };

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const getPreviousDayLetter = (currentDayLetter) => {
    const days = ["A", "B", "C", "D", "E"];
    const currentIndex = days.indexOf(currentDayLetter);
    const prevIndex = currentIndex === 0 ? 4 : currentIndex - 1;
    return days[prevIndex];
  };

  return (
    <div className="flex justify-center items-center">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          if (!copyInProgress) {
            setCopyInProgress(true);
            copyPoints();
          }
        }}
        disabled={copyInProgress}
      >
        {copyInProgress ? "Copying..." : "Copy Points from Previous Day"}
      </button>
    </div>
  );
}

export default CopyPointsButton;
