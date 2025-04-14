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
      boardingLocation: client.boardingLocation || "",
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
        // Retrieve the token from local storage
        const token = localStorage.getItem("token");

        if (!token) {
          setError("يجب تسجيل الدخول أولاً");
          setLoading(false);
          return;
        }

        const response = await instance.delete(
          `/trips/${tripId}/clients/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success("تم حذف العميل من الرحلة بنجاح!");
          await fetchTrip();
        } else if (response.status === 403) {
          toast.error("ليس لديك صلاحية لتنفيذ هذا العملية");
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
    console.log("Client data for editing:", client);
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
      boardingLocation:
        client.boardingLocation || client.client.boardingLocation || "",
      returnStatus: client.returnStatus || "لا",
      returnDate: client.returnDate || "",
      totalPaid: client.totalPaid || 0,
      remainingAmount: client.remainingAmount || 0,
      notes: client.notes || "",
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
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "مؤسسة صدي الحكمه للخدمات التسويقية",
      "الشركة المستأجرة:",
    ]);

    data.push(["", "", "", "", "", "", "", "", "5855356045", "س.ت:"]);

    // Second Row (Company Details)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "الشركة الناقلة / " + trip.leasingCompany,
    ]);

    // Third Row (Bus Details)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      trip.busDetails?.busNumber || "",
      "رقم الباص:",
      "",
      trip.busDetails?.licensePlate || "",
    ]);

    // Fourth Row (Driver 1 Details)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      trip.drivers?.[0]?.driverPhone || "لا يوجد",
      "جوال السائق الاول:",
      trip.drivers?.[0]?.driverName || "لا يوجد",
      "اسم السائق الاول:",
      "",
    ]);

    // Fifth Row (Driver 1 ID)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      trip.drivers?.[0]?.driverId || "لا يوجد",
      "رقم الهوية الاول:",
      "",
    ]);

    // Sixth Row (Driver 2 Details)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      trip.drivers?.[1]?.driverPhone || "لا يوجد",
      "جوال السائق الثاني:",
      trip.drivers?.[1]?.driverName || "لا يوجد",
      "اسم السائق الثاني:",
      "",
    ]);

    // Seventh Row (Driver 2 ID)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      trip.drivers?.[1]?.driverId || "لا يوجد",
      "رقم الهوية الثاني:",
      "",
    ]);

    // Eighth Row (Trip Date)
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      new Date(trip.date).toLocaleDateString("ar-SA", {
        weekday: "long",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        calendar: "islamic",
      }),
      "تاريخ الرحلة:",
      "",
    ]);

    // Location Information
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      trip.busDetails?.departureLocation || "",
      "الانطلاق:",
      "",
    ]);
    data.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      trip.busDetails?.destination || "",
      "الوجهة:",
      "",
    ]);

    // Add empty row before table
    data.push([]);

    // Table Headers (reversed order)
    data.push([
      "الجنسية",
      "المكان",
      "الهوية/الاقامة",
      "الاسم",
      "م",
      "الجنسية",
      "المكان",
      "الهوية/الاقامة",
      "الاسم",
      "م",
      "",
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
        rightPerson?.nationality || "",
        rightPerson?.boardingLocation || "",
        rightPerson?.identityNumber || "",
        rightPerson?.name || "",
        rightPerson ? i + halfLength + 1 : "", // Right column number
        leftPerson?.nationality || "",
        leftPerson?.boardingLocation || "",
        leftPerson?.identityNumber || "",
        leftPerson?.name || "",
        i + 1, // Left column number
        "",
      ];
      data.push(row);
    }

    // Add empty row and signature
    data.push([]);
    data.push(["", "", "", "", "", "", "", "", "", "", "المدير العام"]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set RTL direction and ensure it's applied
    ws["!rtl"] = true;
    ws["!direction"] = "rtl";

    // Styling
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };

        // Default cell style with RTL alignment
        ws[cellAddress].s = {
          font: { name: "Arial", sz: 10 },
          alignment: {
            horizontal: "right",
            vertical: "center",
            wrapText: true,
            readingOrder: 2, // RTL reading order
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
          ws[cellAddress].s.fill = { fgColor: { rgb: "2F75B5" } }; // Dark blue background
          ws[cellAddress].s.alignment.horizontal = "center";
          ws[cellAddress].s.font.color = { rgb: "FFFFFF" }; // White text
        }

        // Header section styling
        if (R < 12) {
          ws[cellAddress].s.font = { name: "Arial", sz: 10, bold: true };
        }
      }
    }

    // Set column widths
    ws["!cols"] = [
      { wch: 8 }, // الجنسية
      { wch: 8 }, // المكان
      { wch: 12 }, // الهوية/الاقامة
      { wch: 25 }, // الاسم
      { wch: 4 }, // م
      { wch: 8 }, // الجنسية
      { wch: 8 }, // المكان
      { wch: 12 }, // الهوية/الاقامة
      { wch: 25 }, // الاسم
      { wch: 4 }, // م
      { wch: 20 }, // Empty column
    ];

    // Set row heights
    ws["!rows"] = Array(range.e.r + 1).fill({ hpt: 25 }); // Set all rows to 25 points height

    // Merge cells for headers
    ws["!merges"] = [
      // Company names
      { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } },
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
          "مكان الركوب":
            client.boardingLocation || client.client.boardingLocation,
          "التكلفة الإجمالية": client.totalCost,
          "المبلغ المدفوع": client.totalPaid,
          "المبلغ المتبقي": client.remainingAmount,
          ملاحظات: client.notes || "",
        },
      ];

      const accompanyingPersonsData = client.accompanyingPersons.map(
        (person) => ({
          "اسم العميل": person.name,
          "رقم الهوية": person.identityNumber,
          "رقم الجوال": client.client.phone,
          "مكان الركوب":
            client.boardingLocation || client.client.boardingLocation,
          "التكلفة الإجمالية": "",
          "المبلغ المدفوع": "",
          "المبلغ المتبقي": "",
          ملاحظات: "",
        })
      );

      return [...clientData, ...accompanyingPersonsData];
    });

    // إنشاء مصفوفة بيانات كشف الرحلة
    const tripSheetData = [
      ["كشف الرحلة"], // العنوان الرئيسي
      [], // سطر فارغ
      [
        "ملاحظات",
        "المبلغ المتبقي",
        "المبلغ المدفوع",
        "التكلفة الإجمالية",
        "مكان الركوب",
        "رقم الجوال",
        "رقم الهوية",
        "اسم العميل",
      ], // العناوين
      ...clientsData.map((client) => [
        client["ملاحظات"],
        client["المبلغ المتبقي"],
        client["المبلغ المدفوع"],
        client["التكلفة الإجمالية"],
        client["مكان الركوب"],
        client["رقم الجوال"],
        client["رقم الهوية"],
        client["اسم العميل"],
      ]),
    ];

    // إنشاء مصنف Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(tripSheetData);

    // تعيين اتجاه الورقة من اليمين إلى اليسار
    ws["!rtl"] = true;

    // تطبيق الأنماط
    const range = XLSX.utils.decode_range(ws["!ref"]); // الحصول على نطاق الورقة

    // تطبيق نمط العنوان الرئيسي
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      font: { bold: true, size: 16, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "D3D3D3" } },
    };

    // تطبيق نمط العناوين
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 2, c: C });
      if (!ws[headerCell]) ws[headerCell] = { v: "" };
      ws[headerCell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2F75B5" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // تطبيق نمط الخلايا
    for (let R = 3; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };

        // نمط أساسي للخلية
        const baseStyle = {
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

        // تطبيق نمط الأرقام على أعمدة التكلفة والمدفوع والمتبقي
        if (C >= 1 && C <= 3) {
          ws[cellAddress].s = {
            ...baseStyle,
            numFmt: "#,##0.00",
          };
        } else {
          ws[cellAddress].s = baseStyle;
        }
      }
    }

    // تعيين عرض الأعمدة
    ws["!cols"] = [
      { wch: 30 }, // ملاحظات
      { wch: 15 }, // المبلغ المتبقي
      { wch: 15 }, // المبلغ المدفوع
      { wch: 15 }, // التكلفة الإجمالية
      { wch: 15 }, // مكان الركوب
      { wch: 15 }, // رقم الجوال
      { wch: 15 }, // رقم الهوية
      { wch: 25 }, // اسم العميل
    ];

    // دمج خلايا العنوان الرئيسي
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    // إضافة الورقة إلى المصنف
    XLSX.utils.book_append_sheet(wb, ws, "كشف الرحلة");

    // حفظ الملف
    XLSX.writeFile(wb, `كشف الرحلة - ${trip.tripNumber}.xlsx`);
  };

  const handleUpdateClient = async (clientId) => {
    try {
      const clientToUpdate = trip.clients.find(
        (c) => c.client._id === clientId
      );

      if (!clientToUpdate) {
        toast.error("لم يتم العثور على العميل");
        return;
      }

      // Get the client data from the form
      const clientData = {
        accompanyingPersons: clientToUpdate.accompanyingPersons,
        returnStatus: clientToUpdate.returnStatus,
        returnDate: clientToUpdate.returnDate,
        totalCost: clientToUpdate.totalCost,
        totalPaid: clientToUpdate.totalPaid,
        boardingLocation: clientToUpdate.boardingLocation,
        notes: clientToUpdate.notes,
      };

      console.log("Updating client with data:", clientData);

      // Send the update request using PATCH
      const response = await instance.patch(
        `/trips/${trip._id}/clients/${clientId}`,
        clientData
      );

      if (response.data) {
        // Update the trip state with the new data
        setTrip(response.data.updatedTrip);
        toast.success("تم تحديث بيانات العميل بنجاح");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("حدث خطأ أثناء تحديث بيانات العميل");
    }
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
