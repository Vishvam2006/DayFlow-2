import React from "react";

const StatCard = ({ title, value, color, icon: Icon }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition duration-200">
      
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h2 className="text-3xl font-bold text-gray-900 mt-1">{value}</h2>
      </div>

      <div className={`${color} p-3 rounded-xl text-white`}>
        {Icon && <Icon size={24} />}
      </div>

    </div>
  );
};

export default StatCard;