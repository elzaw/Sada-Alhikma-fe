import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import instance from "../../../API/instance";
import toast from "react-hot-toast";
import * as XLSX from "xlsx-js-style";
import ClientFormModal from "../ClientFormModal"; // We'll create this component

const TripPage = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
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

  // Calculate total cost for new client
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

  // Handle selecting a client from search
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
    setIsAddFormVisible(true);
  };

  // Handle adding a new client
  const handleAddClient = async (clientData) => {
    try {
      const response = await instance.post(
        `/trips/${tripId}/clients`,
        clientData
      );

      if (response.status === 201) {
        toast.success("تم إضافة العميل بنجاح!");
        await fetchTrip();
        setIsAddFormVisible(false);
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
          accompanyingPersons: [],
        });
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error(
        `فشل في إضافة العميل: ${error.response?.data?.error || error.message}`
      );
    }
  };

  // Handle editing a client
  const handleEditClient = async (clientData) => {
    try {
      const response = await instance.patch(
        `/trips/${tripId}/clients/${currentClient._id}`,
        clientData
      );

      if (response.status === 200) {
        toast.success("تم تحديث بيانات العميل بنجاح!");
        await fetchTrip();
        setIsEditFormVisible(false);
        setCurrentClient(null);
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(
        `فشل في تحديث العميل: ${error.response?.data?.error || error.message}`
      );
    }
  };

  // Handle deleting a client
  const handleDeleteClient = async (clientId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العميل من الرحلة؟")) {
      try {
        const response = await instance.delete(
          `/trips/${tripId}/clients/${clientId}`
        );

        if (response.status === 200) {
          toast.success("تم حذف العميل من الرحلة بنجاح!");
          await fetchTrip();
        }
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error(
          `فشل في حذف العميل: ${error.response?.data?.error || error.message}`
        );
      }
    }
  };

  // Prepare client data for editing
  const prepareEditClient = (client) => {
    setCurrentClient({
      _id: client.client._id,
      name: client.client.name,
      clientCount: 1 + client.accompanyingPersons.length,
      pricePerPerson:
        client.totalCost / (1 + client.accompanyingPersons.length),
      totalCost: client.totalCost,
      phone: client.client.phone || "",
      identityNumber: client.client.identityNumber || "",
      nationality: client.client.nationality || "",
      boardingLocation: client.client.boardingLocation || "",
      returnStatus: client.returnStatus || "لا",
      returnDate: client.returnDate || "",
      accompanyingPersons: client.accompanyingPersons.map((person) => ({
        name: person.name,
        nationality: person.nationality,
        identityNumber: person.identityNumber,
      })),
    });
    setIsEditFormVisible(true);
  };

  // Export to Excel
  const exportPoliceSheet = () => {
    const data = [];

    // Header - First Row (Company Names)
    data.push([
      "الشركة المستأجرة:",
      // trip.rentingCompany || "",
      "مؤسسة صدي الحكمه للخدمات التسويقية",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    data.push(["س.ت:", "5855356045", "", "", "", "", "", "", "", ""]);

    // Second Row (Company Details)
    data.push([
      "الشركة الناقلة / شركة سابتكو",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Third Row (Bus Details)
    data.push([
      "أ س ن",
      trip.busDetails?.licensePlate || "",
      "",
      "",
      "",
      "رقم الباص:",
      trip.busDetails?.busNumber || "",
      "",
      "",
      "",
    ]);

    // Fourth Row (Driver 1 Details)
    data.push([
      "اسم السائق:",
      trip.drivers?.[0]?.driverName || "لا يوجد",
      "جوال السائق:",
      trip.drivers?.[0]?.driverPhone || "لا يوجد",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Fifth Row (Driver 1 ID)
    data.push([
      "رقم الهوية:",
      trip.drivers?.[0]?.driverId || "لا يوجد",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Sixth Row (Driver 2 Details)
    data.push([
      "اسم السائق:",
      trip.drivers?.[1]?.driverName || "لا يوجد",
      "جوال السائق:",
      trip.drivers?.[1]?.driverPhone || "لا يوجد",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Seventh Row (Driver 2 ID)
    data.push([
      "رقم الهوية:",
      trip.drivers?.[1]?.driverId || "لا يوجد",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Eighth Row (Trip Date)
    data.push([
      "تاريخ الرحلة:",
      new Date(trip.date).toLocaleDateString("ar-SA", {
        weekday: "long",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        calendar: "islamic",
      }),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Location Information
    data.push([
      "الانطلاق:",
      trip.busDetails?.departureLocation || "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    data.push([
      "الوجهة:",
      trip.busDetails?.destination || "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Add empty row before table
    data.push([]);

    // Table Headers
    data.push([
      "م",
      "الاسم",
      "الهوية/الاقامة",
      "المكان",
      "الجنسية",
      "م",
      "الاسم",
      "الهوية/الاقامة",
      "المكان",
      "الجنسية",
    ]);

    // Process clients in two columns
    const processedClients = clients.flatMap((clientObj) => {
      const allPersons = [
        {
          name: clientObj.client.name,
          identityNumber: clientObj.client.identityNumber,
          nationality: clientObj.client.nationality,
          boardingLocation:
            clientObj.client.boardingLocation ||
            trip.busDetails?.departureLocation ||
            "",
        },
        ...clientObj.accompanyingPersons.map((person) => ({
          name: person.name,
          identityNumber: person.identityNumber,
          nationality: person.nationality,
          boardingLocation:
            clientObj.client.boardingLocation ||
            trip.busDetails?.departureLocation ||
            "",
        })),
      ];
      return allPersons;
    });

    // Split into two columns with sequential numbering
    const halfLength = Math.ceil(processedClients.length / 2);
    for (let i = 0; i < halfLength; i++) {
      const leftPerson = processedClients[i];
      const rightPerson = processedClients[i + halfLength];

      const row = [
        i + 1, // Left column number (1,2,3,4,5...)
        leftPerson?.name || "",
        leftPerson?.identityNumber || "",
        leftPerson?.boardingLocation || "",
        leftPerson?.nationality || "",
        rightPerson ? i + halfLength + 1 : "", // Right column number (6,7,8,9,10...)
        rightPerson?.name || "",
        rightPerson?.identityNumber || "",
        rightPerson?.boardingLocation || "",
        rightPerson?.nationality || "",
      ];
      data.push(row);
    }

    // Add empty row and signature
    data.push([]);
    data.push(["المدير العام", "", "", "", "", "", "", "", "", ""]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Styling
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };

        // Default cell style
        ws[cellAddress].s = {
          font: { name: "Arial", sz: 10 },
          alignment: {
            horizontal: "right",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };

        // Add thick border between header section and client table
        if (R === 12) {
          // Top border of the table headers
          ws[cellAddress].s.border.top = {
            style: "thick",
            color: { rgb: "000000" },
          };
        }
        if (R === 11) {
          // Bottom border of the header section
          ws[cellAddress].s.border.bottom = {
            style: "thick",
            color: { rgb: "000000" },
          };
        }

        // Table header styling
        if (R === 12) {
          ws[cellAddress].s.font = { name: "Arial", sz: 10, bold: true };
          ws[cellAddress].s.fill = { fgColor: { rgb: "EEEEEE" } };
          ws[cellAddress].s.alignment.horizontal = "center";
        }

        // Header section styling
        if (R < 12) {
          ws[cellAddress].s.font = { name: "Arial", sz: 10, bold: true };
        }
      }
    }

    // Set column widths
    ws["!cols"] = [
      { wch: 4 }, // م
      { wch: 25 }, // الاسم
      { wch: 12 }, // الهوية/الاقامة
      { wch: 8 }, // المكان
      { wch: 8 }, // الجنسية
      { wch: 4 }, // م
      { wch: 25 }, // الاسم
      { wch: 12 }, // الهوية/الاقامة
      { wch: 8 }, // المكان
      { wch: 8 }, // الجنسية
    ];

    // Set row heights
    ws["!rows"] = Array(range.e.r + 1).fill({ hpt: 25 }); // Set all rows to 25 points height

    // Merge cells for headers
    ws["!merges"] = [
      // Company names
      { s: { r: 0, c: 1 }, e: { r: 0, c: 4 } },
      { s: { r: 0, c: 6 }, e: { r: 0, c: 9 } },
      // Other header merges as needed
    ];

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "كشف الشرطة");

    // Generate filename
    const fileName = `كشف_الشرطة_${trip.tripNumber}_${new Date(trip.date)
      .toLocaleDateString()
      .replace(/\//g, "-")}.xlsx`;

    // Export file
    XLSX.writeFile(wb, fileName);
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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        رحلة: {trip.tripNumber} -{" "}
        {new Date(trip.date).getDate().toString().padStart(2, "0")}/
        {(new Date(trip.date).getMonth() + 1).toString().padStart(2, "0")}/
        {new Date(trip.date).getFullYear()}
      </h1>
      <div className="mb-4">
        <p className="text-lg font-semibold">
          عدد المقاعد الإجمالي: {trip.busDetails.seatCount}
        </p>
        <p className="text-lg font-semibold">
          المقاعد المتبقية:{" "}
          {trip.busDetails.seatCount -
            trip.clients.reduce(
              (total, client) => total + 1 + client.accompanyingPersons.length,
              0
            )}
        </p>
      </div>

      {/* Client Search Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">بحث عن عميل</h2>
          <button
            onClick={() => setIsAddFormVisible(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            إضافة عميل جديد
          </button>
        </div>
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

      {/* Add Client Modal */}
      <ClientFormModal
        isOpen={isAddFormVisible}
        onClose={() => setIsAddFormVisible(false)}
        onSubmit={handleAddClient}
        clientData={newClient}
        setClientData={setNewClient}
        title="إضافة عميل جديد"
        submitText="إضافة"
      />

      {/* Edit Client Modal */}
      {currentClient && (
        <ClientFormModal
          isOpen={isEditFormVisible}
          onClose={() => {
            setIsEditFormVisible(false);
            setCurrentClient(null);
          }}
          onSubmit={handleEditClient}
          clientData={currentClient}
          setClientData={setCurrentClient}
          title="تعديل بيانات العميل"
          submitText="تحديث"
        />
      )}

      {/* Clients List Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">قائمة العملاء</h2>
          <div className="flex gap-4">
            <button
              onClick={exportTripSheet}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              تصدير كشف الرحلة
            </button>
            <button
              onClick={exportPoliceSheet}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              تصدير كشف الشرطة
            </button>
          </div>
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
                <th className="border px-4 py-2">الإجراءات</th>
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
                  <td className="border px-4 py-2">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => prepareEditClient(client)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.client._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                      >
                        حذف
                      </button>
                    </div>
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
                      {client.client.phone}
                    </td>
                    <td className="border px-4 py-2">
                      {client.client.boardingLocation}
                    </td>
                    <td className="border px-4 py-2">
                      <span className="text-gray-400">مرافق</span>
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
              <p className="text-gray-700">{trip.totalTripCost} ريال</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">المبلغ المدفوع</p>
              <p className="text-gray-700">{trip.totalTripPaid} ريال</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">المبلغ المتبقي</p>
              <p className="text-gray-700">{trip.totalTripNetAmount} ريال</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPage;
