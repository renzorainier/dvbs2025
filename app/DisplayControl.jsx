import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db2 } from "./firebaseConfig2"; // Adjust the path if necessary
import AttendanceChart from "./AttendanceChart";
import PointingSystemGraph from "./PointingSystemGraph";
import Password from "./Password.jsx";
import StudentPointsRanking from "./StudentPointsRanking";

import { FaListCheck } from "react-icons/fa6";
import { BsGraphUpArrow } from "react-icons/bs";

function DisplayControl({ isVisitorView }) {
  const [currentComponent, setCurrentComponent] = useState(null);
  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [monitorData, setMonitorData] = useState(null);
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false);

  useEffect(() => {
    if (selectedMonitor) {
      const docRef = doc(db2, "points", selectedMonitor);

      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          setMonitorData(docSnap.data());
          setCurrentComponent(docSnap.data().component); // Set current component based on fetched data
        } else {
          console.log("No such document!");
          setMonitorData(null);
        }
      });

      return () => unsubscribe(); // Clean up the subscription on unmount
    }
  }, [selectedMonitor]);

  const handleMonitorClick = (monitor) => {
    setSelectedMonitor(monitor);
  };

  const renderCurrentComponent = () => {
    switch (currentComponent) {
      case "Point":
        return <PointingSystemGraph isVisitorView={false} />;
      case "Attendance":
        return <AttendanceChart />;
      case "Rank":
        return <StudentPointsRanking />;
      default:
        return (
          <div className="flex flex-col justify-center items-center h-screen">
            <div className="container mx-auto">
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => {
                    if (!isVisitorView) {
                      handleMonitorClick("monitor1");
                    } else {
                      setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                    }
                  }}
                  className={`m-2 p-2 rounded ${
                    selectedMonitor === "monitor1"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}>
                  Monitor 1
                </button>
                <button
                  onClick={() => {
                    if (!isVisitorView) {
                      handleMonitorClick("monitor2");
                    } else {
                      setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                    }
                  }}
                  className={`m-2 p-2 rounded ${
                    selectedMonitor === "monitor2"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}>
                  Monitor 2
                </button>
                <button
                  onClick={() => {
                    if (!isVisitorView) {
                      handleMonitorClick("monitor3");
                    } else {
                      setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                    }
                  }}
                  className={`m-2 p-2 rounded ${
                    selectedMonitor === "monitor3"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}>
                  Monitor 3
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fade-in">
      <div className="fade-in">
        {showVisitorPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
              <p className="mb-4 text-center">
                You are in visitor view. This feature is disabled.
              </p>
              <button
                className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setShowVisitorPrompt(false)}>
                OK
              </button>
            </div>
          </div>
        )}

        <div>{renderCurrentComponent()}</div>
      </div>
    </div>
  );
}

export default DisplayControl;
