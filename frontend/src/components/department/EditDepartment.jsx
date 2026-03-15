import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState({
    dep_name: "",
    description: "",
  });

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/department/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.data.success) {
        setDepartment(response.data.department);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/department/${id}`,
        department,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      navigate("/admin-dashboard/departments");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pb-28">
      <div className="bg-white w-full max-w-md rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Department</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="dep_name"
            value={department.dep_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
          />

          <textarea
            name="description"
            value={department.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border rounded-md"
          />

          <button className="w-full bg-teal-600 text-white py-2 rounded-md">
            Update Department
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditDepartment;
