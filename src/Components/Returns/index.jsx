import React, { useState } from "react";
import instance from "../../API/instance";
import * as XLSX from "xlsx-js-style"; // استيراد المكتبة

const ClientsByReturnDate = () => {
  const [returnDate, setReturnDate] = useState("");
  const [destination, setDestination] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTripsByDate = async () => {
    if (!returnDate) {
      alert("يرجى اختيار تاريخ العودة.");
      return;
    }

    setLoading(true);
    setError("");
    setClients([]);

    try {
      // Ensure returnDate is in YYYY-MM-DD format
      const formattedDate = new Date(returnDate).toISOString().split("T")[0];

      const response = await instance.get("trips/bydate", {
        params: { returnDate: formattedDate },
      });

      console.log("Selected returnDate:", formattedDate);

      if (response.data && Array.isArray(response.data)) {
        const filteredClients = response.data
          .filter((trip) =>
            destination ? trip.busDetails?.destination === destination : true
          )
          .flatMap((trip) =>
            trip.clients
              .filter((client) => client.returnStatus === "نعم") // Only clients with returnStatus "نعم"
              .flatMap((client) => {
                // Create the main client row
                const clientRow = {
                  tripNumber: trip.tripNumber,
                  clientName: client.client?.name || "غير متوفر",
                  phone: client.client?.phone || "غير متوفر", // رقم هاتف العميل الرئيسي
                  nationality: client.client?.nationality || "غير متوفر",
                  type: "client",
                  departureLocation:
                    trip.busDetails?.departureLocation || "غير متوفر",
                  destination: trip.busDetails?.destination || "غير متوفر",
                  returnDate: client.returnDate,
                };

                // Create accompanying persons rows
                const accompanyingRows = (client.accompanyingPersons || []).map(
                  (person) => ({
                    tripNumber: trip.tripNumber,
                    clientName: person.name,
                    phone: person.phone || client.client?.phone || "غير متوفر", // استخدام رقم هاتف العميل الرئيسي إذا لم يكن لدى المرافق رقم هاتف
                    nationality: person.nationality || "غير متوفر",
                    type: "accompanying",
                    departureLocation:
                      trip.busDetails?.departureLocation || "غير متوفر",
                    destination: trip.busDetails?.destination || "غير متوفر",
                    returnDate: client.returnDate,
                  })
                );

                return [clientRow, ...accompanyingRows];
              })
          );

        if (filteredClients.length === 0) {
          console.warn("لم يتم العثور على عملاء عائدين في هذا التاريخ.");
          setClients([]);
        } else {
          setClients(filteredClients);
        }
      } else {
        setClients([]);
        console.warn("لم يتم العثور على رحلات في هذا التاريخ.");
      }
    } catch (error) {
      setError("حدث خطأ أثناء جلب البيانات.");
      console.error(
        "خطأ في جلب البيانات:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // دالة لتصدير البيانات إلى Excel
  const exportReturnsToExcel = () => {
    const data = [];

    // إضافة عنوان الملف
    data.push(["عوادات - تاريخ العودة: " + returnDate]);
    data.push([]); // سطر فارغ

    // إضافة عناوين الأعمدة بترتيب معكوس للعربية
    data.push([
      "تاريخ العودة",
      "الوجهة",
      "مكان الانطلاق",
      "الجنسية",
      "رقم الهاتف",
      "اسم العميل / المرافق",
      "رقم الرحلة",
    ]);

    // إضافة بيانات العملاء والمرافقين بترتيب معكوس
    clients.forEach((client) => {
      data.push([
        new Date(client.returnDate).toLocaleDateString(),
        client.destination,
        client.departureLocation,
        client.nationality,
        client.phone,
        client.clientName,
        client.tripNumber,
      ]);
    });

    // إنشاء ورقة عمل
    const ws = XLSX.utils.aoa_to_sheet(data);

    // تنسيق الأعمدة مع عرض أكبر
    const wscols = [
      { wch: 20 }, // تاريخ العودة
      { wch: 20 }, // الوجهة
      { wch: 25 }, // مكان الانطلاق
      { wch: 20 }, // الجنسية
      { wch: 20 }, // رقم الهاتف
      { wch: 35 }, // اسم العميل
      { wch: 15 }, // رقم الرحلة
    ];
    ws["!cols"] = wscols;

    // تنسيق عنوان الملف
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "right", readingOrder: 2, wrapText: true },
    };

    // تنسيق العناوين
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C }); // العنوان في الصف الثالث
      if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
      ws[cellAddress].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, // خط أبيض
        alignment: { horizontal: "right", readingOrder: 2, wrapText: true },
        fill: { fgColor: { rgb: "4F81BD" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }

    // تنسيق باقي الخلايا
    for (let R = 3; R <= headerRange.e.r; ++R) {
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
        ws[cellAddress].s = {
          alignment: { horizontal: "right", readingOrder: 2, wrapText: true },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }

    // إنشاء مصنف وإضافة الورقة
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "عوادات");

    // تصدير الملف
    XLSX.writeFile(wb, `عوادات_${returnDate}.xlsx`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        إدارة العملاء حسب تاريخ العودة
      </h1>

      {/* إدخال تاريخ العودة */}
      <div className="mb-4">
        <label className="block mb-2">تاريخ العودة:</label>
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      {/* فلتر الوجهة */}
      <div className="mb-4">
        <label className="block mb-2">اختر الوجهة (اختياري):</label>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">كل الوجهات</option>
          <option value="المدينة">المدينة</option>
          <option value="مكة">مكة</option>
        </select>
      </div>

      {/* زر البحث */}
      <button
        onClick={fetchTripsByDate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "جاري البحث..." : "بحث"}
      </button>

      {/* زر تصدير البيانات إلى Excel */}
      <button
        onClick={exportReturnsToExcel}
        disabled={clients.length === 0}
        className="bg-green-500 text-white px-4 py-2 rounded mx-3 "
      >
        طباعة كشف العوادات
      </button>

      {/* عرض الأخطاء */}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* عرض النتائج */}
      {clients.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <h2 className="text-xl font-bold mb-2">النتائج</h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">رقم الرحلة</th>
                <th className="border p-2">اسم العميل / المرافق</th>
                <th className="border p-2">رقم الهاتف</th>
                <th className="border p-2">الجنسية</th>
                <th className="border p-2">مكان الانطلاق</th>
                <th className="border p-2">الوجهة</th>
                <th className="border p-2">تاريخ العودة</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-100 ${
                    client.type === "accompanying" ? "bg-gray-50" : ""
                  }`}
                >
                  <td className="border p-2">{client.tripNumber}</td>
                  <td className="border p-2">{client.clientName}</td>
                  <td
                    className={`border p-2 ${
                      client.type === "accompanying" ? "text-gray-500" : ""
                    }`}
                  >
                    {client.phone}
                  </td>
                  <td className="border p-2">{client.nationality}</td>
                  <td className="border p-2">{client.departureLocation}</td>
                  <td className="border p-2">{client.destination}</td>
                  <td className="border p-2">
                    {new Date(client.returnDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="mt-4">لا توجد بيانات متاحة.</p>
      )}
    </div>
  );
};

export default ClientsByReturnDate;
