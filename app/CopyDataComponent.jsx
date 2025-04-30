import React from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { db4 } from './firebaseConfig4';

const CopyDataComponent = () => {
  const copyData = async () => {
    try {
      // Fetch all documents from the "dvbs" collection in db
      const querySnapshot = await getDocs(collection(db, 'dvbs'));
      const dvbsData = [];
      querySnapshot.forEach((doc) => {
        dvbsData.push({ id: doc.id, ...doc.data() });
      });

      // Add each document to the "dvbs" collection in db4 with the same document ID
      for (const docData of dvbsData) {
        const { id, ...data } = docData;
        await setDoc(doc(db4, 'dvbs', id), data);
      }

      console.log('Data copied successfully');
    } catch (error) {
      console.error('Error copying data: ', error);
    }
  };

  return (
    <div>
      <button className="bg-white" onClick={copyData}>Copy Data from db to db4</button>
    </div>
  );
};

export default CopyDataComponent;
