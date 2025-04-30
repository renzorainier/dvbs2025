import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config

function InitializeData() {
  const prefixes = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
  const suffixes = ["name", "loc", "A", "B", "C", "D", "E", "invitedby", "contact"];

  const initializeData = async () => {
    try {
      for (const prefix of prefixes) {
        const data = {};
        for (const suffix of suffixes) {
          data[`${prefix}${suffix}`] = "";
        }

        const docRef = doc(db, "dvbs", "primary");
        await setDoc(docRef, data, { merge: true });
      }
      console.log("Data initialized successfully");
    } catch (error) {
      console.error("Error initializing data: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
        <div className="flex flex-col gap-2 w-full">
          <button
            className="hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl bg-gray-200"
            onClick={initializeData}
          >
            Initialize Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default InitializeData;
