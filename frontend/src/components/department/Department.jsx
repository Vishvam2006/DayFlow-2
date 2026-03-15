import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?"))
      return;

    try {
      await axios.delete(`http://localhost:5000/api/department/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setDepartments(departments.filter((dep) => dep._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);
  const fetchDepartments = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/department", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredDepartments = departments.filter((dep) =>
    dep.dep_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Departments</h1>

        <NavLink
          to="/admin-dashboard/add-new-department"
          className="bg-teal-600 text-white px-4 py-2 rounded-md font-medium hover:bg-teal-700 transition"
        >
          Add New Department
        </NavLink>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search By Department"
          className="w-64 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Fetch Departments  */}
      <div>
        <table className="w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Sr No</th>
              <th className="p-4 text-left">Department</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDepartments.map((dep, index) => (
              <tr key={dep._id} className="border-t">
                <td className="p-4">{index + 1}</td>
                <td className="p-4">{dep.dep_name}</td>
                <td className="p-4 text-center space-x-2">
                  <NavLink
                    to={`/admin-dashboard/departments/edit/${dep._id}`}
                    className="bg-green-500 px-3 py-1 text-white rounded"
                  >
                    Edit
                  </NavLink>
                  <button
                    onClick={() => handleDelete(dep._id)}
                    className="bg-red-500 px-3 py-1 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {departments.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-6 text-gray-500">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Department;
