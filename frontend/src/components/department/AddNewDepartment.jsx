import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddNewDepartment = () => {
  const [department, setDepartment] = useState({
    dep_name: "",
    description: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/department/add",
        department,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.data.success) {
        navigate("/admin-dashboard/departments");
      }
    } catch (error) {
      if (error.response && !error.response.data.success) {
        alert(error.response.data.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pb-28">
      {/* Card */}
      <div className="bg-white w-full max-w-md rounded-lg shadow-md p-6">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Add New Department
        </h2>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name
            </label>
            <input
              type="text"
              name="dep_name"
              value={department.dep_name}
              placeholder="Department Name"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows="4"
              name="description"
              value={department.description}
              placeholder="Description"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-md font-semibold hover:bg-teal-700 transition"
          >
            Add Department
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNewDepartment;
