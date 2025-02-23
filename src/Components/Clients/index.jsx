import React, { useEffect, useState } from "react";
import AddClientForm from "./AddClient";
import instance from "../../API/instance";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Clients = () => {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      const response = await instance.get("/clients");
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients based on search term
  const filteredClients = clients.filter((client) =>
    [
      client.name,
      client.identityNumber,
      client.phone,
      client.nationality,
      client.boardingLocation,
    ].some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close the modal and refresh clients
  const closeModal = () => {
    setShowForm(false);
    fetchClients(); // Refresh clients after closing the modal
  };

  // Handle card click to navigate to client page
  const handleCardClick = (clientId) => {
    navigate(`/client/${clientId}`); // Navigate to the client page
  };

  return (
    <>
      <div className="my-4 flex justify-center gap-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          إضافة عميل جديد
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">قائمة العملاء</h1>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="search"
            placeholder=" ابحث بالاسم، رقم الهوية، أو رقم الجوال أو الجنسية أو مكان الركوب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">الاسم</th>
                <th className="border px-4 py-2">رقم الجوال</th>
                <th className="border px-4 py-2">الجنسية</th>
                <th className="border px-4 py-2">رقم الهوية</th>
                <th className="border px-4 py-2">مكان الركوب</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{client.name}</td>
                  <td className="border px-4 py-2">{client.phone}</td>
                  <td className="border px-4 py-2">{client.nationality}</td>
                  <td className="border px-4 py-2">{client.identityNumber}</td>
                  <td className="border px-4 py-2">
                    {client.boardingLocation}
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    لا توجد بيانات مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client._id}
            onClick={() => handleCardClick(client._id)} // Navigate on click
            className="relative block overflow-hidden rounded-lg border bg-white mt-6 border-gray-100 p-4 sm:p-6 lg:p-8 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"></span>

            <div className="sm:flex sm:justify-between sm:gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {client.name}
                </h3>

                <p className="mt-1 text-xs font-medium text-gray-600">
                  {client.nationality}
                </p>
              </div>

              <div className="hidden sm:block sm:shrink-0">
                <img
                  alt=""
                  src="https://via.placeholder.com/150"
                  className="size-16 rounded-lg object-cover shadow-xs"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-pretty text-gray-500">
                <strong>رقم الجوال:</strong> {client.phone}
              </p>
              <p className="text-sm text-pretty text-gray-500">
                <strong>رقم الهوية:</strong> {client.identityNumber}
              </p>
              <p className="text-sm text-pretty text-gray-500">
                <strong>مكان الركوب:</strong> {client.boardingLocation}
              </p>
            </div>

            <dl className="mt-6 flex gap-4 sm:gap-6">
              <div className="flex flex-col-reverse">
                <dt className="text-sm font-medium text-gray-600">Client ID</dt>
                <dd className="text-xs text-gray-500">{client._id}</dd>
              </div>
            </dl>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-4">
            لا توجد بيانات مطابقة.
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showForm && (
        <div className="fixed top-1/2 left-1/2 z-50 transform lg:-translate-x-3/4 -translate-x-1/2 lg:w-1/4 w-1/2 -translate-y-1/2">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <AddClientForm onSuccess={closeModal} />

            {/* Centered buttons */}
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={closeModal}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Clients;
