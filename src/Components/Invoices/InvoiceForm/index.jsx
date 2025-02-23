import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import instance from "../../../API/instance";
import toast from "react-hot-toast";

const InvoiceForm = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const [trips, setTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedTripId = watch("trip");
  const selectedClientId = watch("client");
  const totalAmount = watch("totalAmount");
  const paidAmount = watch("paidAmount");

  // مراقبة التغييرات في totalAmount و paidAmount وحساب remainingAmount
  useEffect(() => {
    const remaining = totalAmount - paidAmount;
    setValue("remainingAmount", remaining >= 0 ? remaining : 0);
  }, [totalAmount, paidAmount, setValue]);

  // جلب الرحلات عند تحميل المكون
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await instance.get("/trips");
        setTrips(response.data);
      } catch (error) {
        console.error("Error fetching trips:", error);
        toast.error("فشل في تحميل الرحلات.");
      }
    };

    fetchTrips();
  }, []);

  // جلب العملاء عند اختيار رحلة
  useEffect(() => {
    if (selectedTripId) {
      const fetchClients = async () => {
        setLoading(true);
        try {
          const response = await instance.get(`/trips/${selectedTripId}`);
          setClients(response.data.clients || []);
        } catch (error) {
          console.error("Error fetching clients:", error);
          toast.error("فشل في تحميل العملاء.");
        } finally {
          setLoading(false);
        }
      };

      fetchClients();
    } else {
      setClients([]);
    }
  }, [selectedTripId]);

  // تحديث بيانات العميل عند اختياره
  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients.find(
        (client) => client.client._id === selectedClientId
      );
      if (selectedClient) {
        setValue("numberOfPeople", selectedClient.clientCount);
        setValue(
          "costPerPerson",
          selectedClient.totalCost / selectedClient.clientCount
        );
        setValue("totalAmount", selectedClient.totalCost);
      }
    }
  }, [selectedClientId, clients, setValue]);

  // إرسال البيانات إلى الخادم
  const submitHandler = async (data) => {
    try {
      const response = await instance.post("/invoices", data);
      if (response.status === 201) {
        toast.success("تم إنشاء الفاتورة بنجاح!");
        onSubmit(data);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("فشل في إنشاء الفاتورة.");
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="p-6">
      <h2 className="text-xl font-semibold mb-4">إنشاء فاتورة</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* قائمة الرحلات */}
        <div>
          <label className="block mb-1">الرحلة</label>
          <select
            {...register("trip", { required: "هذا الحقل مطلوب" })}
            className="p-2 border rounded-lg w-full"
          >
            <option value="">اختر رحلة</option>
            {trips.map((trip) => (
              <option key={trip._id} value={trip._id}>
                {trip.tripNumber} - {new Date(trip.date).toLocaleDateString()}
              </option>
            ))}
          </select>
          {errors.trip && (
            <span className="text-red-500 text-sm">{errors.trip.message}</span>
          )}
        </div>

        {/* قائمة العملاء */}
        <div>
          <label className="block mb-1">العميل</label>
          <select
            {...register("client", { required: "هذا الحقل مطلوب" })}
            className="p-2 border rounded-lg w-full"
            disabled={!selectedTripId || loading}
          >
            <option value="">اختر عميل</option>
            {clients.map((client) => (
              <option key={client.client._id} value={client.client._id}>
                {client.client.name} - {client.client.identityNumber}
              </option>
            ))}
          </select>
          {errors.client && (
            <span className="text-red-500 text-sm">
              {errors.client.message}
            </span>
          )}
        </div>

        {/* عدد الأفراد */}
        <div>
          <label className="block mb-1">عدد الأفراد</label>
          <input
            type="number"
            {...register("numberOfPeople", {
              required: "هذا الحقل مطلوب",
              min: { value: 1, message: "يجب أن يكون العدد أكبر من 0" },
            })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.numberOfPeople && (
            <span className="text-red-500 text-sm">
              {errors.numberOfPeople.message}
            </span>
          )}
        </div>

        {/* تكلفة الفرد */}
        <div>
          <label className="block mb-1">تكلفة الفرد</label>
          <input
            type="number"
            {...register("costPerPerson", {
              required: "هذا الحقل مطلوب",
              min: {
                value: 0,
                message: "يجب أن تكون التكلفة أكبر من أو تساوي 0",
              },
            })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.costPerPerson && (
            <span className="text-red-500 text-sm">
              {errors.costPerPerson.message}
            </span>
          )}
        </div>

        {/* التكلفة الإجمالية */}
        <div>
          <label className="block mb-1">التكلفة الإجمالية</label>
          <input
            type="number"
            {...register("totalAmount", {
              required: "هذا الحقل مطلوب",
              min: {
                value: 0,
                message: "يجب أن تكون القيمة أكبر من أو تساوي 0",
              },
            })}
            className="p-2 border rounded-lg w-full"
            readOnly
          />
        </div>

        {/* المدفوع */}
        <div>
          <label className="block mb-1">المدفوع</label>
          <input
            type="number"
            {...register("paidAmount", {
              required: "هذا الحقل مطلوب",
              min: {
                value: 0,
                message: "يجب أن تكون القيمة أكبر من أو تساوي 0",
              },
            })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.paidAmount && (
            <span className="text-red-500 text-sm">
              {errors.paidAmount.message}
            </span>
          )}
        </div>

        {/* المتبقي */}
        <div>
          <label className="block mb-1">المتبقي</label>
          <input
            type="number"
            {...register("remainingAmount", {
              required: "هذا الحقل مطلوب",
              min: {
                value: 0,
                message: "يجب أن تكون القيمة أكبر من أو تساوي 0",
              },
            })}
            className="p-2 border rounded-lg w-full"
            readOnly
          />
        </div>

        {/* طريقة الدفع */}
        <div>
          <label className="block mb-1">طريقة الدفع</label>
          <select
            {...register("paymentMethod", { required: "هذا الحقل مطلوب" })}
            className="p-2 border rounded-lg w-full"
          >
            <option value="cash">نقدي</option>
            <option value="bankTransfer">تحويل بنكي</option>
          </select>
          {errors.paymentMethod && (
            <span className="text-red-500 text-sm">
              {errors.paymentMethod.message}
            </span>
          )}
        </div>

        {/* ملاحظات */}
        <div className="col-span-2">
          <label className="block mb-1">ملاحظات</label>
          <textarea
            {...register("notes")}
            className="p-2 border rounded-lg w-full"
          />
        </div>
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded-lg mt-4"
      >
        إنشاء الفاتورة
      </button>
    </form>
  );
};

export default InvoiceForm;
