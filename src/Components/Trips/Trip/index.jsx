import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import instance from "../../../API/instance";
import toast from "react-hot-toast";

const TripPage = () => {
  const { tripId } = useParams(); // Get tripId from URL params
  const [trip, setTrip] = useState(null); // State to store trip details
  const [clients, setClients] = useState([]); // State to store clients associated with the trip
  const [searchTerm, setSearchTerm] = useState(""); // State to store search term for clients
  const [searchResults, setSearchResults] = useState([]); // State to store search results
  const [isFormVisible, setIsFormVisible] = useState(false); // State to control form visibility
  const [newClient, setNewClient] = useState({
    _id: "", // Client ID
    name: "", // Client name
    clientCount: 1, // Number of individuals (client + accompanying persons)
    pricePerPerson: 0, // Price per person
    totalCost: 0, // Total cost (clientCount * pricePerPerson)
    phone: "", // Client phone number
    identityNumber: "", // Client identity number
    nationality: "", // Client nationality
    boardingLocation: "", // Boarding location
    returnStatus: "لا", // Return status (Yes/No)
    accompanyingPersons: [], // List of accompanying persons
  });

  // Toggle form visibility
  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
  };

  // Fetch trip and associated clients when the component mounts or tripId changes
  const fetchTrip = async () => {
    try {
      const response = await instance.get(`/trips/${tripId}`);
      setTrip(response.data); // Set trip details
      setClients(response.data.clients || []); // Set clients associated with the trip
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast.error("فشل في تحميل بيانات الرحلة.");
    }
  };
  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  // Calculate total cost whenever clientCount or pricePerPerson changes
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

  // Perform a real-time search for clients based on the search term
  useEffect(() => {
    const searchClients = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]); // Clear results if search term is empty
        return;
      }

      try {
        const response = await instance.get(`/clients?search=${searchTerm}`);
        // Filter results based on name or identity number
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

    // Add a delay to avoid making too many API calls
    const delayDebounce = setTimeout(() => {
      searchClients();
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounce); // Cleanup timeout
  }, [searchTerm]);

  // Handle selecting a client from search results
  const handleSelectClient = (client) => {
    setNewClient({
      _id: client._id, // Set client ID
      name: client.name,
      clientCount: 1,
      pricePerPerson: 0,
      totalCost: 0,
      phone: client.phone || "",
      identityNumber: client.identityNumber || "",
      nationality: client.nationality || "",
      boardingLocation: "",
      returnStatus: "لا",
      accompanyingPersons: [], // Reset accompanying persons
    });
    setSearchResults([]); // Clear search results
    setSearchTerm(""); // Clear search term
  };

  // Handle adding a new client to the trip
  const handleAddClient = async (e) => {
    e.preventDefault();

    const clientData = {
      clientId: newClient?._id ?? "",
      accompanyingPersons: newClient?.accompanyingPersons ?? [],
      returnStatus: newClient?.returnStatus === "نعم" ? "نعم" : "لا",
      returnDate:
        newClient?.returnStatus === "نعم" ? newClient.returnDate : undefined, // إرسال returnDate فقط إذا كان returnStatus هو "نعم"
      totalCost: newClient?.totalCost ?? 0,
      totalPaid: newClient?.totalPaid ?? 0,
    };

    console.log("Client data being sent:", clientData);

    try {
      const response = await instance.post(
        `/trips/${tripId}/clients`,
        clientData
      );

      if (response.status === 201) {
        toast.success("تم إضافة العميل بنجاح!");

        // إعادة تحميل بيانات الرحلة
        await fetchTrip();

        const fullClientData = await fetchClientById(newClient._id);

        if (fullClientData) {
          const newClientData = {
            ...fullClientData,
            ...response.data,
          };

          setClients((prevClients) => [...prevClients, newClientData]);
        }

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
          returnStatus: "لا", // Reset returnStatus to "لا"
          returnDate: "", // Reset returnDate
          accompanyingPersons: [],
        });

        fetchTrip();
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error(`فشل في إضافة العميل: ${error.message}`);
    }
  };

  // Fetch client details by ID
  const fetchClientById = async (clientId) => {
    try {
      const response = await instance.get(`/clients/${clientId}`);
      return response.data; // Return the client data
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("فشل في تحميل بيانات العميل.");
      return null;
    }
  };

  // Render loading state if trip data is not yet available
  if (!trip) {
    return <div>جارٍ التحميل...</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "لا يوجد"; // إذا كان التاريخ غير موجود

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0"); // اليوم
    const month = String(date.getMonth() + 1).padStart(2, "0"); // الشهر (يبدأ من 0)
    const year = date.getFullYear(); // السنة

    return `${day}-${month}-${year}`; // التنسيق المطلوب: dd-mm-yyyy
  };

  return (
    <div className="p-6">
      {/* Trip Details Section */}
      <h1 className="text-2xl font-bold mb-4">
        رحلة: {trip.tripNumber} - {new Date(trip.date).toLocaleDateString()} -{" "}
        {new Date(trip.date).toLocaleDateString("ar-SA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
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
          <div className="bg-white shadow-lg rounded-lg p-2 max-h-60 overflow-auto">
            {searchResults.map((client) => (
              <div
                key={client.id}
                className="flex justify-between items-center p-2 border-b hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectClient(client)}
              >
                <span>
                  {client.name} - {client.identityNumber}
                </span>
                <button className="text-blue-500">تحديد</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Add Client Form */}
      <div className="p-6">
        {/* Toggle Button */}
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
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">الاسم</th>
              <th className="border px-4 py-2">عدد الأفراد</th>
              <th className="border px-4 py-2">سعر الفرد</th>
              <th className="border px-4 py-2">التكلفة الإجمالية</th>
              <th className="border px-4 py-2">رقم الجوال</th>
              <th className="border px-4 py-2">رقم الهوية</th>
              <th className="border px-4 py-2">الجنسية</th>
              <th className="border px-4 py-2">مكان الركوب</th>
              <th className="border px-4 py-2">العودة</th>
            </tr>
          </thead>
          <tbody>
            {trip.clients.map((client, index) => (
              <tr key={index} className="hover:bg-gray-50 text-center">
                <td className="border px-4 py-2">{client.client.name}</td>
                <td className="border px-4 py-2">
                  {client.accompanyingPersons.length + 1}
                </td>
                <td className="border px-4 py-2">
                  {/* Replace with actual price per person if available */}
                  {client.totalCost / (client.accompanyingPersons.length + 1)}
                </td>
                <td className="border px-4 py-2">
                  {/* Replace with actual total cost for this client if available */}
                  {client.totalCost}
                </td>
                <td className="border px-4 py-2">{client.client.phone}</td>
                <td className="border px-4 py-2">
                  {client.client.identityNumber}
                </td>
                <td className="border px-4 py-2">
                  {client.client.nationality}
                </td>
                <td className="border px-4 py-2">
                  {client.client.boardingLocation}
                </td>
                <td className="border px-4 py-2">
                  {client.returnStatus === "نعم"
                    ? formatDate(client.returnDate) // استخدام الدالة لتنسيق التاريخ
                    : "لا يوجد"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TripPage;
