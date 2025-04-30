"use client";

import React, { useState, useEffect } from "react";
import Visitors from "./Visitors";
import Tab from "./Tab";
import Primary from "./Primary";
import InitializeData from "./InitializeData";
import AttendanceChart from "./AttendanceChart";
import StudentOutTime from "./StudentOutTime";
import PointingSystemGraph from "./PointingSystemGraph";
import ScrollToTopButton from "./Scroll";
import Schedule from "./Schedule";
import CopyScheduleData from "./CopyScheduleData";
import DailyRewards from "./DailyRewards";
import SalvationDecision from "./SalvationDecision";
import CopyPreviousDayPoints from "./CopyPreviousDayPoints";
import Store from "./Store";
import CopyDataComponent from "./CopyDataComponent";
import Password from "./Password.jsx";
import StudentPointsRanking from "./StudentPointsRanking";
import DisplayControl from "./DisplayControl";
import BobbingImage from "./Image";
import Weather from "./Weather";
import AdditionalPoints from  "./AdditionalPoints"
import UpdateFieldNames from "./UpdateFieldNames"

import { FaChevronDown } from "react-icons/fa";
import { MdOutlineLocalGroceryStore } from "react-icons/md";
import { FaListCheck } from "react-icons/fa6";
import { FiClock } from "react-icons/fi";
import { HiMiniUserGroup } from "react-icons/hi2";
import { FaMedal } from "react-icons/fa";
import { FaCross } from "react-icons/fa";
import { TbDoorExit } from "react-icons/tb";
import { BsGraphUpArrow } from "react-icons/bs";
import { FiMonitor } from "react-icons/fi";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoIosAddCircle } from "react-icons/io";

