import React from "react";
import { useForm } from "react-hook-form";
import instance from "../../../API/instance";
import toast from "react-hot-toast";

const AddClientForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await instance.post("/clients", data);
      toast.success("تم اضافة العميل بنجاح");
      reset(); // Clear the form after successful submission
    } catch (error) {
      console.error(error);

      // Handle duplicate key error
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.code === 11000
      ) {
        const field = Object.keys(error.response.data.keyValue)[0]; // Get the duplicate field (phone or identityNumber)
        toast.error(
          `لا يمكن تكرار ${field === "phone" ? "رقم الجوال" : "رقم الهوية"}`
        );
      } else {
        toast.error("حدث خطأ اثناء الاضافة");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">إضافة عميل جديد</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block mb-1">الاسم</label>
          <input
            type="text"
            {...register("name", { required: "الاسم مطلوب" })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1">رقم الجوال</label>
          <input
            type="text"
            {...register("phone", {
              required: "رقم الجوال مطلوب",
              pattern: {
                value: /^[0-9]{10,15}$/,
                message: "رقم الجوال غير صحيح",
              },
            })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {errors.phone && (
            <p className="text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Nationality */}
        <div>
          <label className="block mb-1">الجنسية</label>
          <input
            type="text"
            {...register("nationality", { required: "الجنسية مطلوبة" })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {errors.nationality && (
            <p className="text-red-500">{errors.nationality.message}</p>
          )}
        </div>

        {/* Identity Number */}
        <div>
          <label className="block mb-1">رقم الهوية</label>
          <input
            type="text"
            {...register("identityNumber", {
              required: "رقم الهوية مطلوب",
              pattern: {
                value: /^[0-9]{8,16}$/,
                message: "رقم الهوية غير صحيح",
              },
            })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {errors.identityNumber && (
            <p className="text-red-500">{errors.identityNumber.message}</p>
          )}
        </div>

        {/* Boarding Location */}
        <div>
          <label className="block mb-1">مكان الركوب</label>
          <input
            type="text"
            {...register("boardingLocation", {
              required: "مكان الركوب مطلوب",
            })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {errors.boardingLocation && (
            <p className="text-red-500">{errors.boardingLocation.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          إضافة العميل
        </button>
      </form>
    </div>
  );
};

export default AddClientForm;
