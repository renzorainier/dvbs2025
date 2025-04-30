import React, { useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

function UpdateFieldNames() {
  useEffect(() => {
    const updateFieldNames = async () => {
      try {
        const documents = ["primary", "middlers", "juniors", "youth"];

        for (const docName of documents) {
          const docRef = doc(db, "dvbs", docName);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const newData = {};

            for (const key in data) {
              // Add "0" in front of each field name and copy the values
              const newKey = `0${key}`;
              newData[newKey] = data[key];
            }

            await setDoc(docRef, newData);
            console.log(`Field names updated for document ${docName}`);
          } else {
            console.error(`Document ${docName} does not exist!`);
          }
        }
      } catch (error) {
        console.error("Error updating field names:", error);
      }
    };

    updateFieldNames();
  }, []);

  return <div>Updating field names...</div>;
}

export default UpdateFieldNames;
