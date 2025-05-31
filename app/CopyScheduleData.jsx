// import React, { useState } from 'react';
// import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
// import { db3 } from './firebaseConfig3.js'; // Assuming db3 is your initialized Firestore instance

// const CopyScheduleData = () => {
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   const copyData = async () => {
//     setLoading(true);
//     setMessage('');

//     try {
//       const sourceCollectionName = 'sched';
//       const targetCollectionName = 'sched2025';

//       // Get a reference to the source collection
//       const sourceCollectionRef = collection(db3, sourceCollectionName);
//       // Fetch all documents from the source collection
//       const sourceDocsSnapshot = await getDocs(sourceCollectionRef);

//       // Prepare an array of promises for copying each document
//       const copyPromises = sourceDocsSnapshot.docs.map(async (sourceDoc) => {
//         // Get the document data and ID from the source
//         const docData = sourceDoc.data();
//         const docId = sourceDoc.id;

//         // Create a reference to the target document in the new collection with the same ID
//         const targetDocRef = doc(db3, targetCollectionName, docId);
//         // Set (overwrite or create) the document in the target collection with the source data
//         await setDoc(targetDocRef, docData);
//         console.log(`Copied document: ${sourceCollectionName}/${docId} to ${targetCollectionName}/${docId}`);
//       });

//       // Wait for all document copy operations to complete
//       await Promise.all(copyPromises);

//       setMessage(`All data from "${sourceCollectionName}" collection copied successfully to "${targetCollectionName}" collection.`);
//     } catch (error) {
//       console.error("Error copying data:", error);
//       setMessage(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 font-sans">
//       <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
//         <h1 className="text-3xl font-extrabold mb-6 text-gray-800">
//           Copy <span className="text-blue-600">'sched'</span> to <span className="text-blue-600">'sched2025'</span>
//         </h1>

//         <p className="text-gray-600 mb-6">
//           This tool will copy all documents from your Firebase Firestore's
//           <span className="font-semibold text-blue-600"> 'sched' </span>
//           collection to a new
//           <span className="font-semibold text-blue-600"> 'sched2025' </span>
//           collection.
//           <br />
//           <span className="font-semibold text-red-500">
//             Ensure your Firebase security rules allow read access to 'sched' and write access to 'sched2025' for this to work.
//           </span>
//         </p>

//         <button
//           onClick={copyData}
//           disabled={loading}
//           className={`w-full py-3 px-6 rounded-lg text-white font-bold text-lg transition duration-300 ease-in-out transform ${
//             loading
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
//           } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75`}
//         >
//           {loading ? 'Copying...' : 'Start Copying Data'}
//         </button>

//         {message && (
//           <p className={`mt-6 text-lg font-medium ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
//             {message}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CopyScheduleData;



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
      const primaryDocRef = doc(db3, 'sched2025', 'youth');
      const primaryDocSnapshot = await getDoc(primaryDocRef);

      if (!primaryDocSnapshot.exists()) {
        throw new Error('Primary document does not exist!');
      }

      const primaryData = primaryDocSnapshot.data();

      // Get all documents in the sched collection
      const schedCollectionRef = collection(db3, 'sched2025');
      const schedDocsSnapshot = await getDocs(schedCollectionRef);

      const promises = schedDocsSnapshot.docs.map(async (schedDoc) => {
        if (schedDoc.id !== 'youth') {
          const targetDocRef = doc(db3, 'sched2025', schedDoc.id);
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
