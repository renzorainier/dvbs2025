import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "./firebase.js";
import { db2 } from "./firebaseConfig2.js";
import { motion } from "framer-motion";
import { BsStars } from "react-icons/bs";

const StudentRanking = () => {
  const [groupedStudents, setGroupedStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [configGroup, setConfigGroup] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupIndex, setGroupIndex] = useState(0);

  useEffect(() => {
    const unsubscribeStudents = onSnapshot(
      collection(db, "dvbs"),
      (querySnapshot) => {
        const studentData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const currentDayLetter = getCurrentDayLetter();
        const presentStudents = studentData
          .map((group) => {
            const groupStudents = [];
            for (const key in group) {
              if (key.endsWith(currentDayLetter)) {
                const prefix = key.slice(0, 3);
                const pointsField = `${prefix}${currentDayLetter}points`;
                if (group[pointsField]) {
                  groupStudents.push({
                    id: group.id,
                    group: group.id,
                    prefix,
                    name: group[`${prefix}name`],
                    location: group[`${prefix}loc`],
                    points: group[pointsField],
                  });
                }
              }
            }
            return groupStudents;
          })
          .flat();

        console.log("Fetched Students:", presentStudents);

        // Sort students by points from highest to lowest
        presentStudents.sort((a, b) => b.points - a.points);

        // Group students by their group (document name)
        const groups = presentStudents.reduce((acc, student) => {
          if (!acc[student.group]) {
            acc[student.group] = [];
          }
          acc[student.group].push(student);
          return acc;
        }, {});

        // Group students by their ranks within each group
        const groupedByRank = {};
        for (const group in groups) {
          let rank = 0;
          let currentRankPoints = null;
          groupedByRank[group] = {};
          groups[group].forEach((student) => {
            if (student.points !== currentRankPoints) {
              rank++;
              currentRankPoints = student.points;
            }
            if (rank <= 5) {
              if (!groupedByRank[group][rank]) {
                groupedByRank[group][rank] = [];
              }
              groupedByRank[group][rank].push(student);
            }
          });
        }

        setGroupedStudents(groupedByRank);
        setLoading(false);
      }
    );

    const unsubscribeConfig = onSnapshot(doc(db2, "points/config"), (doc) => {
      if (doc.exists()) {
        const configData = doc.data();
        console.log("Fetched Config Data:", configData.group);
        setConfigGroup(configData.group); // Set the fetched group name
        if (configData.group === "play") {
          setCurrentGroup(Object.keys(groupedStudents)[0]); // Start with the first group
        } else {
          setCurrentGroup(configData.group);
        }
      } else {
        console.log("Config document does not exist");
      }
    });

    return () => {
      unsubscribeStudents();
      unsubscribeConfig();
    };
  }, []);
//fix here
  useEffect(() => {
    let interval;
    if (configGroup === "play" && Object.keys(groupedStudents).length > 0) {
      interval = setInterval(() => {
        setGroupIndex(
          (prevIndex) => (prevIndex + 1) % Object.keys(groupedStudents).length
        );
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [configGroup, groupedStudents]);

  useEffect(() => {
    if (configGroup === "play" && Object.keys(groupedStudents).length > 0) {
      setCurrentGroup(Object.keys(groupedStudents)[groupIndex]);
    }
  }, [groupIndex, configGroup, groupedStudents]);

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  };

  const getBackgroundColor = (group) => {
    switch (group) {
      case "primary":
        return "#FFC100";
      case "middlers":
        return "#04d924";
      case "juniors":
        return "#027df7";
      case "youth":
        return "#f70233";
      default:
        return "#FFFFFF";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-[#9ca3af] min-h-screen h-screen overflow-auto">
      <div className="flex justify-center items-center h-full overflow-auto">
        <div className="w-full h-full rounded-lg mx-auto flex flex-col justify-center">
          {currentGroup && groupedStudents[currentGroup] && (
            <div
              key={currentGroup}
              className="w-full text-center text-black bg-black p-5  shadow-lg flex-grow">
              <h1 className="text-9xl text-white font-bold mb-4">
                Highest points
                <span style={{ display: "inline-block" }}>
                  <BsStars />
                </span>
              </h1>

              <h4 className="text-5xl text-white  font-bold mb-4">
                {" "}
                {currentGroup}
              </h4>
              <div className="flex flex-col justify-between">
                {Object.keys(groupedStudents[currentGroup]).map(
                  (rank, index) =>
                    parseInt(rank) <= 5 && (
                      <motion.div
                        key={rank}
                        className="flex items-center p-4 bg-white rounded-lg shadow-md mb-4 last:mb-0"
                        initial={{ x: "100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}>
                        <div
                          className="text-9xl font-extrabold text-center text-black-700 flex-shrink-0"
                          style={{ width: "120px" }}>
                          {rank}
                        </div>
                        <div className="flex-grow">
                          <div className="flex flex-wrap">
                            {groupedStudents[currentGroup][rank].map(
                              (student) => (
                                <div
                                  key={`${student.id}-${student.prefix}`}
                                  className="flex items-center m-2 w-full">
                                  <div
                                    className="flex-grow p-4 rounded-l-lg shadow-md text-white font-bold text-7xl"
                                    style={{
                                      backgroundColor: getBackgroundColor(
                                        student.group
                                      ),
                                    }}>
                                    {student.name}
                                  </div>
                                  <div className="flex-shrink-0 ml-auto bg-black p-4 rounded-r-lg shadow-md text-white font-bold text-7xl">
                                    {student.points}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRanking;
//sana gumana hehehhehe