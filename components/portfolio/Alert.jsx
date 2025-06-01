import React from "react";

const Alert = ({ type, text }) => {
  return (
    <div className="absolute flex items-center justify-center right-10 bottom-10">
      <div
        className={`${type === "danger" ? "bg-red-800" : "bg-green-500"} 
             p-2 text-indigo-100 leading-none rounded-2xl flex lg:inline-flex items-center`}
        role="alert"
      >
        <p
          className={`${type === "danger" ? "bg-red-500" : "bg-green-300"}
                 flex rounded-full uppercase px-2 py-1 font-semibold mr-3 text-xs`}
        >
          {type === "danger" ? "Failed" : "Success"}
        </p>
        <p className="mr-2 text-left">{text}</p>
      </div>
    </div>
  );
};

export default Alert;