function Main() {
  const [currentComponent, setCurrentComponent] = useState(null);
  const [isVisitorView, setIsVisitorView] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);

  const toggleCard = () => setCardExpanded(!cardExpanded);

  const handleButtonClick = (componentName) => {
    setCurrentComponent(componentName);
  };

  const handleBackButtonClick = () => {
    setCurrentComponent(null);
    setIsVisitorView(false);
  };

  const renderCurrentComponent = () => {
    switch (currentComponent) {
      case "Tab":
        return <Tab />;
      case "Out":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="1111">
            <StudentOutTime isVisitorView={isVisitorView} />;
          </Password>
        );

      case "Point":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="0000">
            <PointingSystemGraph isVisitorView={isVisitorView} />
          </Password>
        );
      case "Attendance":
        return <AttendanceChart />;
      case "Schedule":
        return <Schedule />;
      case "Rewards":
        return <DailyRewards />;
      case "SalvationDecision":
        return <SalvationDecision />;
      case "Rank":
        return <StudentPointsRanking />;
      case "Store":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="2024">
            <Store isVisitorView={isVisitorView} />
          </Password>
        );
      case "DisplayControl":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="0000">
            <DisplayControl isVisitorView={isVisitorView} />
          </Password>
        );
        case "AdditionalPoints":
          return (
            <Password
              isVisitorView={isVisitorView}
              setIsVisitorView={setIsVisitorView}
              correctPassword="2222">
              <AdditionalPoints isVisitorView={isVisitorView} />
            </Password>
          );

      default:
        return (
          <div
            className="flex flex-col justify-center items-center h-screen relative overflow-y-auto overflow-x-hidden"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.05))",
            }}>
            <div className="text-white text-center mb-4 relative z-10">
              <h1 className="font-bold text-8xl sm:text-8xl md:text-9xl lg:text-9xl">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-transparent bg-clip-text">
                  Re
                </span>
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-transparent bg-clip-text">
                  scue
                </span>
              </h1>
              <h1 className="font-bold text-7xl sm:text-7xl md:text-8xl lg:text-9xl">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-transparent bg-clip-text">
                  Z
                </span>
                <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 text-transparent bg-clip-text">
                  one
                </span>
              </h1>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                D V B S &nbsp;2 0 2 4
              </h3>
            </div>

            <div className="container mx-auto mb-5 relative z-10">
              <Weather />
            </div>
            <div className="z-10">
              <div className="container mx-auto relative ">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                  <button
                    className="focus:outline-none  bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Tab")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <FaListCheck style={{ fontSize: "3.5em" }} />
                      <span style={{ marginTop: "0.5em" }}>Attendance</span>
                    </div>
                  </button>

                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Attendance")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <BsGraphUpArrow style={{ fontSize: "3.5em" }} />
                      <span style={{ marginTop: "0.5em" }}>List</span>
                    </div>
                  </button>
                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg border-4 border-yellow-400 text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Schedule")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <FiClock style={{ fontSize: "3.5em" }} />{" "}
                      <span style={{ marginTop: "0.5em" }}>Schedule</span>
                    </div>
                  </button>

                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Point")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <HiMiniUserGroup style={{ fontSize: "3.5em" }} />{" "}
                      <span style={{ marginTop: "0.5em" }}>Points</span>
                    </div>
                  </button>

                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg  border-4 border-yellow-400 text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Rewards")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <FaMedal style={{ fontSize: "3.5em" }} />{" "}
                      <span style={{ marginTop: "0.5em" }}>Rewards</span>
                    </div>
                  </button>

                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg border-4 border-yellow-400  text-white font-semibold py-4 px-4 rounded-lg                   shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("SalvationDecision")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <FaCross style={{ fontSize: "3.5em" }} />{" "}
                      <span style={{ marginTop: "0.5em" }}>Salvation</span>
                    </div>
                  </button>
                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Store")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <MdOutlineLocalGroceryStore
                        style={{ fontSize: "3.5em" }}
                      />{" "}
                      <span style={{ marginTop: "0.5em" }}>Store</span>
                    </div>
                  </button>

                  <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("Out")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <TbDoorExit style={{ fontSize: "3.5em" }} />{" "}
                      <span style={{ marginTop: "0.5em" }}>Out</span>
                    </div>
                  </button>


                </div>
              </div>
              <div className="flex justify-center items-center">
                <div
                  className="px-4 py-5 sm:p-6 cursor-pointer"
                  onClick={toggleCard}>
                  <div className="flex justify-center items-center">
                    <div className="flex text-white items-center">
                      <FaChevronDown
                        className={`transition-transform ${
                          cardExpanded ? "rotate-180 mb-4" : ""
                        }`}
                      />
                    </div>
                  </div>
                  {cardExpanded && (
                    <div className="flex justify-center items-center">
                      <button
                        className="focus:outline-none bg-white-500 backdrop-blur-lg text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                        onClick={() => handleButtonClick("DisplayControl")}
                        style={{
                          animation: "slide-from-left 1s ease forwards",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}>
                          <FiMonitor style={{ fontSize: "3.5em" }} />
                          <span style={{ marginTop: "0.5em" }}>
                            Monitor Control
                          </span>
                        </div>
                      </button>
                      <button
                    className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    onClick={() => handleButtonClick("AdditionalPoints")}
                    style={{ animation: "slide-from-left 1s ease forwards" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <IoIosAddCircle  style={{ fontSize: "3.5em" }} />{" "}
                      <span style={{ marginTop: "0.5em" }}>Additional Points</span>
                    </div>
                  </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <BobbingImage />
          </div>
        );
    }
  };
  const backButton = currentComponent ? (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2"
        onClick={handleBackButtonClick}>
        <IoMdArrowRoundBack className="text-2xl" />
      </button>
    </div>
  ) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentComponent]);

  return (
    <div className="fade-in">
      <div className="fade-in">
        <div>
          {backButton}
          {renderCurrentComponent()}
          {/* <UpdateFieldNames/> */}
        </div>
      </div>
    </div>
  );
}

export default Main;

// "use client";

// import React from "react";
// import Visitors from "./Visitors";
// import Tab from "./Tab";
// import Primary from "./Primary"
// import InitializeData from "./InitializeData"
// import AttendanceChart from "./AttendanceChart"
// import StudentOutTime from "./StudentOutTime"
// import PointingSystemGraph from "./PointingSystemGraph"

// function Main({ configurations, currentConfigIndex, setCurrentConfigIndex  }) {
//   return (
//     <div>
//       <AttendanceChart/>
// <Tab configurations={configurations} currentConfigIndex={currentConfigIndex}
//   setCurrentConfigIndex={setCurrentConfigIndex}/>
//       <StudentOutTime/>
//       <PointingSystemGraph/>

//     </div>
//   );
// }

// export default Main;
