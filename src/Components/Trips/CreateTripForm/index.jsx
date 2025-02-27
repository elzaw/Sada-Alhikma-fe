import React, { useState, useEffect, useMemo } from "react";
import instance from "../../../API/instance";
import toast from "react-hot-toast";

function CreateTripForm({ setShowCreateForm, onTripCreated }) {
  const [formData, setFormData] = useState({
    tripNumber: "",
    date: "",
    departureLocation: "",
    destination: "",
    leasingCompany: "",
    rentingCompany: "",
    busNumber: "",
    licensePlate: "",
    seatCount: 0,
    driver1: "",
    driver1Id: "",
    driver1Phone: "",
    driver2: "",
    driver2Id: "",
    driver2Phone: "",
    totalTripCost: 0,
    totalTripPaid: 0,
  });

  const [loading, setLoading] = useState(false);

  // Calculate net amount using useMemo
  const netAmount = useMemo(() => {
    return formData.totalTripCost - formData.totalTripPaid;
  }, [formData.totalTripPaid, formData.totalTripPaid]);

  // Fetch the last trip number for the selected date
  useEffect(() => {
    const fetchLastTripNumber = async () => {
      if (!formData.date) return;

      try {
        const response = await instance.get(
          `/trips/last-trip-number?date=${formData.date}`
        );
        const lastTripNumber = response.data.lastTripNumber;

        const lastSequentialNumber = lastTripNumber
          ? parseInt(lastTripNumber.slice(-2), 10)
          : 0;

        const date = new Date(formData.date);
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const newSequentialNumber = String(lastSequentialNumber + 1).padStart(
          2,
          "0"
        );
        const newTripNumber = `${year}${month}${day}${newSequentialNumber}`;

        setFormData((prev) => ({
          ...prev,
          tripNumber: newTripNumber,
        }));
      } catch (error) {
        console.error("Error fetching last trip number:", error);
        toast.error("فشل في جلب آخر رقم رحلة.");
      }
    };

    fetchLastTripNumber();
  }, [formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("total") ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tripData = {
      tripNumber: formData.tripNumber,
      date: formData.date,
      leasingCompany: formData.leasingCompany,
      rentingCompany: formData.rentingCompany,
      busDetails: {
        busNumber: formData.busNumber,
        licensePlate: formData.licensePlate,
        seatCount: formData.seatCount,
        departureLocation: formData.departureLocation,
        destination: formData.destination,
      },
      drivers: [
        {
          driverName: formData.driver1,
          driverId: formData.driver1Id,
          driverPhone: formData.driver1Phone,
        },
        formData.driver2
          ? {
              driverName: formData.driver2,
              driverId: formData.driver2Id,
              driverPhone: formData.driver2Phone,
            }
          : null,
      ].filter(Boolean),
      totalTripCost: formData.totalTripCost,
      totalTripPaid: formData.totalTripPaid,
      totalTripNetAmount: netAmount,
    };

    console.log(tripData);

    try {
      const res = await instance.post("/trips", tripData);

      if (res && res.status === 201) {
        toast.success("تم إنشاء الرحلة بنجاح!");
        setFormData({
          tripNumber: "",
          date: "",
          departureLocation: "",
          destination: "",
          leasingCompany: "",
          rentingCompany: "",
          busNumber: "",
          licensePlate: "",
          seatCount: 0,
          driver1: "",
          driver1Id: "",
          driver1Phone: "",
          driver2: "",
          driver2Id: "",
          driver2Phone: "",
          totalTripCost: 0,
          totalTripPaid: 0,
        });
        if (onTripCreated) onTripCreated();
        setShowCreateForm(false);
      } else {
        toast.error(
          `حدث خطأ أثناء حفظ الرحلة. (رمز: ${res?.status || "غير معروف"})`
        );
      }
    } catch (error) {
      console.error("Error creating trip:", error?.response?.data || error);
      toast.error(
        `خطأ: ${error?.response?.data?.message || "فشل في إنشاء الرحلة."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "رقم الرحلة", name: "tripNumber", type: "text", disabled: true },
    { label: "تاريخ الرحلة", name: "date", type: "date" },
    { label: "مكان الانطلاق", name: "departureLocation", type: "text" },
    { label: "الوجهة", name: "destination", type: "text" },
    { label: "الشركة المؤجرة", name: "leasingCompany", type: "text" },
    { label: "الشركة المستأجرة", name: "rentingCompany", type: "text" },
    { label: "رقم الباص", name: "busNumber", type: "text" },
    { label: "لوحة الباص", name: "licensePlate", type: "text" },
    { label: "عدد المقاعد", name: "seatCount", type: "number" },
  ];

  const driverFields = [
    [
      { label: "اسم السائق الأول", name: "driver1", type: "text" },
      { label: "رقم هوية السائق الأول", name: "driver1Id", type: "text" },
      { label: "رقم هاتف السائق الأول", name: "driver1Phone", type: "tel" },
    ],
    [
      { label: "اسم السائق الثاني (اختياري)", name: "driver2", type: "text" },
      {
        label: "رقم هوية السائق الثاني (اختياري)",
        name: "driver2Id",
        type: "text",
      },
      {
        label: "رقم هاتف السائق الثاني (اختياري)",
        name: "driver2Phone",
        type: "tel",
      },
    ],
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 pb-10 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">إنشاء رحلة جديدة</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {fields.map(({ label, name, type, disabled }) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-medium mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={!name.includes("driver2")}
                className="w-full p-2 border rounded"
                disabled={loading || disabled}
              />
            </div>
          ))}

          {/* Driver 1 Fields */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {driverFields[0].map(({ label, name, type }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-medium mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required={!name.includes("driver2")}
                  className="w-full p-2 border rounded"
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          {/* Driver 2 Fields */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {driverFields[1].map(({ label, name, type }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-medium mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required={false}
                  className="w-full p-2 border rounded"
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          {/* Cost Fields */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">إجمالي التكلفة</label>
              <input
                type="number"
                name="totalTripCost"
                value={formData.totalTripCost}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                disabled={loading}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">إجمالي المدفوع</label>
              <input
                type="number"
                name="totalTripPaid"
                value={formData.totalTripPaid}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                disabled={loading}
              />
            </div>
          </div>

          {/* Net Amount */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">صافي المبلغ</label>
            <input
              type="number"
              value={netAmount}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
              disabled={loading}
            >
              إغلاق
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
              disabled={loading}
            >
              {loading ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTripForm;
