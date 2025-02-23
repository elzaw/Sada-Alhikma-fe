import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import instance from "../../../API/instance";
import toast from "react-hot-toast";
import * as XLSX from "xlsx"; // Import xlsx library

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
  const exportToExcel = () => {
    const data = clients.flatMap((client) => {
      const clientData = [
        {
          الاسم: client.client.name,
          "رقم الهوية": client.client.identityNumber,
          "رقم الجوال": client.client.phone,
          "مكان الركوب": client.client.boardingLocation,
        },
      ];

      const accompanyingPersonsData = client.accompanyingPersons.map(
        (person) => ({
          الاسم: person.name,
          "رقم الهوية": person.identityNumber,
          "رقم الجوال": client.client.phone, // نفس رقم هاتف العميل
          "مكان الركوب": client.client.boardingLocation,
        })
      );

      return [...clientData, ...accompanyingPersonsData];
    });

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Add styles to the worksheet
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } }, // لون خلفية العنوان
      alignment: { horizontal: "center" },
    };

    // Apply header style
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = headerStyle;
    }

    // Add borders to all cells
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "الرحلة");

    // Write file
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
                key={client.id}
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
        <button
          onClick={exportToExcel}
          className="bg-green-500 text-white px-4 py-2 rounded-lg mb-4"
        >
          تصدير إلى Excel
        </button>
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
      </div>
    </div>
  );
};

export default TripPage;
