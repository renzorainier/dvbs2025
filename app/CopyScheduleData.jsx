import React, { useState } from 'react';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { db3 } from './firebaseConfig3.js';

const CopyScheduleData = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const copyData = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Get the primary document
      const primaryDocRef = doc(db3, 'sched', 'primary');
      const primaryDocSnapshot = await getDoc(primaryDocRef);

      if (!primaryDocSnapshot.exists()) {
        throw new Error('Primary document does not exist!');
      }

      const primaryData = primaryDocSnapshot.data();

      // Get all documents in the sched collection
      const schedCollectionRef = collection(db3, 'sched');
      const schedDocsSnapshot = await getDocs(schedCollectionRef);

      const promises = schedDocsSnapshot.docs.map(async (schedDoc) => {
        if (schedDoc.id !== 'primary') {
          const targetDocRef = doc(db3, 'sched', schedDoc.id);
          await setDoc(targetDocRef, primaryData);
        }
      });

      await Promise.all(promises);

      setMessage('Data copied successfully to all documents in the sched collection.');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Copy Schedule Data</h1>
      <button
        onClick={copyData}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Copying...' : 'Copy Data'}
      </button>
      {message && <p className="mt-4 text-lg">{message}</p>}
    </div>
  );
};

export default CopyScheduleData;
