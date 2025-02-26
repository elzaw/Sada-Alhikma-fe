import React, { useState } from "react";
import instance from "../../API/instance";

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
                  nationality: client.client?.nationality || "غير متوفر",
                  type: "client",
                  departureLocation:
                    trip.busDetails?.departureLocation || "غير متوفر",
                  destination: trip.busDetails?.destination || "غير متوفر",
                  returnStatus: client.returnStatus,
                  returnDate: client.returnDate,
                  totalCost: client.totalCost,
                };

                // Create accompanying persons rows
                const accompanyingRows = (client.accompanyingPersons || []).map(
                  (person) => ({
                    tripNumber: trip.tripNumber,
                    clientName: person.name,
                    nationality: person.nationality,
                    type: "accompanying",
                    departureLocation:
                      trip.busDetails?.departureLocation || "غير متوفر",
                    destination: trip.busDetails?.destination || "غير متوفر",
                    returnStatus: client.returnStatus,
                    returnDate: client.returnDate,
                    totalCost: client.totalCost,
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
          <option value="جدة">جدة</option>
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

      {/* عرض الأخطاء */}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* عرض النتائج */}
      {clients.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">النتائج</h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">رقم الرحلة</th>
                <th className="border p-2">اسم العميل / المرافق</th>
                <th className="border p-2">الجنسية</th>
                <th className="border p-2">مكان الانطلاق</th>
                <th className="border p-2">الوجهة</th>
                <th className="border p-2">حالة العودة</th>
                <th className="border p-2">تاريخ العودة</th>
                <th className="border p-2">التكلفة الإجمالية</th>
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
                  <td className="border p-2">{client.nationality}</td>
                  <td className="border p-2">{client.departureLocation}</td>
                  <td className="border p-2">{client.destination}</td>
                  <td className="border p-2">{client.returnStatus}</td>
                  <td className="border p-2">
                    {new Date(client.returnDate).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{client.totalCost}</td>
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
