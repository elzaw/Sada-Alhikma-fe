import React, { useState, useEffect } from "react";
import instance from "../../API/instance"; // تأكد من تعديل المسار حسب هيكل مشروعك
import * as XLSX from "xlsx-js-style"; // استيراد مكتبة Excel

const MadinaTrips = () => {
  // State للفلترات
  const [tripType, setTripType] = useState(""); // نوع الرحلة (go أو return)
  const [date, setDate] = useState(""); // التاريخ
  const [trips, setTrips] = useState([]); // الرحلات المصفاة
  const [loading, setLoading] = useState(false); // حالة التحميل
  const [error, setError] = useState(""); // رسائل الأخطاء

  // جلب الرحلات المصفاة
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await instance.get("/trips/trips/filter", {
          params: {
            tripType, // نوع الرحلة (go أو return)
            date, // التاريخ
          },
        });

        if (response.data && response.data.length > 0) {
          setTrips(response.data);
        } else {
          setTrips([]);
          setError("لا توجد رحلات متاحة.");
        }
      } catch (error) {
        setError("فشل في جلب الرحلات. يرجى المحاولة مرة أخرى.");
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [tripType, date]); // إعادة الجلب عند تغيير الفلترات

  // تصدير البيانات إلى Excel
  const exportToExcel = () => {
    // إنشاء مصفوفة تحتوي على البيانات
    const data = [
      [
        "رقم الرحلة",
        "التاريخ",
        "مكان الانطلاق",
        "الوجهة",
        "نوع الرحلة",
        "عدد العملاء",
      ], // العناوين
      ...trips.map((trip) => [
        trip.tripNumber,
        new Date(trip.date).toLocaleDateString(),
        trip.busDetails.departureLocation,
        trip.busDetails.destination,
        trip.busDetails.departureLocation === "المدينة" ? "عودة" : "ذهاب",
        trip.clients.length,
      ]),
    ];

    // إنشاء ورقة عمل
    const ws = XLSX.utils.aoa_to_sheet(data);

    // تنسيق الأعمدة
    const wscols = [
      { wch: 15 }, // عرض الأعمدة
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws["!cols"] = wscols;

    // تنسيق العناوين
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }); // العنوان في الصف الأول
      if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
      ws[cellAddress].s = {
        font: { bold: true, sz: 14 }, // خط عريض وحجم كبير
        alignment: { horizontal: "center" }, // محاذاة النص في المنتصف
        fill: { fgColor: { rgb: "D9D9D9" } }, // لون خلفية العناوين
      };
    }

    // إنشاء مصنف وإضافة الورقة
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "رحلات المدينة");

    // تصدير الملف
    XLSX.writeFile(wb, `رحلات_المدينة_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">رحلات المدينة</h1>

      {/* فلتر نوع الرحلة */}
      <div className="mb-4">
        <label className="block mb-2">نوع الرحلة:</label>
        <select
          value={tripType}
          onChange={(e) => setTripType(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">كل الأنواع</option>
          <option value="go">ذهاب</option>
          <option value="return">عودة</option>
        </select>
      </div>

      {/* فلتر التاريخ */}
      <div className="mb-4">
        <label className="block mb-2">التاريخ:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      {/* زر تصدير إلى Excel */}
      <button
        onClick={exportToExcel}
        disabled={trips.length === 0}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        تصدير إلى Excel
      </button>

      {/* حالة التحميل */}
      {loading && <p className="text-blue-500">جاري التحميل...</p>}

      {/* رسائل الأخطاء */}
      {error && <p className="text-red-500">{error}</p>}

      {/* عرض الرحلات */}
      {trips.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">رقم الرحلة</th>
                <th className="border p-2">التاريخ</th>
                <th className="border p-2">مكان الانطلاق</th>
                <th className="border p-2">الوجهة</th>
                <th className="border p-2">نوع الرحلة</th>
                <th className="border p-2">عدد العملاء</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip._id} className="hover:bg-gray-100">
                  <td className="border p-2">{trip.tripNumber}</td>
                  <td className="border p-2">
                    {new Date(trip.date).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    {trip.busDetails.departureLocation}
                  </td>
                  <td className="border p-2">{trip.busDetails.destination}</td>
                  <td className="border p-2">
                    {trip.busDetails.departureLocation === "المدينة"
                      ? "عودة"
                      : "ذهاب"}
                  </td>
                  <td className="border p-2">{trip.clients.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="mt-4">لا توجد رحلات متاحة.</p>
      )}
    </div>
  );
};

export default MadinaTrips;
