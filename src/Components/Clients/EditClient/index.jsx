import React, { useState } from "react";
import instance from "../../../API/instance";
import toast from "react-hot-toast";

function EditClientForm({ client, onSuccess }) {
  const [formData, setFormData] = useState({
    name: client.name || "",
    identityNumber: client.identityNumber || "",
    phone: client.phone || "",
    nationality: client.nationality || "",
    boardingLocation: client.boardingLocation || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await instance.put(`/clients/${client._id}`, formData);
      if (response.status === 200) {
        toast.success("تم تحديث بيانات العميل بنجاح");
        onSuccess();
      } else {
        throw new Error("Failed to update client");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("فشل في تحديث بيانات العميل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">الاسم</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">رقم الهوية</label>
        <input
          type="text"
          name="identityNumber"
          value={formData.identityNumber}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">رقم الجوال</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">الجنسية</label>
        <input
          type="text"
          name="nationality"
          value={formData.nationality}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">مكان الركوب</label>
        <input
          type="text"
          name="boardingLocation"
          value={formData.boardingLocation}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {loading ? "جاري التحديث..." : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
}

export default EditClientForm;
