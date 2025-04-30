import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config

function CopyPreviousDayPoints() {
  const [primaryData, setPrimaryData] = useState({});

  useEffect(() => {
    const fetchPrimary = async () => {
      try {
        const docRef = doc(db, "dvbs", "primary");
        const primarySnapshot = await getDoc(docRef);
        if (primarySnapshot.exists()) {
          setPrimaryData(primarySnapshot.data());
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching primary data: ", error);
      }
    };

    fetchPrimary();
  }, []);

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

  const copyPreviousDayPoints = async () => {
    try {
      const dayLetter = getCurrentDayLetter();
      const prevDayLetter = getPreviousDayLetter(dayLetter);

      for (const key in primaryData) {
        if (key.endsWith(prevDayLetter + "points")) {
          const newValue = primaryData[key];
          const fieldName = key.replace(prevDayLetter + "points", dayLetter + "points");

          // Console log the field name being updated
          console.log("Updating field:", fieldName);

          await updateDoc(doc(db, "dvbs", "primary"), {
            [fieldName]: newValue,
          });
        }
      }

      alert("Previous day's points copied to today successfully!");
    } catch (error) {
      console.error("Error updating Firebase: ", error);
      alert("Error occurred while copying points. Please try again later.");
    }
  };

  return (
    <div className="flex justify-center mt-5">
      <button
        onClick={copyPreviousDayPoints}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Copy Previous Days Points to Today
      </button>
    </div>
  );
}

export default CopyPreviousDayPoints;
