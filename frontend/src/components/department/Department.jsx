import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { Plus, PencilSimple, Trash, Buildings, MagnifyingGlass } from "@phosphor-icons/react";
import API_BASE_URL from "../../config/api.js";

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchDepartments = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/department`, { headers });
      if (r.data.success) setDepartments(r.data.departments);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, [headers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDepartments();
  }, [fetchDepartments]);
  
  const handleDelete = async (id) => { 
    if (!window.confirm("Delete this department?")) return; 
    try { 
      await axios.delete(`${API_BASE_URL}/api/department/${id}`, { headers }); 
      setDepartments(prev => prev.filter(d => d._id !== id)); 
    } catch (error) {
      console.error("Failed to delete department:", error);
    } 
  };

  const filtered = departments.filter(d => d.dep_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[var(--color-text-primary)] tracking-tight">Departments</h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">{departments.length} departments in organization</p>
        </div>
        <NavLink to="/admin-dashboard/add-new-department" className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-sm)] bg-slate-900 border border-slate-900 text-white text-[13px] font-semibold transition-all hover:bg-slate-800 hover:shadow-md">
          <Plus size={14} weight="bold" /> Add Department
        </NavLink>
      </div>

      <div className="relative mb-5 max-w-[300px]">
        <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search departments…" 
          className="w-full py-2 pl-9 pr-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] outline-none transition-all focus:border-slate-800 focus:ring-1 focus:ring-slate-800 placeholder:text-slate-400" 
        />
      </div>

      <div className="bg-[var(--color-card)] rounded-[var(--radius-sm)] border border-[var(--color-border)] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-16">#</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-48 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-16 text-slate-400">
                  <div className="flex justify-center mb-3 text-slate-300">
                    <Buildings size={40} weight="thin" />
                  </div>
                  <p className="text-[14px]">No departments found</p>
                </td>
              </tr>
            )}
            {filtered.map((dep, i) => (
              <tr key={dep._id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3 text-[13px] text-slate-500 font-medium">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Buildings size={16} className="text-slate-600" weight="fill" />
                    </div>
                    <span className="font-semibold text-[14px] text-[var(--color-text-primary)]">{dep.dep_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <NavLink to={`/admin-dashboard/departments/edit/${dep._id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-slate-200 bg-white text-slate-700 text-[12px] font-semibold transition-colors hover:bg-slate-50">
                      <PencilSimple size={14} weight="bold" /> Edit
                    </NavLink>
                    <button onClick={() => handleDelete(dep._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 text-red-700 text-[12px] font-semibold transition-colors hover:bg-red-100 cursor-pointer">
                      <Trash size={14} weight="bold" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Department;
