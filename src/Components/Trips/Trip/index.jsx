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
      toast.error(`فشل في إضافة العميل: ${error.message}`);
    }
  };

  // Export to Excel
  // Export to Excel with formatting
  // دالة تصدير كشف الشرطة
  const exportPoliceSheet = () => {
    // بيانات الرحلة
    const tripDate = new Date(trip.date).toLocaleDateString(); // تاريخ الرحلة
    const leasingCompany = trip.leasingCompany; // اسم الشركة المؤجرة
    const rentingCompany = trip.rentingCompany; // اسم الشركة المستأجرة

    // بيانات السائقين
    const drivers = trip.drivers.map((driver) => ({
      name: driver.driverName,
      idNumber: driver.driverId,
      phone: driver.driverPhone,
    }));

    // بيانات الباص
    const busDetails = {
      busNumber: trip.busDetails.busNumber,
      plateNumber: trip.busDetails.licensePlate,
      seatCount: trip.busDetails.seatCount,
      departureLocation: trip.busDetails.departureLocation,
      destinationLocation: trip.busDetails.destination,
    };

    // بيانات العملاء (يتم استخراجها من clients)
    const clientsData = clients.flatMap((client) => {
      const clientData = [
        {
          "اسم العميل": client.client.name,
          "رقم الهوية/الإقامة": client.client.identityNumber,
          الجنسية: client.client.nationality,
          "مكان الركوب": client.client.boardingLocation,
        },
      ];

      const accompanyingPersonsData = client.accompanyingPersons.map(
        (person) => ({
          "اسم العميل": person.name,
          "رقم الهوية/الإقامة": person.identityNumber,
          الجنسية: person.nationality,
          "مكان الركوب": client.client.boardingLocation,
        })
      );

      return [...clientData, ...accompanyingPersonsData];
    });

    // إنشاء مصفوفة بيانات كشف الشرطة
    const policeSheetData = [
      ["كشف الشرطة"], // العنوان الرئيسي
      [], // سطر فارغ
      ["الشركة المستأجرة"], // عنوان الشركة المستأجرة
      ["مؤسسة صدي الحكمة للخدمات التسويقية"], // اسم الشركة
      ["س.ت: 5855356045"], // السجل التجاري
      [], // سطر فارغ
      ["تاريخ الرحلة", tripDate],
      ["اسم الشركة المؤجرة", leasingCompany],
      ["اسم الشركة المستأجرة", rentingCompany],
      [], // سطر فارغ
      ["بيانات السائقين"],
      ["اسم السائق الأول", drivers[0]?.name || "غير متوفر"],
      ["رقم إقامة/حدود السائق الأول", drivers[0]?.idNumber || "غير متوفر"],
      ["رقم جوال السائق الأول", drivers[0]?.phone || "غير متوفر"],
      ["اسم السائق الثاني", drivers[1]?.name || "غير متوفر"],
      ["رقم إقامة/حدود السائق الثاني", drivers[1]?.idNumber || "غير متوفر"],
      ["رقم جوال السائق الثاني", drivers[1]?.phone || "غير متوفر"],
      [], // سطر فارغ
      ["بيانات الباص"],
      ["رقم الباص", busDetails.busNumber],
      ["رقم اللوحات", busDetails.plateNumber],
      ["عدد المقاعد", busDetails.seatCount],
      ["مكان الانطلاق", busDetails.departureLocation],
      ["الوجهة", busDetails.destinationLocation],
      [], // سطر فارغ
      ["كشف العملاء"],
      ["اسم العميل", "رقم الهوية/الإقامة", "الجنسية", "مكان الركوب"],
      ...clientsData.map((client) => [
        client["اسم العميل"],
        client["رقم الهوية/الإقامة"],
        client["الجنسية"],
        client["مكان الركوب"],
      ]),
      [], // سطر فارغ
      ["المدير العام", "", "", ""],
      ["", "", "", "ختم المؤسسة"],
    ];

    // إنشاء مصنف Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(policeSheetData);

    // تعريف الأنماط
    const titleStyle = {
      font: { bold: true, size: 16, color: { rgb: "000000" } }, // خط عريض، حجم كبير
      alignment: { horizontal: "center" }, // توسيط النص
    };

    const companyHeaderStyle = {
      font: { bold: true, size: 14, color: { rgb: "000000" } }, // خط عريض، حجم متوسط
      alignment: { horizontal: "right" }, // محاذاة لليمين
    };

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
    XLSX.utils.sheet_add_aoa(ws, [["كشف الشرطة"]], { origin: "A1" });

    // تطبيق نمط عنوان الشركة المستأجرة
    ws["A3"].s = companyHeaderStyle;
    ws["A4"].s = companyHeaderStyle;
    ws["A5"].s = companyHeaderStyle;

    // تطبيق نمط العناوين
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 10, c: C }); // الصف 11 (عناوين السائقين)
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
    XLSX.utils.book_append_sheet(wb, ws, "كشف الشرطة");

    // حفظ الملف
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
              {/* Basic client fields */}
              <div>
                <label className="block mb-1">الاسم</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="p-2 border rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">عدد الأفراد</label>
                <input
                  type="number"
                  value={newClient.clientCount}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      clientCount: parseInt(e.target.value),
                    })
                  }
                  className="p-2 border rounded-lg w-full"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">سعر الفرد الواحد</label>
                <input
                  type="number"
                  value={newClient.pricePerPerson}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      pricePerPerson: parseFloat(e.target.value),
                    })
                  }
                  className="p-2 border rounded-lg w-full"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">التكلفة الإجمالية</label>
                <input
                  type="number"
                  value={newClient.totalCost}
                  className="p-2 border rounded-lg w-full bg-gray-100"
                  readOnly
                />
              </div>

              <div>
                <label className="block mb-1">رقم الجوال</label>
                <input
                  type="text"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                  className="p-2 border rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">رقم الهوية</label>
                <input
                  type="text"
                  value={newClient.identityNumber}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      identityNumber: e.target.value,
                    })
                  }
                  className="p-2 border rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">الجنسية</label>
                <input
                  type="text"
                  value={newClient.nationality}
                  onChange={(e) =>
                    setNewClient({ ...newClient, nationality: e.target.value })
                  }
                  className="p-2 border rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">مكان الركوب</label>
                <input
                  type="text"
                  value={newClient.boardingLocation}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      boardingLocation: e.target.value,
                    })
                  }
                  className="p-2 border rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">حالة العودة</label>
                <select
                  value={newClient.returnStatus}
                  onChange={(e) => {
                    setNewClient({
                      ...newClient,
                      returnStatus: e.target.value,
                    });
                    if (e.target.value === "لا") {
                      setNewClient((prev) => ({ ...prev, returnDate: "" })); // Clear return date if status is "لا"
                    }
                  }}
                  className="p-2 border rounded-lg w-full"
                >
                  <option value="لا">لا</option>
                  <option value="نعم">نعم</option>
                </select>
              </div>

              {newClient.returnStatus === "نعم" && (
                <div>
                  <label className="block mb-1">تاريخ العودة</label>
                  <input
                    type="date"
                    value={newClient.returnDate}
                    onChange={(e) =>
                      setNewClient({ ...newClient, returnDate: e.target.value })
                    }
                    className="p-2 border rounded-lg w-full"
                    required
                  />
                </div>
              )}

              {/* Accompanying persons fields */}
              {newClient.accompanyingPersons.map((person, index) => (
                <div key={index} className="col-span-2 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    فرد مرافق {index + 1}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1">الاسم</label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => {
                          const updatedPersons = [
                            ...newClient.accompanyingPersons,
                          ];
                          updatedPersons[index].name = e.target.value;
                          setNewClient({
                            ...newClient,
                            accompanyingPersons: updatedPersons,
                          });
                        }}
                        className="p-2 border rounded-lg w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1">الجنسية</label>
                      <input
                        type="text"
                        value={person.nationality}
                        onChange={(e) => {
                          const updatedPersons = [
                            ...newClient.accompanyingPersons,
                          ];
                          updatedPersons[index].nationality = e.target.value;
                          setNewClient({
                            ...newClient,
                            accompanyingPersons: updatedPersons,
                          });
                        }}
                        className="p-2 border rounded-lg w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1">رقم الهوية</label>
                      <input
                        type="text"
                        value={person.identityNumber}
                        onChange={(e) => {
                          const updatedPersons = [
                            ...newClient.accompanyingPersons,
                          ];
                          updatedPersons[index].identityNumber = e.target.value;
                          setNewClient({
                            ...newClient,
                            accompanyingPersons: updatedPersons,
                          });
                        }}
                        className="p-2 border rounded-lg w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                  <td className="border px-4 py-2">{person.identityNumber}</td>
                  <td className="border px-4 py-2">{client.client.phone}</td>
                  <td className="border px-4 py-2">
                    {client.client.boardingLocation}
                  </td>
                </tr>
              )),
            ])}
          </tbody>
        </table>

        {/* Display totalCost, totalPaid, and netAmount */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm">
          <div className="grid grid-cols-3 gap-4">
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
