import React, { useState } from "react";
import instance from "../../API/instance";
import * as XLSX from "xlsx-js-style";

const ClientsByReturnDate = () => {
  // State for regular returns
  const [regularReturnDate, setRegularReturnDate] = useState("");
  const [regularDestination, setRegularDestination] = useState("");
  const [regularClients, setRegularClients] = useState([]);
  const [regularLoading, setRegularLoading] = useState(false);
  const [regularError, setRegularError] = useState("");

  // State for Madinah returns
  const [madinahReturnDate, setMadinahReturnDate] = useState("");
  const [madinahClients, setMadinahClients] = useState([]);
  const [madinahLoading, setMadinahLoading] = useState(false);
  const [madinahError, setMadinahError] = useState("");

  // Fetch regular returns
  const fetchRegularReturns = async () => {
    if (!regularReturnDate) {
      alert("يرجى اختيار تاريخ العودة للعوادات العادية.");
      return;
    }

    setRegularLoading(true);
    setRegularError("");
    setRegularClients([]);

    try {
      const formattedDate = new Date(regularReturnDate)
        .toISOString()
        .split("T")[0];

      const response = await instance.get("/trips/bydate", {
        params: { returnDate: formattedDate },
      });

      if (response.data && Array.isArray(response.data)) {
        const filteredClients = response.data
          .filter((trip) =>
            regularDestination
              ? trip.busDetails?.destination === regularDestination
              : true
          )
          .flatMap((trip) =>
            trip.clients
              .filter((client) => client.returnStatus === "نعم")
              .flatMap((client) => {
                const clientRow = {
                  tripNumber: trip.tripNumber,
                  clientName: client.client?.name || "غير متوفر",
                  phone: client.client?.phone || "غير متوفر",
                  nationality: client.client?.nationality || "غير متوفر",
                  type: "client",
                  departureLocation:
                    trip.busDetails?.departureLocation || "غير متوفر",
                  destination: trip.busDetails?.destination || "غير متوفر",
                  returnDate: client.returnDate,
                };

                const accompanyingRows = (client.accompanyingPersons || []).map(
                  (person) => ({
                    tripNumber: trip.tripNumber,
                    clientName: person.name,
                    phone: person.phone || client.client?.phone || "غير متوفر",
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

        setRegularClients(filteredClients);
      }
    } catch (error) {
      setRegularError("حدث خطأ أثناء جلب العوادات العادية.");
      console.error("Error:", error.response?.data || error.message);
    } finally {
      setRegularLoading(false);
    }
  };

  // Fetch Madinah returns
  const fetchMadinahReturns = async () => {
    if (!madinahReturnDate) {
      alert("يرجى اختيار تاريخ العودة لعوادات المدينة.");
      return;
    }

    setMadinahLoading(true);
    setMadinahError("");

    try {
      const formattedDate = new Date(madinahReturnDate)
        .toISOString()
        .split("T")[0];

      const response = await instance.get("/invoices/madinah-returns/by-date", {
        params: { madinahReturnDate: formattedDate },
      });

      if (response.data) {
        setMadinahClients(response.data.data);
        console.log(response.data.data);
      }
    } catch (error) {
      setMadinahError("فشل جلب بيانات العوادات");
      console.error("Fetch error:", error);
    } finally {
      setMadinahLoading(false);
    }
  };
  // Export regular returns to Excel
  const exportRegularToExcel = () => {
    const data = [
      ["العوادات العادية - تاريخ العودة: " + regularReturnDate],
      [],
      [
        "تاريخ العودة",
        "الوجهة",
        "مكان الانطلاق",
        "الجنسية",
        "رقم الهاتف",
        "اسم العميل / المرافق",
        "رقم الرحلة",
      ],
      ...regularClients.map((client) => [
        new Date(client.returnDate).toLocaleDateString(),
        client.destination,
        client.departureLocation,
        client.nationality,
        client.phone,
        client.clientName,
        client.tripNumber,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const wscols = [
      { wch: 15 }, // رقم الرحلة
      { wch: 25 }, // اسم العميل / المرافق
      { wch: 15 }, // رقم الهاتف
      { wch: 15 }, // الجنسية
      { wch: 20 }, // مكان الانطلاق
      { wch: 15 }, // الوجهة
      { wch: 15 }, // تاريخ العودة
    ];
    ws["!cols"] = wscols;

    // Style the header row (blue background with white text)
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" },
      };
    }

    // Style the title (right-aligned RTL)
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "right", readingOrder: 2 },
    };

    // RTL direction for all cells
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
        ws[cellAddress].s = ws[cellAddress].s || {};
        ws[cellAddress].s.alignment = ws[cellAddress].s.alignment || {};
        ws[cellAddress].s.alignment.readingOrder = 2; // RTL
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العوادات العادية");
    XLSX.writeFile(wb, `العوادات_العادية_${regularReturnDate}.xlsx`);
  };

  const exportMadinahToExcel = () => {
    const data = [
      ["عوادات المدينة - تاريخ العودة: " + madinahReturnDate],
      [],
      [
        "عدد الأشخاص",
        "خيار الرحلة",
        "تاريخ العودة",
        "الجنسية",
        "رقم الهاتف",
        "اسم العميل",
        "رقم الرحلة",
      ],
      ...madinahClients.map((client) => [
        client.numberOfPassengers,
        client.tripOption,
        new Date(client.returnDate).toLocaleDateString(),
        client.nationality,
        client.phone,
        client.clientName,
        client.tripNumber,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const wscols = [
      { wch: 15 }, // رقم الرحلة
      { wch: 25 }, // اسم العميل
      { wch: 15 }, // رقم الهاتف
      { wch: 15 }, // الجنسية
      { wch: 15 }, // تاريخ العودة
      { wch: 15 }, // خيار الرحلة
      { wch: 15 }, // عدد الأشخاص
    ];
    ws["!cols"] = wscols;

    // Style the header row (same blue color)
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" },
      };
    }

    // Style the title (right-aligned RTL)
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "right", readingOrder: 2 },
    };

    // RTL direction for all cells
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
        ws[cellAddress].s = ws[cellAddress].s || {};
        ws[cellAddress].s.alignment = ws[cellAddress].s.alignment || {};
        ws[cellAddress].s.alignment.readingOrder = 2; // RTL
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "عوادات المدينة");
    XLSX.writeFile(wb, `عوادات_المدينة_${madinahReturnDate}.xlsx`);
  };
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">
        إدارة العملاء حسب تاريخ العودة
      </h1>

      {/* Regular Returns Section */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">العوادات العادية</h2>

        <div className="mb-4">
          <label className="block mb-2">تاريخ العودة:</label>
          <input
            type="date"
            value={regularReturnDate}
            onChange={(e) => setRegularReturnDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">اختر الوجهة (اختياري):</label>
          <select
            value={regularDestination}
            onChange={(e) => setRegularDestination(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">كل الوجهات</option>
            <option value="المدينة">المدينة</option>
            <option value="مكة">مكة</option>
          </select>
        </div>

        <button
          onClick={fetchRegularReturns}
          disabled={regularLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {regularLoading ? "جاري البحث..." : "بحث عن العوادات العادية"}
        </button>

        <button
          onClick={exportRegularToExcel}
          disabled={regularClients.length === 0}
          className="bg-green-500 text-white px-4 py-2 rounded mx-3"
        >
          تصدير العوادات العادية
        </button>

        {regularError && <p className="text-red-500 mt-2">{regularError}</p>}

        {regularClients.length > 0 && (
          <div className="mt-4 overflow-x-auto">
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
                {regularClients.map((client, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-100 ${
                      client.type === "accompanying" ? "bg-gray-50" : ""
                    }`}
                  >
                    <td className="border p-2">{client.tripNumber}</td>
                    <td className="border p-2">{client.clientName}</td>
                    <td className="border p-2">{client.phone}</td>
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
        )}

        {!regularLoading && regularClients.length === 0 && (
          <p className="mt-4">لا توجد عوادات عادية متاحة.</p>
        )}
      </div>

      {/* Madinah Returns Section */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">عوادات المدينة</h2>

        <div className="mb-4">
          <label className="block mb-2">تاريخ العودة:</label>
          <input
            type="date"
            value={madinahReturnDate}
            onChange={(e) => setMadinahReturnDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <button
          onClick={fetchMadinahReturns}
          disabled={madinahLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {madinahLoading ? "جاري البحث..." : "بحث عن عوادات المدينة"}
        </button>

        <button
          onClick={exportMadinahToExcel}
          disabled={madinahClients.length === 0}
          className="bg-green-500 text-white px-4 py-2 rounded mx-3"
        >
          تصدير عوادات المدينة
        </button>

        {madinahError && <p className="text-red-500 mt-2">{madinahError}</p>}

        {madinahClients.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">رقم الرحلة</th>
                  <th className="border p-2">اسم العميل</th>
                  <th className="border p-2">رقم الهاتف</th>
                  <th className="border p-2">الجنسية</th>
                  <th className="border p-2">تاريخ العودة</th>
                  <th className="border p-2">خيار الرحلة</th>
                  <th className="border p-2">عدد الأشخاص</th>
                </tr>
              </thead>
              <tbody>
                {madinahClients.map((client, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border p-2">{client.tripNumber}</td>
                    <td className="border p-2">{client.clientName}</td>
                    <td className="border p-2">{client.phone}</td>
                    <td className="border p-2">{client.nationality}</td>
                    <td className="border p-2">
                      {new Date(client.returnDate).toLocaleDateString()}
                    </td>
                    <td className="border p-2">{client.tripOption}</td>
                    <td className="border p-2">{client.numberOfPassengers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!madinahLoading && madinahClients.length === 0 && (
          <p className="mt-4">لا توجد عوادات مدينة متاحة.</p>
        )}
      </div>
    </div>
  );
};

export default ClientsByReturnDate;
