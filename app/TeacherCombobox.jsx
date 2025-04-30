import React, { useState } from "react";
import { Combobox, Transition } from "@headlessui/react";

const predefinedTeachers = ["Renz", "Sean Tio", "Drei", "Vince", "Vaughn",  "Aaliyah", "Angelica", "Bel Tio", "Bernadette", "Calvin", "CJ", "Christine", "Cloe Nicole", "Earl", "Elen", "Eunice", "Hanny", "Io Bell", "Jane", "Keily", "Kisha", "Leonor", "Marjorie", "Mary Joy", "Maybell", "Princess", "RJ", "Robelyn", "Sarah", "Sean Samaniego", "Shane", "Sheryl", "Alebert", "Aneah", "Arlyanna", "Cesar", "Chris", "Ivy", "Jensine", "Tom", "Joan", "Jhun", "Kay", "Maureen", "Mellissa", "Michael", "Ralph", "" ];

function TeacherCombobox({ invitedBy, handleInputChange, config }) {
  const [query, setQuery] = useState("");

  const filteredTeachers = query === ""
    ? predefinedTeachers
    : predefinedTeachers.filter(teacher =>
        teacher.toLowerCase().includes(query.toLowerCase())
      );

  const handleTeacherChange = teacher => {
    handleInputChange({ target: { value: teacher } }, "invitedBy");
  };

  return (
    <Combobox value={invitedBy} onChange={handleTeacherChange}>
      <div className="relative">
        <Combobox.Input
          className={`border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-${config.color}`}
          onChange={e => setQuery(e.target.value)}
          displayValue={teacher => teacher}
          placeholder="Select a Member"
        />
        <Transition
          as={React.Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto bg-white rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredTeachers.map(teacher => (
              <Combobox.Option
                key={teacher}
                value={teacher}
                className={({ active }) =>
                  `cursor-pointer select-none relative py-2 pl-10 pr-4 ${
                    active ? "text-white bg-indigo-600" : "text-gray-900"
                  }`
                }>
                {({ selected, active }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}>
                      {teacher}
                    </span>
                    {selected && (
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? "text-white" : "text-indigo-600"
                        }`}>
                        <svg
                          className="w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}

export default TeacherCombobox;

















































// import React, { useState } from "react";
// import { Combobox, Transition } from "@headlessui/react";

// const predefinedTeachers = ["Renz", "Vince", "Aljon", "Lance", "Jane", "Albert", "Rainier", "Adiel"];

// function TeacherCombobox({ invitedBy, handleInputChange, config }) {
//   const [query, setQuery] = useState("");

//   const filteredTeachers = query === ""
//     ? predefinedTeachers
//     : predefinedTeachers.filter(teacher =>
//         teacher.toLowerCase().includes(query.toLowerCase())
//       );

//   const handleTeacherChange = teacher => {
//     handleInputChange({ target: { value: teacher } }, "invitedBy");
//   };

//   return (
//     <Combobox value={invitedBy} onChange={handleTeacherChange}>
//       <div className="relative">
//         <Combobox.Input
//           className={`border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-${config.color}`}
//           onChange={e => setQuery(e.target.value)}
//           displayValue={teacher => teacher}
//           placeholder="Select a Member"
//         />
//         <Transition
//           as={React.Fragment}
//           leave="transition ease-in duration-100"
//           leaveFrom="opacity-100"
//           leaveTo="opacity-0">
//           <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto bg-white rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
//             {filteredTeachers.map(teacher => (
//               <Combobox.Option
//                 key={teacher}
//                 value={teacher}
//                 className={({ active }) =>
//                   `cursor-pointer select-none relative py-2 pl-10 pr-4 ${
//                     active ? "text-white bg-indigo-600" : "text-gray-900"
//                   }`
//                 }>
//                 {({ selected, active }) => (
//                   <>
//                     <span
//                       className={`block truncate ${
//                         selected ? "font-medium" : "font-normal"
//                       }`}>
//                       {teacher}
//                     </span>
//                     {selected && (
//                       <span
//                         className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
//                           active ? "text-white" : "text-indigo-600"
//                         }`}>
//                         <svg
//                           className="w-5 h-5"
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           stroke="currentColor">
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth="2"
//                             d="M5 13l4 4L19 7"
//                           />
//                         </svg>
//                       </span>
//                     )}
//                   </>
//                 )}
//               </Combobox.Option>
//             ))}
//           </Combobox.Options>
//         </Transition>
//       </div>
//     </Combobox>
//   );
// }

// export default TeacherCombobox;
