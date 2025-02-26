import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import instance from "../../../API/instance";
import toast from "react-hot-toast";
// import * as XLSX from "xlsx"; // Import xlsx library
import * as XLSX from "xlsx-js-style";
const TripPage = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newClient, setNewClient] = useState({
    _id: "",
    name: "",
    clientCount: 1,
    pricePerPerson: 0,
    totalCost: 0,
    phone: "",
    identityNumber: "",
    nationality: "",
    boardingLocation: "",
    returnStatus: "لا",
    accompanyingPersons: [],
  });

  // Toggle form visibility
  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  // Fetch trip and associated clients
  const fetchTrip = async () => {
    try {
      const response = await instance.get(`/trips/${tripId}`);
      setTrip(response.data);
      setClients(response.data.clients || []);
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast.error("فشل في تحميل بيانات الرحلة.");
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  // Calculate total cost
  useEffect(() => {
    const total = newClient.clientCount * newClient.pricePerPerson;
    setNewClient((prev) => ({
      ...prev,
      totalCost: total,
      accompanyingPersons: Array.from({ length: prev.clientCount - 1 }, () => ({
        name: "",
        nationality: "",
        identityNumber: "",
      })),
    }));
  }, [newClient.clientCount, newClient.pricePerPerson]);

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        return;
      }

      try {
        const response = await instance.get(`/clients?search=${searchTerm}`);
        const filteredResults = response.data.filter((client) => {
          return (
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.identityNumber.includes(searchTerm)
          );
        });
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error searching clients:", error);
        toast.error("فشل في البحث عن العملاء.");
      }
    };

    const delayDebounce = setTimeout(() => {
      searchClients();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Handle selecting a client
  const handleSelectClient = (client) => {
    setNewClient({
      _id: client._id,
      name: client.name,
      clientCount: 1,
      pricePerPerson: 0,
      totalCost: 0,
      phone: client.phone || "",
      identityNumber: client.identityNumber || "",
      nationality: client.nationality || "",
      boardingLocation: "",
      returnStatus: "لا",
      accompanyingPersons: [],
    });
    setSearchResults([]);
    setSearchTerm("");
  };

  // Handle adding a new client
  const handleAddClient = async (e) => {
    e.preventDefault();

    const clientData = {
      clientId: newClient?._id ?? "",
      accompanyingPersons: newClient?.accompanyingPersons ?? [],
      returnStatus: newClient?.returnStatus === "نعم" ? "نعم" : "لا",
      returnDate:
        newClient?.returnStatus === "نعم" ? newClient.returnDate : undefined,
      totalCost: newClient?.totalCost ?? 0,
      totalPaid: newClient?.totalPaid ?? 0,
    };

    try {
      const response = await instance.post(
        `/trips/${tripId}/clients`,
        clientData
      );

      if (response.status === 201) {
        toast.success("تم إضافة العميل بنجاح!");
        await fetchTrip();
        setNewClient({
          _id: "",
          name: "",
          clientCount: 1,
          pricePerPerson: 0,
          totalCost: 0,
          phone: "",
          identityNumber: "",
          nationality: "",
          boardingLocation: "",
          returnStatus: "لا",
          returnDate: "",
          accompanyingPersons: [],
        });
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error(`فشل في إضافة العميل: ${error.response.data.error}`);
    }
  };

  // Export to Excel
  // Export to Excel with formatting
  // دالة تصدير كشف الشرطة
  const exportPoliceSheet = () => {
    const tripDate = new Date(trip.date).toLocaleDateString();
    const leasingCompany = trip.leasingCompany;
    const rentingCompany = trip.rentingCompany;

    const drivers = trip.drivers.map((driver) => ({
      name: driver.driverName,
      idNumber: driver.driverId,
      phone: driver.driverPhone,
    }));

    const busDetails = {
      busNumber: trip.busDetails.busNumber,
      plateNumber: trip.busDetails.licensePlate,
      seatCount: trip.busDetails.seatCount,
      departureLocation: trip.busDetails.departureLocation,
      destinationLocation: trip.busDetails.destination,
    };

    const clientsData = clients.flatMap((client, index) => {
      const side = index % 2 === 0 ? "right" : "left";
      return [
        {
          side,
          "اسم العميل": client.client.name,
          "رقم الهوية/الإقامة": client.client.identityNumber,
          الجنسية: client.client.nationality,
          "مكان الركوب": client.client.boardingLocation,
        },
        ...client.accompanyingPersons.map((person) => ({
          side,
          "اسم العميل": person.name,
          "رقم الهوية/الإقامة": person.identityNumber,
          الجنسية: person.nationality,
          "مكان الركوب": client.client.boardingLocation,
        })),
      ];
    });

    const policeSheetData = [
      ["الشركة المستأجرة :", "", "الشركة الناقلة  / " + rentingCompany],
      [leasingCompany, "", "رقم الباص: " + busDetails.busNumber],
      ["س.ت: 5855356045", "", "ا س س " + busDetails.plateNumber],
      ["", "", ""],
      [
        "الانطلاق: " + busDetails.departureLocation,
        "",
        "اسم السائق1: " + (drivers[0]?.name || "غير متوفر"),
      ],
      [
        "الوجهة: " + busDetails.destinationLocation,
        "",
        "جوال السائق: " + (drivers[0]?.phone || "غير متوفر"),
      ],
      ["", "", "رقم الهوية : " + (drivers[0]?.idNumber || "غير متوفر")],
      ["", "", "اسم السائق2: " + (drivers[1]?.name || "غير متوفر")],
      ["", "", "جوال السائق: " + (drivers[1]?.phone || "غير متوفر")],
      ["", "", "رقم الهوية : " + (drivers[1]?.idNumber || "غير متوفر")],
      ["", "", ""],
      ["تاريخ الرحلة: " + tripDate, "", "الخميس"],
      ["", "", ""],
      ["كشف العملاء"],
      [
        "اسم العميل",
        "رقم الهوية/الإقامة",
        "الجنسية",
        "مكان الركوب",
        "",
        "اسم العميل",
        "رقم الهوية/الإقامة",
        "الجنسية",
        "مكان الركوب",
      ],
      ...clientsData.reduce((rows, client, index) => {
        if (client.side === "right") {
          rows.push([
            client["اسم العميل"],
            client["رقم الهوية/الإقامة"],
            client["الجنسية"],
            client["مكان الركوب"],
            "",
            "",
            "",
            "",
            "",
          ]);
        } else {
          rows[rows.length - 1].splice(
            5,
            4,
            client["اسم العميل"],
            client["رقم الهوية/الإقامة"],
            client["الجنسية"],
            client["مكان الركوب"]
          );
        }
        return rows;
      }, []),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(policeSheetData);

    ws["!cols"] = [
      { wch: 25 },
      { wch: 5 },
      { wch: 30 },
      { wch: 20 },
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "كشف الشرطة");
    XLSX.writeFile(wb, `كشف الشرطة - ${trip.tripNumber}.xlsx`);
  };

  // دالة تصدير كشف الرحلة
  // دالة تصدير كشف الرحلة مع التنسيقات
  const exportTripSheet = () => {
    // بيانات العملاء (يتم استخراجها من clients)
    const clientsData = clients.flatMap((client) => {
      const clientData = [
        {
          "اسم العميل": client.client.name,
          "رقم الهوية": client.client.identityNumber,
          "رقم الجوال": client.client.phone,
          "مكان الركوب": client.client.boardingLocation,
        },
      ];

      const accompanyingPersonsData = client.accompanyingPersons.map(
        (person) => ({
          "اسم العميل": person.name,
          "رقم الهوية": person.identityNumber,
          "رقم الجوال": client.client.phone, // نفس رقم جوال العميل
          "مكان الركوب": client.client.boardingLocation,
        })
      );

      return [...clientData, ...accompanyingPersonsData];
    });

    // إنشاء مصفوفة بيانات كشف الرحلة
    const tripSheetData = [
      ["كشف الرحلة"], // العنوان الرئيسي
      [], // سطر فارغ
      ["اسم العميل", "رقم الهوية", "رقم الجوال", "مكان الركوب"], // العناوين
      ...clientsData.map((client) => [
        client["اسم العميل"],
        client["رقم الهوية"],
        client["رقم الجوال"],
        client["مكان الركوب"],
      ]),
    ];

    // إنشاء مصنف Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(tripSheetData);

    // تعريف الأنماط
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } }, // خط عريض، لون أبيض
      fill: { fgColor: { rgb: "4F81BD" } }, // خلفية زرقاء
      alignment: { horizontal: "center" }, // توسيط النص
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const titleStyle = {
      font: { bold: true, size: 16, color: { rgb: "000000" } }, // خط عريض، حجم كبير
      alignment: { horizontal: "center" }, // توسيط النص
    };

    const cellStyle = {
      alignment: { horizontal: "center" }, // توسيط النص
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    // تطبيق الأنماط
    const range = XLSX.utils.decode_range(ws["!ref"]); // الحصول على نطاق الورقة

    // تطبيق نمط العنوان الرئيسي
    ws["A1"].s = titleStyle;
    XLSX.utils.sheet_add_aoa(ws, [["كشف الرحلة"]], { origin: "A1" });

    // تطبيق نمط العناوين
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C }); // الصف الثالث (العناوين)
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = headerStyle;
    }

    // تطبيق نمط الخلايا
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = cellStyle;
      }
    }

    // إضافة الورقة إلى المصنف
    XLSX.utils.book_append_sheet(wb, ws, "كشف الرحلة");

    // حفظ الملف
    XLSX.writeFile(wb, `كشف الرحلة - ${trip.tripNumber}.xlsx`);
  };

  if (!trip) {
    return <div>جارٍ التحميل...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        رحلة: {trip.tripNumber} - {new Date(trip.date).toLocaleDateString()}
      </h1>
      <div className="mb-4">
        <p className="text-lg font-semibold">
          عدد المقاعد الإجمالي: {trip.busDetails.seatCount}
        </p>
        <p className="text-lg font-semibold">
          المقاعد المتبقية:{" "}
          {trip.busDetails.seatCount -
            trip.clients.reduce(
              (total, client) =>
                total + client.clientCount + client.accompanyingPersons.length,
              0
            )}
        </p>
      </div>

      {/* Client Search Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">بحث عن عميل</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الهوية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-lg w-full"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-xl p-4 max-h-72 overflow-auto">
            {searchResults.map((client) => (
              <div
                key={client._id}
                className="flex justify-between items-center p-3 mb-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer border border-gray-200 relative overflow-hidden"
                onClick={() => handleSelectClient(client)}
                role="button"
                tabIndex={0}
                aria-label={`Select client ${client.name}`}
              >
                <span className="text-gray-700 font-medium z-10">
                  {client.name} -{" "}
                  <span className="text-gray-500">{client.identityNumber}</span>
                </span>
                <button className="text-white bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out shadow-sm z-10">
                  تحديد
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Form */}
      <div className="p-6">
        <div className="text-center">
          <button
            onClick={toggleFormVisibility}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4"
          >
            {isFormVisible ? "إخفاء النموذج" : "إظهار النموذج"}
          </button>
        </div>
        {/* Add Client Form (Conditionally Rendered) */}
        {isFormVisible && (
          <form onSubmit={handleAddClient} className="mb-6">
            <h2 className="text-xl font-semibold mb-4">إضافة عميل جديد</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* ... (الكود السابق يبقى كما هو) */}
            </div>

            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg mt-4"
            >
              إضافة عميل
            </button>
          </form>
        )}
      </div>

      {/* Clients List Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">قائمة العملاء</h2>
        <div className="flex gap-4 mb-6">
          <button
            onClick={exportTripSheet}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            تصدير كشف الرحلة
          </button>
          <button
            onClick={exportPoliceSheet}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            تصدير كشف الشرطة
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">الاسم</th>
                <th className="border px-4 py-2">رقم الهوية</th>
                <th className="border px-4 py-2">رقم الجوال</th>
                <th className="border px-4 py-2">مكان الركوب</th>
              </tr>
            </thead>
            <tbody>
              {clients.flatMap((client) => [
                <tr
                  key={client.client._id}
                  className="hover:bg-gray-50 text-center"
                >
                  <td className="border px-4 py-2">{client.client.name}</td>
                  <td className="border px-4 py-2">
                    {client.client.identityNumber}
                  </td>
                  <td className="border px-4 py-2">{client.client.phone}</td>
                  <td className="border px-4 py-2">
                    {client.client.boardingLocation}
                  </td>
                </tr>,
                ...client.accompanyingPersons.map((person, index) => (
                  <tr
                    key={`${client.client._id}-${index}`}
                    className="hover:bg-gray-50 text-center"
                  >
                    <td className="border px-4 py-2">{person.name}</td>
                    <td className="border px-4 py-2">
                      {person.identityNumber}
                    </td>
                    <td className="border px-4 py-2 text-gray-500 italic">
                      {" "}
                      {/* تغيير اللون وإضافة خط مائل */}
                      {client.client.phone}
                    </td>
                    <td className="border px-4 py-2">
                      {client.client.boardingLocation}
                    </td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>

        {/* Display totalCost, totalPaid, and netAmount */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-semibold">التكلفة الإجمالية</p>
              <p className="text-gray-700">{trip.totalCost} ريال</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">المبلغ المدفوع</p>
              <p className="text-gray-700">{trip.totalPaid} ريال</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">المبلغ المتبقي</p>
              <p className="text-gray-700">{trip.netAmount} ريال</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPage;
