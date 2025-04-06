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

  // Export functions (keep the same as before)
  const exportPoliceSheet = () => {
    // ... (same as before)
  };

  const exportTripSheet = () => {
    // ... (same as before)
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
